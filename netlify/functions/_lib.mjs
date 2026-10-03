import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

export const store = getStore("real-estate-alert");

// apartments.json이 Blobs 저장소에 아직 없을 때 쓰이는 기본 목록입니다.
// apartments.mjs(목록 조회)와 subscriptions.mjs(구독 검증)가 이 값을 공유해야
// "존재하지 않는 아파트입니다" 오류 없이 기본 아파트를 구독할 수 있습니다.
export const DEFAULT_APARTMENTS = [
  {id:"11710-geoyeo5", name:"거여5단지", district:"서울특별시 송파구", lawd_cd:"11710"}
];

// 서울 25개 자치구의 법정동코드 앞 5자리(=국토부 실거래가 API의 LAWD_CD).
// 아파트 검색(search-apartments.mjs)에서 "구를 고르면 그 지역 실거래 데이터에서
// 아파트 이름을 찾는" 방식으로 쓰입니다. 이 코드는 정부 표준코드라 거의 바뀌지 않습니다.
export const SEOUL_DISTRICTS = [
  // 전국 시·군·구. LAWD_CD는 국토부 실거래 API에서 사용하는 5자리 코드입니다.
  {name:"서울특별시 종로구", sido:"서울특별시", lawd_cd:"11110"}, {name:"서울특별시 중구", sido:"서울특별시", lawd_cd:"11140"},
  {name:"서울특별시 용산구", sido:"서울특별시", lawd_cd:"11170"}, {name:"서울특별시 성동구", sido:"서울특별시", lawd_cd:"11200"},
  {name:"서울특별시 광진구", sido:"서울특별시", lawd_cd:"11215"}, {name:"서울특별시 동대문구", sido:"서울특별시", lawd_cd:"11230"},
  {name:"서울특별시 중랑구", sido:"서울특별시", lawd_cd:"11260"}, {name:"서울특별시 성북구", sido:"서울특별시", lawd_cd:"11290"},
  {name:"서울특별시 강북구", sido:"서울특별시", lawd_cd:"11305"}, {name:"서울특별시 도봉구", sido:"서울특별시", lawd_cd:"11320"},
  {name:"서울특별시 노원구", sido:"서울특별시", lawd_cd:"11350"}, {name:"서울특별시 은평구", sido:"서울특별시", lawd_cd:"11380"},
  {name:"서울특별시 서대문구", sido:"서울특별시", lawd_cd:"11410"}, {name:"서울특별시 마포구", sido:"서울특별시", lawd_cd:"11440"},
  {name:"서울특별시 양천구", sido:"서울특별시", lawd_cd:"11470"}, {name:"서울특별시 강서구", sido:"서울특별시", lawd_cd:"11500"},
  {name:"서울특별시 구로구", sido:"서울특별시", lawd_cd:"11530"}, {name:"서울특별시 금천구", sido:"서울특별시", lawd_cd:"11545"},
  {name:"서울특별시 영등포구", sido:"서울특별시", lawd_cd:"11560"}, {name:"서울특별시 동작구", sido:"서울특별시", lawd_cd:"11590"},
  {name:"서울특별시 관악구", sido:"서울특별시", lawd_cd:"11620"}, {name:"서울특별시 서초구", sido:"서울특별시", lawd_cd:"11650"},
  {name:"서울특별시 강남구", sido:"서울특별시", lawd_cd:"11680"}, {name:"서울특별시 송파구", sido:"서울특별시", lawd_cd:"11710"},
  {name:"서울특별시 강동구", sido:"서울특별시", lawd_cd:"11740"},
  {name:"부산광역시 중구", sido:"부산광역시", lawd_cd:"26110"}, {name:"부산광역시 서구", sido:"부산광역시", lawd_cd:"26140"},
  {name:"부산광역시 동구", sido:"부산광역시", lawd_cd:"26170"}, {name:"부산광역시 영도구", sido:"부산광역시", lawd_cd:"26200"},
  {name:"부산광역시 부산진구", sido:"부산광역시", lawd_cd:"26230"}, {name:"부산광역시 동래구", sido:"부산광역시", lawd_cd:"26260"},
  {name:"부산광역시 남구", sido:"부산광역시", lawd_cd:"26290"}, {name:"부산광역시 북구", sido:"부산광역시", lawd_cd:"26320"},
  {name:"부산광역시 해운대구", sido:"부산광역시", lawd_cd:"26350"}, {name:"부산광역시 사하구", sido:"부산광역시", lawd_cd:"26380"},
  {name:"부산광역시 금정구", sido:"부산광역시", lawd_cd:"26410"}, {name:"부산광역시 강서구", sido:"부산광역시", lawd_cd:"26440"},
  {name:"부산광역시 연제구", sido:"부산광역시", lawd_cd:"26470"}, {name:"부산광역시 수영구", sido:"부산광역시", lawd_cd:"26500"},
  {name:"부산광역시 사상구", sido:"부산광역시", lawd_cd:"26530"}, {name:"부산광역시 기장군", sido:"부산광역시", lawd_cd:"26710"},
  {name:"대구광역시 중구", sido:"대구광역시", lawd_cd:"27110"}, {name:"대구광역시 동구", sido:"대구광역시", lawd_cd:"27140"},
  {name:"대구광역시 서구", sido:"대구광역시", lawd_cd:"27170"}, {name:"대구광역시 남구", sido:"대구광역시", lawd_cd:"27200"},
  {name:"대구광역시 북구", sido:"대구광역시", lawd_cd:"27230"}, {name:"대구광역시 수성구", sido:"대구광역시", lawd_cd:"27260"},
  {name:"대구광역시 달서구", sido:"대구광역시", lawd_cd:"27290"}, {name:"대구광역시 달성군", sido:"대구광역시", lawd_cd:"27710"},
  {name:"대구광역시 군위군", sido:"대구광역시", lawd_cd:"27720"},
  {name:"인천광역시 중구", sido:"인천광역시", lawd_cd:"28110"}, {name:"인천광역시 동구", sido:"인천광역시", lawd_cd:"28140"},
  {name:"인천광역시 미추홀구", sido:"인천광역시", lawd_cd:"28177"}, {name:"인천광역시 연수구", sido:"인천광역시", lawd_cd:"28185"},
  {name:"인천광역시 남동구", sido:"인천광역시", lawd_cd:"28200"}, {name:"인천광역시 부평구", sido:"인천광역시", lawd_cd:"28237"},
  {name:"인천광역시 계양구", sido:"인천광역시", lawd_cd:"28245"}, {name:"인천광역시 서구", sido:"인천광역시", lawd_cd:"28260"},
  {name:"인천광역시 강화군", sido:"인천광역시", lawd_cd:"28710"}, {name:"인천광역시 옹진군", sido:"인천광역시", lawd_cd:"28720"},
  {name:"광주광역시 동구", sido:"광주광역시", lawd_cd:"29110"}, {name:"광주광역시 서구", sido:"광주광역시", lawd_cd:"29140"},
  {name:"광주광역시 남구", sido:"광주광역시", lawd_cd:"29155"}, {name:"광주광역시 북구", sido:"광주광역시", lawd_cd:"29170"},
  {name:"광주광역시 광산구", sido:"광주광역시", lawd_cd:"29200"},
  {name:"대전광역시 동구", sido:"대전광역시", lawd_cd:"30110"}, {name:"대전광역시 중구", sido:"대전광역시", lawd_cd:"30140"},
  {name:"대전광역시 서구", sido:"대전광역시", lawd_cd:"30170"}, {name:"대전광역시 유성구", sido:"대전광역시", lawd_cd:"30200"},
  {name:"대전광역시 대덕구", sido:"대전광역시", lawd_cd:"30230"},
  {name:"울산광역시 중구", sido:"울산광역시", lawd_cd:"31110"}, {name:"울산광역시 남구", sido:"울산광역시", lawd_cd:"31140"},
  {name:"울산광역시 동구", sido:"울산광역시", lawd_cd:"31170"}, {name:"울산광역시 북구", sido:"울산광역시", lawd_cd:"31200"},
  {name:"울산광역시 울주군", sido:"울산광역시", lawd_cd:"31710"},
  {name:"세종특별자치시", sido:"세종특별자치시", lawd_cd:"36110"},
  {name:"경기도 수원시 장안구", sido:"경기도", lawd_cd:"41111"}, {name:"경기도 수원시 권선구", sido:"경기도", lawd_cd:"41113"},
  {name:"경기도 수원시 팔달구", sido:"경기도", lawd_cd:"41115"}, {name:"경기도 수원시 영통구", sido:"경기도", lawd_cd:"41117"},
  {name:"경기도 성남시 수정구", sido:"경기도", lawd_cd:"41131"}, {name:"경기도 성남시 중원구", sido:"경기도", lawd_cd:"41133"},
  {name:"경기도 성남시 분당구", sido:"경기도", lawd_cd:"41135"}, {name:"경기도 의정부시", sido:"경기도", lawd_cd:"41150"},
  {name:"경기도 안양시 만안구", sido:"경기도", lawd_cd:"41171"}, {name:"경기도 안양시 동안구", sido:"경기도", lawd_cd:"41173"},
  {name:"경기도 부천시", sido:"경기도", lawd_cd:"41190"}, {name:"경기도 광명시", sido:"경기도", lawd_cd:"41210"},
  {name:"경기도 평택시", sido:"경기도", lawd_cd:"41220"}, {name:"경기도 동두천시", sido:"경기도", lawd_cd:"41250"},
  {name:"경기도 안산시 상록구", sido:"경기도", lawd_cd:"41271"}, {name:"경기도 안산시 단원구", sido:"경기도", lawd_cd:"41273"},
  {name:"경기도 고양시 덕양구", sido:"경기도", lawd_cd:"41281"}, {name:"경기도 고양시 일산서구", sido:"경기도", lawd_cd:"41287"},
  {name:"경기도 고양시 일산동구", sido:"경기도", lawd_cd:"41285"}, {name:"경기도 과천시", sido:"경기도", lawd_cd:"41290"},
  {name:"경기도 구리시", sido:"경기도", lawd_cd:"41310"}, {name:"경기도 남양주시", sido:"경기도", lawd_cd:"41360"},
  {name:"경기도 오산시", sido:"경기도", lawd_cd:"41370"}, {name:"경기도 시흥시", sido:"경기도", lawd_cd:"41390"},
  {name:"경기도 군포시", sido:"경기도", lawd_cd:"41410"}, {name:"경기도 의왕시", sido:"경기도", lawd_cd:"41430"},
  {name:"경기도 하남시", sido:"경기도", lawd_cd:"41450"}, {name:"경기도 용인시 처인구", sido:"경기도", lawd_cd:"41461"},
  {name:"경기도 용인시 기흥구", sido:"경기도", lawd_cd:"41463"}, {name:"경기도 용인시 수지구", sido:"경기도", lawd_cd:"41465"},
  {name:"경기도 파주시", sido:"경기도", lawd_cd:"41480"}, {name:"경기도 이천시", sido:"경기도", lawd_cd:"41500"},
  {name:"경기도 안성시", sido:"경기도", lawd_cd:"41550"}, {name:"경기도 김포시", sido:"경기도", lawd_cd:"41570"},
  {name:"경기도 화성시 만세구", sido:"경기도", lawd_cd:"41591"}, {name:"경기도 화성시 효행구", sido:"경기도", lawd_cd:"41593"},
  {name:"경기도 화성시 병점구", sido:"경기도", lawd_cd:"41595"}, {name:"경기도 화성시 동탄구", sido:"경기도", lawd_cd:"41597"},
  {name:"경기도 광주시", sido:"경기도", lawd_cd:"41610"}, {name:"경기도 양주시", sido:"경기도", lawd_cd:"41630"},
  {name:"경기도 포천시", sido:"경기도", lawd_cd:"41650"}, {name:"경기도 여주시", sido:"경기도", lawd_cd:"41670"},
  {name:"경기도 연천군", sido:"경기도", lawd_cd:"41800"}, {name:"경기도 가평군", sido:"경기도", lawd_cd:"41820"},
  {name:"경기도 양평군", sido:"경기도", lawd_cd:"41830"},
  {name:"강원특별자치도 춘천시", sido:"강원특별자치도", lawd_cd:"42110"}, {name:"강원특별자치도 원주시", sido:"강원특별자치도", lawd_cd:"42130"},
  {name:"강원특별자치도 강릉시", sido:"강원특별자치도", lawd_cd:"42150"}, {name:"강원특별자치도 동해시", sido:"강원특별자치도", lawd_cd:"42170"},
  {name:"강원특별자치도 태백시", sido:"강원특별자치도", lawd_cd:"42190"}, {name:"강원특별자치도 속초시", sido:"강원특별자치도", lawd_cd:"42210"},
  {name:"강원특별자치도 삼척시", sido:"강원특별자치도", lawd_cd:"42230"}, {name:"강원특별자치도 홍천군", sido:"강원특별자치도", lawd_cd:"42720"},
  {name:"강원특별자치도 횡성군", sido:"강원특별자치도", lawd_cd:"42730"}, {name:"강원특별자치도 영월군", sido:"강원특별자치도", lawd_cd:"42750"},
  {name:"강원특별자치도 평창군", sido:"강원특별자치도", lawd_cd:"42760"}, {name:"강원특별자치도 정선군", sido:"강원특별자치도", lawd_cd:"42770"},
  {name:"강원특별자치도 철원군", sido:"강원특별자치도", lawd_cd:"42780"}, {name:"강원특별자치도 화천군", sido:"강원특별자치도", lawd_cd:"42790"},
  {name:"강원특별자치도 양구군", sido:"강원특별자치도", lawd_cd:"42800"}, {name:"강원특별자치도 인제군", sido:"강원특별자치도", lawd_cd:"42810"},
  {name:"강원특별자치도 고성군", sido:"강원특별자치도", lawd_cd:"42820"}, {name:"강원특별자치도 양양군", sido:"강원특별자치도", lawd_cd:"42830"},
  {name:"충청북도 청주시 상당구", sido:"충청북도", lawd_cd:"43111"}, {name:"충청북도 청주시 서원구", sido:"충청북도", lawd_cd:"43112"},
  {name:"충청북도 청주시 흥덕구", sido:"충청북도", lawd_cd:"43113"}, {name:"충청북도 청주시 청원구", sido:"충청북도", lawd_cd:"43114"},
  {name:"충청북도 충주시", sido:"충청북도", lawd_cd:"43130"}, {name:"충청북도 제천시", sido:"충청북도", lawd_cd:"43150"},
  {name:"충청북도 보은군", sido:"충청북도", lawd_cd:"43720"}, {name:"충청북도 옥천군", sido:"충청북도", lawd_cd:"43730"},
  {name:"충청북도 영동군", sido:"충청북도", lawd_cd:"43740"}, {name:"충청북도 증평군", sido:"충청북도", lawd_cd:"43745"},
  {name:"충청북도 진천군", sido:"충청북도", lawd_cd:"43750"}, {name:"충청북도 괴산군", sido:"충청북도", lawd_cd:"43760"},
  {name:"충청북도 음성군", sido:"충청북도", lawd_cd:"43770"}, {name:"충청북도 단양군", sido:"충청북도", lawd_cd:"43800"},
  {name:"충청남도 천안시 동남구", sido:"충청남도", lawd_cd:"44131"}, {name:"충청남도 천안시 서북구", sido:"충청남도", lawd_cd:"44133"},
  {name:"충청남도 공주시", sido:"충청남도", lawd_cd:"44150"}, {name:"충청남도 보령시", sido:"충청남도", lawd_cd:"44180"},
  {name:"충청남도 아산시", sido:"충청남도", lawd_cd:"44200"}, {name:"충청남도 서산시", sido:"충청남도", lawd_cd:"44210"},
  {name:"충청남도 논산시", sido:"충청남도", lawd_cd:"44230"}, {name:"충청남도 계룡시", sido:"충청남도", lawd_cd:"44250"},
  {name:"충청남도 당진시", sido:"충청남도", lawd_cd:"44270"}, {name:"충청남도 금산군", sido:"충청남도", lawd_cd:"44710"},
  {name:"충청남도 부여군", sido:"충청남도", lawd_cd:"44760"}, {name:"충청남도 서천군", sido:"충청남도", lawd_cd:"44770"},
  {name:"충청남도 청양군", sido:"충청남도", lawd_cd:"44790"}, {name:"충청남도 홍성군", sido:"충청남도", lawd_cd:"44800"},
  {name:"충청남도 예산군", sido:"충청남도", lawd_cd:"44810"}, {name:"충청남도 태안군", sido:"충청남도", lawd_cd:"44825"},
  {name:"전라북도 전주시 완산구", sido:"전라북도", lawd_cd:"45111"}, {name:"전라북도 전주시 덕진구", sido:"전라북도", lawd_cd:"45113"},
  {name:"전라북도 군산시", sido:"전라북도", lawd_cd:"45130"}, {name:"전라북도 익산시", sido:"전라북도", lawd_cd:"45140"},
  {name:"전라북도 정읍시", sido:"전라북도", lawd_cd:"45180"}, {name:"전라북도 남원시", sido:"전라북도", lawd_cd:"45190"},
  {name:"전라북도 김제시", sido:"전라북도", lawd_cd:"45210"}, {name:"전라북도 완주군", sido:"전라북도", lawd_cd:"45710"},
  {name:"전라북도 진안군", sido:"전라북도", lawd_cd:"45720"}, {name:"전라북도 무주군", sido:"전라북도", lawd_cd:"45730"},
  {name:"전라북도 장수군", sido:"전라북도", lawd_cd:"45740"}, {name:"전라북도 임실군", sido:"전라북도", lawd_cd:"45750"},
  {name:"전라북도 순창군", sido:"전라북도", lawd_cd:"45770"}, {name:"전라북도 고창군", sido:"전라북도", lawd_cd:"45790"},
  {name:"전라북도 부안군", sido:"전라북도", lawd_cd:"45800"},
  {name:"전라남도 목포시", sido:"전라남도", lawd_cd:"46110"}, {name:"전라남도 여수시", sido:"전라남도", lawd_cd:"46130"},
  {name:"전라남도 순천시", sido:"전라남도", lawd_cd:"46150"}, {name:"전라남도 나주시", sido:"전라남도", lawd_cd:"46170"},
  {name:"전라남도 광양시", sido:"전라남도", lawd_cd:"46230"}, {name:"전라남도 담양군", sido:"전라남도", lawd_cd:"46710"},
  {name:"전라남도 곡성군", sido:"전라남도", lawd_cd:"46720"}, {name:"전라남도 구례군", sido:"전라남도", lawd_cd:"46730"},
  {name:"전라남도 고흥군", sido:"전라남도", lawd_cd:"46770"}, {name:"전라남도 보성군", sido:"전라남도", lawd_cd:"46780"},
  {name:"전라남도 화순군", sido:"전라남도", lawd_cd:"46790"}, {name:"전라남도 장흥군", sido:"전라남도", lawd_cd:"46800"},
  {name:"전라남도 강진군", sido:"전라남도", lawd_cd:"46810"}, {name:"전라남도 해남군", sido:"전라남도", lawd_cd:"46820"},
  {name:"전라남도 영암군", sido:"전라남도", lawd_cd:"46830"}, {name:"전라남도 무안군", sido:"전라남도", lawd_cd:"46840"},
  {name:"전라남도 함평군", sido:"전라남도", lawd_cd:"46860"}, {name:"전라남도 영광군", sido:"전라남도", lawd_cd:"46870"},
  {name:"전라남도 장성군", sido:"전라남도", lawd_cd:"46880"}, {name:"전라남도 완도군", sido:"전라남도", lawd_cd:"46890"},
  {name:"전라남도 진도군", sido:"전라남도", lawd_cd:"46900"}, {name:"전라남도 신안군", sido:"전라남도", lawd_cd:"46910"},
  {name:"경상북도 포항시 남구", sido:"경상북도", lawd_cd:"47111"}, {name:"경상북도 포항시 북구", sido:"경상북도", lawd_cd:"47113"},
  {name:"경상북도 경주시", sido:"경상북도", lawd_cd:"47130"}, {name:"경상북도 김천시", sido:"경상북도", lawd_cd:"47150"},
  {name:"경상북도 안동시", sido:"경상북도", lawd_cd:"47170"}, {name:"경상북도 구미시", sido:"경상북도", lawd_cd:"47190"},
  {name:"경상북도 영주시", sido:"경상북도", lawd_cd:"47210"}, {name:"경상북도 영천시", sido:"경상북도", lawd_cd:"47230"},
  {name:"경상북도 상주시", sido:"경상북도", lawd_cd:"47250"}, {name:"경상북도 문경시", sido:"경상북도", lawd_cd:"47280"},
  {name:"경상북도 경산시", sido:"경상북도", lawd_cd:"47290"}, {name:"경상북도 군위군", sido:"경상북도", lawd_cd:"47720"},
  {name:"경상북도 의성군", sido:"경상북도", lawd_cd:"47730"}, {name:"경상북도 청송군", sido:"경상북도", lawd_cd:"47750"},
  {name:"경상북도 영양군", sido:"경상북도", lawd_cd:"47760"}, {name:"경상북도 영덕군", sido:"경상북도", lawd_cd:"47770"},
  {name:"경상북도 청도군", sido:"경상북도", lawd_cd:"47820"}, {name:"경상북도 고령군", sido:"경상북도", lawd_cd:"47830"},
  {name:"경상북도 성주군", sido:"경상북도", lawd_cd:"47840"}, {name:"경상북도 칠곡군", sido:"경상북도", lawd_cd:"47850"},
  {name:"경상북도 예천군", sido:"경상북도", lawd_cd:"47900"}, {name:"경상북도 봉화군", sido:"경상북도", lawd_cd:"47920"},
  {name:"경상북도 울진군", sido:"경상북도", lawd_cd:"47930"}, {name:"경상북도 울릉군", sido:"경상북도", lawd_cd:"47940"},
  {name:"경상남도 창원시 의창구", sido:"경상남도", lawd_cd:"48121"}, {name:"경상남도 창원시 성산구", sido:"경상남도", lawd_cd:"48123"},
  {name:"경상남도 창원시 마산합포구", sido:"경상남도", lawd_cd:"48125"}, {name:"경상남도 창원시 마산회원구", sido:"경상남도", lawd_cd:"48127"},
  {name:"경상남도 창원시 진해구", sido:"경상남도", lawd_cd:"48129"}, {name:"경상남도 진주시", sido:"경상남도", lawd_cd:"48170"},
  {name:"경상남도 통영시", sido:"경상남도", lawd_cd:"48220"}, {name:"경상남도 사천시", sido:"경상남도", lawd_cd:"48240"},
  {name:"경상남도 김해시", sido:"경상남도", lawd_cd:"48250"}, {name:"경상남도 밀양시", sido:"경상남도", lawd_cd:"48270"},
  {name:"경상남도 거제시", sido:"경상남도", lawd_cd:"48310"}, {name:"경상남도 양산시", sido:"경상남도", lawd_cd:"48330"},
  {name:"경상남도 의령군", sido:"경상남도", lawd_cd:"48720"}, {name:"경상남도 함안군", sido:"경상남도", lawd_cd:"48730"},
  {name:"경상남도 창녕군", sido:"경상남도", lawd_cd:"48740"}, {name:"경상남도 고성군", sido:"경상남도", lawd_cd:"48820"},
  {name:"경상남도 남해군", sido:"경상남도", lawd_cd:"48840"}, {name:"경상남도 하동군", sido:"경상남도", lawd_cd:"48850"},
  {name:"경상남도 산청군", sido:"경상남도", lawd_cd:"48860"}, {name:"경상남도 함양군", sido:"경상남도", lawd_cd:"48870"},
  {name:"경상남도 거창군", sido:"경상남도", lawd_cd:"48880"}, {name:"경상남도 합천군", sido:"경상남도", lawd_cd:"48890"},
  {name:"제주특별자치도 제주시", sido:"제주특별자치도", lawd_cd:"50110"}, {name:"제주특별자치도 서귀포시", sido:"제주특별자치도", lawd_cd:"50130"}
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
  try{
    const raw = req.headers.get("cookie") || "";
    const match = raw.match(/(?:^|; )rea_session=([^;]+)/);
    if (!match) return null;
    const token = decodeURIComponent(match[1]);
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [userId, issued, sig] = parts;
    const expected = sign(`${userId}.${issued}`);
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    // timingSafeEqual은 두 버퍼 길이가 다르면 비교 대신 예외를 던지므로,
    // 형식이 깨진(옛날 버전, 수동 수정 등) 쿠키가 와도 죽지 않게 먼저 길이를 확인합니다.
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
    if (Date.now() - Number(issued) > 60*60*24*30*1000) return null;
    return userId;
  }catch(e){
    return null;
  }
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
  const sqm = Number(row.excluUseAr);
  const area = Number.isFinite(sqm) ? `${sqm}㎡ (${(sqm / 3.305785).toFixed(1)}평)` : `${row.excluUseAr ?? "-"}㎡`;
  return [
    `🏠 ${aptName} 실거래`,
    `${row.dealYear}.${String(row.dealMonth).padStart(2,"0")}.${String(row.dealDay).padStart(2,"0")}`,
    `💰 ${amount}만원`,
    `📐 ${area}`,
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

// 아파트 "검색" 전용: 최근 n개월치 연월 문자열(YYYYMM)을 반환합니다.
// 모니터링(getMonths)은 새 거래만 잡으면 되니 2개월이면 충분하지만,
// 검색은 거래가 뜸한 단지도 찾을 수 있게 더 길게(기본 6개월) 봅니다.
export async function getMonthsBack(n=6) {
  const d = new Date();
  const y = d.getUTCFullYear(), m = d.getUTCMonth()+1;
  const out=[];
  for(let i=0;i<n;i++){
    const dt = new Date(Date.UTC(y, m-1-i, 1));
    out.push(`${dt.getUTCFullYear()}${String(dt.getUTCMonth()+1).padStart(2,"0")}`);
  }
  return out;
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
