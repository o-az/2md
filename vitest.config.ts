import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersConfig({
  test: {
    include: ['test/**/*.test.{ts,tsx}', 'test/**/*.spec.{ts,tsx}'],
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.json' },
      },
    },
  },
})
