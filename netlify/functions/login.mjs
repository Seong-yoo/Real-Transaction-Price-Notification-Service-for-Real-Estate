import crypto from "node:crypto";
import { json } from "./_lib.mjs";

export default async () => {
  const redirectUri = process.env.KAKAO_REDIRECT_URI;
  if (!process.env.KAKAO_REST_KEY || !redirectUri) return json({error:"KAKAO_REST_KEY 또는 KAKAO_REDIRECT_URI가 없습니다."},500);
  const state = crypto.randomUUID();
  const url = new URL("https://kauth.kakao.com/oauth/authorize");
  url.searchParams.set("client_id", process.env.KAKAO_REST_KEY);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type","code");
  url.searchParams.set("scope","talk_message");
  url.searchParams.set("state",state);
  return Response.redirect(url.toString(),302);
}
