# pfSense security services incident — 28 August 2026

## Scope

This note records the pfSense stability and security-service findings observed while recovering CrowdSec, pfBlockerNG and Snort after the LAN/link incident. It separates confirmed root causes from mitigations and deferred follow-up.

## Network baseline after recovery

The base pfSense dataplane was healthy before continuing security-service work:

- no new `e6000sw0port2` link-down events were observed during the validation window;
- WANGW monitoring had been moved to `1.1.1.1` to separate Internet reachability from the Free next-hop gateway;
- `netstat -m` reported zero denied/delayed mbuf allocations;
- `net.inet.ip.intr_queue_drops=0`;
- VLAN interfaces had no RX/TX errors or collisions;
- PF state count was around 1.6k, far below the configured state limit;
- PF table-entry limit remained `400000`.

CrowdSec, pfBlockerNG and Snort were then re-enabled sequentially.

## CrowdSec pressure

CrowdSec was initially the largest persistent CPU consumer. Metrics showed that pfSense was parsing a very noisy `/var/log/filter.log` stream and the `firewallservices/pf-scan-multi_ports` scenario repeatedly emitted backpressure warnings with millions of failed event-send attempts.

The pfSense CrowdSec firewall bouncer itself was healthy and inexpensive:

- `pfsense-firewall` was valid and polling the Local API;
- roughly 23k community/CAPI decisions were active;
- the PF `crowdsec_blacklists` table contained roughly 23k IPv4 entries.

### Mitigation applied

The CrowdSec **Log Processor** was disabled on pfSense while keeping the remediation/bouncer path active. This reduced the local parsing/scenario load while retaining application of community decisions to PF.

This is a temporary architecture state. Local log-based detections on pfSense are reduced until the Security Engine runs elsewhere.

### Target architecture

The intended target is:

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

The corresponding deployment work is tracked in `AlbanAndrieu/nabla-compose` PR #59.

## pfBlockerNG ASN failure loop

A PHP fatal error occurred while pfBlockerNG was running an ASN job:

```text
Allowed memory size of 134217728 bytes exhausted
(tried to allocate 124537992 bytes)
/usr/local/pkg/pfblockerng/pfblockerng.inc
file_get_contents()
```

The configured PHP limit was confirmed as `128M`.

Subsequent diagnostics confirmed that the failure was not a generic PF-table exhaustion problem. The pfBlockerNG IP tables remained loaded and PF itself was healthy. The fault was specifically in ASN enrichment/reporting.

### Confirmed root cause

pfBlockerNG repeatedly launched:

```text
pfblockerng.php asn
pfblockerng.sh iptoasn <IP>
```

and `extras.log` accumulated repeated entries such as:

```text
Downloading [ IPinfo databases ]
```

The associated error was explicit and repeated:

```text
ASN Token not defined. Terminating Download.
Database ASN [ asn.mmdb ] not found. Register for IPinfo Token.
```

Current pfBlockerNG code attempts to download the IPinfo ASN database on first ASN lookup when `/usr/local/share/GeoIP/asn.mmdb` is absent. Because no IPinfo ASN token is configured, the database is never created. Each subsequent `iptoasn` lookup can therefore trigger another failed download attempt.

This created a retry loop which contributed CPU load, log growth and the observed PHP OOM.

### Mitigation applied

**ASN Reporting was disabled.** This does not disable pfBlockerNG enforcement:

- IP feeds still populate native PF aliases/tables;
- GeoIP country/continent policy still operates independently;
- DNSBL still filters through Unbound;
- existing `pfB_*` firewall tables remain active.

ASN reporting is enrichment for reports/alerts (mapping an IP to an Autonomous System/organisation), not the primary enforcement path.

However this mitigation is **not yet a complete fix**. `iptoasn` calls were still observed after disabling ASN Reporting, which means another report/log-enrichment path can still request ASN conversion. Do not raise PHP `memory_limit` merely to hide this loop.

The low-priority follow-up is to remove/disable the remaining ASN enrichment path cleanly, or fix the upstream/package configuration so an absent ASN token/database cannot cause repeated downloads.

## pfBlockerNG log volume

pfBlockerNG logs were found to be unusually large, including approximately:

```text
dns_reply.log   ~580 MB
unified.log     ~635 MB
ip_block.log     ~56 MB
error.log        ~37 MB
extras.log       ~16 MB
```

The configured log limits were already set to about 10,000 lines, so they must **not** be increased. The large files are historical/current artifacts and also make broad `grep /var/log/pfblockerng/*` diagnostics expensive.

Use targeted log inspection instead, for example:

```sh
tail -100 /var/log/pfblockerng/error.log
tail -100 /var/log/pfblockerng/extras.log
```

Follow up later on rotation/retention behaviour and truncate/archive oversized historical logs only with an explicit rollback/retention decision.

## PF tables observed

Important dynamic tables remained healthy:

```text
crowdsec_blacklists  ~22.9k entries
snort2c              3 entries
```

pfBlockerNG tables included:

```text
pfB_Antarctica_v4
pfB_Antarctica_v6
pfB_Asia_v4
pfB_Asia_v6
pfB_BlockListDE_v4
pfB_PRI1_v4
pfB_PRI2_v4
pfB_PRI3_v4
```

The existence of these tables confirms that disabling ASN Reporting does not remove the underlying IP-blocking policy.

## AutoConfigBackup

AutoConfigBackup previously reported curl error `(28)` while the WAN/LAN path was unstable. After network recovery:

- `acb.netgate.com` resolved successfully;
- TCP/443 and TLS negotiation succeeded;
- the Netgate certificate validated;
- the GUI reported `Hosted backup count: 100`.

The historical `(28)` errors are therefore treated as transient network-timeout symptoms, not an active ACB failure.

A local/exported pfSense configuration backup was also taken before continuing firewall/security-service changes.

## `write_config()` warning

pfSense logged:

```text
WARNING: write_config() was called without description
```

AutoConfigBackup subsequently recorded `/pkg_edit.php made unknown change` at approximately the same time as the CrowdSec package setting change. This is treated as package/UI audit metadata quality rather than evidence of `config.xml` corruption.

## Remaining security hardening

The higher-priority security work remains to replace the broad WAN rule:

```text
Easy Rule: Passed from Firewall Log View
```

with explicit least-privilege WAN policy. In particular, the pfSense webConfigurator must not be reachable from the public Internet; only explicitly published services such as the HAProxy TrueNAS frontend should remain exposed.

The ASN cleanup is intentionally lower priority than this WAN-rule hardening because ASN enrichment is optional and enforcement remains active without it.
