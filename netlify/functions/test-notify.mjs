import { json, requireUser, getValidAccessToken, kakaoSend } from "./_lib.mjs";

// 실거래/스케줄 로직과 완전히 무관한 테스트용 함수입니다.
// 로그인한 "나"에게만 카카오톡 메시지 한 통을 보내서, 메시지 전송 파이프라인이
// 살아있는지만 확인합니다. 다른 사용자에게는 절대 영향 없습니다.
export default async (req) => {
  const user = await requireUser(req);
  if (!user) return json({ error: "로그인이 필요합니다. 먼저 사이트에 로그인한 브라우저에서 이 주소로 접속해주세요." }, 401);
  try {
    const token = await getValidAccessToken(user);
    await kakaoSend(token, "🔔 테스트 알림입니다.\n이 메시지가 보이면 카카오톡 전송이 정상 작동하는 거예요.");
    return json({ ok: true, message: "카카오톡을 확인해보세요." });
  } catch (e) {
    return json({ error: "카카오 메시지 전송 실패", detail: e.message }, 500);
  }
};
