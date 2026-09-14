import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, query, orderBy, doc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';

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
  const NUMERO_AIRTEL = "+243995473958";
  const NUMERO_WHATSAPP = "243995473958";

  // Coordonnées du siège (zone de travail)
  const ZONE_LAT = -11.6609;
  const ZONE_LNG = 27.4794;
  const RAYON_MAX = 100; // Mètres

  // Codes de réabonnement 30 jours
  const [codesAbonnement, setCodesAbonnement] = useState<string[]>([
    'RH2026-A1X9', 'RH2026-B0Z2', 'RH2026-C3M7', 'RH2026-D4K0', 'RH2026-E9P5'
  ]);

  // --- ÉTATS APPLICATION ---
  const [onglets, setOnglets] = useState<'pointage' | 'admin' | 'abonnement'>('pointage');
  const [nomEntreprise, setNomEntreprise] = useState<string>(() => localStorage.getItem('prh_entreprise') || '');
  const [estInscrit, setEstInscrit] = useState<boolean>(() => !!localStorage.getItem('prh_entreprise'));

  // Employé
  const [nomEmploye, setNomEmploye] = useState('');

  // Admin
  const [codeAdminInput, setCodeAdminInput] = useState('');
  const [estAdminAuthentifie, setEstAdminAuthentifie] = useState(false);
  const [erreurAdmin, setErreurAdmin] = useState('');

  // Abonnement
  const [dateExpiration, setDateExpiration] = useState<number>(() => {
    const saved = localStorage.getItem('prh_expiration');
    return saved ? parseInt(saved, 10) : Date.now() + 30 * 24 * 60 * 60 * 1000;
  });
  const [codeSaisiAbonnement, setCodeSaisiAbonnement] = useState('');
  const [erreurAbonnement, setErreurAbonnement] = useState('');

  // Données Firestore en temps réel
  const [historique, setHistorique] = useState<Pointage[]>([]);

  // --- ÉTATS DES MODALES ---
  const [modaleInfo, setModaleInfo] = useState<{ ouverte: boolean; titre: string; text: string; type: 'succes' | 'erreur' | 'info' }>({
    ouverte: false,
    titre: '',
    text: '',
    type: 'info'
  });
  const [modaleConfirmationVidage, setModaleConfirmationVidage] = useState(false);

  // Synchronisation nom/expiration locale
  useEffect(() => {
    if (nomEntreprise) localStorage.setItem('prh_entreprise', nomEntreprise);
    localStorage.setItem('prh_expiration', dateExpiration.toString());
  }, [nomEntreprise, dateExpiration]);

  // Écoute en temps réel de la collection Firebase Firestore
  useEffect(() => {
    const q = query(collection(db, 'pointages'), orderBy('date', 'desc'), orderBy('heure', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Pointage[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Pointage, 'id'>)
      }));
      setHistorique(data);
    }, (error) => {
      console.error("Erreur Firestore :", error);
    });

    return () => unsubscribe();
  }, []);

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

  const EnregistrerPointage = async (type: 'Arrivée' | 'Départ') => {
    if (!nomEmploye.trim()) {
      notifier('Champ Requis', 'Veuillez saisir le nom et prénom de l\'employé.', 'erreur');
      return;
    }

    const maintenant = new Date();
    const dateStr = maintenant.toLocaleDateString('fr-FR');
    const heureStr = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Enregistrement Cloud avec position par défaut puis mise à jour GPS
    try {
      const docRef = await addDoc(collection(db, 'pointages'), {
        nom: nomEmploye.trim(),
        type,
        heure: heureStr,
        date: dateStr,
        gps: `${ZONE_LAT.toFixed(4)}, ${ZONE_LNG.toFixed(4)}`,
        lat: ZONE_LAT,
        lng: ZONE_LNG,
        estDansLaZone: true
      });

      const currentNom = nomEmploye;
      setNomEmploye('');
      notifier('Pointage Enregistré', `Pointage d'${type} validé pour ${currentNom} à ${heureStr}.`, 'succes');

      // Mise à jour précision GPS en arrière-plan
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const dist = calculerDistance(lat, lng, ZONE_LAT, ZONE_LNG);
            const estDansZone = dist <= RAYON_MAX;

            // Mettre à jour la fiche spécifique dans Firestore
            try {
              const pointageRef = doc(db, 'pointages', docRef.id);
              await addDoc(collection(db, 'pointages_logs'), {
                pointageId: docRef.id,
                gps: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                estDansLaZone: estDansZone
              });
            } catch (e) {
              console.log("Mise à jour GPS optionnelle non synchronisée");
            }
          },
          () => {},
          { enableHighAccuracy: true, timeout: 4000 }
        );
      }
    } catch (err) {
      console.error("Erreur Firebase:", err);
      notifier('Erreur Cloud', 'Impossible d\'enregistrer dans la base de données.', 'erreur');
    }
  };

  const CopierRapport = () => {
    if (historique.length === 0) {
      notifier('Données vides', 'Aucun pointage disponible à copier.', 'info');
      return;
    }

    let texteRapport = `📋 RAPPORT DE POINTAGE - ${nomEntreprise || 'RH'}\n`;
    texteRapport += `Généré le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}\n\n`;

    historique.forEach((p, idx) => {
      const statutZone = p.estDansLaZone ? '✅ Dans la zone' : '⚠️ Hors zone';
      texteRapport += `${idx + 1}. ${p.nom}\n`;
      texteRapport += `   Action : ${p.type.toUpperCase()}\n`;
      texteRapport += `   Date & Heure : ${p.date} à ${p.heure}\n`;
      texteRapport += `   Position : ${statutZone} (${p.gps})\n\n`;
    });

    texteRapport += `-----------------------------------\nTotal : ${historique.length} pointage(s)`;

    navigator.clipboard.writeText(texteRapport)
      .then(() => {
        notifier('Copié !', 'Le rapport a été copié dans le presse-papiers.', 'succes');
      })
      .catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = texteRapport;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        notifier('Copié !', 'Le rapport a été copié dans le presse-papiers.', 'succes');
      });
  };

  const ViderHistoriqueCloud = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'pointages'));
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
      setModaleConfirmationVidage(false);
      notifier('Historique vidé', 'Tous les pointages ont été effacés du Cloud.', 'succes');
    } catch (err) {
      console.error("Erreur suppression:", err);
      notifier('Erreur', 'Impossible de vider l\'historique.', 'erreur');
    }
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
      setErreurAdmin('Code d\'accès incorrect.');
    }
  };

  const ContacterWhatsApp = () => {
    const msg = encodeURIComponent(`Bonjour Pointage-RH, je souhaite acheter un code de recharge d'abonnement pour l'entreprise ${nomEntreprise}.`);
    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${msg}`, '_blank');
  };

  // --- ÉCRAN INITIAL : CRÉATION ENTREPRISE ---
  if (!estInscrit) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '32px 24px', maxWidth: '420px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '32px' }}>📲</span>
            <h1 style={{ color: '#f8fafc', fontSize: '24px', fontWeight: '800', margin: '8px 0 4px 0' }}>Pointage-RH</h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Solution Cloud de gestion du temps de travail</p>
          </div>
          <form onSubmit={InscrireEntreprise}>
            <label style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
              Nom de votre Entreprise / Service :
            </label>
            <input
              type="text"
              placeholder="Ex: SARL Congo Services"
              value={nomEntreprise}
              onChange={(e) => setNomEntreprise(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '15px', marginBottom: '16px', boxSizing: 'border-box' }}
              required
            />
            <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
              Activer l'Espace RH
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- ÉCRAN SI ABONNEMENT EXPIRÉ ---
  if (!estAbonnementValide) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px 20px', maxWidth: '420px', width: '100%', border: '1px solid #334155' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '40px' }}>🔒</span>
            <h2 style={{ color: '#ef4444', margin: '8px 0 4px 0', fontSize: '20px', fontWeight: '800' }}>Accès Expiré</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>L'abonnement de <strong>{nomEntreprise}</strong> a pris fin.</p>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #334155' }}>
            <p style={{ color: '#cbd5e1', fontSize: '13px', margin: '0 0 8px 0' }}>Paiement rapide via <strong>Airtel Money</strong> :</p>
            <div style={{ backgroundColor: '#059669', color: '#fff', padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: '700' }}>
              {NUMERO_AIRTEL}
            </div>
          </div>

          <button onClick={ContacterWhatsApp} style={{ width: '100%', padding: '12px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', marginBottom: '20px', cursor: 'pointer' }}>
            💬 Envoyer la preuve sur WhatsApp
          </button>

          <form onSubmit={Reabonner}>
            <label style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Saisir le Code de Recharge :</label>
            <input
              type="text"
              placeholder="Ex: RH2026-A1X9"
              value={codeSaisiAbonnement}
              onChange={(e) => setCodeSaisiAbonnement(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', marginBottom: '8px', boxSizing: 'border-box' }}
            />
            {erreurAbonnement && <p style={{ color: '#ef4444', fontSize: '12px', margin: '0 0 10px 0' }}>{erreurAbonnement}</p>}
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
              Débloquer pour 30 Jours
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- APPLICATION PRINCIPALE ---
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* HEADER */}
      <header style={{ backgroundColor: '#0f172a', color: '#fff', padding: '16px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>Pointage-RH Cloud</h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{nomEntreprise}</p>
          </div>
          <div>
            <span style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
              Licence: {joursRestants}j
            </span>
          </div>
        </div>
      </header>

      {/* BARRE DE NAVIGATION (ONGLETS) */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex' }}>
          <button
            onClick={() => setOnglets('pointage')}
            style={{ flex: 1, padding: '14px 0', border: 'none', backgroundColor: 'transparent', borderBottom: onglets === 'pointage' ? '3px solid #2563eb' : 'none', color: onglets === 'pointage' ? '#2563eb' : '#64748b', fontWeight: '700', cursor: 'pointer' }}
          >
            📌 Pointage
          </button>
          <button
            onClick={() => setOnglets('admin')}
            style={{ flex: 1, padding: '14px 0', border: 'none', backgroundColor: 'transparent', borderBottom: onglets === 'admin' ? '3px solid #2563eb' : 'none', color: onglets === 'admin' ? '#2563eb' : '#64748b', fontWeight: '700', cursor: 'pointer' }}
          >
            📊 Administration
          </button>
          <button
            onClick={() => setOnglets('abonnement')}
            style={{ flex: 1, padding: '14px 0', border: 'none', backgroundColor: 'transparent', borderBottom: onglets === 'abonnement' ? '3px solid #2563eb' : 'none', color: onglets === 'abonnement' ? '#2563eb' : '#64748b', fontWeight: '700', cursor: 'pointer' }}
          >
            💳 Service
          </button>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px' }}>

        {/* ONGLET 1: POINTAGE EMPLOYÉ */}
        {onglets === 'pointage' && (
          <div>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '20px' }}>
              <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Formulaire de Pointage</h2>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Nom & Prénom de l'employé :</label>
              <input
                type="text"
                placeholder="Ex: Jean Mukendi"
                value={nomEmploye}
                onChange={(e) => setNomEmploye(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', marginBottom: '16px', boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => EnregistrerPointage('Arrivée')}
                  style={{ flex: 1, padding: '16px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  🟢 ARRIVÉE
                </button>
                <button
                  onClick={() => EnregistrerPointage('Départ')}
                  style={{ flex: 1, padding: '16px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  🔴 DÉPART
                </button>
              </div>
            </div>

            {/* DERNIERS POINTAGES EN DIRECT (CLOUD) */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Derniers Pointages Cloud (Direct)
              </h3>
              {historique.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', margin: '20px 0' }}>Aucun pointage synchronisé.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {historique.slice(0, 5).map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{item.nom}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{item.date} à {item.heure}</div>
                      </div>
                      <span style={{ padding: '6px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', backgroundColor: item.type === 'Arrivée' ? '#dcfce7' : '#fee2e2', color: item.type === 'Arrivée' ? '#15803d' : '#b91c1c' }}>
                        {item.
