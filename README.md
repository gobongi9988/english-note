# 📘 영어 표현 수첩

매일 영어 대화 연습에서 나온 **표현 · 단어 · 숙어 · 첨삭 완성 문장**을 한 장씩 모아 보는 모바일 웹앱입니다.
`index.html` 한 파일에 CSS·JS·데이터가 모두 들어 있어 인터넷이 없어도 열립니다.

- 라이브: https://gobongi9988.github.io/english-note/
- 아이폰: Safari에서 열고 **공유 → 홈 화면에 추가** → 앱처럼 전체 화면으로 열립니다.

## 쓰는 법

| 위치 | 하는 일 |
| --- | --- |
| 상단 검색창 | 표현·뜻·예문·메모를 한 번에 검색 (검색어는 노랗게 표시) |
| `전체` / `⭐ 즐겨찾기` / `날짜` | 전체 목록 · 내가 별표한 것만 · 날짜별 묶어 보기 |
| 카드 탭 | 메모와 내가 쓴 원문 → 첨삭까지 펼쳐 보기 |
| 카드 **왼쪽** `★`~`★★★` | 표현 자체의 중요도(실생활 활용도) — 데이터에 고정된 값, 금색 알약 모양 |
| 카드 **오른쪽** `☆` | 즐겨찾기 표시 (이 브라우저에 저장, `localStorage`) |

## 표현 추가하고 다시 올리기

1. `data/expressions.json` 의 해당 날짜 세션 `items` 에 항목을 추가합니다.

```json
{
  "kind": "표현",
  "importance": 3,
  "en": "get slammed with work",
  "ko": "일이 폭탄처럼 쏟아지다",
  "nuance": "한 줄 뉘앙스 설명",
  "example": { "en": "Today sucked. I got slammed with work.", "ko": "오늘 최악이야. 일복 터져서 일이 폭탄처럼 쏟아졌어." },
  "also": [ { "en": "be buried in work", "ko": "일더미에 파묻히다" } ],
  "note": "문법·실수 메모 (선택)",
  "mine": "내가 실제로 쓴 문장 (선택 — '첨삭'으로 보임)"
}
```

- `kind` 는 `표현` / `단어` / `숙어` / `문장` 중 하나. `문장`은 첨삭 완성 문장용(초록 카드).
- `importance` 는 1~3 정수. 카드 왼쪽 금색 별 개수로 보입니다 — 3 = 원어민이 일상·직장에서 정말 자주 쓰는 핵심(★★★), 2 = 자주 쓰는 유용한 표현(★★), 1 = 가끔 쓰는 표현(★). 생략하면 별이 안 붙습니다.
- 첨삭 문장은 그 문장이 연습하는 표현 중 **가장 높은 importance** 를 그대로 씁니다(예: busywork만 있으면 ★★, swing by + no way면 ★★★).
- 새 날짜는 `sessions` 에 `{ "date": "2026-11-25", "label": "짧은 제목", "items": [] }` 를 추가.
- `updated` 도 그날 날짜로 바꿔 주세요.

2. 빌드하고 올립니다.

```bash
python3 scripts/build_english_note.py     # 데이터 검사 + index.html 생성
git add -A && git commit -m "2026-11-25 표현 추가" && git push
```

데이터를 다른 곳에 둘 때는 `--data 경로` 로 지정할 수 있습니다. 아이콘을 다시 만들려면 `python3 scripts/make_icons.py`.

## 구성

```
index.html               생성물 (직접 고치지 말고 아래를 고친 뒤 빌드)
data/expressions.json    표현 데이터 (유일한 원본)
src/style.css            스타일
src/app.js               검색·탭·별표 로직
src/template.html        HTML 뼈대
scripts/build_english_note.py   빌더
scripts/make_icons.py           홈 화면 아이콘 생성
manifest.webmanifest · icon-*.png · .nojekyll   GitHub Pages / 홈 화면 추가용
```

GitHub Pages: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`** 를 켜면 위 라이브 주소로 열립니다.
