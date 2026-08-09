# OrderFlow

OrderFlow is a small asynchronous e-commerce order-processing system built as a practical DevOps learning environment. The application is intentionally understandable: a browser creates an order, an API stores it, and an independent worker processes it.

## Current architecture

```text
Browser -> Nginx web :8080 -> Node.js API :3000 -> PostgreSQL
                                      |               ^
                                      v               |
                              database job queue -> Node.js worker
```

The database-backed queue is a Phase 1 adapter, not a claim that PostgreSQL is Amazon SQS. It makes asynchronous processing observable locally. A later milestone will replace this adapter with SQS, retries, and a dead-letter queue.

## Services

| Service | Responsibility |
|---|---|
| `orderflow-web` | Static browser UI and `/api` reverse proxy |
| `orderflow-api` | Validates requests, calculates server-side prices, writes orders and jobs atomically, exposes health and metrics |
| `orderflow-worker` | Claims queued work, updates order state, exposes health and metrics |
| PostgreSQL | Stores products, orders, item price snapshots, and temporary local jobs |

## Run locally

```bash
npm ci
npm run lint
npm test
docker compose up --build --detach --wait
```

Open `http://localhost:8080`. Only the web service is published to the host. The API, worker, and database communicate over private Compose networks.

## API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Basic API health |
| `GET` | `/health/live` | Process liveness |
| `GET` | `/health/ready` | Database-backed readiness |
| `GET` | `/metrics` | Prometheus metrics |
| `GET` | `/products` | Product catalog |
| `POST` | `/orders` | Create a `PENDING` order and enqueue it |
| `GET` | `/orders/:id` | Observe order state |

## Deliberate boundaries

This milestone does not include EKS, Kubernetes, SQS, SNS, RDS, Helm, Argo CD, or production secrets. Those components will be added only when the current deployment and failure modes are understood. Local credentials in Compose are disposable and are not a production secret-management pattern.

See [architecture.md](docs/architecture.md) and [troubleshooting.md](docs/troubleshooting.md).
