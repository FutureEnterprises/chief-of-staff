export async function register() {
  if (process.env.NODE_ENV === 'production') {
    // Fail fast on missing required env vars in production
    await import('./lib/env')
  }
}
