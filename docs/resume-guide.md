# Resume and interview guide

## Resume bullets

Use only bullets you can explain and adjust tense/numbers to match the role:

- Built an asynchronous Node.js/PostgreSQL order platform with transactionally coupled orders/jobs and concurrent-safe worker claims using `FOR UPDATE SKIP LOCKED`.
- Designed a cost-gated AWS platform in Terraform with private EKS nodes, encrypted RDS, VPC endpoints, control-plane audit logs, remote state, and least-privilege Pod Identity.
- Implemented keyless GitHub Actions delivery through OIDC, immutable ECR tags, digest-pinned Helm releases, blocking Trivy gates, and pull-request-based GitOps promotion with Argo CD.
- Hardened Kubernetes workloads with non-root/read-only containers, Restricted Pod Security, default-deny NetworkPolicies, probes, HPAs, PDBs, and explicit resource bounds.
- Added Prometheus service metrics, availability/error/latency alerts, Grafana dashboards, SLO definitions, and incident runbooks; verified 30/30 requests during a pod-loss exercise.

## Explain the design

`202 Accepted` communicates that durable work was accepted but has not finished. The API stays responsive because workers perform processing independently. The database transaction prevents an order without a job; row locking prevents two workers claiming the same job.

Pull-request code has no AWS identity. Only `main` can exchange a GitHub OIDC token for the narrowly scoped ECR role. Images are immutable, but publishing is not deployment: a promotion workflow opens a digest change PR, and only its merge changes Argo CD desired state.

Secrets move from Secrets Manager through a controller with a single-secret Pod Identity policy. They do not live in Git, workflow variables, images, or Helm values.

## Honest boundaries

- The Kubernetes runtime was verified both in a disposable local cluster and in a time-bounded AWS deployment. In AWS, Argo CD reconciled the full platform, EBS CSI provisioned Prometheus/Grafana volumes, and a live order traversed web, API, private RDS, and worker from `PENDING` to `COMPLETED`; paid resources were then torn down.
- PostgreSQL is the current queue. Explain the transactional-outbox-to-SQS migration instead of calling the database SQS.
- The sample lacks end-user authentication, WAF, TLS/DNS configuration, and payment handling.
- SLOs are proposed targets until real production traffic supplies a measurement window.

Strong interviews reward these boundaries because they distinguish validated evidence from architecture intent.
