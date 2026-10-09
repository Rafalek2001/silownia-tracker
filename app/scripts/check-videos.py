# Checks that every library exercise has a technique video that exists on YouTube (via oEmbed).
# Run: python3 app/scripts/check-videos.py  — exits 1 on a missing or broken link.
import json, re, subprocess, sys, urllib.parse

src = open(__import__("pathlib").Path(__file__).resolve().parent.parent / "src/lib/exercises.ts").read()
entries = re.findall(r'id: "([^"]+)",\s*name: "([^"]*)",\s*en: "[^"]*",(?:\s*video: \{ url: "([^"]*)")?', src)
bad = 0
for id_, name, url in entries:
    if not url:
        print(f"MISSING  {id_:28} {name}")
        bad += 1
        continue
    q = urllib.parse.quote(url, safe="")
    try:
        out = subprocess.run(["curl", "-sf", "--max-time", "15", f"https://www.youtube.com/oembed?url={q}&format=json"], capture_output=True, text=True, check=True).stdout
        d = json.loads(out)
        print(f"OK       {id_:28} {d['author_name']:26} {d['title'][:70]}")
    except Exception as e:
        print(f"BROKEN   {id_:28} {url} ({e})")
        bad += 1
print(f"\n{len(entries)} exercises, {bad} problems")
sys.exit(1 if bad else 0)
