#!/bin/bash
# Blocks Claude's `git push` until the mobile-review skill has passed for HEAD.
python3 -c '
import json, re, shlex, sys
cmd = json.load(sys.stdin).get("tool_input", {}).get("command", "")
for part in re.split(r"&&|\|\||[;|&\n]", cmd):
    try: toks = shlex.split(part)
    except ValueError: toks = part.split()
    if "git" not in toks: continue
    rest = toks[toks.index("git") + 1:]
    while rest and rest[0].startswith("-"):  # global options; -C/-c take a value
        rest = rest[2:] if rest[0] in ("-C", "-c") else rest[1:]
    if rest and rest[0] == "push": sys.exit(1)
' 2>/dev/null && exit 0

dir="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"
head=$(git -C "$dir" rev-parse HEAD 2>/dev/null)
stamp=$(cat "$dir/.claude/.mobile-review-ok" 2>/dev/null)

[ -n "$head" ] && [ "$stamp" = "$head" ] && exit 0

echo "Push blocked: no passing mobile review for HEAD $head. Run the mobile-review skill first (.claude/skills/mobile-review/SKILL.md); it writes the stamp on PASS." >&2
exit 2
