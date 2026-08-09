# Architecture and decisions

## Runtime flow

1. Nginx serves the static client and proxies `/api/*` to the `api` Kubernetes Service.
2. The API validates IDs and quantities, loads authoritative prices, and commits the order, immutable item price snapshots, and one job in a single PostgreSQL transaction.
3. It returns `202 Accepted` with `PENDING`; completion is intentionally asynchronous.
4. A worker claims one eligible job using `SELECT ... FOR UPDATE SKIP LOCKED`, marks the order `PROCESSING`, performs the work, and commits `COMPLETED` or `FAILED`.
5. The browser polls the order resource until it reaches a terminal state.

Integer cents avoid floating-point currency errors. Item snapshots keep historical totals stable when the catalog changes. Unique job-to-order constraints and row locks protect against duplicate processing.

## AWS boundaries

The `terraform/platform` stack creates a dedicated two-AZ VPC. EKS worker nodes and RDS live in private subnets. ECR, EC2, EKS, CloudWatch Logs, STS, and S3 endpoints allow core control-plane and image traffic without a NAT gateway; NAT is an explicit opt-in for workloads needing arbitrary internet egress. RDS has no public endpoint and accepts PostgreSQL only from the EKS cluster security group.

EKS enables control-plane API, audit, authenticator, controller-manager, and scheduler logs. Public API access requires explicit administrative CIDRs and rejects `0.0.0.0/0`. Nodes use the ECR pull-only managed policy. External Secrets receives a separate Pod Identity role that can read only the OrderFlow database secret.

## Delivery and GitOps

Pull requests cannot authenticate to AWS. On `main`, GitHub Actions exchanges its OIDC token for a short-lived IAM role restricted to the immutable GitHub repository identity and `refs/heads/main`. The exact locally scanned image is pushed as `sha-<40-character-commit>` to an immutable ECR repository.

Publishing and deployment are separate approvals. The `Promote images` workflow resolves all three ECR digests for a source commit, edits the production values, validates the chart, and opens a pull request. Merging that PR changes desired state; Argo CD then reconciles the digest-pinned Helm release.

## Queue decision

PostgreSQL is the current durable queue adapter, chosen to keep transaction semantics explicit and the project runnable without cloud services. It is appropriate for this workload but is not represented as an SQS replacement.

The production migration path is a transactional outbox: retain the database transaction, publish outbox records to SQS, consume with visibility timeouts and idempotency keys, and route exhausted messages to a DLQ. Publishing directly to SQS inside the HTTP request is intentionally rejected because a database commit and SQS send cannot form one atomic transaction.

## Failure domains

- Web/API/worker Deployments have two replicas, rolling updates, PDBs, probes, and resource bounds.
- API and worker scale independently because request traffic and background throughput differ.
- Readiness removes dependency-broken pods from Services; liveness does not restart a healthy process merely because PostgreSQL is briefly unavailable.
- Multi-AZ RDS is configurable but off by default in the portfolio environment to control cost; a sustained production environment should enable it.
- NetworkPolicies deny by default and admit only ingress, web-to-API, monitoring scrapes, DNS, and database flows.
