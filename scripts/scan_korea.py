#!/usr/bin/env python3
"""Weekly radar: scan official conference sites for Korea-hosting signals.

주요 학회 공식 사이트를 가져와 한국 개최 관련 키워드(Seoul, Korea, COEX …)가
있는지 훑고, *새로* 발견된 신호만 검수용 리포트(마크다운)로 남긴다.

- 데이터( data/korea_conferences.json )를 직접 수정하지 않는다.
  개최지 오표기·스폰서 언급 같은 오탐이 있을 수 있어 사람 검수가 필요하며,
  GitHub Actions 가 리포트를 `korea-radar` 라벨 이슈로 올린다.
- 이미 등록된 학회(items)와 이미 보고한 신호(data/korea_scan_state.json)는
  건너뛰므로 같은 내용이 반복 보고되지 않는다.
- 사이트가 봇을 차단(403 등)하면 해당 사이트만 건너뛴다.

수동 실행:

  python3 scripts/scan_korea.py --report /tmp/report.md
"""
import argparse
import datetime
import json
import pathlib
import re
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "korea_conferences.json"
STATE = ROOT / "data" / "korea_scan_state.json"

# (약칭, URL 템플릿) — {year} 는 스캔 연도로 치환. 템플릿이 없으면 단일 페이지.
SOURCES = [
    ("ICML", "https://icml.cc/Conferences/{year}"),
    ("ICLR", "https://iclr.cc/Conferences/{year}"),
    ("NeurIPS", "https://neurips.cc/Conferences/{year}"),
    ("AAAI", "https://aaai.org/conference/aaai/"),
    ("IJCAI", "https://www.ijcai.org/future_conferences"),
    ("CVPR", "https://cvpr.thecvf.com/Conferences/{year}"),
    ("ICCV", "https://iccv.thecvf.com/Conferences/{year}"),
    ("ECCV", "https://eccv.ecva.net/Conferences/{year}"),
    ("ACL", "https://{year}.aclweb.org/"),
    ("EMNLP", "https://{year}.emnlp.org/"),
    ("NAACL", "https://{year}.naacl.org/"),
    ("ICASSP", "https://{year}.ieeeicassp.org/"),
    ("INTERSPEECH", "https://interspeech{year}.org/"),
    ("KDD", "https://kdd{year}.kdd.org/"),
    ("NDSS", "https://www.ndss-symposium.org/ndss{year}/"),
    ("ICRA", "https://{year}.ieee-icra.org/"),
]

KEYWORDS = ["seoul", "busan", "jeju", "incheon", "daejeon", "gwangju",
            "coex", "bexco", "kintex", "songdo", "korea"]
# 흔한 오탐 문맥(소속 기관·저자 등)은 신호에서 제외
NEGATIVE = ["university", "univ.", "institute", "kaist", "author", "@"]

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read(1_500_000).decode("utf-8", "replace")


def visible_text(html: str) -> str:
    html = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", html)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))


def find_signals(text: str):
    low = text.lower()
    for kw in KEYWORDS:
        for m in re.finditer(re.escape(kw), low):
            # 오탐 필터는 키워드 바로 옆(±25자)만 본다 — 멀리 있는 소속 표기가
            # 정상적인 개최지 발표 문장까지 지우지 않도록
            tight = low[max(0, m.start() - 25): m.end() + 25]
            if any(neg in tight for neg in NEGATIVE):
                continue
            yield kw, text[max(0, m.start() - 70): m.end() + 70].strip()
            break  # 키워드당 첫 유효 문맥 하나면 충분


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", type=pathlib.Path, required=True,
                    help="새 신호가 있을 때 검수용 리포트를 쓸 경로")
    args = ap.parse_args()

    today = datetime.date.today()
    years = [today.year, today.year + 1, today.year + 2]

    data = json.loads(SRC.read_text(encoding="utf-8"))
    tracked = {(i["abbr"], int(i["edition"])) for i in data["items"]
               if str(i.get("edition", "")).isdigit()}
    state = (json.loads(STATE.read_text(encoding="utf-8"))
             if STATE.exists() else {"reported": []})
    reported = set(state["reported"])

    findings, errors = [], []
    for abbr, tpl in SOURCES:
        scan_years = years if "{year}" in tpl else [0]
        for year in scan_years:
            url = tpl.format(year=year) if year else tpl
            try:
                text = visible_text(fetch(url))
            except (urllib.error.URLError, OSError, ValueError) as e:
                errors.append(f"{abbr} {url} — {e}")
                continue
            if year and (abbr, year) in tracked:
                continue  # 이미 등록된 개최 건
            for kw, ctx in find_signals(text):
                sig_id = f"{abbr}:{year or 'site'}:{kw}"
                if sig_id in reported:
                    continue
                reported.add(sig_id)
                findings.append((abbr, year, url, kw, ctx))

    if findings:
        # 같은 페이지에서 나온 키워드는 하나의 섹션으로 묶는다
        groups = {}
        for abbr, year, url, kw, ctx in findings:
            g = groups.setdefault((abbr, year, url), {"kws": [], "ctx": ctx})
            g["kws"].append(kw)
        lines = [
            f"주간 자동 스캔({today.isoformat()})에서 **한국 개최 가능성이 있는 "
            f"새 신호 {len(groups)}건**을 발견했습니다. 오탐일 수 있으니 반드시 "
            "공식 사이트에서 확인 후 `data/korea_conferences.json` 에 반영해 주세요.",
            "",
        ]
        for (abbr, year, url), g in groups.items():
            title = f"{abbr} {year}" if year else abbr
            kws = " ".join(f"`{k}`" for k in g["kws"])
            lines += [f"### {title} — 키워드 {kws}",
                      f"- 출처: {url}",
                      f"- 문맥: “…{g['ctx']}…”",
                      ""]
        lines += ["반영 절차: `items` 에 항목 추가 → `python3 scripts/build_korea.py` "
                  "→ 커밋. 오탐이면 이 이슈만 닫으면 됩니다(다시 보고되지 않음)."]
        args.report.write_text("\n".join(lines) + "\n", encoding="utf-8")
        state["reported"] = sorted(reported)
        state["updated"] = today.isoformat()
        STATE.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n",
                         encoding="utf-8")

    print(f"scanned {len(SOURCES)} sources, {len(findings)} new signal(s), "
          f"{len(errors)} fetch error(s)")
    for e in errors:
        print("  skip:", e)


if __name__ == "__main__":
    main()
