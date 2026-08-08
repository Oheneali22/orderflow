# Beacon Support Ticket Platform

An original full-stack project for learning the complete DevOps lifecycle. Users create and track support tickets through a browser; the API stores ticket data in PostgreSQL and exposes operational health and Prometheus metrics.

This repository is intentionally developed in stages. We start with source code and local containers, then add CI/CD, Terraform, AWS, Kubernetes, Helm, secrets management, GitOps, and observability while explaining every decision.

## Current architecture - Phase 1

```text
Browser
  |
  v
Nginx frontend :8080
  | /api/*
  v
Flask API :5000
  |
  v
PostgreSQL :5432
```

## Services

| Service | Technology | Responsibility |
|---|---|---|
| Frontend | HTML, CSS, JavaScript, Nginx | User interface and API reverse proxy |
| Backend | Python, Flask, SQLAlchemy, Gunicorn | Ticket API, health checks, metrics, logging |
| Database | PostgreSQL 16 | Durable ticket data |

## API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/live` | Confirms that the application process is alive |
| `GET` | `/api/ready` | Confirms that the API can reach its database dependency |
| `GET` | `/metrics` | Exposes Prometheus metrics |
| `GET` | `/api/tickets` | Lists tickets; accepts an optional `status` query parameter |
| `GET` | `/api/tickets/{id}` | Returns one ticket |
| `POST` | `/api/tickets` | Creates a ticket |
| `PATCH` | `/api/tickets/{id}/status` | Changes ticket status |
| `DELETE` | `/api/tickets/{id}` | Deletes a ticket |
| `GET` | `/api/stats` | Returns counts grouped by status and priority |

## Run the automated tests

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt
pytest -v --cov=app
```

On Linux or macOS, activate the environment with `source .venv/bin/activate`.

## Run the full stack with Docker Compose

```bash
docker compose up --build
```

Open:

- Frontend: `http://localhost:8080`
- Backend readiness: `http://localhost:5000/api/ready`
- Prometheus metrics: `http://localhost:5000/metrics`

Stop the services without deleting database data:

```bash
docker compose down
```

Delete the local database volume as well:

```bash
docker compose down --volumes
```

## Configuration contract

| Variable | Purpose | Local value source | Future Kubernetes source |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Compose environment | Kubernetes Secret synced from AWS Secrets Manager |
| `LOG_LEVEL` | Runtime log verbosity | Compose environment | ConfigMap |
| `APP_ENV` | Environment identity | Compose environment | ConfigMap |

Sensitive production values will never be committed to Git. Local credentials in `compose.yaml` are disposable development-only values.

## DevOps roadmap

1. Source code, tests, health checks, metrics, and logs
2. Docker image construction and local orchestration
3. Git workflow and pull-request controls
4. GitHub Actions CI: lint, test, coverage, secret and dependency scanning
5. Image build, SBOM, vulnerability scanning, signing, and ECR push
6. Terraform remote state and AWS environment provisioning
7. VPC, subnets, EKS, RDS, ECR, S3, IAM, IRSA, and CloudWatch
8. Helm Deployments, Services, Ingress, ConfigMap, ExternalSecret, probes, limits, HPA, PDB, and NetworkPolicy
9. Argo CD GitOps promotion and rollback
10. Prometheus, Grafana, CloudWatch, dashboards, alerts, and incident exercises

See [docs/INTERVIEW_GUIDE.md](docs/INTERVIEW_GUIDE.md) for the reasoning you should be able to explain.
