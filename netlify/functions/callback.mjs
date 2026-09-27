import { getStore } from "@netlify/blobs";
import { cookie, makeSession, json, writeJSON } from "./_lib.mjs";

export default async (req) => {
  const url = new URL(req.url);
  const code=url.searchParams.get("code");
  if(!code) return json({error:"카카오 인증 코드가 없습니다."},400);

  const body=new URLSearchParams({
    grant_type:"authorization_code",
    client_id:process.env.KAKAO_REST_KEY,
    redirect_uri:process.env.KAKAO_REDIRECT_URI,
    code
  });
  if(process.env.KAKAO_CLIENT_SECRET) body.set("client_secret",process.env.KAKAO_CLIENT_SECRET);

  const tokenRes=await fetch("https://kauth.kakao.com/oauth/token",{
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded;charset=utf-8"},
    body
  });
  const token=await tokenRes.json();
  if(!tokenRes.ok || !token.access_token) return json({error:"카카오 토큰 발급 실패", detail:token},500);

  const meRes=await fetch("https://kapi.kakao.com/v2/user/me",{
    headers:{Authorization:`Bearer ${token.access_token}`}
  });
  const me=await meRes.json();
  if(!meRes.ok || !me.id) return json({error:"카카오 사용자 정보 조회 실패", detail:me},500);

  const id=String(me.id);
  const old=await getStore("real-estate-alert").get(`users/${id}.json`,{type:"json",consistency:"strong"});
  const user={
    id,
    nickname:me.kakao_account?.profile?.nickname || "",
    access_token:token.access_token,
    refresh_token:token.refresh_token || old?.refresh_token || "",
    access_token_expires_at:Date.now()+Number(token.expires_in||0)*1000,
    created_at:old?.created_at || new Date().toISOString()
  };
  await writeJSON(`users/${id}.json`,user);
  if(!old) await writeJSON(`subscriptions/${id}.json`,[]);

  return new Response(null,{status:302,headers:{
    Location:"/",
    "Set-Cookie":cookie("rea_session",makeSession(id))
  }});
}
