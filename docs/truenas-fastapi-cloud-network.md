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
Internet / Free
      │
      ▼
pfSense
WAN: 82.66.4.247/24
LAN: 172.17.0.1/24
OPT: 10.20.0.1/24
      │
      ▼
LAN switch
   ├── TrueNAS        172.17.0.24
   ├── workstation    172.17.0.57
   └── Netgear R7000  172.17.0.12 (AP mode)
          │
          └── Wi-Fi clients
                └── S24 Ultra 172.17.0.11
```

The Netgear R7000 is configured in **Access Point mode**, not router mode. pfSense remains the LAN gateway, routing, firewall and DHCP authority. The switch is now before the R7000, so TrueNAS and the workstation do not depend on the access point for wired LAN connectivity.

### pfSense interface/VLAN layout

The current pfSense Ethernet parent is `mvneta0`, running at `1000baseT <full-duplex>`. Logical networks are carried as tagged VLANs on that parent:

| Interface | VLAN | Address | Role |
| --- | ---: | --- | --- |
| `mvneta0.4090` | 4090 | `82.66.4.247/24` | WAN / Free |
| `mvneta0.4091` | 4091 | `172.17.0.1/24` | trusted LAN |
| `mvneta0.4092` | 4092 | `10.20.0.1/24` | OPT |

Observed interface state after the topology/DNS fixes:

```text
mvneta0       1000baseT full-duplex, active
mvneta0.4090  1000baseT full-duplex, active
mvneta0.4091  1000baseT full-duplex, active
mvneta0.4092  1000baseT full-duplex, active
```

`netstat -i` showed no interface input/output errors or collisions on the VLAN interfaces. The parent interface had a small historical `Idrop` count, but no current `Ierrs`, `Oerrs` or collisions indicating an obvious duplex/CRC fault.

### Relevant addressing

| Role | Address / value | Notes |
| --- | --- | --- |
| pfSense WAN / `home.albandrieu.com` | `82.66.4.247` | Public IPv4 used by the HAProxy listener |
| Free next-hop gateway | `82.66.4.254` | WAN gateway, not used as the independent dpinger monitor target |
| pfSense LAN / default gateway | `172.17.0.1` | Default route for TrueNAS and LAN clients |
| pfSense OPT | `10.20.0.1` | VLAN 4092 |
| R7000 access point | `172.17.0.12` | DHCP reservation for MAC `10:0C:6B:62:12:8E` |
| TrueNAS | `172.17.0.24` | Direct backend endpoint on TCP/7000 |
| Workstation | `172.17.0.57` | Local validation host |
| S24 Ultra Wi-Fi | `172.17.0.11` | DHCP reservation on the trusted home SSID |
| S24 Ultra via Free Mobile | `37.166.227.161` | Observed public source during external validation |
| FastAPI Cloud probe source | `34.200.20.162` | Observed source correlated with `/healthz` refresh traffic |

## DNS and outage resilience

The AP itself uses:

```text
Primary DNS:   172.17.0.1   # pfSense
Secondary DNS: 172.17.0.24  # TrueNAS/Pi-hole fallback
```

LAN clients should not depend on a **single** DNS resolver hosted inside the TrueNAS Apps runtime. When pfSense DHCP distributed only `172.17.0.24` and TrueNAS/Docker was down, Wi-Fi association and IP routing still worked, but Android could not resolve the connectivity-check hostnames and reported **Connected without Internet**. The R7000 itself could simultaneously report Internet connectivity because its own DNS path remained available.

The resilient default is therefore:

```text
DHCP gateway: 172.17.0.1
DHCP DNS:     172.17.0.1
```

Pi-hole can still be used for filtering, but a production-quality design should avoid making a single Docker-hosted Pi-hole the only resolver for the LAN. Suitable follow-ups are a second independent Pi-hole instance, or pfSense/Unbound as the resilient resolver with filtering designed so that loss of TrueNAS does not remove DNS for the whole LAN.

TrueNAS itself currently uses:

```text
Primary DNS:   9.9.9.9
Secondary DNS: 1.1.1.1
Tertiary DNS:  172.17.0.24
Default route: 172.17.0.1
```

## pfSense gateway monitoring

The WAN gateway remains the Free next hop `82.66.4.254`, but its independent dpinger monitor target is now:

```text
WANGW gateway:    82.66.4.254
WANGW Monitor IP: 1.1.1.1
```

This separates **next-hop reachability** from **actual Internet reachability**. A dpinger failure against `1.1.1.1` is therefore more useful diagnostically than monitoring only the directly connected Free gateway.

During the incident pfSense logged:

```text
dpinger: WANGW 82.66.4.254: sendto error: 13
```

This should be treated as a symptom to correlate with physical link events, routing/firewall state and gateway health, not as proof that dpinger itself is the root cause.

Useful live correlation command:

```sh
tail -f /var/log/system.log \
  | grep --line-buffered -E 'e6000sw0port2|dpinger|WANGW'
