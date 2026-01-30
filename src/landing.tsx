import { Hono } from 'hono'
import type { FC } from 'hono/jsx'
import { proxy } from 'hono/proxy'

const landingApp = new Hono<{ Bindings: Cloudflare.Env }>()

const Layout: FC = props => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link
        rel="icon"
        href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💾</text></svg>"
      />
      <title>2md</title>
    </head>
    <body style="font-family: monospace; max-width: 800px; margin: 0 auto; padding: 1rem;">
      {props.children}
    </body>
  </html>
)

landingApp.get('/', context =>
  context.html(
    <Layout>
      <h1>2md</h1>
      <p>Convert GitHub repos, directories, or files to markdown.</p>

      <h2>Usage</h2>
      <ul style="list-style: none; padding: 0; margin: 0; background: #f4f4f4; padding: 1rem; overflow-x: auto; white-space: pre-wrap;">
        <li>
          <a href="/">2md.sauce.wiki</a>
        </li>
        <li>
          <code>+</code>
        </li>
        <li>
          <code>/github.com/owner/repo</code> → whole repo
        </li>
        <li>
          <code>/github.com/owner/repo/tree/branch</code> → repo at branch
        </li>
        <li>
          <code>/github.com/owner/repo/tree/b/path</code> → directory at branch
        </li>
        <li>
          <code>/github.com/owner/repo/blob/b/file</code> → single file at
          branch
        </li>
        <li>
          <code>/github.com/owner/repo/path</code> → shorthand (file or dir)
        </li>
      </ul>

      <h2>Examples</h2>
      <h3>Whole repo</h3>
      <ul>
        <li>
          <a
            href="/github.com/o-az/2md"
            target="_blank"
            rel="noopener noreferrer">
            /github.com/o-az/2md
          </a>
        </li>
        <li>
          <a
            href="/github.com/honojs/hono"
            target="_blank"
            rel="noopener noreferrer">
            /github.com/honojs/hono
          </a>
        </li>
      </ul>

      <h3>Directory</h3>
      <ul>
        <li>
          <a
            href="/github.com/o-az/2md/tree/main/src"
            target="_blank"
            rel="noopener noreferrer">
            /github.com/o-az/2md/tree/main/src
          </a>
        </li>
        <li>
          <a
            href="/github.com/o-az/2md/src"
            target="_blank"
            rel="noopener noreferrer">
            /github.com/o-az/2md/src
          </a>{' '}
          (shorthand)
        </li>
        <li>
          <a
            href="/github.com/o-az/2md/tree/main/.github"
            target="_blank"
            rel="noopener noreferrer">
            /github.com/o-az/2md/tree/main/.github
          </a>
        </li>
      </ul>

      <h3>Single file</h3>
      <ul>
        <li>
          <a
            href="/github.com/o-az/2md/blob/main/justfile"
            target="_blank"
            rel="noopener noreferrer">
            /github.com/o-az/2md/blob/main/justfile
          </a>
        </li>
        <li>
          <a
            href="/github.com/o-az/2md/justfile"
            target="_blank"
            rel="noopener noreferrer">
            /github.com/o-az/2md/justfile
          </a>{' '}
          (shorthand)
        </li>
        <li>
          <a
            href="/github.com/o-az/2md/src/index.ts"
            target="_blank"
            rel="noopener noreferrer">
            /github.com/o-az/2md/src/index.ts
          </a>
        </li>
        <li>
          <a
            href="/github.com/o-az/2md/.env.example"
            target="_blank"
            rel="noopener noreferrer">
            /github.com/o-az/2md/.env.example
          </a>
        </li>
      </ul>

      <h3>Branches & tags</h3>
      <ul>
        <li>
          <a
            href="/github.com/honojs/hono/tree/v4.0.0/src"
            target="_blank"
            rel="noopener noreferrer">
            /github.com/honojs/hono/tree/v4.0.0/src
          </a>
        </li>
        <li>
          <a
            href="/github.com/o-az/2md/tree/cli"
            target="_blank"
            rel="noopener noreferrer">
            /github.com/o-az/2md/tree/cli
          </a>{' '}
          (branch with /)
        </li>
      </ul>

      <h3>Clean path format</h3>
      <ul>
        <li>
          <a
            href="/gh_o-az_2md@main.md"
            target="_blank"
            rel="noopener noreferrer">
            /gh_o-az_2md@main.md
          </a>
        </li>
        <li>
          <a
            href="/gh_o-az_2md@main_src.md"
            target="_blank"
            rel="noopener noreferrer">
            /gh_o-az_2md@main_src.md
          </a>
        </li>
        <li>
          <a
            href="/ghf_o-az_2md@main_justfile.md"
            target="_blank"
            rel="noopener noreferrer">
            /ghf_o-az_2md@main_justfile.md
          </a>
        </li>
      </ul>

      <h3>With submodules</h3>
      <p style="font-size: 0.9em; color: #666;">
        For Foundry/Solidity projects with git submodules in lib/
      </p>
      <ul>
        <li>
          <a
            href="/github.com/transmissions11/solmate?submodules=true"
            target="_blank"
            rel="noopener noreferrer">
            /github.com/transmissions11/solmate?submodules=true
          </a>
        </li>
        <li>
          <a
            href="/gh_transmissions11_solmate@main.md?submodules=true"
            target="_blank"
            rel="noopener noreferrer">
            /gh_...@main.md?submodules=true
          </a>{' '}
          (clean path)
        </li>
      </ul>

      <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #ccc;">
        <a
          href="https://github.com/o-az/2md"
          target="_blank"
          rel="noopener noreferrer">
          github.com/o-az/2md
        </a>
      </footer>
    </Layout>,
  ),
)

landingApp.get('/llms.txt', context =>
  proxy(
    'https://raw.githubusercontent.com/o-az/2md/refs/heads/main/.github/README.md',
  ),
)
export { landingApp }
