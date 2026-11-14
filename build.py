"""応募シート（CSV）から作品ページを作る。

ローカル試験:  python build.py sample/entries.csv sample/votes.csv
本番(Actions): 環境変数 GOOGLE_CREDENTIALS / ENTRY_SHEET / VOTE_SHEET を入れて python build.py
"""
import csv, datetime, hashlib, html, io, json, os, re, shutil, subprocess, sys, tempfile, urllib.parse
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).parent
SITE_URL = os.environ.get("SITE_URL", "").rstrip("/")         # 例 https://xxx.github.io/degitail-expo
# フォームの質問文（シートの見出し）。フォームの文言を変えたらここも変える
COL = dict(time="タイムスタンプ", title="作品名", by="ハンドルネーム", desc="プロジェクト概要",
           images="画像", video="動画", youtube="YouTube URL", link="リンク", sns="SNSアカウント",
           ok="掲載", vote_id="作品ID", battle="投票バトル")

# 投票：締切後の票は数えない。作品の掲載から日がたつほど1票の重みを下げる（HALF_LIFE日で半分）
DEADLINE = datetime.datetime(2026, 11, 30, 23, 59, 59)
HALF_LIFE = 7

def when(s):  # フォームのタイムスタンプ「2026/11/02 9:00:00」
    return datetime.datetime.strptime(s.strip(), "%Y/%m/%d %H:%M:%S")

def vote_weight(entry_time, vote_time):
    days = max(0, (vote_time - entry_time).total_seconds() / 86400)
    return 0.5 ** (days / HALF_LIFE)

# ---------- Google から取得（本番のみ） ----------
_session = None
def google():
    global _session
    if _session is None:
        from google.oauth2 import service_account
        from google.auth.transport.requests import AuthorizedSession
        info = json.loads(os.environ["GOOGLE_CREDENTIALS"])
        cred = service_account.Credentials.from_service_account_info(
            info, scopes=["https://www.googleapis.com/auth/drive.readonly",
                    "https://www.googleapis.com/auth/spreadsheets.readonly"])
        _session = AuthorizedSession(cred)
    return _session

def read_rows(src):
    """src はローカルの CSV パス、またはシートID（「ID:gid」でタブ指定）"""
    if Path(src).exists():
        text = Path(src).read_text(encoding="utf-8-sig")
    else:
        # Sheets API で読む（CSV書き出しは転送先で400になるため使わない）。「ID:gid」ならそのタブ、IDだけなら1枚目
        sid, _, gid = (s.strip() for s in src.partition(":"))
        api = f"https://sheets.googleapis.com/v4/spreadsheets/{sid}"
        rng = "A:ZZ"
        if gid:
            r = google().get(api, params={"fields": "sheets.properties(sheetId,title)"})
            r.raise_for_status()
            tabs = r.json()["sheets"]
            names = {str(t["properties"]["sheetId"]): t["properties"]["title"] for t in tabs}
            if gid not in names:
                sys.exit(f"シート {sid} に gid={gid} のタブがない。あるタブ：{names}")
            title = names[gid]
            rng = "'" + title.replace("'", "''") + "'!A:ZZ"
        r = google().get(f"{api}/values/{urllib.parse.quote(rng)}")
        r.raise_for_status()
        head, *body = r.json().get("values", [[]])
        head = [h.strip() for h in head]
        return [dict(zip(head, row + [""] * (len(head) - len(row)))) for row in body]
    return list(csv.DictReader(io.StringIO(text)))

def fetch(ref, dst):
    """フォームの添付は Drive の URL。ローカル試験ではファイルパス"""
    m = re.search(r"[?&]id=([\w-]+)|/d/([\w-]+)", ref)
    if m:
        r = google().get(f"https://www.googleapis.com/drive/v3/files/{m[1] or m[2]}?alt=media")
        if not r.ok:
            raise RuntimeError(f"{r.status_code} {r.text[:400]}")
        dst.write_bytes(r.content)
    else:
        dst.write_bytes((ROOT / ref).read_bytes())

# ---------- 変換 ----------
def split(v):
    return [s.strip() for s in (v or "").split(",") if s.strip()]

def safe_url(u):
    u = (u or "").strip()
    return u if re.match(r"https?://", u) else ""

def youtube_id(u):
    m = re.search(r"(?:youtu\.be/|v=|shorts/|embed/)([\w-]{11})", u or "")
    return m[1] if m else ""