```

## Ethernet link-flap investigation

The strongest incident signal is repeated physical/link-layer state loss on pfSense switch port `e6000sw0port2`:

```text
12:43:43 DOWN → 12:43:47 UP
12:55:17 DOWN → 12:55:21 UP
13:05:11 DOWN → 13:05:14 UP
13:07:27 DOWN → 13:07:30 UP
13:11:11 DOWN → 13:11:18 UP
17:11:53 DOWN → 17:11:56 UP
17:39:24 DOWN → 17:39:28 UP
18:45:01 DOWN → 18:45:24 UP
19:18:55 DOWN → 19:19:12 UP
19:19:20 DOWN → 19:19:44 UP
```

The later outages lasting roughly 17–24 seconds are particularly significant. A `link state changed to DOWN` event is below DNS, HAProxy, DHCP, dpinger or application health; it points first to the Ethernet path, port, cable, switch/AP peer, PHY negotiation, or hardware/driver state.

At `13:13` ports 1/2/3 all cycled while the pfSense parent interface was being reinitialized. That grouped event is consistent with a broader restart/reconfiguration. Subsequent isolated `e6000sw0port2` flaps remain the more useful evidence for the intermittent fault.

### Current diagnosis priority

1. **P0 — isolate `e6000sw0port2` physical/L2 instability.** Keep the new switch-before-R7000 topology, verify cable and peer switch/AP port, and correlate every future DOWN/UP with switch/R7000 logs and LEDs.
2. **P1 — monitor WANGW independently through `1.1.1.1`.** Determine whether dpinger errors occur only when the Ethernet link drops.
3. **P1 — keep DNS resilient to TrueNAS outages.** pfSense/Unbound must remain a working resolver even if TrueNAS Apps/Pi-hole is unavailable.
4. **P2 — re-enable security services one by one only after the base link is stable.** This prevents IDS/filtering restarts from obscuring the physical diagnosis.

### Network-buffer check

The earlier Unbound message included:

```text
SO_SNDBUF ... No buffer space available
```

However the subsequent pfSense mbuf inspection was healthy:

```text
0 requests for mbufs denied
0 requests for mbufs delayed
0 requests for jumbo clusters denied
kern.ipc.maxsockbuf: 4262144
```

Only about 7 MiB was allocated/cached to the network allocator at the time of inspection, far below exhaustion. This materially lowers the probability that persistent FreeBSD mbuf starvation is the current root cause. The previous Unbound warning should therefore remain documented as historical evidence rather than the primary explanation for the continuing `e6000sw0port2` flaps.

## Security-service recovery order

CrowdSec, Snort and pfBlockerNG were intentionally stopped or left disabled while the base network path was being diagnosed. Re-enable them **sequentially**, validating link stability, DNS and WANGW after each step:

```text
1. Baseline: pfSense routing + Unbound/Kea + HAProxy stable
2. CrowdSec
3. pfBlockerNG
4. Snort last
```

Snort should be last because IDS/IPS inspection has the greatest potential to add packet-processing state, resource pressure and troubleshooting noise. After each service is enabled, verify:

```sh
ifconfig
netstat -i
netstat -m
sysctl kern.ipc.maxsockbuf

tail -f /var/log/system.log \
  | grep --line-buffered -E 'e6000sw0port2|dpinger|WANGW|unbound|kea|snort|crowdsec|pfblocker'
