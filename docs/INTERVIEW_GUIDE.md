# Phase 1 Interview Guide

The goal is not to memorize commands. Explain the problem each component solves, the tradeoff introduced, and how you would validate it.

## Why separate frontend, backend, and database?

They change and scale for different reasons. Static frontend traffic can be served efficiently by Nginx, API replicas can scale according to request load, and the database maintains durable state independently of both. Separation also permits independent deployments, but introduces network communication and more operational components.

## Why PostgreSQL instead of SQLite?

SQLite is useful for isolated automated tests because it has no external service dependency. PostgreSQL is the runtime database because it supports concurrent connections, durable server-side storage, operational backups, access controls, and managed deployment through Amazon RDS. Tests using SQLite are fast, but a production pipeline should also include PostgreSQL integration tests to catch database-specific behavior.

## Why use environment variables?

The same image must run in local, test, staging, and production environments. Environment variables separate configuration from the image. Normal configuration will eventually come from a ConfigMap; sensitive values will come from a Kubernetes Secret populated by External Secrets from AWS Secrets Manager.

## Liveness versus readiness

- Liveness answers: "Is the process running, or should Kubernetes restart it?"
- Readiness answers: "Can this replica serve traffic right now?"

The liveness endpoint deliberately avoids checking PostgreSQL. Restarting every API pod during a database outage would create a restart storm without fixing the dependency. Readiness checks the database so Kubernetes can stop routing requests to an unhealthy replica.

## Why Gunicorn?

Flask's built-in server is for development. Gunicorn provides a production process model with multiple workers, concurrency controls, access logging, and predictable signal handling. The number of workers must be tuned to available CPU and workload characteristics rather than copied blindly.

## Why Nginx?

Nginx serves static assets efficiently and reverse-proxies `/api` requests to the backend. This gives the browser one origin, avoids hardcoding backend addresses in JavaScript, and creates a future place for compression, caching, and security headers.

## Why Docker?

Docker packages the application, runtime, dependencies, and startup command into a versioned, reproducible image. It reduces environment drift but does not remove the need for configuration, security scanning, resource limits, or orchestration.

## Why non-root containers?

If the application is compromised, a non-root process has fewer privileges inside the container. This is defense in depth; container isolation is not itself a complete security boundary.

## Why Docker Compose?

Compose describes the multi-container local environment as code. It creates services, networks, dependency health checks, and persistent volumes consistently. It is a development and integration tool, not a replacement for Kubernetes production orchestration.

## Why two Compose networks?

The database is attached only to the internal backend network, while the frontend has no direct database path. This approximates network segmentation and illustrates least connectivity. The backend bridges the edge and backend networks because it must communicate with both tiers.

## Why structured logs and Prometheus metrics?

Logs explain individual events and errors. Metrics quantify behavior over time, such as request rate, latency, and error count. Both are necessary: metrics reveal that something is wrong, while logs often help explain why.

## Questions to practice

1. What happens between `docker compose up` and a request reaching PostgreSQL?
2. Why should application images be immutable across environments?
3. Why should credentials not be placed in Dockerfiles, Git, or ConfigMaps?
4. What failure would pass liveness but fail readiness?
5. What is the difference between a Docker health check and a Kubernetes probe?
6. Why does the database use a volume while the frontend does not?
7. What changes when PostgreSQL moves from Compose to RDS?
8. How would you investigate an increase in API latency?

## Your first explanation exercise

Explain the request path in your own words:

```text
Browser -> host port 8080 -> Nginx container -> backend service name ->
Gunicorn -> Flask route -> SQLAlchemy -> PostgreSQL -> JSON response
```

Then explain why the browser never connects directly to PostgreSQL.