def make_media(e, refs_img, ref_video, out):
    """画像は長辺1280のJPEG、OGPは1200x630、動画は音なし・15秒・幅640のmp4"""
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for i, ref in enumerate(refs_img, 1):
            raw = Path(tmp) / f"img{i}"
            fetch(ref, raw)
            im = ImageOps.exif_transpose(Image.open(raw)).convert("RGB")
            if i == 1:
                ImageOps.fit(im, (1200, 630)).save(out / "ogp.jpg", quality=85)
            im.thumbnail((1280, 1280))
            im.save(out / f"{i}.jpg", quality=82)
        if ref_video:
            raw = Path(tmp) / "video"
            fetch(ref_video, raw)
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-an", "-t", "15",
                            "-vf", "scale=640:-2", "-c:v", "libx264", "-crf", "28", "-pix_fmt", "yuv420p",
                            "-movflags", "+faststart", str(out / "v.mp4")], check=True)

def entry(row):
    eid = hashlib.sha1((row[COL["time"]] + row[COL["title"]]).encode()).hexdigest()[:8]
    out = ROOT / "media" / eid
    imgs, video = split(row.get(COL["images"])), split(row.get(COL["video"]))
    if not out.exists():  # 変換済みならやり直さない（毎時の実行を軽くする）
        try:
            make_media(eid, imgs, video[0] if video else "", out)
        except Exception as err:
            print(f"::error::[skip] {row[COL['title']]}: {err!r}")  # ::error:: は Actions の注釈に出る
            shutil.rmtree(out, ignore_errors=True)  # 途中まで作ったフォルダを残さない
            return None
    n = len(list(out.glob("[0-9]*.jpg")))
    return dict(id=eid, title=row[COL["title"]].strip(), by=row[COL["by"]].strip(),
                desc=row[COL["desc"]].strip(), short=row[COL["desc"]].strip()[:40],
                imgs=[f"media/{eid}/{i}.jpg" for i in range(1, n + 1)],
                video=f"media/{eid}/v.mp4" if (out / "v.mp4").exists() else "",
                yt=youtube_id(row.get(COL["youtube"])), url=safe_url(row.get(COL["link"])),
                sns=row.get(COL["sns"], "").strip(), votes=0, pts=0, start=row[COL["time"]].strip(),
                battle=bool(row.get(COL["battle"], "").strip()))  # チェックすると選択肢の文字が入る

def load_reviews():
    """reviews.csv（作品ID, Claude Code, ChatGPT）。運営が手で足す"""
    p = ROOT / "reviews.csv"
    return {r["作品ID"].strip(): r for r in csv.DictReader(p.open(encoding="utf-8-sig"))} if p.exists() else {}

REVIEWS = load_reviews()

def review_html(a):
    r = REVIEWS.get(a["id"], {})
    def body(t):  # 最初の1文だけ見せて、残りは「続きを読む」で開く
        head, dot, rest = html.escape(t.strip()).partition("。")
        return f'<details><summary>{head}{dot}<span class="more">続きを読む</span></summary>{rest}</details>' if rest else f'<p>{head}{dot}</p>'
    items = "".join(f'<div class="review"><h3>{who}</h3>{body(r[who])}</div>'
                    for who in ("Claude Code", "ChatGPT") if r.get(who, "").strip())
    return f'<section class="reviews"><h2>AI講評</h2>{items or "<p>講評準備中</p>"}</section>'

def linkify(text):
    """本文を HTML にし、中の URL をリンクにする。全角文字（「」。など）の手前で URL を切る"""
    return re.sub(r"https?://[^\s<>\"'\u3000-\uffff]+",
                  lambda m: f'<a href="{m[0]}" target="_blank" rel="noopener">{m[0]}</a>', html.escape(text))

def next_html(nxt):
    """ページの最後に置く「ほかの作品」カード"""
    if not nxt:
        return ""
    h = html.escape
    cards = "".join(
        f'<a class="card" href="{b["id"]}.html"><div class="thumb"'
        + (f' style="background-image:url(../{b["imgs"][0]})">' if b["imgs"] else f'>{h(b["title"])}')
        + f'</div><div class="body"><h3>{h(b["title"])}</h3><p>{h(b["short"])}</p></div></a>' for b in nxt)
    return f'<section class="next"><h2>ほかの作品も見る</h2><div class="grid">{cards}</div></section>'

