# OrderFlow

OrderFlow is an asynchronous order-processing platform and a production-shaped DevOps portfolio project. A browser submits an order, a Node.js API commits the order and processing job atomically to PostgreSQL, and independently scalable workers claim jobs without double-processing them.

[![CI](https://github.com/Oheneali22/orderflow/actions/workflows/ci.yml/badge.svg)](https://github.com/Oheneali22/orderflow/actions/workflows/ci.yml)

## Architecture

```text
Internet
   |
Nginx ingress -> web replicas -> API replicas -> encrypted PostgreSQL/RDS
                                      |                    ^
                                      v                    |
                              transactional job table -> worker replicas

GitHub Actions --OIDC--> AWS IAM -> immutable ECR images
                         Git PR -> Argo CD -> Helm -> EKS
Prometheus <- ServiceMonitors <- API/worker metrics -> Grafana + alerts
Secrets Manager --EKS Pod Identity--> External Secrets -> Kubernetes Secret
```

The current queue adapter is PostgreSQL. `FOR UPDATE SKIP LOCKED` makes concurrent claims safe, and creating the order plus job in one transaction prevents stranded orders. The trade-off and SQS migration path are documented in [architecture.md](docs/architecture.md).

## What this demonstrates

- Three hardened, non-root images with read-only Kubernetes root filesystems and blocking Trivy scans.
- Pull-request CI for linting, tests against real PostgreSQL, Terraform validation, Helm rendering, secret/IaC scanning, image builds, and vulnerability scanning.
- GitHub-to-AWS OIDC with no stored AWS access keys; the trust policy uses GitHub's immutable repository identity and only permits `main`.
- Private immutable ECR repositories and commit-addressed image tags.
- Cost-gated Terraform for a two-AZ VPC, private EKS nodes, VPC endpoints, encrypted RDS, Secrets Manager, control-plane audit logs, and least-privilege EKS Pod Identity.
- A reusable Helm chart with probes, requests/limits, HPAs, PDBs, NetworkPolicies, Pod Security compatibility, digest pinning, and optional local PostgreSQL.
- Argo CD application-of-applications for ingress, external secrets, monitoring, and OrderFlow.
- A reviewable promotion workflow that resolves ECR digests and opens a GitOps pull request; Argo CD never deploys an unreviewed tag.
- Prometheus alerts, a Grafana service dashboard, SLOs, incident runbooks, and tested pod-replacement behavior.

## Verified behavior

The application has been tested locally with Compose and in a disposable Kubernetes 1.36 cluster. The Kubernetes verification used the same Helm chart in development mode and proved:

```text
POST /api/orders -> PENDING -> PROCESSING -> COMPLETED
```

It ran two web, two API, and two worker replicas under non-root/read-only security settings. During a 30-request in-cluster probe, one web pod was deleted; the Service returned all 30 responses successfully while the Deployment replaced the pod.

The paid AWS application stack is deliberately not left running continuously. Terraform is initialized and validated in CI; [deployment.md](docs/deployment.md) defines the apply, verification, and teardown gates.

## Run locally

Requirements: Node.js 20–22 and Docker with Compose.

```bash
npm ci
npm run lint
npm test
docker compose up --build --detach --wait
```

Open `http://localhost:8080`. Only Nginx is host-published; the worker and PostgreSQL remain on the internal data network.

## Validate infrastructure and packaging

```bash
terraform fmt -check -recursive
terraform -chdir=terraform/platform init -backend=false
terraform -chdir=terraform/platform validate
helm lint charts/orderflow --values environments/production/values.yaml
helm template orderflow charts/orderflow --values environments/production/values.yaml
```

Production values reference image digests, not mutable tags. `developmentPostgresql.enabled` exists only for disposable cluster testing and is disabled by default.

## API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health/live` | Dependency-free liveness |
| `GET` | `/health/ready` | PostgreSQL-backed readiness |
| `GET` | `/metrics` | Prometheus metrics |
| `GET` | `/products` | Product catalog |
| `POST` | `/orders` | Atomically create a `PENDING` order and job; returns `202` |
| `GET` | `/orders/:id` | Observe the order transition |

## Documentation

- [Architecture and decisions](docs/architecture.md)
- [Deployment and promotion](docs/deployment.md)
- [Security model](docs/security.md)
- [Reliability, SLOs, and testing](docs/reliability.md)
- [Runbooks](docs/runbooks/)
- [Troubleshooting journal](docs/troubleshooting.md)
- [Resume and interview guide](docs/resume-guide.md)
