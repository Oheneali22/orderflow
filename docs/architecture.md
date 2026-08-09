# OrderFlow architecture

## Order flow

1. Nginx serves the browser application and proxies `/api/*` to the API by Compose DNS name.
2. The API validates product IDs and quantities, reads authoritative prices, and creates the order, item snapshots, and job in one PostgreSQL transaction.
3. The API returns HTTP `202 Accepted` because processing has not finished.
4. The worker atomically claims one pending job with `FOR UPDATE SKIP LOCKED`, changing the order to `PROCESSING`.
5. The worker finishes the job and changes the order to `COMPLETED`; the browser polls the order endpoint and displays the transition.

## Network boundaries

```text
host :8080
    |
edge network: web <-> api
                       |
data network:          api <-> PostgreSQL <-> worker
```

The web container is not attached to the data network. The worker is not attached to the edge network. Network membership provides coarse segmentation; application authentication, TLS, Kubernetes NetworkPolicies, and AWS security controls will be later layers.

## Important decisions

- Prices use integer cents to avoid floating-point currency errors.
- Order items snapshot names and prices so historical orders do not change with the catalog.
- The order and job are committed together, preventing an order from being saved without processing work.
- API and worker are separate processes and images because they scale and fail differently.
- Liveness avoids dependency checks; readiness reports whether the database dependency is usable.
