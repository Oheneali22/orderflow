# Reliability and service objectives

## Proposed SLOs

These are proposed engineering targets, not claims based on production traffic or a completed measurement window.

| Signal | Objective | Measurement |
|---|---|---|
| API availability | 99.9% successful non-5xx requests over 30 days | Prometheus request counter |
| API latency | 95% under 500 ms over 30 days | Request-duration histogram |
| Processing success | 99.5% of accepted orders reach `COMPLETED` | Order/job states (future recording rule) |
| Recovery | Web/API pod loss without customer-visible outage | Replica/PDB probe exercise |

The chart alerts when API or worker targets disappear, 5xx ratio exceeds 5%, or p95 latency exceeds 500 ms. Runbook links are embedded in each rule.

## Tested scenarios

- Real PostgreSQL integration test proves order/job atomicity and concurrent-safe claim behavior.
- Compose health checks prove browser-to-Nginx-to-API-to-database behavior.
- Disposable Kubernetes 1.36 test proved the production-shaped chart can run non-root with read-only roots.
- A real order transitioned `PENDING → PROCESSING → COMPLETED` through Nginx and two worker replicas.
- An in-cluster probe completed 30/30 requests while a web pod was deleted; the Deployment restored two ready replicas.
- A Compose worker was stopped with SIGTERM while an order was `PROCESSING`; shutdown waited for the cycle and the order was `COMPLETED` before the container exited.
- A real PostgreSQL regression test ages a claimed job beyond its lease and proves another claim recovers the same job safely.

## Backup and recovery

RDS retains seven days of automated backups, encrypts storage, copies tags to snapshots, and defaults to deletion protection plus a final snapshot. Recovery must be exercised periodically: restore to a new instance, run readiness and schema checks, compare sampled order counts, then redirect only after validation. A backup that has never been restored is unproven.

## Capacity and graceful degradation

Web/API HPAs scale on CPU with a five-minute scale-down stabilization window. Worker replicas are statically controlled because CPU alone is a poor queue signal; add a queue-depth metric before autoscaling workers. Requests/limits prevent unbounded contention. If PostgreSQL is unavailable, readiness returns 503 and workers stop claiming work; committed jobs remain durable for later processing.

Workers drain an in-flight cycle on SIGTERM. A claimed job is also a time-bounded lease: after 60 seconds without completion, another worker can reclaim it under the same row lock. This provides at-least-once processing, so future external side effects must use the order/job ID as an idempotency key.
