# Microsoft Teams app manifest — COYL

The `manifest.json` in this folder is the COYL Microsoft Teams app
manifest, v1.16 schema. Sideloadable today for QA + AppSource-
submittable after the four `REPLACE_WITH_AZURE_AD_APP_ID` placeholders
are filled in.

## Pre-submission checklist

- [ ] Register an Azure AD app at https://portal.azure.com → App
      Registrations → New. Single-tenant or multi-tenant; multi for
      AppSource distribution.
- [ ] Copy the application (client) ID into `manifest.json` at all
      four `REPLACE_WITH_AZURE_AD_APP_ID` placeholders + the `botId`
      field inside `bots[0]`.
- [ ] Generate a client secret and store as `MS_BOT_APP_PASSWORD` in
      Vercel env. Store the app ID as `MS_BOT_APP_ID`.
- [ ] Generate icons:
        - `color.png` — 192×192, full color, ~24KB max
        - `outline.png` — 32×32, white-on-transparent silhouette
      Place both alongside `manifest.json`.
- [ ] Zip `manifest.json + color.png + outline.png` into a single
      flat archive (no folder nesting) for sideload + AppSource submit.

## Sideload for QA

1. Teams Admin Center → Teams apps → Manage apps → Upload a custom app
2. Select the zipped manifest from step above
3. Allow the app for your test tenant
4. Open Teams → Apps → Built for your org → COYL → Add

## AppSource submission

See `/docs/integrations/teams-appsource-submission.md` for the full
operational checklist + the realistic timeline (4-6 weeks if Microsoft
365 Certification is targeted).

## Manifest version policy

The manifest schema in this file is **v1.16** (current as of Teams
2024). Bump the schema only when consuming a feature that requires
a higher version; AppSource accepts manifests as old as v1.14, so
staying on v1.16 maximizes compatibility.

The `version` field at the top (`"version": "0.2.0"`) is the COYL app
version, separate from the schema version. Bump that with each
release; AppSource enforces strict monotonic increase.
