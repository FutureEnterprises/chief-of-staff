-- Defense-in-depth: enable RLS on every COYL public-schema table that
-- currently has it disabled. No policies are added — every one of these
-- tables is accessed exclusively via Prisma using the service role,
-- which bypasses RLS by design. The application keeps working with
-- zero code change.
--
-- The lock-down here means: if any of these tables is ever accidentally
-- exposed via the anon Supabase REST client (PostgREST), no rows are
-- accessible. Closes the Supabase advisor "RLS Disabled in Public" ERROR
-- list across the COYL public schema in one wave.
--
-- Surface BEFORE this migration: 39 public tables with RLS disabled.
-- Pre-existing tables that already had RLS on (accountability_partners,
-- badges, challenges, checkin_schedules, commitments, danger_windows,
-- decision_logs, excuses, referrals, rescue_sessions, scenario_sims,
-- slip_records, stakes, user_badges, etc.) keep their existing posture.
-- This migration only flips the disabled ones.

-- ALTERed alphabetically for review.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "action_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_interactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_funnel_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "billing_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "checkins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cron_heartbeats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "daily_numbers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "devices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "eap_audit_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_briefings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "live_activity_registrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "llm_partners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "marketing_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orchestrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "panic_states" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pap_proposals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pod_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prediction_models" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "productivity_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "redirect_choices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reminders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "retention_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scope_grants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sensor_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "signal_clusters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sms_signups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teams_workspaces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "uap_audit_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "uap_grants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "uap_kill_switch_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "uap_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
