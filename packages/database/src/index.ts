import { existsSync, readdirSync, statSync } from 'node:fs'
import { PrismaClient } from './generated/client'

// ────────────────────────────────────────────────────────────
// Runtime-only Prisma query-engine path resolution (Vercel + Turbopack).
//
// Next.js 16 builds with Turbopack, which sanitizes build-machine paths
// to "/ROOT/..." and leaks them into Prisma's runtime engine-search
// heuristic. The engine binary IS shipped into the function bundle (via
// next.config `outputFileTracingIncludes`) but Prisma searches the wrong
// (mangled) locations and fails with:
//   "Prisma Client could not locate the Query Engine for runtime
//    rhel-openssl-3.0.x"
// which silently breaks EVERY database query in production (writes that
// run through error-swallowing routes just vanish; routes that surface
// the error 500).
//
// Fix: at Lambda cold-start ONLY — `AWS_LAMBDA_FUNCTION_NAME` is set at
// runtime but NOT during the Vercel build or `prisma generate`, so this
// never interferes with the build (an earlier attempt to set
// PRISMA_QUERY_ENGINE_LIBRARY as a plain Vercel env var broke the build
// because `prisma generate` validated the runtime-only path) — locate
// the engine binary on disk and point Prisma straight at it. We check
// existence before setting, so a wrong guess never makes things worse;
// Prisma just falls back to its default search. MUST run before the
// `new PrismaClient()` call below.
// ────────────────────────────────────────────────────────────
if (
  process.env.AWS_LAMBDA_FUNCTION_NAME &&
  !process.env.PRISMA_QUERY_ENGINE_LIBRARY
) {
  try {
    const ENGINE = 'libquery_engine-rhel-openssl-3.0.x.so.node'
    const candidates = [
      `/var/task/packages/database/src/generated/client/${ENGINE}`,
      `/var/task/apps/web/packages/database/src/generated/client/${ENGINE}`,
      `/var/task/node_modules/@repo/database/src/generated/client/${ENGINE}`,
      `/var/task/apps/web/node_modules/@repo/database/src/generated/client/${ENGINE}`,
    ]
    let found = candidates.find((p) => existsSync(p))

    // Fallback: bounded recursive search across the likely Lambda roots.
    // Runs once per cold start, only if the candidate list missed.
    if (!found) {
      const walk = (dir: string, depth: number): string | undefined => {
        if (depth < 0) return undefined
        let entries: string[]
        try {
          entries = readdirSync(dir)
        } catch {
          return undefined
        }
        if (entries.includes(ENGINE)) return `${dir}/${ENGINE}`
        for (const e of entries) {
          if (e === 'node_modules' && depth > 2) continue // avoid deep nm trees
          const full = `${dir}/${e}`
          try {
            if (statSync(full).isDirectory()) {
              const r = walk(full, depth - 1)
              if (r) return r
            }
          } catch {
            // unreadable entry — skip
          }
        }
        return undefined
      }
      for (const root of ['/var/task/packages', '/var/task/apps']) {
        found = walk(root, 6)
        if (found) break
      }
    }

    if (found) process.env.PRISMA_QUERY_ENGINE_LIBRARY = found
  } catch {
    // best-effort; fall back to Prisma's default engine search
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ────────────────────────────────────────────────────────────
// Re-exports from the generated Prisma client.
//
// Two re-export forms instead of a single `export *`. Prisma's generated
// `client/index.js` is CommonJS, and Turbopack can't statically tree-
// shake CJS through `export *` — it falls back to runtime export
// resolution and emits "unexpected export *" warnings on every build
// (see apps/web build logs prior to this refactor).
//
//   1. `export type *` — re-exports every TYPE (User, Task, Prisma
//      namespace types, etc.). Type-only — no runtime code generated,
//      so the CJS interop issue doesn't apply.
//
//   2. Explicit `export { ... }` — every RUNTIME value the client
//      exports. New enums and new model accessors must be added here
//      manually; the build will tell you (consumers get TS errors).
//
// If/when Prisma's `prisma-client` generator (currently experimental
// in 6.x, default in 7.x) lands and emits ESM, both blocks can fold
// back into a single `export * from './generated/client'`.
// ────────────────────────────────────────────────────────────

export type * from './generated/client'

export {
  // Core. Error classes, raw SQL helpers, Decimal, and extension
  // helpers are NOT re-exported at top level — they're surfaced via
  // the `Prisma` namespace (`Prisma.PrismaClientKnownRequestError`,
  // `Prisma.sql`, `Prisma.Decimal`, etc.). This matches Prisma's own
  // .d.ts where those names are namespace members, not top-level
  // exports. Consumers in apps/web/src already use the namespace form.
  PrismaClient,
  Prisma,

  // Enums (runtime values — used in switch statements, defaults, etc.)
  $Enums,
  AiInteractionType,
  CheckinCadence,
  CheckinChannel,
  CheckinType,
  CommitmentDomain,
  CommitmentFrequency,
  DriveProfile,
  EffortLevel,
  EventType,
  ExcuseCategory,
  ExcuseSource,
  FollowUpMode,
  IdentityState,
  InboundChannel,
  MarketingPlatform,
  MarketingPostStatus,
  PlanType,
  PrimaryWedge,
  ProjectStatus,
  RAPRiskClass,
  RecoveryState,
  ReminderChannel,
  ReminderIntensity,
  ReminderStatus,
  ReminderType,
  RescueOutcome,
  RescueTrigger,
  ScheduledInterruptStatus,
  TaskPriority,
  TaskSource,
  TaskStatus,
  ToneMode,
  UAPGrantStatus,
} from './generated/client'
