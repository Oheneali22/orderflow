# OrderFlow

**An asynchronous order processing project built to demonstrate application development and AWS DevOps practices.** A Node.js API accepts orders, stores them with a processing job in PostgreSQL, and returns immediately. A separate worker claims jobs and advances orders through their lifecycle. The repository also includes infrastructure as code, Kubernetes packaging, and a GitHub Actions delivery pipeline.

## At a glance

| Area | What I built |
| --- | --- |
| Application | Express API for product listing, order creation, and order tracking; a separate polling worker |
| Data and reliability | PostgreSQL transactions for order and job creation, row locking with `FOR UPDATE SKIP LOCKED`, and reclaiming jobs after a worker claim times out |
| Operations | Docker images, health and readiness endpoints, Prometheus metrics, structured logs, and graceful shutdown |
| Cloud infrastructure | Terraform definitions for an AWS VPC, EKS, ECR, private RDS PostgreSQL, IAM, and related networking |
| Delivery | GitHub Actions lint and tests, commit SHA tagged images pushed to ECR using OIDC, a database migration gate, and Helm deployment to EKS |

**Stack:** Node.js, Express, PostgreSQL, Docker, Terraform, AWS EKS/RDS/ECR/Secrets Manager, Kubernetes, Helm, GitHub Actions, Prometheus client, and Pino.

## How it works

```text
Client ── POST /orders ──> API ── transaction ──> PostgreSQL
                         │                     order + items + job
                         └── 202 Accepted

Worker ── poll/claim job ──> PostgreSQL ──> PROCESSING ──> COMPLETED or FAILED
Client ── GET /orders/:id ──> API ──> current order status
```

The API validates product IDs and quantities, reads current prices, and creates the order, its item snapshots, and a pending job in one transaction. The worker claims one available job with PostgreSQL row locking, so concurrent workers can select different jobs. A timed out claim can be reclaimed if a worker stops mid job. The processing step currently **simulates work with a configurable delay**; it does not charge a card, reserve inventory, or send a shipment.

Order states are `PENDING` → `PROCESSING` → `COMPLETED` (or `FAILED` when processing raises an error). The API returns `202 Accepted` and a `Location` header when an order is created.

## Run locally

Requirements: Docker with Compose. Create a local `.env` file in the repository root:

```dotenv
POSTGRES_USER=orderflow
POSTGRES_PASSWORD=local-development-only
POSTGRES_DB=orderflow
LOG_LEVEL=info
API_PORT=3000
WORKER_HEALTH_PORT=3001
WORKER_POLL_INTERVAL_MS=1000
WORKER_PROCESSING_DELAY_MS=1500
```

Then start the services:

```bash
docker compose up --build
```

In another terminal, create and track an order:

```bash
curl http://localhost:3000/products
curl -i -X POST http://localhost:3000/orders \
  -H 'Content-Type: application/json' \
  -d '{"products":[{"productId":"keyboard","quantity":1}]}'
curl http://localhost:3000/orders/<order-id-from-response>
```

Both services run the idempotent database schema setup at startup. Docker Compose starts PostgreSQL, the API, and the worker; the worker's health port is internal to the Compose network. The `.env` file is gitignored.

## API and observability

| Endpoint | Purpose |
| --- | --- |
| `GET /products` | List active products and prices |
| `POST /orders` | Validate and queue an order; returns `202` |
| `GET /orders/:id` | Read an order and its current status |
| `GET /health/live` | Process liveness |
| `GET /health/ready` | API database readiness |
| `GET /metrics` | Prometheus format API metrics |

The worker also exposes `/health/live`, `/health/ready`, and `/metrics` on its own health port. API request logs include a request ID; the metrics include request duration and worker job counts.

## Infrastructure and delivery

Terraform in [`infrastructure/terraform/`](infrastructure/terraform/) defines a remote state S3 bucket and a development AWS environment with separate public, EKS, and database subnets. RDS is private and uses an AWS managed master password. The Kubernetes configuration uses EKS Pod Identity and a Secrets Store CSI provider to make database credentials available to the workloads. The Helm chart in [`helm/orderflow/`](helm/orderflow/) packages the API, worker, service account, ingress, configuration, and migration job; [`k8s/`](k8s/) contains additional Kubernetes manifests.

The [GitHub Actions workflow](.github/workflows/ci.yml) runs ESLint and tests on pushes and pull requests. On a push to `main`, it builds separate API and worker images, tags them with the commit SHA, and pushes them to ECR using GitHub OIDC credentials. Its deployment job runs the database migration as a Kubernetes Job, waits for it to complete, then upgrades the Helm release and checks both rollouts. The AWS environment, IAM role, and Kubernetes permissions must already be configured for that deployment job to succeed.

## Tests and project structure

With Node.js 20–22 installed:

```bash
npm ci
npm run lint
npm test
```

The test suite covers API validation and responses, worker completion and failure, and PostgreSQL order processing and timed out claim recovery. Database integration tests run when `TEST_DATABASE_URL` points to a PostgreSQL test database; otherwise Node's test runner skips them. CI supplies that database through a PostgreSQL service container.

| Path | Contents |
| --- | --- |
| [`src/api/`](src/api/) | HTTP API and API metrics |
| [`src/worker/`](src/worker/) | Job polling, processing, health, and metrics |
| [`src/database/`](src/database/) | Schema, migrations, and repository queries |
| [`test/`](test/) | API, worker, and database tests |
| [`infrastructure/terraform/`](infrastructure/terraform/) | AWS infrastructure definitions |
| [`helm/orderflow/`](helm/orderflow/) | Kubernetes deployment chart |
| [`web/`](web/) | Browser UI prototype for ordering and status tracking |

The browser UI is present in the repository but is not served by the current API image or Docker Compose configuration. The application and AWS configuration are a development project; the Terraform RDS settings, for example, use a single Availability Zone and allow deletion without a final snapshot.