```

Do not enable the next security layer if a fresh physical link flap, DNS failure, gateway loss, buffer denial or unexpected service restart appears. The objective is to preserve a clean causal boundary between the L1/L2 issue and higher-layer filtering.

## Validation evidence

A refresh of the FastAPI health board has produced TCP traffic from the FastAPI Cloud source address to the public pfSense address on TCP/7000. The TCP handshake and subsequent application traffic confirm that the FastAPI Cloud request reaches the HAProxy listener.

LAN validation also confirms that:

- `/` returns an HTTP redirect to `/ui/`;
- `/ui/` returns HTTP 200;
- direct access to `https://172.17.0.24:7000/ui/` negotiates TLS 1.3 and serves the TrueNAS UI;
- the direct TrueNAS certificate is the expected self-signed iXsystems `CN=localhost` certificate;
- the public wildcard certificate matches `truenas.albandrieu.com`;
- the TrueNAS physical link is 1 Gbit/s full-duplex and the default route is `172.17.0.1`.

These checks demonstrate transport and HTTPS reachability. They do not, on their own, prove that an authenticated TrueNAS API call succeeds.

## Docker / Apps network constraint

The TrueNAS host LAN is `172.17.0.0/24`. The Apps Address Pool must **not** overlap that network.

The previous configuration was:

```text
Base: 172.17.0.0/12
Size: 24
```

This was invalid for the topology because `/12` is canonicalized to `172.16.0.0/12`, which includes the physical LAN `172.17.0.0/24`. Docker allocated many `/24` bridges from that supernet, creating address-space overlap with the host LAN. The failure only became fully visible when the Docker/Apps networking stack was reinitialized and applications had to recreate their networks; stale pre-existing networks can mask an invalid pool until a restart, upgrade, pool reconfiguration, or large-scale app restart forces reconciliation.

The corrected Apps Address Pool is:

```text
Base: 10.200.0.0/16
Size: 24
```

pfSense routing was checked before the change and had no route for `10.200.0.0/16`. After the change and restart, `midclt call docker.status` returned `RUNNING`, confirming recovery of the global Apps service. Old `172.16.x.0/24` Docker bridges can remain visible as `linkdown` until stale networks are removed/recreated; they are not evidence that the new pool was ignored if newly created networks use `10.200.x.0/24`.

Cloudflared subsequently recovered and tunnel `nabla-truescale` returned to **Healthy** with one connector.

## Application restart follow-up

A healthy Docker service does not imply that every application recovered. Current failure classes include:

- global CPU-availability failures where app Compose definitions request more CPUs than Docker currently reports available;
- application-specific data migrations, such as Bichon legacy storage requiring `bichon-admin` migration before v2.x can start;
- removed or inaccessible container images, such as the configured ClickHouse exporter image;
- normal dependency-order failures where an upstream database/proxy is still stopped.

Use the TrueNAS `app.query` API/runtime inventory as the source of truth for installed app state, then restart infrastructure dependencies before leaf applications. Do not repeatedly restart apps whose logs show a deterministic migration or image error; remediate those errors first.

## Planned network hardening

The following changes are intentionally deferred until FastAPI Cloud → TrueNAS API access is fully validated:

- [ ] Remove or replace the broad pfSense WAN rule `Easy Rule: Passed from Firewall Log View` with explicit least-privilege rules, including a dedicated TCP/7000 rule for the HAProxy frontend.
- [ ] Confirm whether HAProxy-to-TrueNAS mTLS is actually required. If it is not, remove the backend client-certificate directive `crt /var/etc/haproxy/server_clientcert_638a386ebea01.pem`.
- [ ] Enable detailed HAProxy HTTP logging for the TrueNAS frontend while avoiding capture of `Authorization`, cookies, API keys, or other credentials.
- [ ] Configure an explicit HAProxy tunnel timeout suitable for TrueNAS WebSocket/API sessions.
- [ ] Re-enable CrowdSec, pfBlockerNG and Snort sequentially after the physical link and gateway monitoring remain stable.
- [ ] Keep the public health check lightweight and distinct from authenticated API/WebSocket validation.
- [ ] Keep TrueNAS SSH on TCP/9922 reachable from trusted LAN administration hosts only; it must remain unreachable from the public Internet.
- [ ] Make LAN DNS resilient to loss of the TrueNAS Apps service before making Pi-hole authoritative again.
- [ ] Identify the physical peer/cable/path represented by pfSense `e6000sw0port2` and eliminate repeated DOWN/UP events.

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
