# AGENTS.md

## **IMPORTANT**

- after any code changes, run `bun check && bun check:types` to ensure there are no lint or type errors.
- when adding a new feature, first consult the relevant [architecture](#architecture) sections and see if there's already a native API you can use
- **_always_** use the most up-to-date APIs instead of defaulting to what shows up the most in your training
- if we are debugging an issue, it's best to not hide stdout/stderr by doing `>/dev/null`
- if you are running in `kitty` emulator:
  - leverage `kitty` panes to open multiple terminals and run commands in parallel.

## **CARDINAL SINS**

These are the absolute worst things you can do. It is better to do nothing than to do these.

- ignore the [important](#important) section, and do something that is not recommended,
- ignore the [cardinal sins](#cardinal-sins) section and indluge in the devils ways,
- lie (white or not, same damage),
- make up a nonexistent API or feature,
- assume that you have to be "nice", "friendly", "polite". None of that matters. The one and only thing that matters is optimal, idiomatic, & performant **end result**.

## Commands

Commands are defined in [package.json](./package.json) under the `scripts` section.

## Architecture

- **JavaScript Runtime**:
  - [Cloudflare Workers](https://developers.cloudflare.com/llms.txt)
  - CF Workers Vite:
    - [@cloudflare/vite-plugin](https://developers.cloudflare.com/workers/vite-plugin/index.md)
    - [Vite](https://vite.dev/llms.txt)

- **Routing Framework**:
  - [Hono](https://hono.dev/llms-full.txt)

- **Testing**:
  - [Vitest](https://vitest.dev/llms.txt)
  - [Hono Cloudflare](https://raw.githubusercontent.com/honojs/website/refs/heads/main/examples/cloudflare-vitest.md)
  - [Cloudflare Vitest Pool Workers](https://2md.sauce.wiki/gh_cloudflare_cloudflare-docs@production_src_content_docs_workers_testing_vitest-integration.md)
