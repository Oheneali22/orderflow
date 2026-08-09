# Troubleshooting journal

This journal records failures reproduced while building OrderFlow.

## OIDC subject mismatch

The first `main` workflow passed tests, builds, and scans but every image job failed `AssumeRoleWithWebIdentity`. IAM trusted `repo:Oheneali22/orderflow:ref:refs/heads/main`; CloudTrail showed GitHub emitted the immutable subject `repo:Oheneali22@279475744/orderflow@1327790997:ref:refs/heads/main`. Terraform was tightened to that exact identity. The rerun authenticated and published all three digests.

## Named users and Kubernetes `runAsNonRoot`

Images declared `USER nginx` and `USER node`. Kubernetes refused to start them because it cannot prove a named user is non-root. The chart now supplies numeric UIDs 101 and 1000 while retaining `runAsNonRoot`.

## Read-only Nginx filesystem

The chart correctly enforced a read-only root, but Nginx needs runtime PID/cache paths. Narrow ephemeral mounts at `/run` and `/var/cache/nginx` solved this without making the container root writable.

## Misleading port-forward resilience result

Deleting a web pod terminated `kubectl port-forward service/...` because port-forward binds to one selected pod. Those host failures were a test-harness artifact. A replacement in-cluster probe used Service DNS and recorded zero failures across 30 requests during pod deletion.

## Stranded claimed jobs

The original worker marked a database job `CLAIMED` with no lease recovery. A process crash after that transaction could strand the order in `PROCESSING`; shutdown also closed the pool without explicitly draining the current cycle. Claims now expire after 60 seconds and can be reclaimed under `SKIP LOCKED`, while SIGTERM waits for the in-flight cycle before closing PostgreSQL. Both paths have real regression evidence.

## Investigation path

Trace one boundary at a time:

```text
DNS/load balancer -> ingress -> web Service -> API Service -> endpoints -> pod readiness -> PostgreSQL
```

At each boundary verify desired/ready replicas, events, endpoints, network policy, probe result, structured logs, resource pressure, recent GitOps changes, and dependency health before changing configuration.
