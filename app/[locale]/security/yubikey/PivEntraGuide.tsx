/** Conceptual public guide: no device inventory, employee identity or secrets. */
export default function PivEntraGuide({ locale }: { locale: string }) {
  const fr = locale === "fr";
  const slots = [
    ["9A", fr ? "Authentification utilisateur" : "User authentication", fr ? "Certificat X.509 pour smartcard/Entra CBA ; pas présent d’usine." : "X.509 certificate for smartcard/Entra CBA; not factory-provisioned."],
    ["9C", fr ? "Signature numérique" : "Digital signature", fr ? "Certificat de signature si provisionné ; pas automatiquement présent." : "Signing certificate when provisioned; not automatically present."],
    ["9D", fr ? "Gestion des clés / déchiffrement" : "Key management / decryption", fr ? "Prévoir une stratégie de récupération avant usage." : "Plan recovery before use."],
    ["9E", fr ? "Authentification de carte" : "Card authentication", fr ? "Ne constitue pas automatiquement une identité Entra CBA." : "Not automatically an Entra CBA identity."],
    ["82–95", fr ? "Clés de gestion retirées" : "Retired key management", fr ? "Historique de clés de chiffrement, non des slots de connexion interchangeables." : "Encryption key history, not interchangeable login identities."],
    ["F9", fr ? "Attestation fabricant" : "Manufacturer attestation", fr ? "Certificat d’attestation Yubico d’usine ; ne prouve pas l’identité professionnelle." : "Factory Yubico attestation certificate; not a workplace identity."],
    ["9B", fr ? "Clé d’administration PIV" : "PIV management key", fr ? "Secret d’administration ; ce n’est pas un certificat X.509." : "Administration secret, not an X.509 certificate."],
  ];
  const stages = fr
    ? ["1. Vérifier l’identité et approuver l’enrôlement", "2. Générer la clé privée dans le slot 9A de la YubiKey", "3. Produire une CSR contenant la clé publique", "4. Signer la CSR via la CA émettrice (Vault PKI ou PKI entreprise)", "5. Importer le certificat public sans remplacer une clé existante", "6. Configurer la confiance CA, la liaison forte utilisateur et Entra CBA", "7. Tester la connexion, la politique Conditional Access et la révocation", "8. Renouveler avant expiration, révoquer en cas de perte ou départ"]
    : ["1. Verify identity and approve enrollment", "2. Generate a private key in YubiKey slot 9A", "3. Generate a CSR containing the public key", "4. Sign the CSR using an issuing CA (Vault PKI or corporate PKI)", "5. Import the public certificate without replacing an existing key", "6. Configure CA trust, strong user binding and Entra CBA", "7. Test sign-in, Conditional Access and revocation", "8. Renew before expiry; revoke on loss or departure"];
  const profiles = fr
    ? [["Administrateurs / comptes privilégiés", "FIDO2 matériel prioritaire ; CBA si exigence de smartcard/PKI."],["Collaborateurs", "Passkeys, Windows Hello for Business ou Platform SSO sur Mac ; CBA uniquement si besoin métier."],["Prestataires B2B", "MFA du tenant d’origine via Cross-Tenant Access / trust, sous politique entreprise."],["Équipes signature ou chiffrement", "PIV avec certificats 9C/9D adaptés, CA et récupération documentées."],["Utilisateurs de services WebAuthn", "YubiKey FIDO2 seule : aucun certificat PIV n’est nécessaire."]]
    : [["Administrators / privileged accounts", "Hardware FIDO2 first; CBA only when smartcard/PKI is required."],["Employees", "Passkeys, Windows Hello for Business or Mac Platform SSO; CBA only when needed."],["B2B contractors", "Home-tenant MFA with Cross-Tenant Access trust and corporate policy."],["Signing / encryption teams", "PIV 9C/9D certificates with defined CA and recovery process."],["WebAuthn service users", "YubiKey FIDO2 alone: no PIV certificate needed."]];
  const terms = [
    ["PIV", "Personal Identity Verification", fr ? "Application carte à puce de la YubiKey." : "YubiKey smartcard application."],
    ["CBA", "Certificate-Based Authentication", fr ? "Authentification par certificat X.509." : "X.509 certificate-based authentication."],
    ["PKI", "Public Key Infrastructure", fr ? "Infrastructure de confiance et de gestion des certificats." : "Certificate trust and lifecycle infrastructure."],
    ["CA", "Certificate Authority", fr ? "Autorité signataire des certificats." : "Authority that signs certificates."],
    ["CSR", "Certificate Signing Request", fr ? "Demande de signature contenant une clé publique." : "Signing request containing a public key."],
    ["CRL", "Certificate Revocation List", fr ? "Liste des certificats révoqués publiée par la CA." : "CA-published revoked certificate list."],
    ["X.509", "Certificate standard", fr ? "Format des certificats d’identité." : "Identity certificate format."],
    ["FIDO2", "Fast Identity Online 2", fr ? "Authentification par clé publique résistante au phishing." : "Phishing-resistant public-key authentication."],
    ["WebAuthn", "Web Authentication", fr ? "API web utilisée par les passkeys et clés FIDO2." : "Web API for passkeys and FIDO2 security keys."],
    ["EKU", "Extended Key Usage", fr ? "Usages autorisés d’un certificat, par exemple Client Authentication." : "Allowed certificate uses, e.g. Client Authentication."],
    ["SAN", "Subject Alternative Name", fr ? "Identifiants supplémentaires du certificat." : "Additional identities in the certificate."],
    ["UPN", "User Principal Name", fr ? "Identifiant de compte Microsoft Entra." : "Microsoft Entra account identifier."],
    ["MFA", "Multi-Factor Authentication", fr ? "Authentification à plusieurs facteurs." : "Multiple-factor authentication."],
    ["SSO", "Single Sign-On", fr ? "Authentification unique entre applications." : "Single sign-on across applications."],
  ];
  const itemStyle = { padding: "0.85rem", border: "1px solid currentColor", borderRadius: "0.65rem" };
  return <section id="yubikey-piv-entra" aria-labelledby="yubikey-piv-entra-heading" style={{ marginBlock: "2.5rem" }}>
    <h2 id="yubikey-piv-entra-heading">{fr ? "PIV et Microsoft Entra ID : guide de décision" : "PIV and Microsoft Entra ID: decision guide"}</h2>
    <p>{fr ? "Une YubiKey 5 dispose de slots PIV, mais les certificats d’identité 9A/9C/9D/9E ne sont pas automatiquement préinstallés. Le certificat d’attestation d’usine n’est pas un certificat de connexion Entra ID." : "A YubiKey 5 has PIV slots, but identity certificates in 9A/9C/9D/9E are not automatically preinstalled. The factory attestation certificate is not an Entra ID login certificate."}</p>
    <details><summary>{fr ? "Architecture des slots PIV d’une YubiKey 5" : "YubiKey 5 PIV slot architecture"}</summary>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.8rem", marginBlock: "1rem" }}>
        {slots.map(([id, name, description]) => <article key={id} style={itemStyle}><h3>{id} — {name}</h3><p>{description}</p></article>)}
      </div>
      <p>{fr ? "Les slots PIV sont indépendants des deux slots OTP physiques. PIN, PUK et clé d’administration sont partagés par l’application PIV ; plusieurs certificats ne signifient pas plusieurs environnements indépendants." : "PIV slots are separate from the two physical OTP slots. PIN, PUK and management key are shared by the PIV application; multiple certificates do not mean independent environments."}</p>
    </details>
    <details><summary>{fr ? "Comment fonctionne Microsoft Entra CBA ?" : "How does Microsoft Entra CBA work?"}</summary>
      <p>{fr ? "Le navigateur ou système négocie une authentification par certificat ; la YubiKey prouve la possession de sa clé privée sans la divulguer. Entra vérifie la chaîne CA approuvée, la validité, la révocation (CRL) et le rattachement du certificat au compte ; Conditional Access décide ensuite de l’accès. CBA n’est pas automatiquement MFA : configurer les règles de liaison forte et la politique d’authentification." : "The browser or operating system performs certificate authentication; YubiKey proves possession of its private key without exposing it. Entra validates CA trust, expiry, CRL revocation and user mapping; Conditional Access then determines access. CBA is not automatically MFA: configure strong mapping and authentication policy."}</p>
      <p>{fr ? "Un simple module PIV sans certificat X.509 d’identité ne suffit pas à Entra CBA. En revanche, FIDO2/WebAuthn fonctionne sans certificat PIV personnel." : "A PIV applet without an X.509 identity certificate is insufficient for Entra CBA. FIDO2/WebAuthn works without a personal PIV certificate."}</p>
    </details>
    <details><summary>{fr ? "Cycle de vie d’un certificat 9A avec Entra CBA" : "Lifecycle of a 9A certificate with Entra CBA"}</summary>
      <ol>{stages.map(stage => <li key={stage}>{stage}</li>)}</ol>
      <p>{fr ? "La CA professionnelle doit rester administrée par l’entreprise. Vault PKI personnel ne doit pas être ajouté comme CA de confiance au tenant sans décision IAM formelle. La clé privée reste dans la YubiKey." : "The corporate CA must remain governed by the company. Do not add a personal Vault PKI CA to the tenant trust list without formal IAM approval. The private key stays on YubiKey."}</p>
    </details>
    <h3>{fr ? "Faut-il vraiment déployer CBA en entreprise ?" : "Should an enterprise deploy CBA?"}</h3>
    <p>{fr ? "Pas uniquement pour obtenir une MFA résistante au phishing : FIDO2 est plus simple à exploiter. CBA devient pertinent en présence d’une PKI existante, de smartcards, d’applications legacy, ou d’exigences de certificats et de conformité. Il faut alors exploiter l’émission, le renouvellement, les CRL, la récupération et le support utilisateur." : "Not solely for phishing-resistant MFA: FIDO2 is simpler to operate. CBA makes sense with an existing PKI, smartcards, legacy applications or certificate/compliance requirements. It entails issuance, renewal, CRLs, recovery and user support."}</p>
    <div style={{ display: "grid", gap: "0.7rem", marginBlock: "1rem" }}>
      {profiles.map(([name, guidance]) => <article key={name} style={itemStyle}><h4>{name}</h4><p>{guidance}</p></article>)}
    </div>
    <details><summary>{fr ? "Acronymes et concepts" : "Acronyms and concepts"}</summary>
      <dl>{terms.map(([acronym, full, meaning]) => <div key={acronym} style={{ marginBlock: "0.65rem" }}><dt><strong>{acronym} — {full}</strong></dt><dd>{meaning}</dd></div>)}</dl>
    </details>
    <p>{fr ? "Documentation de référence :" : "Reference documentation:"} <a href="https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-certificate-based-authentication" target="_blank" rel="noopener noreferrer">Microsoft Entra CBA</a> · <a href="https://developers.yubico.com/PIV/Introduction/Certificate_slots.html" target="_blank" rel="noopener noreferrer">Yubico PIV</a> · <a href="https://developer.hashicorp.com/vault/docs/secrets/pki" target="_blank" rel="noopener noreferrer">Vault PKI</a></p>
  </section>;
}
