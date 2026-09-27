import { json, readJSON, DEFAULT_APARTMENTS } from "./_lib.mjs";
export default async ()=>{
  const apartments=await readJSON("apartments.json",DEFAULT_APARTMENTS);
  return json({apartments});
};
