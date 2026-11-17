<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Git permissions

The agent may only use Git commands that read information from the repository,
such as `status`, `log`, `diff`, `show`, `branch`, and `remote`.

The agent must not modify Git state or publish changes. In particular, it must
not run `add`, `commit`, `push`, `pull`, `fetch`, `merge`, `rebase`, `cherry-pick`,
`reset`, `restore`, `checkout`, or create/remove worktrees. Any requested code
changes must remain as uncommitted working-tree changes unless the user
explicitly changes this policy.
