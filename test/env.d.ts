declare module 'cloudflare:test' {
  // Extend ProvidedEnv to include the Cloudflare.Env bindings
  interface ProvidedEnv extends Cloudflare.Env {}
}
