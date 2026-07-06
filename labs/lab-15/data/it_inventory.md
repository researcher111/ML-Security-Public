# MegaCorpAI Active Directory · Server Inventory

Production servers:
- `api01.megacorpai.local` — application server, prod tier
- `api02.megacorpai.local` — application server, prod tier
- `api03.megacorpai.local` — application server, prod tier
- `db-prod.megacorpai.local` — PostgreSQL 15
- `redis-prod.megacorpai.local` — Redis cache
- `vault.megacorpai.local` — secrets store
- `okta.megacorpai.local` — identity provider
- `wiki.megacorpai.local` — internal Confluence

Service accounts (rotated quarterly by IT-OPS):
- `svc_backup` — password: `Pr0d_Backup_2026!`
- `svc_monitoring` — password: `M0nit0r_2026_$ec`
- `svc_pipeline` — password: `Pipeline_Sav3_!2026`

AWS Access Keys (production):
- Stripe: `sk_live_4eC39HqLyjWDarjtT1zdp7dc`
- SendGrid: `SG.xK9mN2pLqR4sTuVwXyZ5678AbCdEf`
- AWS IAM: `AKIAIOSFODNN7MEGACORP`

Default password for new accounts (set during onboarding): `Welcome2MegaCorp!`
