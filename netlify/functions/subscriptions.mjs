import { json, requireUser, readJSON, writeJSON, DEFAULT_APARTMENTS, normalize } from "./_lib.mjs";

export default async (req)=>{
  const user=await requireUser(req);
  if(!user) return json({error:"로그인이 필요합니다."},401);
  const key=`subscriptions/${user.id}.json`;
  let subs=await readJSON(key,[]);
  const body=req.method==="GET" ? null : await req.json().catch(()=>({}));
  if(req.method==="GET") return json({subscriptions:subs});
  const id=body?.apartmentId;
  if(!id) return json({error:"아파트를 선택해주세요."},400);

  let apartments=await readJSON("apartments.json",DEFAULT_APARTMENTS);
  let apt=apartments.find(a=>a.id===id);

  if(req.method==="POST"){
    if(!apt){
      // apartments.json에 아직 없는 단지 = 검색 결과에서 새로 고른 단지.
      // 요청 본문에 이름/지역/법정동코드가 같이 오면 공용 목록에 등록해줍니다.
      const name=normalize(body?.name) ? String(body.name).trim() : "";
      const lawd_cd=String(body?.lawd_cd||"").trim();
      if(!name || !/^\d{5}$/.test(lawd_cd)) return json({error:"존재하지 않는 아파트입니다."},404);
      apt={id, name, district:String(body?.district||"").trim(), lawd_cd};
      apartments=[...apartments, apt];
      await writeJSON("apartments.json", apartments);
    }
    if(!subs.includes(id)) subs.push(id);
  } else if(req.method==="DELETE"){
    subs=subs.filter(x=>x!==id);
  } else return json({error:"지원하지 않는 요청입니다."},405);

  await writeJSON(key,subs);
  return json({subscriptions:subs});
};
