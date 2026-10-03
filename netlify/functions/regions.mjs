import { json, SEOUL_DISTRICTS } from "./_lib.mjs";

export default async () => {
  return json({
    regions: SEOUL_DISTRICTS.map(({sido, name, lawd_cd}) => ({sido, name, lawd_cd}))
  });
};
