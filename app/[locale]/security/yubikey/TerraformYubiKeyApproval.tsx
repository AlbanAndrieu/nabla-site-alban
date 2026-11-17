/** Public, static guide to plan-bound SSH-FIDO2 approval; never asks for PINs or secrets. */
import type { AppLocale } from "@/i18n/routing";
import styles from "./page.module.css";

const content = {
  fr: {
    title: "Approuver un plan Terraform avec une YubiKey",
    intro:
      "Une signature SSH-FIDO2 permet d’autoriser un plan précis depuis le poste de travail, sans transférer la clé privée vers GitHub Actions. Ce n’est pas une authentification Entra ID ni un certificat PIV.",
    steps: [
      {
        title: "1. La CI prépare le plan",
        description:
          "Le runner GitHub éphémère calcule un plan OpenTofu et contrôle les ressources autorisées. Seul un manifeste expurgé est publié : dépôt, commit SHA, tenant Entra personnel, workspace HCP, opérations, empreinte SHA-256, identifiant du run et expiration.",
      },
      {
        title: "2. Examiner avant de signer",
        description:
          "Sur la workstation, récupérer le manifeste et comparer le SHA, le tenant et la liste des changements à l’intention réelle. L’empreinte lie la signature aux valeurs du plan ; le manifeste ne dévoile pas tout le détail des changements.",
      },
      {
        title: "3. Toucher la YubiKey",
        description:
          "La commande ssh-keygen -Y sign utilise une clé SSH ed25519-sk FIDO2 déjà enrôlée. Le contact physique, et le PIN selon la politique de la clé, autorisent la signature. Aucune clé privée n’est transmise.",
      },
      {
        title: "4. La CI vérifie et applique",
        description:
          "Un job sans identifiants HCP/Entra vérifie la signature, la clé publique autorisée, le contexte et l’expiration (90 minutes). Le job privilégié recalcule le plan sous verrou HCP et refuse toute différence avant d’appliquer le même plan enregistré.",
      },
    ],
    commandTitle: "Exemple de signature manuelle (aucun apply)",
    notesTitle: "Limites et protections complémentaires",
    notes: [
      "L’approbation matérielle ne protège pas un apply direct avec des comptes HCP/Graph privilégiés ; limiter ces accès et protéger les environnements GitHub reste indispensable.",
      "La correspondance repose sur l’empreinte canonique des changements, et non sur un fichier binaire identique entre deux runs.",
      "Une signature expirée, un changement de tenant ou de plan doit imposer une nouvelle validation ; aucun apply automatique n’est lancé depuis la workstation.",
    ],
    status: "Préparé dans une PR Draft ; signature matérielle et exécution cloud non vérifiées.",
    implementation: "Voir la PR d’implémentation et les tests de refus",
    source: "Référence OpenSSH : signatures SSH",
  },
  en: {
    title: "Approve a Terraform plan using a YubiKey",
    intro:
      "An SSH-FIDO2 signature approves a specific plan from the workstation without transferring the private key to GitHub Actions. This is not Entra ID authentication or a PIV certificate.",
    steps: [
      {
        title: "1. CI prepares the plan",
        description:
          "An ephemeral GitHub-hosted runner computes an OpenTofu plan and checks allowed changes. Only a sanitized manifest is published: repository, commit SHA, personal Entra tenant, HCP workspace, actions, SHA-256 fingerprint, run ID and expiration.",
      },
      {
        title: "2. Review before signing",
        description:
          "On the workstation, download the manifest and compare SHA, tenant and proposed changes against the intended operation. The hash binds approval to plan values, but the manifest does not reveal every detail of the changes.",
      },
      {
        title: "3. Touch the YubiKey",
        description:
          "ssh-keygen -Y sign uses an enrolled SSH ed25519-sk FIDO2 key. Physical touch, and PIN when configured, authorize the signature. No private key is exported.",
      },
      {
        title: "4. CI verifies and applies",
        description:
          "A job with no HCP/Entra credentials verifies the signature, registered public key, context and 90-minute expiry. The privileged job recomputes the plan with HCP state locking and rejects any mismatch before applying that same saved plan.",
      },
    ],
    commandTitle: "Manual signature example (does not apply)",
    notesTitle: "Limitations and additional protections",
    notes: [
      "Hardware approval does not stop direct applies by accounts already privileged in HCP/Graph. Restrict those identities and protect GitHub environments.",
      "The comparison uses a canonical fingerprint of changes, not the same binary plan file across different runs.",
      "A changed tenant, altered plan or expired signature requires a new approval; the workstation never runs apply automatically.",
    ],
    status: "Prepared in a Draft PR; no live hardware signature or cloud apply verified.",
    implementation: "Implementation PR and negative security tests",
    source: "OpenSSH reference: SSH signatures",
  },
} as const;

export default function TerraformYubiKeyApproval({
  locale,
}: Readonly<{ locale: AppLocale }>) {
  const copy = content[locale];
  return (
    <section
      id="yubikey-terraform-approval"
      className={styles.section}
      aria-labelledby="yubikey-terraform-approval-title"
    >
      <h2 id="yubikey-terraform-approval-title">{copy.title}</h2>
      <p>{copy.intro}</p>
      <ol className={styles.stepGrid}>
        {copy.steps.map((step) => (
          <li className={styles.step} key={step.title}>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </li>
        ))}
      </ol>
      <details>
        <summary>{copy.commandTitle}</summary>
        <pre className={styles.command} tabIndex={0}>
          <code>{"ssh-keygen -Y sign -n nabla-entra-apply -f ~/.ssh/<fido2-key> challenge.json"}</code>
        </pre>
      </details>
      <h3>{copy.notesTitle}</h3>
      <ul className={styles.safetyList}>
        {copy.notes.map((note) => <li key={note}>{note}</li>)}
      </ul>
      <p role="note">{copy.status}</p>
      <p className={styles.sources}>
        <a href="https://github.com/AlbanAndrieu/nabla-compose/pull/410" target="_blank" rel="noopener noreferrer">{copy.implementation}</a>
        {" · "}
        <a href="https://man.openbsd.org/ssh-keygen.1" target="_blank" rel="noopener noreferrer">{copy.source}</a>
      </p>
    </section>
  );
}
