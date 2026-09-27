import { json, fetchMonth, normalize, getMonthsBack, SEOUL_DISTRICTS } from "./_lib.mjs";

// 별도의 "전국 아파트 DB"를 두지 않고, 국토부가 실제로 갖고 있는 실거래 데이터
// 안에서 이름이 일치하는 단지를 찾아서 보여주는 방식입니다.
// 그래서 최근 몇 달 안에 거래가 없던 단지는 검색에 안 걸릴 수 있어요.
export default async (req) => {
  const url = new URL(req.url);
  const districtName = url.searchParams.get("district");
  const q = url.searchParams.get("q") || "";

  const district = SEOUL_DISTRICTS.find(d => d.name === districtName);
  if (!district) return json({ error: "구를 선택해주세요." }, 400);
  if (normalize(q).length < 1) return json({ results: [] });
  if (!process.env.MOLIT_SERVICE_KEY) return json({ error: "MOLIT_SERVICE_KEY가 설정되지 않았습니다." }, 500);

  const months = await getMonthsBack(6);
  const found = new Map();

  for (const month of months) {
    let rows;
    try {
      rows = await fetchMonth(process.env.MOLIT_SERVICE_KEY, district.lawd_cd, month);
    } catch (e) {
      console.error("검색용 국토부 API 실패", district.lawd_cd, month, e.message);
      continue;
    }
    for (const row of rows) {
      const name = String(row.aptNm || "").trim();
      if (!name) continue;
      if (!normalize(name).includes(normalize(q))) continue;
      const umd = String(row.umdNm || "").trim();
      const key = `${district.lawd_cd}|${name}|${umd}`;
      if (!found.has(key)) {
        found.set(key, {
          id: `${district.lawd_cd}-${normalize(name)}-${normalize(umd)}`,
          name,
          district: `서울 ${district.name}`,
	  address: `${umd} ${String(row.jibun || "").trim()}`.trim(),
          lawd_cd: district.lawd_cd
        });
      }
    }
  }

  return json({ results: [...found.values()].slice(0, 30) });
};
