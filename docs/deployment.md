# Deployment and promotion

## Cost gate

`terraform/platform` defines paid, continuously billed resources: EKS control plane, EC2 nodes, RDS, interface endpoints, load balancers, persistent volumes, and optional NAT. Validation does not create them. Before applying, use the AWS Pricing Calculator, set a budget/alarm, choose a teardown time, and review a saved plan.

For a short demonstration, use `database_deletion_protection=false`, `database_skip_final_snapshot=true`, leave NAT disabled, and temporarily enable `cluster_endpoint_public_access` with one explicit `/32` administrative CIDR. Those settings are not production durability defaults.

## Provision AWS

1. Copy `terraform/platform/backend.tfbackend.example` and `terraform.tfvars.example` to ignored local files.
2. Replace the state bucket placeholder and administrative CIDR.
3. Initialize against the protected remote state, review a saved plan, then apply that exact file:

```bash
terraform -chdir=terraform/platform init -backend-config=backend.tfbackend
terraform -chdir=terraform/platform plan -out=platform.tfplan
terraform -chdir=terraform/platform apply platform.tfplan
aws eks update-kubeconfig --name orderflow-production --region us-east-1
```

Never commit backend files, variable files, plans, state, credentials, database URLs, or generated kubeconfigs.

## Bootstrap GitOps

Install the pinned Argo CD chart, then apply the root application:

```bash
helm upgrade --install argocd argo/argo-cd \
  --namespace argocd --create-namespace --version 10.3.0 --wait
kubectl apply -f gitops/bootstrap/root-application.yaml
```

The root reconciles External Secrets first, ingress and monitoring next, and OrderFlow last. Confirm all Applications are `Synced` and `Healthy`; confirm the generated `orderflow-database` Secret exists without printing its value.

## Publish and promote

Merging application code to `main` runs tests/scans and publishes three immutable ECR images. It does not silently deploy them. Start `Promote images`, provide the full source SHA, review the resulting digest-only pull request, and merge it. Argo CD then performs the rollout and self-heals drift.

## Verification

```bash
kubectl get applications -n argocd
kubectl get pods,pdb,hpa,networkpolicy -n orderflow
kubectl rollout status deployment/orderflow-web -n orderflow
kubectl rollout status deployment/orderflow-api -n orderflow
kubectl rollout status deployment/orderflow-worker -n orderflow
```

Create an order through the ingress and observe `PENDING`, `PROCESSING`, and `COMPLETED`. Confirm Prometheus targets are up, the dashboard has traffic, and alert rules are loaded.

## Teardown

For a temporary demonstration, delete Kubernetes load-balancing/persistent resources first, confirm AWS load balancers are gone, disable RDS deletion protection through Terraform, review a destroy plan, and destroy the platform. ECR and the protected state backend are separate stacks and remain available unless deliberately removed.
