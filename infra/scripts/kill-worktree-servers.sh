#!/usr/bin/env sh
# Kill the dev servers a removed worktree left behind.
#
# `pnpm dev` starts wrangler and vite out of the worktree's own node_modules, so
# both carry its path in their command line long after the directory is gone. An
# orphan keeps port 8787 or 5173, and the next worktree to run `pnpm dev` fails
# to bind for reasons that point nowhere.
#
# Run from worktrunk's post-remove hook; takes the removed worktree's path.
set -eu

worktree=${1:?usage: kill-worktree-servers.sh <worktree-path>}
case $worktree in
  /*) ;;
  *)
    echo "kill-worktree-servers: refusing a relative path: $worktree" >&2
    exit 1
    ;;
esac

pattern="$worktree/node_modules"

# macOS `pgrep -f` does not reliably match a full command line, so read the
# table directly. Snapshotting it first keeps the grep out of its own results.
matching_pids() {
  snapshot=$(ps ax -o pid=,args=)
  printf '%s\n' "$snapshot" | grep -F "$pattern" | awk -v self="$$" '$1 != self { print $1 }'
}

pids=$(matching_pids)
[ -n "$pids" ] || exit 0

echo "kill-worktree-servers: stopping $(printf '%s\n' "$pids" | wc -l | tr -d ' ') process(es) from $worktree"
printf '%s\n' "$pids" | xargs kill 2>/dev/null || true
sleep 2

# wrangler's workerd child holds the socket and does not always go with its
# parent, so anything still alive gets the second one.
remaining=$(matching_pids)
[ -n "$remaining" ] || exit 0
printf '%s\n' "$remaining" | xargs kill -9 2>/dev/null || true
