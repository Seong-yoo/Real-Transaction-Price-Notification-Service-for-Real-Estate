import { json, requireUser } from "./_lib.mjs";
export default async (req)=>{
  const user=await requireUser(req);
  return json(user ? {loggedIn:true,user:{id:user.id,nickname:user.nickname}} : {loggedIn:false});
};
