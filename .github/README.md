# 2md

Converts GitHub repositories, directories, or single files into a single Markdown document for easy consumption by LLMs or documentation tools.

## Examples

Paste any GitHub URL and it redirects to a clean format:

| Input | Redirects to |
|-------|--------------|
| `2md.sauce.wiki/github.com/vercel-labs/json-render` | `2md.sauce.wiki/gh_vercel-labs_json-render.md` |
| `2md.sauce.wiki/github.com/vercel-labs/json-render/tree/main/examples/dashboard` | `2md.sauce.wiki/gh_vercel-labs_json-render_examples_dashboard.md` |
| `2md.sauce.wiki/github.com/vercel-labs/json-render/blob/main/README.md` | Returns file content directly |

## CLI

```bash
npx github:o-az/2md honojs/hono
npx github:o-az/2md honojs/hono/src
npx github:o-az/2md https://github.com/honojs/hono/blob/main/README.md
```
