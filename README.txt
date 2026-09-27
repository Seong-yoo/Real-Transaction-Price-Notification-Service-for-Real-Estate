실거래 알리미 - 다중 사용자/다중 아파트 버전

이 버전은:
- 카카오 로그인
- 사용자별 관심 아파트 목록
- 국토부 아파트 실거래 API
- 새 거래만 카카오 나에게 보내기
- Netlify Scheduled Function 10분 주기
- Netlify Blobs 영구 저장
을 사용합니다.

중요:
1. 기존 PC용 app.py를 이 폴더에 섞지 마세요. 별도 프로젝트로 올리는 것을 권장합니다.
2. 실제 배포 전에 Netlify 환경변수 4개를 설정해야 합니다.
   MOLIT_SERVICE_KEY = 국토부 서비스키
   KAKAO_REST_KEY = 카카오 REST API 키
   KAKAO_REDIRECT_URI = https://사이트주소/api/callback
   SESSION_SECRET = 길고 랜덤한 문자열
   KAKAO_CLIENT_SECRET = 현재 카카오에서 Client Secret을 OFF로 해두었다면 비워두세요.
3. 카카오 Developers의 Redirect URI에도 똑같은 KAKAO_REDIRECT_URI를 등록해야 합니다.
4. 현재 아파트 목록에는 거여5단지만 들어 있습니다.
5. 전국 아파트를 사용자가 직접 검색/추가하는 기능은 다음 단계에서 붙이는 것이 좋습니다.

스케줄:
check.mjs가 10분마다 실행됩니다. Netlify Scheduled Functions는 UTC 기준입니다.
