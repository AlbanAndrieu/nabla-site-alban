# pfSense security services incident — 28 August 2026

Status: mitigated; remaining network/security follow-up is tracked in
`docs/homelab-roadmap.md`.

## Scope

This note records the pfSense stability and security-service findings observed
while recovering CrowdSec, pfBlockerNG and Snort after the LAN/link incident. It
keeps only evidence that remains useful for diagnosing a recurrence.

## LAN/link-layer context

Repeated `e6000sw0port2` DOWN/UP events were observed before recovery, with
individual outages lasting from a few seconds to roughly 24 seconds. A grouped
port cycle occurred during a broader pfSense interface reinitialization, but later
isolated port flaps remained the stronger signal for an intermittent physical/L2
fault.

The important diagnostic ordering is:

- a fresh `link state changed to DOWN` event is below DNS, HAProxy, DHCP,
  dpinger and application health and therefore points first to cable/port/peer,
  PHY negotiation or driver/hardware state;
- `dpinger: WANGW 82.66.4.254: sendto error: 13` is a correlated symptom, not
  evidence that dpinger itself is the root cause;
- an earlier Unbound `SO_SNDBUF ... No buffer space available` warning was not
  corroborated by later mbuf inspection: `netstat -m` showed zero denied or
  delayed mbuf allocations, so persistent mbuf starvation was not retained as
  the primary explanation;
- when DHCP exposed only the TrueNAS-hosted resolver and TrueNAS/Docker was down,
  clients could retain Wi-Fi/IP routing while DNS failed. This led to the
  requirement that pfSense/Unbound remain an independent LAN resolver.

The current topology, commands and addressing belong in
`docs/truenas-fastapi-cloud-network.md`.

## Network baseline after recovery

The base pfSense dataplane was healthy before continuing security-service work:

- no new `e6000sw0port2` link-down events were observed during the validation window;
- WANGW monitoring had been moved to `1.1.1.1` to separate Internet reachability
  from the Free next-hop gateway;
- `netstat -m` reported zero denied/delayed mbuf allocations;
- `net.inet.ip.intr_queue_drops=0`;
- VLAN interfaces had no RX/TX errors or collisions;
- PF state count was around 1.6k, far below the configured state limit;
- PF table-entry limit remained `400000`.

CrowdSec, pfBlockerNG and Snort were then re-enabled sequentially.

## CrowdSec pressure

CrowdSec was initially the largest persistent CPU consumer. Metrics showed that
pfSense was parsing a very noisy `/var/log/filter.log` stream and the
`firewallservices/pf-scan-multi_ports` scenario repeatedly emitted backpressure
warnings with millions of failed event-send attempts.

The pfSense CrowdSec firewall bouncer itself was healthy and inexpensive:

- `pfsense-firewall` was valid and polling the Local API;
- roughly 23k community/CAPI decisions were active;
- the PF `crowdsec_blacklists` table contained roughly 23k IPv4 entries.

### Mitigation applied

The CrowdSec **Log Processor** was disabled on pfSense while keeping the
remediation/bouncer path active. This reduced local parsing/scenario load while
retaining application of community decisions to PF.

This is a temporary architecture state. Local log-based detections on pfSense are
reduced until the Security Engine runs elsewhere.

### Target architecture

```text
pfSense logs + Suricata events
            |
            v
CrowdSec Security Engine + LAPI on TrueNAS
            |
            | trusted LAN only
            v
pfSense remediation / firewall bouncer
            |
            v
PF block tables
```

The corresponding deployment work is tracked in
`AlbanAndrieu/nabla-compose` PR #59.

## pfBlockerNG ASN failure loop

A PHP fatal error occurred while pfBlockerNG was running an ASN job:

```text
Allowed memory size of 134217728 bytes exhausted
(tried to allocate 124537992 bytes)
/usr/local/pkg/pfblockerng/pfblockerng.inc
file_get_contents()
```

The configured PHP limit was `128M`. PF tables remained loaded and PF itself
was healthy, so the failure was isolated to ASN enrichment/reporting rather than
generic PF-table exhaustion.

### Confirmed root cause

pfBlockerNG repeatedly launched:

```text
pfblockerng.php asn
pfblockerng.sh iptoasn <IP>
```

while `extras.log` repeatedly attempted:

```text
Downloading [ IPinfo databases ]
```

with:

```text
ASN Token not defined. Terminating Download.
Database ASN [ asn.mmdb ] not found. Register for IPinfo Token.
```

Without an IPinfo ASN token, `asn.mmdb` was never created. Subsequent
`iptoasn` lookups could therefore trigger another failed download, contributing
CPU load, log growth and the observed PHP OOM.

### Mitigation applied

**ASN Reporting was disabled.** Enforcement remained active through PF aliases,
GeoIP policy, DNSBL and existing `pfB_*` tables.

This mitigation is incomplete: `iptoasn` calls were still observed afterwards,
so another enrichment path can still request ASN conversion. Do not increase PHP
`memory_limit` to hide the loop. The remaining cleanup is tracked in the homelab
roadmap.

## pfBlockerNG log volume

Large historical logs included approximately:

```text
dns_reply.log   ~580 MB
unified.log     ~635 MB
ip_block.log     ~56 MB
error.log        ~37 MB
extras.log       ~16 MB
```

Configured limits were already around 10,000 lines and must not be increased.
Prefer targeted inspection:

```sh
tail -100 /var/log/pfblockerng/error.log
tail -100 /var/log/pfblockerng/extras.log
```

Rotation/retention cleanup remains open in the homelab roadmap.

## PF tables observed

Important dynamic tables remained healthy:

```text
crowdsec_blacklists  ~22.9k entries
snort2c              3 entries
```

pfBlockerNG tables included `pfB_Antarctica_v4/v6`, `pfB_Asia_v4/v6`,
`pfB_BlockListDE_v4` and `pfB_PRI1_v4` through `pfB_PRI3_v4`. Their
presence confirmed that disabling ASN Reporting did not remove IP-blocking
policy.

## AutoConfigBackup and configuration audit

AutoConfigBackup had reported curl error `(28)` while WAN/LAN was unstable.
After network recovery, DNS, TCP/443, TLS and the Netgate certificate succeeded,
and the GUI reported `Hosted backup count: 100`. The earlier errors are treated
as transient network symptoms rather than an active ACB failure.

A local/exported pfSense configuration backup was also taken before continuing
security-service changes.

pfSense also logged:

```text
WARNING: write_config() was called without description
```

AutoConfigBackup recorded `/pkg_edit.php made unknown change` around the same
CrowdSec package change. This is treated as package/UI audit-metadata quality, not
evidence of `config.xml` corruption.

## Remaining ownership

No open checklist is maintained in this incident record. Current network,
least-privilege WAN, DNS resilience, ASN cleanup, log retention and rollback work
is owned by `docs/homelab-roadmap.md`.
