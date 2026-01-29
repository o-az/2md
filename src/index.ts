import { Hono } from 'hono'
import { cache } from 'hono/cache'
import { except } from 'hono/combine'
import { env } from 'cloudflare:workers'
import { cacheHeader } from 'pretty-cache-header'
import { HTTPException } from 'hono/http-exception'

import {
  isTextFile,
  filterFiles,
  getRepoFiles,
  parseGitHubUrl,
  getFileContent,
  type GitHubFile,
  filterByDirectory,
  resolveBranchAndPath,
  fetchWithConcurrency,
} from '#github.ts'
import { landingApp } from '#landing.tsx'
import { IGNORE_FILES } from '#constants.ts'
import { parseCleanPath, toCleanPath } from '#url.ts'

export const app = new Hono<{ Bindings: Cloudflare.Env }>()

app.use('/:path{.+}', async (c, next) => {
  const urlPath = c.req.param('path')
  if (
    (urlPath.startsWith('gh_') || urlPath.startsWith('ghf_')) &&
    urlPath.endsWith('.md')
  ) {
    return next()
  }
  if (
    urlPath.startsWith('github.com/') ||
    urlPath.startsWith('https://github.com/')
  ) {
    const githubUrl = urlPath.startsWith('http')
      ? urlPath
      : `https://${urlPath}`
    const parsed = parseGitHubUrl(githubUrl)

    let branch = parsed.branch
    let path = parsed.path

    if (!branch) {
      const segments = path ? path.split('/') : []
      const resolved = await resolveBranchAndPath(
        parsed.owner,
        parsed.repo,
        segments,
        c.env.GITHUB_TOKEN,
      )
      branch = resolved.branch
      path = resolved.path
    }

    const cleanPath = toCleanPath(
      parsed.owner,
      parsed.repo,
      branch,
      path,
      parsed.type === 'file',
    )
    return c.redirect(cleanPath, 301)
  }
  return next()
})

app.notFound(context => {
  throw new HTTPException(404, {
    cause: context.error,
    message: `${context.req.url} is not a valid path.`,
  })
})

app.get('/ping', context => context.text('ok'))

app.get('/favicon.ico', context => context.body(null, 204))

app.get('/purge', async context => {
  const key = context.req.query('key')
  const path = context.req.query('path')

  if (!key || key !== context.env.PURGE_KEY) {
    throw new HTTPException(401, { message: 'Invalid or missing key' })
  }

  if (!path) {
    throw new HTTPException(400, { message: 'Missing path parameter' })
  }

  const cache = await caches.open('2md')
  const url = new URL(path, context.req.url)
  const deleted = await cache.delete(url.toString())

  return context.json({
    success: deleted,
    purged: url.toString(),
    message: deleted
      ? 'Cache purged from this datacenter'
      : 'Not found in cache (may not be cached at this datacenter)',
  })
})

app.route('/', landingApp)

const cacheMiddleware = except(
  c => env.DISABLE_CACHE === 'true',
  cache({
    cacheName: '2md',
    cacheControl: cacheHeader({ public: true, maxAge: '5 minutes' }),
  }),
)

app.get('/:cleanPath{ghf?_.+\\.md}', cacheMiddleware, async context => {
  const cleanPath = context.req.param('cleanPath')
  const parsed = parseCleanPath(cleanPath)
  if (!parsed) {
    throw new HTTPException(400, { message: 'Invalid path format' })
  }

  const { owner, repo, branch, path, isFile } = parsed

  if (isFile && path) {
    const content = await getFileContent(owner, repo, branch, path)
    return context.text(content, 200, {
      'Content-Type': 'text/markdown; charset=utf-8',
    })
  }

  const allFiles = await getRepoFiles(owner, repo, branch)

  let files: Array<GitHubFile> = allFiles

  if (path) files = filterByDirectory(files, path)

  files = filterFiles(files, IGNORE_FILES)
  files = files.filter(f => isTextFile(f.path))

  const contents = await fetchWithConcurrency(
    files,
    async file => {
      try {
        const content = await getFileContent(owner, repo, branch, file.path)
        return `## ${file.path}\n\n\`\`\`\n${content}\n\`\`\``
      } catch {
        return `## ${file.path}\n\n*Failed to fetch*`
      }
    },
    10,
  )

  const markdown = `# ${owner}/${repo}@${branch}${path ? `/${path}` : ''}\n\n${contents.join('\n\n')}`

  return context.text(markdown, 200, {
    'Content-Type': 'text/markdown; charset=utf-8',
  })
})

app.get('/:path{.+}', cacheMiddleware, async context => {
  const urlPath = context.req.param('path')
  const githubUrl = urlPath.startsWith('http') ? urlPath : `https://${urlPath}`
  const parsed = parseGitHubUrl(githubUrl)

  let branch = parsed.branch
  let path = parsed.path

  if (!branch) {
    const segments = path ? path.split('/') : []
    const resolved = await resolveBranchAndPath(
      parsed.owner,
      parsed.repo,
      segments,
      context.env.GITHUB_TOKEN,
    )
    branch = resolved.branch
    path = resolved.path
  }

  if (parsed.type === 'file') {
    const content = await getFileContent(
      parsed.owner,
      parsed.repo,
      branch,
      path!,
    )
    return context.text(content, 200, {
      'Content-Type': 'text/markdown; charset=utf-8',
    })
  }

  const allFiles = await getRepoFiles(parsed.owner, parsed.repo, branch)

  let files: Array<GitHubFile> = allFiles

  if (parsed.type === 'directory' && path)
    files = filterByDirectory(files, path)

  files = filterFiles(files, IGNORE_FILES)
  files = files.filter(f => isTextFile(f.path))

  const contents = await fetchWithConcurrency(
    files,
    async file => {
      try {
        const content = await getFileContent(
          parsed.owner,
          parsed.repo,
          branch,
          file.path,
        )
        return `## ${file.path}\n\n\`\`\`\n${content}\n\`\`\``
      } catch {
        return `## ${file.path}\n\n*Failed to fetch*`
      }
    },
    10,
  )

  const markdown = `# ${parsed.owner}/${parsed.repo}${path ? `/${path}` : ''}\n\n${contents.join('\n\n')}`

  return context.text(markdown, 200, {
    'Content-Type': 'text/markdown; charset=utf-8',
  })
})

export default app satisfies ExportedHandler<Cloudflare.Env>
