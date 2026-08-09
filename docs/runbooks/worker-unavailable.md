# Runbook: worker unavailable

1. Check worker Deployment availability, pod events, `/health/live`, `/health/ready`, and logs.
2. Confirm the database Secret exists, RDS is available, and port 5432 is allowed from EKS.
3. Inspect job state counts and oldest pending age without modifying rows.
4. Restore worker availability before replaying work; row locks and unique constraints protect concurrent claims.
5. Do not manually mark jobs completed. Revert a bad image through Git and allow Argo CD to reconcile.
6. After recovery, confirm backlog drains and sample orders reach a terminal state.
