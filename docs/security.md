# Security model

## Supply chain

- Dependencies are installed from `package-lock.json` with `npm ci`.
- GitHub Actions are pinned to full commit SHAs.
- Pull requests scan the repository for vulnerable dependencies, secrets, and IaC misconfigurations.
- Every runtime image is built and blocked on fixable HIGH/CRITICAL Trivy findings.
- ECR tags are immutable and production deploys use SHA-256 image digests.

## Identity and secrets

GitHub Actions uses OIDC and short-lived AWS credentials; no AWS access keys are GitHub secrets. IAM trust names the immutable GitHub owner/repository IDs, audience, and main branch. The publishing policy can upload only to the three OrderFlow repositories.

Terraform generates the database and Grafana passwords and stores them in Secrets Manager. External Secrets uses EKS Pod Identity—not node credentials—to read only those two secrets. The Helm chart references an existing Kubernetes Secret and never contains a production password. Kubernetes Secrets and Terraform state are envelope-encrypted with separate rotating customer-managed KMS keys.

## Runtime hardening

- Pods run as known non-root numeric UIDs with `RuntimeDefault` seccomp.
- Privilege escalation is disabled and all Linux capabilities are dropped.
- Application root filesystems are read-only; Nginx receives narrow `emptyDir` mounts for runtime/cache files.
- Service-account tokens are not automounted into application pods.
- The production namespace enforces the Kubernetes Restricted Pod Security Standard.
- NetworkPolicies default-deny ingress/egress and add only documented flows.
- RDS and EKS nodes are private; the production EKS API is private-only by default.

## Threat boundaries and residual risk

The browser-facing sample has no user authentication or authorization, rate limiting, WAF, TLS certificate configuration, or payment data. It must not be represented as a commercial checkout. Before handling users or money, add an identity provider, tenant/ownership checks, TLS and DNS, request throttling/WAF, audit retention, database role separation, secret rotation, and an external security review.
