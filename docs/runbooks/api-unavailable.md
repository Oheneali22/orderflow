# Runbook: API unavailable

1. Confirm scope with `up{namespace="orderflow",service="api"}` and ingress 5xx metrics.
2. Inspect Deployment availability, pod events, previous logs, readiness failures, and recent Argo CD syncs.
3. Test `GET /health/live` and `/health/ready` separately. A live-but-not-ready pod points to PostgreSQL/network/secret dependencies.
4. Verify the `api` Service has ready endpoints and NetworkPolicies admit web and monitoring traffic.
5. If a new digest caused the incident, revert the production-values commit; let Argo CD roll back declaratively.
6. Record timeline, affected requests, cause, remediation, and a prevention action.
