import { json, requireUser, readJSON, writeJSON, DEFAULT_APARTMENTS } from "./_lib.mjs";

export default async (req)=>{
  const user=await requireUser(req);
  if(!user) return json({error:"로그인이 필요합니다."},401);
  const key=`subscriptions/${user.id}.json`;
  let subs=await readJSON(key,[]);
  const body=req.method==="GET" ? null : await req.json().catch(()=>({}));
  if(req.method==="GET") return json({subscriptions:subs});
  const id=body?.apartmentId;
  if(!id) return json({error:"아파트를 선택해주세요."},400);

  const apartments=await readJSON("apartments.json",DEFAULT_APARTMENTS);
  if(!apartments.some(a=>a.id===id)) return json({error:"존재하지 않는 아파트입니다."},404);

  if(req.method==="POST"){
    if(!subs.includes(id)) subs.push(id);
  } else if(req.method==="DELETE"){
    subs=subs.filter(x=>x!==id);
  } else return json({error:"지원하지 않는 요청입니다."},405);

  await writeJSON(key,subs);
  return json({subscriptions:subs});
};
