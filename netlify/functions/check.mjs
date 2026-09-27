import { readJSON, writeJSON, store, getMonths, fetchMonth, transactionId, formatTransaction, getValidAccessToken, kakaoSend, DEFAULT_APARTMENTS } from "./_lib.mjs";

export const config = { schedule: "*/10 * * * *" };

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
        cache.set(key,{ok:true,rows:await fetchMonth(process.env.MOLIT_SERVICE_KEY,apt.lawd_cd,month)});
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
        if(String(row.aptNm||"").trim()===String(apt.name).trim()) rows.push(row);
      }
    }
    rowsByApt.set(id,{apt,rows,complete});
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
