# Runbook: API high latency

1. Confirm p50/p95/p99 and identify affected routes; exclude low-traffic histogram artifacts.
2. Inspect CPU throttling, memory pressure, HPA state, database connections, slow queries, locks, and RDS metrics.
3. Check whether latency follows traffic growth, a deployment, or database maintenance.
4. Scale only the constrained tier. API replicas do not fix a saturated database.
5. Preserve query plans and metric evidence before remediation; add a capacity or query regression test.
