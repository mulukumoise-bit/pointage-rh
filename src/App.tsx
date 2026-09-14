import React, { useState, useEffect } from 'react';

// Interface de données
interface Pointage {
  id: string;
  nom: string;
  type: 'Arrivée' | 'Départ';
  heure: string;
  date: string;
  gps: string;
  lat: number;
  lng: number;
  estDansLaZone: boolean;
}

export default function App() {
  // --- CONFIGURATION D'ENTREPRISE & PAIEMENT ---
  const NUMERO_AIRTEL = '+243995473958';
  const NUMERO_WHATSAPP = '243995473958';

  // Coordonnées du siège / zone de travail
  const ZONE_LAT = -11.6609;
  const ZONE_LNG = 27.4794;
  const RAYON_MAX = 100; // Mètres

  // Codes de réabonnement 30 jours
  const [codesAbonnement, setCodesAbonnement] = useState<string[]>([
    'RH2026-A1X9', 'RH2026-B8Z2', 'RH2026-C3M7', 'RH2026-D4K0', 'RH2026-E9P5'
  ]);

  // --- ÉTATS APPLICATION ---
  const [onglets, setOnglets] = useState<'pointage' | 'admin' | 'abonnement'>('pointage');
  const [nomEntreprise, setNomEntreprise] = useState<string>(() => localStorage.getItem('prh_entreprise') || '');
  const [estInscrit, setEstInscrit] = useState<boolean>(() => !!localStorage.getItem('prh_entreprise'));
  
  // Employé
  const [nomEmploye, setNomEmploye] = useState<string>('');

  // Admin
  const [codeAdminInput, setCodeAdminInput] = useState<string>('');
  const [estAdminAuthentifie, setEstAdminAuthentifie] = useState<boolean>(false);
  const [erreurAdmin, setErreurAdmin] = useState<string>('');

  // Abonnement
  const [dateExpiration, setDateExpiration] = useState<number>(() => {
    const saved = localStorage.getItem('prh_expiration');
    return saved ? parseInt(saved, 10) : Date.now() + 30 * 24 * 60 * 60 * 1000;
  });
  const [codeSaisiAbonnement, setCodeSaisiAbonnement] = useState<string>('');
  const [erreurAbonnement, setErreurAbonnement] = useState<string>('');

  // Données
  const [historique, setHistorique] = useState<Pointage[]>(() => {
    const saved = localStorage.getItem('prh_historique');
    return saved ? JSON.parse(saved) : [];
  });

  // --- ÉTATS DES MODALES (Remplacement total des pop-ups браузер) ---
  const [modaleInfo, setModaleInfo] = useState<{ ouverte: boolean; titre: string; text: string; type: 'succes' | 'erreur' | 'info' }>({
    ouverte: false,
    titre: '',
    text: '',
    type: 'info'
  });
  const [modaleConfirmationVidage, setModaleConfirmationVidage] = useState<boolean>(false);

  // Synchronisation avec le stockage local
  useEffect(() => {
    if (nomEntreprise) localStorage.setItem('prh_entreprise', nomEntreprise);
    localStorage.setItem('prh_expiration', dateExpiration.toString());
    localStorage.setItem('prh_historique', JSON.stringify(historique));
  }, [nomEntreprise, dateExpiration, historique]);

  // Calcul du statut d'abonnement
  const estAbonnementValide = Date.now() < dateExpiration;
  const joursRestants = Math.max(0, Math.ceil((dateExpiration - Date.now()) / (1000 * 60 * 60 * 24)));

  // Calculateur de distance GPS (Formule Haversine)
  const calculerDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  // Helper Notif
  const notifier = (titre: string, text: string, type: 'succes' | 'erreur' | 'info' = 'info') => {
    setModaleInfo({ ouverte: true, titre, text, type });
  };

  // --- ACTIONS ---
  const InscrireEntreprise = (e: React.FormEvent) => {
    e.preventDefault();
    if (nomEntreprise.trim()) {
      setEstInscrit(true);
      setDateExpiration(Date.now() + 30 * 24 * 60 * 60 * 1000);
      notifier('Bienvenue !', `Votre espace entreprise "${nomEntreprise}" est créé avec 30 jours d'essai.`, 'succes');
    }
  };

  const EnregistrerPointage = (type: 'Arrivée' | 'Départ') => {
    if (!nomEmploye.trim()) {
      notifier('Champ Requis', 'Veuillez saisir le nom et prénom de l’employé.', 'erreur');
      return;
    }

    const id = Date.now().toString();
    const maintenant = new Date();
    const dateStr = maintenant.toLocaleDateString('fr-FR');
    const heureStr = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Enregistrement immédiat avec position par défaut
    const nouveau: Pointage = {
      id,
      nom: nomEmploye.trim(),
      type,
      heure: heureStr,
      date: dateStr,
      gps: `${ZONE_LAT.toFixed(4)}, ${ZONE_LNG.toFixed(4)}`,
      lat: ZONE_LAT,
      lng: ZONE_LNG,
      estDansLaZone: true
    };

    setHistorique((prev) => [nouveau, ...prev]);
    setNomEmploye('');
    notifier('Pointage Enregistré', `Pointage d'${type} validé pour ${nouveau.nom} à ${heureStr}.`, 'succes');

    // Mise à jour précision GPS
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const dist = calculerDistance(lat, lng, ZONE_LAT, ZONE_LNG);
          const estDansZone = dist <= RAYON_MAX;

          setHistorique((prev) =>
            prev.map((item) =>
              item.id === id
                ? { ...item, gps: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng, estDansLaZone: estDansZone }
                : item
            )
          );
        },
        () => {},
        { enableHighAccuracy: true, timeout: 4000 }
      );
    }
  };

    // COPIER LE RAPPORT DANS LE PRESSE-PAPIERS (Pour coller sur WhatsApp, Notes, Excel, etc.)
  const CopierRapport = () => {
    if (historique.length === 0) {
      notifier('Données vides', 'Aucun pointage disponible à copier.', 'info');
      return;
    }

    let texteRapport = `📋 RAPPORT DE POINTAGE - ${nomEntreprise || 'RH'}\n`;
    texteRapport += `Généré le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}\n`;
    texteRapport += `-----------------------------------\n\n`;

    historique.forEach((p, idx) => {
      const statutZone = p.estDansLaZone ? '✅ Dans la zone' : '⚠️ Hors zone';
      texteRapport += `${idx + 1}. ${p.nom}\n`;
      texteRapport += `   • Action : ${p.type.toUpperCase()}\n`;
      texteRapport += `   • Date & Heure : ${p.date} à ${p.heure}\n`;
      texteRapport += `   • Position : ${statutZone} (${p.gps})\n\n`;
    });

    texteRapport += `-----------------------------------\nTotal : ${historique.length} pointage(s)`;

    // Copie automatique dans le presse-papiers
    navigator.clipboard.writeText(texteRapport)
      .then(() => {
        notifier('Copié !', 'Le rapport a été copié dans le presse-papiers. Vous pouvez le coller sur WhatsApp, e-mail ou ailleurs.', 'succes');
      })
      .catch(() => {
        // Option de secours au cas où le navigateur est plus ancien
        const textArea = document.createElement('textarea');
        textArea.value = texteRapport;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        notifier('Copié !', 'Le rapport a été copié dans le presse-papiers. Vous pouvez le coller n\'importe où.', 'succes');
      });
  };
  

  const Reabonner = (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeSaisiAbonnement.trim().toUpperCase();

    if (codesAbonnement.includes(code)) {
      setCodesAbonnement(codesAbonnement.filter((c) => c !== code));
      setDateExpiration(Date.now() + 30 * 24 * 60 * 60 * 1000);
      setCodeSaisiAbonnement('');
      setErreurAbonnement('');
      notifier('Abonnement Réactivé', 'Votre licence a été prolongée de 30 jours avec succès !', 'succes');
    } else {
      setErreurAbonnement('Code de recharge invalide ou déjà utilisé.');
    }
  };

  const ConnexionAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeAdminInput === 'admin123') {
      setEstAdminAuthentifie(true);
      setErreurAdmin('');
    } else {
      setErreurAdmin('Code d’accès incorrect.');
    }
  };

  const ContacterWhatsApp = () => {
    const msg = encodeURIComponent(`Bonjour Pointage-RH, je souhaite acheter un code de recharge d'abonnement pour l'entreprise : ${nomEntreprise}`);
    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${msg}`, '_blank');
  };

  // --- ECRAN INITIAL : CREATION ENTREPRISE ---
  if (!estInscrit) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '32px 24px', borderRadius: '16px', border: '1px solid #334155', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '32px' }}>📊</span>
            <h1 style={{ color: '#f8fafc', fontSize: '24px', fontWeight: '800', margin: '8px 0 4px 0' }}>Pointage-RH</h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Solution de gestion du temps de travail</p>
          </div>
          <form onSubmit={InscrireEntreprise}>
            <label style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Nom de votre Organisation / Entreprise</label>
            <input
              type="text"
              placeholder="Ex: SARL Congo Services"
              value={nomEntreprise}
              onChange={(e) => setNomEntreprise(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '15px', boxSizing: 'border-box', marginBottom: '20px', outline: 'none' }}
              required
            />
            <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
              Activer l'Espace RH
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- ECRAN SI ABONNEMENT EXPIRÉ ---
  if (!estAbonnementValide) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px 20px', maxWidth: '420px', width: '100%', border: '1px solid #dc2626', textStyle: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '40px' }}>🔒</span>
            <h2 style={{ color: '#ef4444', margin: '8px 0 4px 0', fontSize: '20px', fontWeight: '800' }}>Accès Expiré</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>L'abonnement de <strong>{nomEntreprise}</strong> est arrivé à terme.</p>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #334155' }}>
            <p style={{ color: '#cbd5e1', fontSize: '13px', margin: '0 0 8px 0' }}>Paiement rapide via <strong>Airtel Money</strong> :</p>
            <div style={{ backgroundColor: '#059669', color: '#fff', padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: '800', fontSize: '18px', letterSpacing: '1px' }}>
              {NUMERO_AIRTEL}
            </div>
          </div>

          <button
            onClick={ContacterWhatsApp}
            style={{ width: '100%', padding: '12px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            💬 Envoyer la preuve sur WhatsApp
          </button>

          <form onSubmit={Reabonner}>
            <label style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Code d'activation reçu</label>
            <input
              type="text"
              placeholder="Ex: RH2026-A1X9"
              value={codeSaisiAbonnement}
              onChange={(e) => setCodeSaisiAbonnement(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '15px', boxSizing: 'border-box', marginBottom: '8px', textTransform: 'uppercase' }}
            />
            {erreurAbonnement && <p style={{ color: '#ef4444', fontSize: '12px', margin: '0 0 10px 0' }}>{erreurAbonnement}</p>}
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
              Débloquer pour 30 Jours
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- APPLICATION PRINCIPALE (NAVIGATION PAR ONGLETS) ---
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: '30px' }}>
      
      {/* HEADER ULTRA PRO */}
      <header style={{ backgroundColor: '#0f172a', color: '#fff', padding: '16px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '600px', margin: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>Pointage-RH</h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{nomEntreprise}</p>
          </div>
          <span style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
            Licence: {joursRestants}j
          </span>
        </div>
      </header>

      {/* BARRE DE NAVIGATION (ONGLETS) */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '600px', margin: 'auto', display: 'flex' }}>
          <button
            onClick={() => setOnglets('pointage')}
            style={{ flex: 1, padding: '14px 0', border: 'none', backgroundColor: 'transparent', borderBottom: onglets === 'pointage' ? '3px solid #2563eb' : '3px solid transparent', color: onglets === 'pointage' ? '#2563eb' : '#64748b', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
          >
            ⏱️ Pointage
          </button>
          <button
            onClick={() => setOnglets('admin')}
            style={{ flex: 1, padding: '14px 0', border: 'none', backgroundColor: 'transparent', borderBottom: onglets === 'admin' ? '3px solid #2563eb' : '3px solid transparent', color: onglets === 'admin' ? '#2563eb' : '#64748b', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
          >
            📊 Administration
          </button>
          <button
            onClick={() => setOnglets('abonnement')}
            style={{ flex: 1, padding: '14px 0', border: 'none', backgroundColor: 'transparent', borderBottom: onglets === 'abonnement' ? '3px solid #2563eb' : '3px solid transparent', color: onglets === 'abonnement' ? '#2563eb' : '#64748b', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
          >
            💳 Service
          </button>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <main style={{ maxWidth: '600px', margin: 'auto', padding: '20px 16px' }}>

        {/* --- ONGLET 1: POINTAGE EMPLOYE --- */}
        {onglets === 'pointage' && (
          <div>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
              <h2 style={{ marginTop: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Borne d'enregistrement</h2>
              
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Nom complet du salarié</label>
              <input
                type="text"
                placeholder="Ex: Jean Mukendi"
                value={nomEmploye}
                onChange={(e) => setNomEmploye(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '16px', boxSizing: 'border-box', marginBottom: '16px', outline: 'none' }}
              />

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => EnregistrerPointage('Arrivée')}
                  style={{ flex: 1, padding: '16px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(22, 163, 74, 0.2)' }}
                >
                  🟢 ARRIVÉE
                </button>
                <button
                  onClick={() => EnregistrerPointage('Départ')}
                  style={{ flex: 1, padding: '16px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(220, 38, 38, 0.2)' }}
                >
                  🔴 DÉPART
                </button>
              </div>
            </div>

            {/* DERNIERS POINTAGES EN DIRECT */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Derniers enregistrements</h3>
              {historique.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', margin: '20px 0' }}>Aucun pointage aujourd'hui.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {historique.slice(0, 5).map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{item.nom}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{item.date} à {item.heure}</div>
                      </div>
                      <span style={{ padding: '6px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', backgroundColor: item.type === 'Arrivée' ? '#dcfce7' : '#fee2e2', color: item.type === 'Arrivée' ? '#15803d' : '#b91c1c' }}>
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

            {/* --- ONGLET 2: ADMINISTRATION & RAPPORTS --- */}
    {onglets === 'admin' && (
      <div>
        {!estAdminAuthentifie ? (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: '800' }}>Accès Sécurisé RH</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>Entrez votre code confidentiel administration.</p>
            <form onSubmit={ConnexionAdmin}>
              <input
                type="password"
                placeholder="Code Admin (par défaut: admin123)"
                value={codeAdminInput}
                onChange={(e) => setCodeAdminInput(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', marginBottom: '12px', boxSizing: 'border-box' }}
              />
              {erreurAdmin && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: 0 }}>{erreurAdmin}</p>}
              <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                Se Connecter
              </button>
            </form>
          </div>
        ) : (
          <div>
            {/* BOUTONS ACTIONS RH */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button
                onClick={CopierRapport}
                style={{ flex: 1, padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                📋 Copier-Coller le Rapport
              </button>
              <button
                onClick={() => setModaleConfirmationVidage(true)}
                style={{ flex: 1, padding: '12px', backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                🗑️ Vider l'historique
              </button>
            </div>

            {/* HISTORIQUE COMPLET */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>Historique Global des Pointages ({historique.length})</h3>
              {historique.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', margin: '20px 0' }}>Aucun pointage enregistré.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {historique.map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{p.nom}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{p.date} à {p.heure}</div>
                        <div style={{ fontSize: '11px', color: p.estDansLaZone ? '#16a34a' : '#dc2626', fontWeight: '600', marginTop: '2px' }}>
                          📍 GPS : {p.gps} ({p.estDansLaZone ? 'Dans la zone' : 'Hors zone'})
                        </div>
                      </div>
                      <span style={{ padding: '6px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', backgroundColor: p.type === 'Arrivée' ? '#dcfce7' : '#fee2e2', color: p.type === 'Arrivée' ? '#15803d' : '#b91c1c' }}>
                        {p.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )}

    {/* --- ONGLET 3: SERVICE CLIENT & ABONNEMENT --- */}
    {onglets === 'abonnement' && (
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700' }}>📲 Service Client & Abonnement</h3>
        <p style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
          Paiement Airtel Money : <strong>{NUMERO_AIRTEL}</strong>
        </p>
        <button
          onClick={ContacterWhatsApp}
          style={{ width: '100%', padding: '12px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          💬 Discuter sur WhatsApp
        </button>
      </div>
    )}
  </main>

  {/* --- MODALE DÉSOLÉ / NOTIFICATION DYNAMIQUE --- */}
  {modaleInfo.ouverte && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, fontSize: '18px', fontWeight: '800', color: modaleInfo.type === 'erreur' ? '#dc2626' : modaleInfo.type === 'succes' ? '#16a34a' : '#0f172a' }}>
          {modaleInfo.titre}
        </h3>
        <p style={{ color: '#475569', fontSize: '14px', margin: '16px 0 24px 0', lineHeight: '1.5' }}>
          {modaleInfo.texte}
        </p>
        <button
          onClick={() => setModaleInfo({ ...modaleInfo, ouverte: false })}
          style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
        >
          OK
        </button>
      </div>
    </div>
  )}

  {/* --- MODALE CONFIRMATION VIDAGE HISTORIQUE --- */}
  {modaleConfirmationVidage && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, fontSize: '18px', fontWeight: '800', color: '#d97706' }}>
          Confirmation
        </h3>
        <p style={{ color: '#475569', fontSize: '14px', margin: '16px 0 24px 0', lineHeight: '1.5' }}>
          Voulez-vous vraiment effacer tout l'historique des pointages ? Cette action est irréversible.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setModaleConfirmationVidage(false)}
            style={{ flex: 1, padding: '12px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
          >
            Annuler
          </button>
          <button
            onClick={() => {
              setHistorique([]);
              setModaleConfirmationVidage(false);
              notifier('Historique vidé', 'Tous les pointages ont été effacés.', 'succes');
            }}
            style={{ flex: 1, padding: '12px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
          >
            Oui, Vider
          </button>
        </div>
      </div>
    </div>
  )}
</div>
);
                  }
                           
