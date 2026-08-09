# Terraform layout

| Directory | Purpose |
|---|---|
| `state-bootstrap` | Creates the OrderFlow remote-state S3 bucket. Run only when establishing or recovering the backend. |
| `delivery` | Creates ECR repositories and the GitHub Actions OIDC publishing role. |
| `platform` | Cost-gated two-AZ VPC, private EKS nodes, VPC endpoints, encrypted RDS, Secrets Manager, and External Secrets Pod Identity. |
| `bootstrap` | Legacy Beacon state-bucket configuration retained temporarily so an existing real bucket is not orphaned. |

The legacy stack must be reviewed and destroyed deliberately after confirming no useful state remains. It is not part of the OrderFlow target architecture.

Never commit `*.tfbackend`, `*.tfvars`, plans, state files, credentials, account IDs, or role ARNs.
