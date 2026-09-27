import { json, requireUser } from "./_lib.mjs";
export default async (req)=>{
  try{
    const user=await requireUser(req);
    return json(user ? {loggedIn:true,user:{id:user.id,nickname:user.nickname}} : {loggedIn:false});
  }catch(e){
    // 오래되거나 깨진 세션 쿠키 때문에 로그인 여부 확인 자체가 죽지 않도록,
    // 여기서 문제가 생기면 그냥 "로그인 안 한 상태"로 취급합니다.
    console.error("me.mjs 오류", e);
    return json({loggedIn:false});
  }
};
