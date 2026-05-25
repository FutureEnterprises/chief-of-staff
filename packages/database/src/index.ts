import { PrismaClient } from './generated/client'

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
