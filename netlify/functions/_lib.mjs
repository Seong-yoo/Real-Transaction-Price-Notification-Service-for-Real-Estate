import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

export const store = getStore("real-estate-alert");

// apartments.json이 Blobs 저장소에 아직 없을 때 쓰이는 기본 목록입니다.
// apartments.mjs(목록 조회)와 subscriptions.mjs(구독 검증)가 이 값을 공유해야
// "존재하지 않는 아파트입니다" 오류 없이 기본 아파트를 구독할 수 있습니다.
export const DEFAULT_APARTMENTS = [
  {id:"11710-geoyeo5", name:"거여5단지", district:"서울 송파구", lawd_cd:"11710"}
];

export function json(data, status=200, headers={}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {"Content-Type":"application/json; charset=utf-8", ...headers}
  });
}

export async function readJSON(key, fallback=null) {
  const value = await store.get(key, {type:"json", consistency:"strong"});
  return value ?? fallback;
}

export async function writeJSON(key, value) {
  await store.setJSON(key, value);
}

export function cookie(name, value, maxAge=60*60*24*30) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function secret() {
  return process.env.SESSION_SECRET || "CHANGE_THIS_SESSION_SECRET";
}

function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function makeSession(userId) {
  const value = `${userId}.${Date.now()}`;
  return `${value}.${sign(value)}`;
}

export function getSession(req) {
  const raw = req.headers.get("cookie") || "";
  const match = raw.match(/(?:^|; )rea_session=([^;]+)/);
  if (!match) return null;
  const token = decodeURIComponent(match[1]);
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, issued, sig] = parts;
  const expected = sign(`${userId}.${issued}`);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Date.now() - Number(issued) > 60*60*24*30*1000) return null;
  return userId;
}

export async function requireUser(req) {
  const userId = getSession(req);
  if (!userId) return null;
  return await readJSON(`users/${userId}.json`);
}

export function normalize(s) {
  return String(s ?? "").replace(/\s+/g,"").trim();
}

export function transactionId(row, aptName) {
  const pick = k => row[k] ?? "";
  return [
    aptName, pick("dealYear"), pick("dealMonth"), pick("dealDay"),
    pick("dealAmount"), pick("floor"), pick("jibun"), pick("excluUseAr"), pick("aptNm")
  ].join("|");
}

export function formatTransaction(row, aptName) {
  const amount = String(row.dealAmount ?? "").replace(/\s+/g,"");
  return [
    `🏠 ${aptName} 실거래`,
    `${row.dealYear}.${String(row.dealMonth).padStart(2,"0")}.${String(row.dealDay).padStart(2,"0")}`,
    `💰 ${amount}만원`,
    `📐 ${row.excluUseAr ?? "-"}㎡`,
    `🏢 ${row.floor ?? "-"}층`,
    `📍 ${row.umdNm ?? ""} ${row.jibun ?? ""}`.trim()
  ].join("\n");
}

export async function getMonths() {
  const d = new Date();
  const y = d.getUTCFullYear(), m = d.getUTCMonth()+1;
  const prev = new Date(Date.UTC(y, m-2, 1));
  return [
    `${y}${String(m).padStart(2,"0")}`,
    `${prev.getUTCFullYear()}${String(prev.getUTCMonth()+1).padStart(2,"0")}`
  ];
}

export async function fetchMonth(serviceKey, lawdCd, yyyymm) {
  const url = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";
  const params = new URLSearchParams({
    serviceKey, LAWD_CD: lawdCd, DEAL_YMD: yyyymm,
    pageNo:"1", numOfRows:"1000"
  });
  const r = await fetch(`${url}?${params.toString()}`);
  if (!r.ok) throw new Error(`국토부 API HTTP ${r.status}`);
  const xml = await r.text();
  const resultCode = xml.match(/<resultCode>([^<]+)<\/resultCode>/)?.[1];
  if (resultCode !== "000") {
    const msg = xml.match(/<resultMsg>([^<]+)<\/resultMsg>/)?.[1] || "API 오류";
    throw new Error(`${resultCode}: ${msg}`);
  }
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>m[1]);
  const rows = items.map(block=>{
    const row={};
    for (const m of block.matchAll(/<([^!?/][^>]*)>([\s\S]*?)<\/\1>/g)) {
      row[m[1]] = m[2].replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#x27;/g,"'").replace(/&quot;/g,'"');
    }
    return row;
  });
  return rows;
}

export async function kakaoSend(accessToken, text) {
  const template = {
    object_type:"text",
    text,
    link:{web_url:"https://www.molit.go.kr/", mobile_web_url:"https://www.molit.go.kr/"}
  };
  const r = await fetch("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
    method:"POST",
    headers:{
      "Authorization":`Bearer ${accessToken}`,
      "Content-Type":"application/x-www-form-urlencoded;charset=utf-8"
    },
    body:new URLSearchParams({template_object:JSON.stringify(template)})
  });
  const data = await r.json().catch(()=>({}));
  if (!r.ok || data.result_code !== 0) throw new Error(`카카오 메시지 실패: ${JSON.stringify(data)}`);
  return true;
}

export async function refreshKakaoToken(user) {
  const body = new URLSearchParams({
    grant_type:"refresh_token",
    client_id:process.env.KAKAO_REST_KEY,
    refresh_token:user.refresh_token
  });
  if (process.env.KAKAO_CLIENT_SECRET) body.set("client_secret", process.env.KAKAO_CLIENT_SECRET);
  const r = await fetch("https://kauth.kakao.com/oauth/token", {
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded;charset=utf-8"},
    body
  });
  const data=await r.json().catch(()=>({}));
  if (!r.ok || !data.access_token) throw new Error(`카카오 토큰 갱신 실패: ${JSON.stringify(data)}`);
  user.access_token=data.access_token;
  if (data.refresh_token) user.refresh_token=data.refresh_token;
  user.access_token_expires_at=Date.now()+Number(data.expires_in||0)*1000;
  await writeJSON(`users/${user.id}.json`, user);
  return user;
}

export async function getValidAccessToken(user) {
  if (user.access_token && Number(user.access_token_expires_at||0) > Date.now()+60_000) return user.access_token;
  user = await refreshKakaoToken(user);
  return user.access_token;
}
