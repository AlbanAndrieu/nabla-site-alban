# Zero Trust Kubernetes security strategy

The public security page presents this strategy as an implementation posture, not as a claim that every control is already enforced.

## Target posture

Use the **most restrictive configuration that remains functional**. Normal application workloads should converge on Kubernetes Pod Security Standards `Restricted`; exceptions that genuinely need node-level privilege must stay isolated in dedicated infrastructure namespaces with explicit RBAC and documented justification.

Live implementation context: <https://www.albanandrieu.com/en/truenas#homelab>

Practical Kubernetes hardening reference: <https://blog.stephane-robert.info/docs/securiser/kubernetes/>

## Security First ordering

1. **Trust root and control plane** — retain Talos' minimal/immutable operating model; continuously verify PKI/mTLS, API-server and kubelet authentication, etcd protections, Secret encryption-at-rest, certificate rotation and audit logging.
2. **Identity before network reachability** — minimize human and workload RBAC, separate human/CI/observer/workload identities, disable automatic ServiceAccount token mounting unless required, and avoid long-lived broad credentials.
3. **PSS/PSA Restricted for applications** — make `Restricted` the default target for normal workloads. Treat `Baseline` as a migration floor, not the final objective. Keep CSI/CNI/runtime-security privilege exceptions namespace-scoped.
4. **Default-deny networking** — prove the CNI actually enforces NetworkPolicy before enabling default-deny ingress and egress. Add only explicit DNS, ingress, storage, observability, database and required external API flows.
5. **Secrets and workload identity** — reduce static credentials, centralize secret lifecycle/rotation and avoid exposing infrastructure credentials to ordinary application Pods.
6. **Policy as code** — evaluate Kyverno first for Kubernetes-native policy/reporting/image-verification workflows. Keep OPA Gatekeeper as the alternative when reusable Rego/OPA policy is a stronger requirement. Start in audit/report mode before enforcing new policies.
7. **Supply-chain integrity** — generate SBOMs, scan images/dependencies/IaC, prefer immutable image digests, sign artifacts with Sigstore/Cosign and add admission-time provenance/signature verification after the policy layer is stable.
8. **Runtime and network detection** — use Falco for high-signal runtime/syscall/container detections. If Cilium is selected after the current network/storage baseline is stable, evaluate Hubble for flow observability and Tetragon for eBPF runtime visibility/selective enforcement.
9. **Continuous assurance** — correlate Kubernetes audit/admission/runtime/network events with Prometheus/Grafana and the existing SIEM/observability path; keep the controls covered by deterministic CI and runtime regression tests.

## Prevent, detect, observe

```text
Prevent
  Talos hardening + RBAC + PSA/PSS + NetworkPolicy + Kyverno/Gatekeeper
                              |
                              v
Detect
  Falco / Tetragon + Kubernetes audit/admission events
                              |
                              v
Observe and respond
  Hubble + Prometheus/Grafana + Graylog/Wazuh
```

Falco is deliberately not described as a replacement for NetworkPolicy: it is primarily a runtime detection layer. Likewise, a `NetworkPolicy` object is not a security control until the selected CNI is proven to enforce it.

## Acceptance principles

- no implicit public exposure for generic workloads;
- no automatic ServiceAccount API credentials without a demonstrated need;
- no privileged exception without an owner, namespace boundary and reason;
- no move from audit/warn to enforce without proving application compatibility;
- no default-deny rollout without explicit allow paths and a recovery route;
- no security scanner or policy engine added solely for tool count: each component must close a documented capability gap and produce actionable evidence.
