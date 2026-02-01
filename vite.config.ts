import * as z from 'zod/mini'
import { defineConfig, loadEnv } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'

const enabledSchema = z.stringbool({
  truthy: ['true', '1', 'yes', 'on', 'y', 'enabled'],
  falsy: ['false', '0', 'no', 'off', 'n', 'disabled'],
})

const envSchema = z.object({
  PORT: z.prefault(z.coerce.number(), 6969),
  DISABLE_CACHE: z.prefault(enabledSchema, 'false'),
})

export default defineConfig(config => {
  const env = loadEnv(config.mode, process.cwd(), '')

  const envFlags = envSchema.safeParse(env)
  if (!envFlags.success) throw new Error(z.prettifyError(envFlags.error))

  const allowedHosts = env?.ALLOWED_HOSTS?.split(',') || []

  return {
    plugins: [cloudflare()],
    server: {
      port: envFlags.data.PORT,
      allowedHosts,
    },
  }
})