def page(a, nxt=()):
    h = html.escape
    abs_ = lambda p: f"{SITE_URL}/{p}" if SITE_URL else f"../{p}"
    share = "https://x.com/intent/post?text=" + urllib.parse.quote(
        f"{a['title']} / {a['by']} #DegitailExpo {SITE_URL}/w/{a['id']}.html")
    if a["yt"]:
        hero = f'<iframe src="https://www.youtube-nocookie.com/embed/{a["yt"]}" allowfullscreen></iframe>'
    elif a["video"]:
        hero = f'<video src="../{a["video"]}" muted loop playsinline autoplay controls></video>'
    else:
        hero = f'<img src="../{a["imgs"][0]}" alt="">' if a["imgs"] else ""
    gallery = "".join(f'<img src="../{p}" alt="" loading="lazy">' for p in a["imgs"])
    sns = h(a["sns"])
    if re.match(r"@[\w.]{1,30}$", a["sns"]):  # 「@名前」だけなら Threads のユーザー名として扱う
        sns = f'<a href="https://www.threads.com/{h(a["sns"])}" target="_blank" rel="noopener">{sns}</a>'
    elif safe_url(a["sns"]):
        sns = f'<a href="{sns}" target="_blank" rel="noopener">{sns}</a>'
    vote_btn = f'<button class="btn primary vote" data-id="{a['id']}" data-title="{h(a['title'])}">投票する</button>' if a["battle"] else ""
    count = f'<span class="count" data-n="{a["votes"]}">{a["votes"]}票</span>' if a["battle"] else ""
    try_btn = f'<a class="btn primary" href="{h(a["url"])}" target="_blank" rel="noopener">体験する</a>' if a["url"] else ""
    return f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{h(a['title'])} — Degitail Expo</title>
<meta property="og:title" content="{h(a['title'])} — Degitail Expo">
<meta property="og:description" content="{h(a['short'])}">
<meta property="og:image" content="{abs_(f'media/{a["id"]}/ogp.jpg')}">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="../style.css">
</head>
<body>
<nav><a href="../index.html">展示作品</a><a href="../ranking.html">投票TOP10</a><a href="../contest.html">コンテストルール</a></nav>
<main class="work">
  <div class="hero">{hero}{count}</div>
  <p class="viewers" data-id="{a['id']}"></p>
  <h1>{h(a['title'])}</h1>
  <div class="meta">作者：{h(a['by'])} ／ {sns}</div>
  <p class="desc">{linkify(a['desc'])}</p>
  <div class="btns">{try_btn}{vote_btn}<a class="btn" href="{h(share)}" target="_blank" rel="noopener">Xでシェア</a></div>
  {review_html(a)}
  <div class="gallery">{gallery}</div>
  {next_html(nxt)}
</main>
<footer>© 2026 Degitail Expo</footer>
<script src="../viewers.js"></script>
<script src="../bg.js"></script>
<script src="../count.js"></script>
<script src="../vote.js"></script>
<script src="../gallery.js"></script>
</body>
</html>
"""

def main():
    args = sys.argv[1:]
    entries_src = args[0] if args else os.environ["ENTRY_SHEET"]
    votes_src = args[1] if len(args) > 1 else os.environ.get("VOTE_SHEET", "")
    all_rows = read_rows(entries_src)
    print(f"::notice::応募シート：{len(all_rows)} 行、見出し {list(all_rows[0]) if all_rows else []}")
    rows = [r for r in all_rows if r.get(COL["ok"], "").strip().upper() in ("TRUE", "1", "済")]
    apps = [a for a in map(entry, rows) if a]
    recent = []  # 電光掲示板に流す直近の票
    if votes_src:
        by_id = {a["id"]: a for a in apps if a["battle"]}
        vrows = read_rows(votes_src)
        for r in vrows:
            a, t = by_id.get(r.get(COL["vote_id"], "").strip()), when(r[COL["time"]])
            if a and t <= DEADLINE:
                a["votes"] += 1
                a["pts"] += vote_weight(when(a["start"]), t)
                recent.append((t, a["title"]))
        for a in apps:
            a["pts"] = round(a["pts"], 2)
        n = sum(a["votes"] for a in apps)
        print(f"::notice::投票シート：{len(vrows)} 行、集計 {n} 票（締切後・掲載外の作品への票 {len(vrows) - n} 件は除外）")
    (ROOT / "w").mkdir(exist_ok=True)
    for i, a in enumerate(apps):  # 次の作品は応募順で隣の3つ（最後まで行ったら先頭へ）
        nxt = [apps[(i + k) % len(apps)] for k in range(1, min(4, len(apps)))]
        (ROOT / "w" / f"{a['id']}.html").write_text(page(a, nxt), encoding="utf-8")
    data = json.dumps(apps, ensure_ascii=False, indent=1).replace("</", "<\\/")
    recent_js = json.dumps([dict(t=t.strftime("%m/%d %H:%M"), title=x) for t, x in sorted(recent)[-5:][::-1]],
                           ensure_ascii=False).replace("</", "<\\/")
    (ROOT / "data.js").write_text(f"// build.py が生成。手で編集しない\nconst APPS = {data};\nconst RECENT = {recent_js};\n", encoding="utf-8")
    print(f"::notice::{len(apps)} 作品を反映（変換に失敗 {len(rows) - len(apps)} 件）")

if __name__ == "__main__":
    main()
