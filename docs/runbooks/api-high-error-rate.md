# Runbook: API high error rate

1. Break down 5xx rate by route and correlate request IDs with structured application logs.
2. Check PostgreSQL availability, connection saturation, pod restarts, resource throttling, and the latest deployment.
3. Compare error onset with Argo CD history and infrastructure events.
4. Roll back through a production-values revert if the new digest is causal.
5. Avoid hiding the symptom by widening alert thresholds; capture the failing request class and add a regression test.
