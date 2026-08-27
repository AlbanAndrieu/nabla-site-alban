# TrueNAS access from FastAPI Cloud

## Current path

The production health/API path is:

```text
FastAPI Cloud → Internet → pfSense:7000 → HAProxy → TrueNAS
```

Current public endpoint:

```text
https://truenas.albandrieu.com:7000
```

HAProxy terminates the public TLS connection on pfSense and forwards traffic to the TrueNAS backend. TrueNAS itself must not be exposed directly to the Internet.

## Validation evidence

A refresh of the FastAPI health board has produced TCP traffic from the FastAPI Cloud source address to the public pfSense address on TCP/7000. The TCP handshake and subsequent application traffic confirm that the FastAPI Cloud request reaches the HAProxy listener.

LAN validation also confirms that:

- `/` returns an HTTP redirect to `/ui/`;
- `/ui/` returns HTTP 200;
- the public wildcard certificate matches `truenas.albandrieu.com`.

These checks demonstrate transport and HTTPS reachability. They do not, on their own, prove that an authenticated TrueNAS API call succeeds.

## Planned network hardening

The following changes are intentionally deferred until FastAPI Cloud → TrueNAS API access is fully validated:

- [ ] Remove or replace the broad pfSense WAN rule `Easy Rule: Passed from Firewall Log View` with explicit least-privilege rules, including a dedicated TCP/7000 rule for the HAProxy frontend.
- [ ] Confirm whether HAProxy-to-TrueNAS mTLS is actually required. If it is not, remove the backend client-certificate directive `crt /var/etc/haproxy/server_clientcert_638a386ebea01.pem`.
- [ ] Enable detailed HAProxy HTTP logging for the TrueNAS frontend while avoiding capture of `Authorization`, cookies, API keys, or other credentials.
- [ ] Configure an explicit HAProxy tunnel timeout suitable for TrueNAS WebSocket/API sessions.
- [ ] Re-enable IDS/IPS and filtering controls only after the explicit WAN policy has been validated.
- [ ] Keep the public health check lightweight and distinct from authenticated API/WebSocket validation.

## HAProxy observability target

For the TrueNAS frontend, retain `log global` and add HTTP request logging. Useful non-sensitive request/response metadata includes the Host header, User-Agent, WebSocket Upgrade/Connection headers, response Location, HTTP status, backend selected, connection timings, and termination state.

Do not log credentials or authentication headers.

## Health-check design

The HAProxy backend health check should validate that the TrueNAS web service is alive and capable of serving a stable unauthenticated endpoint. It should not use an authenticated WebSocket/API endpoint merely to decide whether the backend can accept traffic.

Authenticated TrueNAS API health belongs in the application-level FastAPI health/runtime integration, where authentication failures, API protocol failures, and transport failures can be reported separately.
