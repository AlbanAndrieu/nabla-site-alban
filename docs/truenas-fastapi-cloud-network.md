# TrueNAS network runbook — FastAPI Cloud

This runbook describes the **current network path and diagnostic contract**.
Historical pfSense/LAN evidence lives in
`docs/incidents/2026-08-28-pfsense-security-services.md`; open hardening work is
owned by `docs/homelab-roadmap.md`.

## Current path

Production health/API traffic follows:

```text
FastAPI Cloud → Internet → pfSense:7000 → HAProxy → TrueNAS:7000
```

Public endpoint:

```text
https://truenas.albandrieu.com:7000
```

HAProxy terminates public TLS on pfSense. TrueNAS must not be exposed directly
to the Internet.

## LAN topology and addressing

```text
Internet / Free
      │
      ▼
pfSense
WAN 82.66.4.247/24
LAN 172.17.0.1/24
OPT 10.20.0.1/24
      │
      ▼
LAN switch
   ├── TrueNAS        172.17.0.24
   ├── workstation    172.17.0.57
   └── Netgear R7000  172.17.0.12 (AP mode)
```

The R7000 is an access point, not a router. pfSense remains the routing, firewall
and DHCP authority. The wired TrueNAS/workstation path must not depend on the AP.

| Interface / role | Address | Notes |
| --- | --- | --- |
| pfSense WAN / `home.albandrieu.com` | `82.66.4.247/24` | public HAProxy listener |
| Free gateway | `82.66.4.254` | next hop only |
| pfSense LAN / `mvneta0.4091` | `172.17.0.1/24` | VLAN 4091, trusted LAN |
| pfSense OPT / `mvneta0.4092` | `10.20.0.1/24` | VLAN 4092 |
| R7000 AP | `172.17.0.12` | trusted LAN |
| TrueNAS | `172.17.0.24` | backend on TCP/7000 |
| Workstation | `172.17.0.57` | local validation host |

The pfSense parent `mvneta0` and VLAN interfaces are expected at 1 Gbit/s
full-duplex. A fresh link-down event or RX/TX error takes priority over
application-layer hypotheses.

## DNS and gateway invariants

LAN clients must keep DNS when TrueNAS Apps is down:

```text
DHCP gateway: 172.17.0.1
DHCP DNS:     172.17.0.1
```

pfSense/Unbound therefore remains the resilient resolver. Pi-hole or AdGuard Home
may filter DNS, but no resolver hosted only on TrueNAS may be the LAN's single
point of failure.

The AP currently uses pfSense first and TrueNAS/Pi-hole only as a secondary
resolver. TrueNAS itself uses external resolvers and default route
`172.17.0.1`.

WANGW keeps the Free next hop but monitors an independent Internet target:

```text
WANGW gateway:    82.66.4.254
WANGW monitor IP: 1.1.1.1
```

This separates next-hop reachability from broader Internet reachability.

## TrueNAS Apps network invariant

The Apps address pool must never overlap the physical LAN `172.17.0.0/24`.

Invalid historical pool:

```text
Base: 172.17.0.0/12
Size: 24
```

Because `/12` canonicalizes to `172.16.0.0/12`, that pool includes the
physical LAN and can create overlapping Docker bridges.

Current corrected pool:

```text
Base: 10.200.0.0/16
Size: 24
```

After an Apps/Docker restart, verify that newly created networks use
`10.200.x.0/24`. Old `172.16.x.0/24` bridges may remain `linkdown` until
their stale networks are recreated.

```sh
midclt call docker.status
```

`RUNNING` proves the global Apps service recovered; it does **not** prove every
application is healthy. Use TrueNAS `app.query` plus the failing app logs to
separate migration, image, dependency-order and resource errors.

## Diagnostic sequence

Diagnose from the lowest layer upward. Do not treat a higher-layer symptom as a
root cause until the lower layers are stable.

| Signal | First interpretation |
| --- | --- |
| `e6000sw0port2 ... DOWN` | physical/L1-L2 path, cable, peer, PHY or driver first |
| `dpinger ... sendto error: 13` | correlate with link, routing, firewall and gateway state |
| routing works but clients report no Internet | verify DNS before application health |
| `SO_SNDBUF ... No buffer space available` | inspect mbufs/socket buffers; do not assume persistent exhaustion |
| public TCP/7000 fails | WAN rule / listener / HAProxy before TrueNAS API |
| `/ui/` works but API fails | transport is healthy; inspect WebSocket/auth/RBAC/API separately |
| Docker `RUNNING` but app down | inspect `app.query` and application-specific logs |

Useful pfSense checks:

```sh
ifconfig
netstat -i
netstat -m
sysctl kern.ipc.maxsockbuf

tail -f /var/log/system.log \
  | grep --line-buffered -E 'e6000sw0port2|dpinger|WANGW|unbound|kea|snort|crowdsec|pfblocker'
```

A previous incident showed repeated `e6000sw0port2` link flaps while subsequent
`netstat -m` checks reported zero denied/delayed mbuf allocations. Preserve that
distinction when diagnosing a recurrence; the detailed historical evidence is in
the incident record.

## Reachability baseline

A healthy path should prove these layers independently:

1. DNS resolves the intended public/internal name.
2. TCP/7000 reaches the pfSense HAProxy listener.
3. Public TLS presents the wildcard certificate for
   `truenas.albandrieu.com`.
4. LAN access to `https://172.17.0.24:7000/ui/` returns the TrueNAS UI; the
   direct backend may present the expected self-signed iXsystems certificate.
5. `/` redirects to `/ui/` and `/ui/` returns HTTP 200.
6. Authenticated WebSocket/API validation proves auth/RBAC separately.

Transport or UI reachability must never be reported as proof that an
authenticated TrueNAS API method succeeded.

## HAProxy and health-check contract

The infrastructure health check should use a stable unauthenticated UI endpoint
such as `/ui/`. Do not use `/api/current` as a basic HTTP liveness endpoint;
authenticated TrueNAS API/WebSocket health belongs in the FastAPI runtime
integration.

HAProxy logging may capture non-sensitive routing metadata needed for diagnosis:

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

Never log `Authorization`, cookies, API keys or other credentials.

## Security and recovery invariants

- pfSense webConfigurator is LAN/VPN administration only.
- Public TrueNAS access is only through the explicitly reviewed HAProxy frontend.
- TrueNAS SSH on TCP/9922 is trusted-LAN administration only.
- Re-enable CrowdSec, pfBlockerNG and Snort sequentially after a network incident
  so filtering layers do not obscure L1/L2 or DNS diagnosis.
- A Cloudflare Tunnel state is independent from the direct HAProxy TCP/7000 path.

The remaining WAN-rule, HAProxy mTLS/logging/timeout, DNS redundancy and physical
link hardening actions are tracked only in `docs/homelab-roadmap.md`.
