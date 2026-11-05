import styles from "./page.module.css";

/**
 * Public education only. Explain the device before discussing any personal setup.
 * No live inventory, secret, serial number, certificate subject or security claim.
 */
export default function YubiKeyIntroduction({ locale }: { locale: "fr" | "en" }) {
  const fr = locale === "fr";
  const benefit = fr
    ? [
        { title: "Contre le phishing", body: "Avec FIDO2/WebAuthn, la clé vérifie le site auquel vous vous connectez : une copie frauduleuse ne peut pas utiliser votre connexion de la même façon." },
        { title: "Un secret qui reste sur la clé", body: "Pour FIDO2 et les clés PIV générées sur l’appareil, la clé privée n’a pas besoin de quitter la YubiKey." },
        { title: "Une protection pratique", body: "Selon le service : insérer la clé ou l’approcher en NFC, puis toucher le capteur et éventuellement saisir un PIN." },
        { title: "Un secours indépendant", body: "Enregistrer une seconde clé dès le départ évite de dépendre d’un seul objet en cas de perte ou de panne." },
      ]
    : [
        { title: "Phishing-resistant sign-in", body: "With FIDO2/WebAuthn, the key checks the website you sign in to, so a fake lookalike site cannot reuse the sign-in in the same way." },
        { title: "Private secrets stay on the key", body: "For FIDO2 and PIV keys generated on the device, the private key need not leave the YubiKey." },
        { title: "Convenient protection", body: "Depending on the service, plug it in or use NFC, touch the sensor and sometimes enter a PIN." },
        { title: "Independent recovery", body: "Registering a second key ahead of time avoids relying on a single device if one is lost or broken." },
      ];
  const paths = fr
    ? [
        { title: "Je découvre les clés de sécurité", body: "Comprendre comment protéger un compte en ligne avec FIDO2, sans certificat ni infrastructure PKI.", href: "#yubikey-use-cases", cta: "Voir des exemples" },
        { title: "Je configure mes deux YubiKey", body: "Voir l’inventaire connu, les tests, les sauvegardes et les procédures propres à cet environnement.", href: "#yubikey-manual", cta: "Voir la configuration" },
        { title: "J’étudie une architecture d’entreprise", body: "Explorer PIV, les certificats X.509, Entra CBA, Vault PKI et les choix par profil.", href: "#yubikey-piv-entra", cta: "Lire la partie experte" },
      ]
    : [
        { title: "I am new to security keys", body: "Learn how to secure an online account with FIDO2, without certificates or a PKI.", href: "#yubikey-use-cases", cta: "See examples" },
        { title: "I configure my two YubiKeys", body: "Review known inventory, checks, backups and recovery procedures for this environment.", href: "#yubikey-manual", cta: "See my setup" },
        { title: "I design enterprise authentication", body: "Explore PIV, X.509 certificates, Entra CBA, Vault PKI and role-based choices.", href: "#yubikey-piv-entra", cta: "Read expert guidance" },
      ];
  return (
    <section id="yubikey-introduction" className={styles.section} aria-labelledby="yubikey-introduction-title">
      <p className={styles.eyebrow}>{fr ? "Comprendre en 60 secondes" : "Understand in 60 seconds"}</p>
      <h2 id="yubikey-introduction-title">{fr ? "Une YubiKey, c’est quoi ?" : "What is a YubiKey?"}</h2>
      <p>
        {fr
          ? "Une YubiKey est une petite clé de sécurité physique, généralement USB et parfois NFC. Elle ajoute une preuve que vous possédez réellement la clé lorsque vous vous connectez à un compte. Sur les services compatibles, elle peut remplacer les codes SMS et même le mot de passe."
          : "A YubiKey is a small physical security key, usually USB and sometimes NFC. It proves you actually have the key when you sign in to an account. On compatible services it can replace SMS codes and even the password."}
      </p>
      <div className={styles.stepGrid}>
        {benefit.map((item, index) => (
          <article className={styles.step} key={item.title}>
            <div className={styles.stepHead}>
              <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
      <h3>{fr ? "Comment ça marche, concrètement ?" : "How does it work in practice?"}</h3>
      <ol>
        <li>{fr ? "Enregistrez la YubiKey comme clé de sécurité dans les paramètres d’un compte compatible." : "Register the YubiKey as a security key in a supported account’s settings."}</li>
        <li>{fr ? "Lors de la connexion, choisissez « clé de sécurité » ou « passkey »." : "When signing in, choose security key or passkey."}</li>
        <li>{fr ? "Branchez ou approchez la clé, puis confirmez par contact et PIN si demandé." : "Plug in or tap the key, then confirm with touch and a PIN if requested."}</li>
      </ol>
      <p role="note">
        {fr
          ? "Important : une YubiKey n’est pas une sauvegarde universelle de mots de passe. Il faut que le service accepte la méthode choisie. Les fonctions FIDO2/WebAuthn, OTP, OpenPGP et PIV sont différentes : pour la plupart des comptes web, FIDO2 suffit, sans certificat X.509."
          : "Important: a YubiKey is not a universal password backup. The service must support the selected method. FIDO2/WebAuthn, OTP, OpenPGP and PIV are different features: for most web accounts, FIDO2 is enough and no X.509 certificate is needed."}
      </p>
      <h3>{fr ? "Choisir son niveau de lecture" : "Choose your reading path"}</h3>
      <div className={styles.stepGrid}>
        {paths.map((item) => (
          <article className={styles.step} key={item.href}>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
            <p><a href={item.href}>{item.cta}</a></p>
          </article>
        ))}
      </div>
    </section>
  );
}
