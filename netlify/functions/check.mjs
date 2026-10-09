import { readJSON, writeJSON, store, getMonths, fetchMonth, transactionId, formatTransaction, getValidAccessToken, kakaoSend, DEFAULT_APARTMENTS } from "./_lib.mjs";

export const config = { schedule: "0 21 * * *" };

export default async ()=>{
  const {blobs: userBlobs}=await store.list({prefix:"users/"});
  const users=[];
  for(const b of userBlobs){
    const u=await readJSON(b.key,null);
    if(u) users.push(u);
  }

  const allApts=await readJSON("apartments.json",DEFAULT_APARTMENTS);
  const userSubs=new Map();
  const needed=new Map();

  for(const u of users){
    const ids=await readJSON(`subscriptions/${u.id}.json`,[]);
    userSubs.set(u.id,ids);
    for(const id of ids){
      const apt=allApts.find(a=>a.id===id);
      if(!apt) continue;
      needed.set(id,apt);
    }
  }

  if(!needed.size) return new Response("no subscriptions");

  const months=await getMonths();
  const rowsByApt=new Map();

  // 같은 시군구/월은 한 번만 국토부 API를 호출합니다.
  const cache=new Map();
  for(const apt of needed.values()){
    for(const month of months){
      const key=`${apt.lawd_cd}:${month}`;
      if(cache.has(key)) continue;
      try{
        const fetchedRows = await fetchMonth(process.env.MOLIT_SERVICE_KEY,apt.lawd_cd,month);
        cache.set(key,{ok:true,rows:fetchedRows});
        console.log('API OK', key, 'rows=', fetchedRows.length);
      }catch(e){
        console.error("API 실패",key,e.message);
        cache.set(key,{ok:false,rows:[]});
      }
    }
  }

  for(const [id,apt] of needed){
    const rows=[];
    let complete=true;
    for(const month of months){
      const result=cache.get(`${apt.lawd_cd}:${month}`);
      if(!result?.ok){complete=false;continue;}
      for(const row of result.rows){
        const isTarget =
          String(row.dealYear) === "2026" &&
          String(row.dealMonth).padStart(2,"0") === "09" &&
          String(row.dealDay).padStart(2,"0") === "22" &&
          String(row.floor).trim() === "9" &&
          String(row.dealAmount).replace(/,/g,"").replace(/\s+/g,"") === "305500";

        if(isTarget){
          console.log("TARGET IN RAW API", JSON.stringify({
            requestedApt:apt.name,
            apiAptName:row.aptNm,
            dealYear:row.dealYear,
            dealMonth:row.dealMonth,
            dealDay:row.dealDay,
            dealAmount:row.dealAmount,
            floor:row.floor,
            excluUseAr:row.excluUseAr,
            jibun:row.jibun
          }));
        }

        if(String(row.aptNm||"").trim()===String(apt.name).trim()) rows.push(row);
      }
    }
    rowsByApt.set(id,{apt,rows,complete});
    console.log('APT MATCH', JSON.stringify({id,name:apt.name,lawd_cd:apt.lawd_cd,rows:rows.length,complete}));
    const targetRows = rows.filter(r =>
      String(r.dealYear) === "2026" &&
      String(r.dealMonth).padStart(2,"0") === "09" &&
      String(r.dealDay).padStart(2,"0") === "22" &&
      String(r.floor).trim() === "9" &&
      String(r.dealAmount).replace(/,/g,"").replace(/\s+/g,"") === "305500"
    );
    if (targetRows.length) {
      console.log('TARGET TRANSACTION FOUND', JSON.stringify(targetRows.map(r => ({
        aptNm:r.aptNm, dealYear:r.dealYear, dealMonth:r.dealMonth,
        dealDay:r.dealDay, dealAmount:r.dealAmount, floor:r.floor,
        excluUseAr:r.excluUseAr, jibun:r.jibun
      }))));
    } else {
      console.log('TARGET TRANSACTION NOT FOUND IN MATCHED ROWS', apt.name);
    }
  }

  let sent=0;
  for(const [id,{apt,rows,complete}] of rowsByApt){
    if(!complete) continue; // API 실패가 있으면 기준점도 알림도 갱신하지 않음
    const seenKey=`seen/${id}.json`;
    let seen=await readJSON(seenKey,null);
    const ids=rows.map(r=>transactionId(r,apt.name));

    if(!seen){
      await writeJSON(seenKey,ids);
      console.log(`${apt.name}: 기준점 ${ids.length}건 저장`);
      continue;
    }

    const seenSet=new Set(seen);
    const newRows=rows.filter(r=>!seenSet.has(transactionId(r,apt.name)));
    console.log('TRANSACTION CHECK', JSON.stringify({name:apt.name,totalRows:rows.length,seenCount:seen.length,newCount:newRows.length}));
    if(!newRows.length) continue;

    await writeJSON(seenKey,[...new Set([...seen,...ids])]);

    for(const u of users){
      const subs=userSubs.get(u.id)||[];
      if(!subs.includes(id)) continue;
      try{
        const token=await getValidAccessToken(u);
        for(const row of newRows){
          await kakaoSend(token,formatTransaction(row,apt.name));
          sent++;
        }
      }catch(e){
        console.error(`카카오 전송 실패 user=${u.id} apt=${apt.name}`,e.message);
      }
    }
  }

  return new Response(`checked ${needed.size} apartments, sent ${sent} messages`);
};
