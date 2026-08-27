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

## Physical and logical LAN topology

The target LAN topology keeps the Wi-Fi access point outside the critical path for TrueNAS:

```text
Internet
   │
   ▼
pfSense
WAN: 82.66.4.247
LAN: 172.17.0.1/24
   │
   ▼
LAN switch
   ├── TrueNAS        172.17.0.24
   ├── workstation    172.17.0.57
   └── Netgear R7000  172.17.0.12
          │
          └── Wi-Fi clients
                └── S24 Ultra 172.17.0.11
```

The Netgear R7000 is configured in **Access Point mode**, not router mode. pfSense remains the LAN gateway and DHCP authority.

### Relevant addressing

| Role | Address / value | Notes |
| --- | --- | --- |
| pfSense WAN / `home.albandrieu.com` | `82.66.4.247` | Public IPv4 used by the HAProxy listener |
| pfSense LAN / default gateway | `172.17.0.1` | Default route for TrueNAS and LAN clients |
| R7000 access point | `172.17.0.12` | DHCP reservation for MAC `10:0C:6B:62:12:8E` |
| TrueNAS | `172.17.0.24` | Direct backend endpoint on TCP/7000 |
| Workstation | `172.17.0.57` | Local validation host |
| S24 Ultra Wi-Fi | `172.17.0.11` | DHCP reservation on the trusted home SSID |
| S24 Ultra via Free Mobile | `37.166.227.161` | Observed public source during external validation |
| FastAPI Cloud probe source | `34.200.20.162` | Observed source correlated with `/healthz` refresh traffic |

## DNS design

LAN clients should receive **pfSense `172.17.0.1` as their resilient DNS entry point**. Pi-hole on TrueNAS can still provide filtering, but TrueNAS should not be the only DNS server handed directly to clients while it also hosts Docker Apps.

The failure mode observed during the TrueNAS Apps outage was:

```text
S24 Ultra → Wi-Fi association succeeds
         → DHCP succeeds
         → gateway 172.17.0.1 is reachable
         → DNS points to 172.17.0.24 (Pi-hole)
         → TrueNAS / Docker Apps is down
         → DNS lookups fail
         → Android reports "Connected without Internet"
```

The preferred design is:

```text
LAN client
   │
   └── DNS 172.17.0.1 (pfSense)
            │
            ├── pfSense resolver / fallback path
            └── optional forwarding/filtering through Pi-hole on TrueNAS
```

This keeps Pi-hole useful for DNS filtering while avoiding a circular dependency where a TrueNAS/Docker failure also removes basic name resolution from the LAN.

The R7000 management interface currently uses:

```text
Primary DNS:   172.17.0.1
Secondary DNS: 172.17.0.24
```

Those values apply to the AP itself; Wi-Fi clients receive their DNS configuration from the pfSense DHCP service.

TrueNAS currently uses:

```text
Primary DNS:   9.9.9.9
Secondary DNS: 1.1.1.1
Tertiary DNS:  172.17.0.24
Default route: 172.17.0.1
```

## Validation evidence

A refresh of the FastAPI health board has produced TCP traffic from the FastAPI Cloud source address to the public pfSense address on TCP/7000. The TCP handshake and subsequent application traffic confirm that the FastAPI Cloud request reaches the HAProxy listener.

LAN validation confirms that:

- the TrueNAS default route is `172.17.0.1` on `enp10s0`;
- `enp10s0` negotiates 1000 Mbit/s, full duplex, with link detected;
- `/` returns an HTTP redirect to `/ui/`;
- `/ui/` returns HTTP 200;
- direct access to `https://172.17.0.24:7000/ui/` negotiates TLS 1.3 and serves the TrueNAS UI;
- the direct TrueNAS certificate is the expected self-signed iXsystems `CN=localhost` certificate;
- the public wildcard certificate matches `truenas.albandrieu.com`.

These checks demonstrate transport and HTTPS reachability. They do not, on their own, prove that an authenticated TrueNAS API call succeeds.

