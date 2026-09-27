import { clearCookie } from "./_lib.mjs";
export default async ()=>new Response(null,{status:302,headers:{Location:"/", "Set-Cookie":clearCookie("rea_session")}});
