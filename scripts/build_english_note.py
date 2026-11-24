#!/usr/bin/env python3
"""영어 표현 수첩 빌더 — 데이터 JSON + src/ 를 하나의 index.html 로 묶습니다.

사용법 (저장소 루트에서):
    python3 scripts/build_english_note.py
    python3 scripts/build_english_note.py --data /경로/english-note-data.json
    python3 scripts/build_english_note.py --out index.html --pretty

동작:
  1) data/expressions.json 을 읽어 세션·항목 구조를 검사
  2) src/style.css, src/app.js, src/template.html 을 읽어
  3) CSS·JS·데이터를 모두 인라인으로 넣은 단일 index.html 을 씀 (오프라인·홈화면 추가 대응)
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KINDS = {"표현", "단어", "숙어", "문장"}


def load_data(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        sys.exit(f"데이터 파일이 없습니다: {path}")
    except json.JSONDecodeError as e:
        sys.exit(f"데이터 JSON 문법 오류: {path} → {e}")

    if not isinstance(data.get("sessions"), list) or not data["sessions"]:
        sys.exit("데이터에 sessions 배열이 비어 있습니다.")

    seen = set()
    for s in data["sessions"]:
        if not s.get("date"):
            sys.exit("세션에 date 가 없습니다.")
        date.fromisoformat(s["date"])  # 형식 검사 (YYYY-MM-DD)
        for i, it in enumerate(s.get("items", []), start=1):
            where = f'{s["date"]} #{i}'
            if not it.get("en"):
                sys.exit(f"{where}: en(영어 표현)이 비어 있습니다.")
            if not it.get("ko"):
                sys.exit(f"{where}: ko(한국어 뜻)가 비어 있습니다.")
            if it.get("kind", "표현") not in KINDS:
                sys.exit(f'{where}: kind 는 {"/".join(sorted(KINDS))} 중 하나여야 합니다.')
            if it["en"] in seen:
                print(f'  ! 중복 표현: {it["en"]} ({where})')
            seen.add(it["en"])
            ex = it.get("example") or {}
            if ex and ("en" not in ex or "ko" not in ex):
                print(f"  ! 예문에 en/ko 한쪽이 빠졌습니다 ({where})")
    return data


def main() -> None:
    ap = argparse.ArgumentParser(description="영어 표현 수첩 빌더")
    ap.add_argument("--data", default=str(ROOT / "data" / "expressions.json"),
                    help="표현 데이터 JSON 경로")
    ap.add_argument("--out", default=str(ROOT / "index.html"),
                    help="출력 HTML 경로")
    ap.add_argument("--pretty", action="store_true", help="데이터 JSON을 들여쓰기해 넣기")
    args = ap.parse_args()

    data_path = Path(args.data).expanduser()
    data = load_data(data_path)

    css = (ROOT / "src" / "style.css").read_text(encoding="utf-8")
    js = (ROOT / "src" / "app.js").read_text(encoding="utf-8")
    tpl = (ROOT / "src" / "template.html").read_text(encoding="utf-8")

    items = [it for s in data["sessions"] for it in s.get("items", [])]
    expr = sum(1 for it in items if it.get("kind", "표현") != "문장")
    sent = sum(1 for it in items if it.get("kind") == "문장")

    if args.pretty:
        payload = json.dumps(data, ensure_ascii=False, indent=2)
    else:
        payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    # </script> 로 조기 종료되지 않도록
    payload = payload.replace("</", "<\\/")

    updated = data.get("updated") or max(s["date"] for s in data["sessions"])
    updated_dots = updated.replace("-", ".")

    html = (tpl
            .replace("__CSS__", css)
            .replace("__DATA__", payload)
            .replace("__JS__", js)
            .replace("__TITLE__", data.get("title", "영어 표현 수첩"))
            .replace("__SUBTITLE__", data.get("subtitle", "매일 영어 대화에서 건진 표현"))
            .replace("__DESC__", data.get("subtitle", "매일 영어 대화에서 건진 표현·숙어·첨삭 문장 수첩"))
            .replace("__UPDATED__", updated_dots))

    out = Path(args.out).expanduser()
    out.write_text(html, encoding="utf-8")

    print(f"빌드 완료 → {out}")
    print(f"  세션 {len(data['sessions'])}개 · 표현/숙어 {expr}개 · 완성 문장 {sent}개 (총 {len(items)}개)")
    print(f"  크기 {out.stat().st_size / 1024:.1f} KB · 데이터 {data_path.name} · 업데이트 {updated_dots}")


if __name__ == "__main__":
    main()