## Docker / Apps network constraint

The TrueNAS host LAN is `172.17.0.0/24`. The previous Apps Address Pool was:

```text
Base: 172.17.0.0/12
Size: 24
```

That value is effectively in the `172.16.0.0/12` supernet and overlaps the physical LAN `172.17.0.0/24`. Existing Docker bridges were consequently allocated as `172.16.x.0/24` networks. After the outage, the Apps service could not start reliably while this overlapping address space remained the default pool.

The corrected Apps Address Pool is:

```text
Base: 10.200.0.0/16
Size: 24
```

pfSense routing currently has no `10.200.0.0/16` route, so this range is not in conflict with the known routed networks. The Apps service recovered to:

```text
{"description": "Application(s) are currently running", "status": "RUNNING"}
```

Old `172.16.x.0/24` Docker bridge routes can remain visible as `linkdown` for already-created Apps. Do not delete them blindly during service recovery. Recreate or clean them only after identifying which installed Apps still reference those networks.

## Cloudflare Tunnel recovery

After Docker Apps recovered, the `cloudflared` App required a restart. The `nabla-truescale` tunnel then returned to:

```text
Healthy — 1 connector
```

This confirms the expected dependency chain:

```text
TrueNAS networking
   → Docker Apps service
      → cloudflared App
         → Cloudflare Tunnel
            → externally published homelab services
```

## Planned network hardening

The following changes are intentionally deferred until FastAPI Cloud → TrueNAS API access is fully validated:

- [ ] Remove or replace the broad pfSense WAN rule `Easy Rule: Passed from Firewall Log View` with explicit least-privilege rules, including a dedicated TCP/7000 rule for the HAProxy frontend.
- [ ] Confirm whether HAProxy-to-TrueNAS mTLS is actually required. If it is not, remove the backend client-certificate directive `crt /var/etc/haproxy/server_clientcert_638a386ebea01.pem`.
- [ ] Enable detailed HAProxy HTTP logging for the TrueNAS frontend while avoiding capture of `Authorization`, cookies, API keys, or other credentials.
- [ ] Configure an explicit HAProxy tunnel timeout suitable for TrueNAS WebSocket/API sessions.
- [ ] Re-enable IDS/IPS and filtering controls only after the explicit WAN policy has been validated.
- [ ] Keep the public health check lightweight and distinct from authenticated API/WebSocket validation.
- [ ] Keep TrueNAS SSH on TCP/9922 reachable from trusted LAN administration hosts only; it must remain unreachable from the public Internet.
- [ ] Audit the remaining `172.16.x.0/24` Docker networks after all Apps are healthy and migrate/recreate stale networks where required.
- [ ] Keep Pi-hole as a filtering resolver without making TrueNAS/Docker the single DNS dependency for the complete LAN.

## HAProxy observability target

For the TrueNAS frontend, retain `log global` and add HTTP request logging. Useful non-sensitive request/response metadata includes the Host header, User-Agent, WebSocket Upgrade/Connection headers, response Location, HTTP status, backend selected, connection timings, and termination state.

Do not log credentials or authentication headers.

Recommended frontend pass-through settings:

```haproxy
option httplog
option logasap
capture request header Host len 128
capture request header User-Agent len 128
capture request header Upgrade len 32
capture request header Connection len 64
capture response header Location len 256
timeout tunnel 1h
```

## Health-check design

The HAProxy backend health check should validate that the TrueNAS web service is alive and capable of serving a stable unauthenticated endpoint. `/ui/` is suitable for this infrastructure-level liveness check.

It should not use `/api/current` as a basic HTTP health check. On current TrueNAS releases this path is the WebSocket JSON-RPC API endpoint and belongs in application-level validation.

Authenticated TrueNAS API health belongs in the FastAPI health/runtime integration, where authentication failures, certificate-validation failures, API protocol failures, and transport failures can be reported separately.
