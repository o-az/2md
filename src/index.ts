import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { cache } from 'hono/cache'

import {
  isTextFile,
  filterFiles,
  getRepoFiles,
  parseGitHubUrl,
  getFileContent,
  type GitHubFile,
  filterByDirectory,
  resolveBranchAndPath,
} from '#github.ts'
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

    if (
      (parsed.type === 'directory' || parsed.type === 'file') &&
      parsed.path
    ) {
      const segments = [parsed.branch, ...parsed.path.split('/')]
      const resolved = await resolveBranchAndPath(
        parsed.owner,
        parsed.repo,
        segments,
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

app.get('/', context => {
  return context.html(
    /* html */ `<html>
    <body style="font-family: monospace; max-width: 800px; margin: 0 auto; padding: 1rem;">
      <h1>2md</h1>
      <p>Convert GitHub repos, directories, or files to markdown.</p>
      
      <h2>Usage</h2>
      <pre style="background: #f4f4f4; padding: 1rem; overflow-x: auto;">
/github.com/owner/repo              → whole repo
/github.com/owner/repo/tree/branch  → repo at branch
/github.com/owner/repo/tree/b/path  → directory at branch
/github.com/owner/repo/blob/b/file  → single file at branch
/github.com/owner/repo/path         → shorthand (file or dir)
</pre>

      <h2>Examples</h2>
      <h3>Whole repo</h3>
      <ul>
        <li><a href="/github.com/o-az/2md" target="_blank" rel="noopener noreferrer">/github.com/o-az/2md</a></li>
        <li><a href="/github.com/honojs/hono" target="_blank" rel="noopener noreferrer">/github.com/honojs/hono</a></li>
      </ul>

      <h3>Directory</h3>
      <ul>
        <li><a href="/github.com/o-az/2md/tree/main/src" target="_blank" rel="noopener noreferrer">/github.com/o-az/2md/tree/main/src</a></li>
        <li><a href="/github.com/o-az/2md/src" target="_blank" rel="noopener noreferrer">/github.com/o-az/2md/src</a> (shorthand)</li>
        <li><a href="/github.com/o-az/2md/tree/main/.github" target="_blank" rel="noopener noreferrer">/github.com/o-az/2md/tree/main/.github</a></li>
      </ul>

      <h3>Single file</h3>
      <ul>
        <li><a href="/github.com/o-az/2md/blob/main/justfile" target="_blank" rel="noopener noreferrer">/github.com/o-az/2md/blob/main/justfile</a></li>
        <li><a href="/github.com/o-az/2md/justfile" target="_blank" rel="noopener noreferrer">/github.com/o-az/2md/justfile</a> (shorthand)</li>
        <li><a href="/github.com/o-az/2md/src/index.ts" target="_blank" rel="noopener noreferrer">/github.com/o-az/2md/src/index.ts</a></li>
        <li><a href="/github.com/o-az/2md/.env.example" target="_blank" rel="noopener noreferrer">/github.com/o-az/2md/.env.example</a></li>
      </ul>

      <h3>Branches & tags</h3>
      <ul>
        <li><a href="/github.com/honojs/hono/tree/v4.0.0/src" target="_blank" rel="noopener noreferrer">/github.com/honojs/hono/tree/v4.0.0/src</a></li>
        <li><a href="/github.com/o-az/2md/tree/cli" target="_blank" rel="noopener noreferrer">/github.com/o-az/2md/tree/cli</a> (branch with /)</li>
      </ul>

      <h3>Clean path format</h3>
      <ul>
        <li><a href="/gh_o-az_2md@main.md" target="_blank" rel="noopener noreferrer">/gh_o-az_2md@main.md</a></li>
        <li><a href="/gh_o-az_2md@main_src.md" target="_blank" rel="noopener noreferrer">/gh_o-az_2md@main_src.md</a></li>
        <li><a href="/ghf_o-az_2md@main_justfile.md" target="_blank" rel="noopener noreferrer">/ghf_o-az_2md@main_justfile.md</a></li>
      </ul>

      <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #ccc;">
        <a href="https://github.com/o-az/2md" target="_blank" rel="noopener noreferrer">github.com/o-az/2md</a>
      </footer>
    </body>
  </html>`,
  )
})

app.get(
  '/:cleanPath{ghf?_.+\\.md}',
  cache({ cacheName: '2md', cacheControl: 'public, max-age=300' }),
  async context => {
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

    const contents = await Promise.all(
      files.map(async file => {
        try {
          const content = await getFileContent(owner, repo, branch, file.path)
          return `## ${file.path}\n\n\`\`\`\n${content}\n\`\`\``
        } catch {
          return `## ${file.path}\n\n*Failed to fetch*`
        }
      }),
    )

    const markdown = `# ${owner}/${repo}@${branch}${path ? `/${path}` : ''}\n\n${contents.join('\n\n')}`

    return context.text(markdown, 200, {
      'Content-Type': 'text/markdown; charset=utf-8',
    })
  },
)

app.get(
  '/:path{.+}',
  cache({ cacheName: '2md', cacheControl: 'public, max-age=300' }),
  async context => {
    const urlPath = context.req.param('path')
    const githubUrl = urlPath.startsWith('http')
      ? urlPath
      : `https://${urlPath}`
    const parsed = parseGitHubUrl(githubUrl)

    if (parsed.type === 'file') {
      let branch = parsed.branch
      let filePath = parsed.path!

      if (parsed.path) {
        const segments = [parsed.branch, ...parsed.path.split('/')]
        const resolved = await resolveBranchAndPath(
          parsed.owner,
          parsed.repo,
          segments,
        )
        branch = resolved.branch
        filePath = resolved.path!
      }

      const content = await getFileContent(
        parsed.owner,
        parsed.repo,
        branch,
        filePath,
      )
      return context.text(content, 200, {
        'Content-Type': 'text/markdown; charset=utf-8',
      })
    }

    const allFiles = await getRepoFiles(
      parsed.owner,
      parsed.repo,
      parsed.branch,
    )

    let files: Array<GitHubFile> = allFiles

    if (parsed.type === 'directory' && parsed.path)
      files = filterByDirectory(files, parsed.path)

    files = filterFiles(files, IGNORE_FILES)
    files = files.filter(f => isTextFile(f.path))

    const contents = await Promise.all(
      files.map(async file => {
        try {
          const content = await getFileContent(
            parsed.owner,
            parsed.repo,
            parsed.branch,
            file.path,
          )
          return `## ${file.path}\n\n\`\`\`\n${content}\n\`\`\``
        } catch {
          return `## ${file.path}\n\n*Failed to fetch*`
        }
      }),
    )

    const markdown = `# ${parsed.owner}/${parsed.repo}${parsed.path ? `/${parsed.path}` : ''}\n\n${contents.join('\n\n')}`

    return context.text(markdown, 200, {
      'Content-Type': 'text/markdown; charset=utf-8',
    })
  },
)

export default app satisfies ExportedHandler<Cloudflare.Env>
