import { Hono } from 'hono'
import { marked } from 'marked'
import { proxy } from 'hono/proxy'
import { html, raw } from 'hono/html'

import packageJSON from '#package.json' with { type: 'json' }

const landingApp = new Hono<{ Bindings: Cloudflare.Env }>()

const README_URL =
  'https://raw.githubusercontent.com/o-az/2md/refs/heads/main/.github/README.md'

// TODO: more head tags

const Layout = (props: { parsedMarkdown: string }) => html`
  <html>
    <head>
      <meta charset="UTF-8">
      <title>${packageJSON.name}</title>
      <meta name="description" content="${packageJSON.description}">
      <meta property="og:type" content="article">
      <meta property="og:title" content="${packageJSON.name}">
    </head>
    <body style="font-family: monospace;">
      ${props.parsedMarkdown}
    </body>
  </html>
`

landingApp.get('/', async context => {
  const readmeRequest = await fetch(README_URL)
  const readme = await readmeRequest.text()

  const parsedHtml = await marked.parse(readme)

  return context.html(<Layout parsedMarkdown={raw(parsedHtml)} />)
})

landingApp.get('/llms.txt', () => proxy(README_URL))
landingApp.get('/llms-full.txt', () => proxy(README_URL))

export { landingApp }
