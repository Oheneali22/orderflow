# Troubleshooting journal

This file records failures that were actually reproduced and diagnosed. Do not add invented incidents or business impact.

## Investigation path

For an unavailable browser request, trace one boundary at a time:

```text
Browser -> host port -> Nginx -> Compose DNS -> API -> PostgreSQL
```

At each boundary verify process state, listening port, DNS resolution, network membership, request logs, and dependency health before changing configuration.
