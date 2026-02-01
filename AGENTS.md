# AGENTS.md

## **IMPORTANT**

- after any code changes, run `bun check && bun check:types` to ensure there are no lint or type errors.
- when adding any new feature, first consult the relevant [architecture](#architecture) sections and see if there's already a native API you can use.
- **_always_** use the most up-to-date APIs instead of defaulting to what shows up the most in your training. 
- if you are running in `kitty` emulator:
  - leverage `kitty` panes to open multiple terminals and run commands in parallel.

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