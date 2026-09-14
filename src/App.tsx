import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, query, getDocs, where, setDoc, doc, writeBatch } from 'firebase/firestore';

interface Pointage {
  id: string;
  nom: string;
  entreprise: string;
  type: 'Arrivée' | 'Départ';
  heure: string;
  date: string;
  gps: string;
  estDansLaZone: boolean;
  distanceMetres: number;
}

interface Entreprise {
  id: string;
  nom: string;
}

export default function App() {
  const NUMERO_AIRTEL = "+243995473958";
  const NUMERO_WHATSAPP = "243995473958";
  
  // Coordonnées GPS du siège/bureau (Lubumbashi)
  const ZONE_LAT = -11.6609;
  const ZONE_LNG = 27.4794;
  const RAYON_MAX_METRES = 100;

  // Codes de recharge d'abonnement (30 jours)
  const CODES_ABONNEMENT_VALIDES = [
    'RH2026-A1X9', 'RH2026-B0Z2', 'RH2026-C3M7', 'RH2026-D4K0', 'RH2026-E9P5'
  ];

  const [onglets, setOnglets] = useState<'pointage' | 'admin' | 'abonnement'>('pointage');
  const [listeEntreprises, setListeEntreprises] = useState<Entreprise[]>([]);
  const [nomEntreprise, setNomEntreprise] = useState<string>('');
  const [nouvelleEntrepriseInput, setNouvelleEntrepriseInput] = useState('');

  const [nomEmploye, setNomEmploye] = useState('');
  const [codeAdminInput, setCodeAdminInput] = useState('');
  const [estAdminAuthentifie, setEstAdminAuthentifie] = useState(false);
  const [erreurAdmin, setErreurAdmin] = useState('');

  // Gestion Abonnement (Persisté en LocalStorage)
  const [dateExpiration, setDateExpiration] = useState<number>(() => {
    const saved = localStorage.getItem('prh_expiration');
    return saved ? parseInt(saved, 10) : Date.now() + 30 * 24 * 60 * 60 * 1000;
  });
  const [codeSaisiAbonnement, setCodeSaisiAbonnement] = useState('');

  const [historique, setHistorique] = useState<Pointage[]>([]);
  const [modaleInfo, setModaleInfo] = useState<{ ouverte: boolean; titre: string; text: string; type: 'succes' | 'erreur' | 'info' }>({
    ouverte: false, titre: '', text: '', type: 'info'
  });
  const [modaleConfirmationVidage, setModaleConfirmationVidage] = useState(false);
  const [chargementGPS, setChargementGPS] = useState(false);

  // Détection URL (?entreprise=...) ou LocalStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const entrepriseUrl = urlParams.get('entreprise');

    if (entrepriseUrl) {
      setNomEntreprise(entrepriseUrl);
      localStorage.setItem('prh_entreprise', entrepriseUrl);
    } else {
      const saved = localStorage.getItem('prh_entreprise');
      if (saved) setNomEntreprise(saved);
    }
  }, []);

  // Charger la liste des entreprises depuis Firebase
  useEffect(() => {
    const q = query(collection(db, 'entreprises'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Entreprise[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        nom: docSnap.data().nom
      }));
      setListeEntreprises(data);
    });
    return () => unsubscribe();
  }, []);

  // Charger l'historique de l'entreprise active
  useEffect(() => {
    if (!nomEntreprise) return;

    const q = query(
      collection(db, 'pointages'),
      where('entreprise', '==', nomEntreprise)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Pointage[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Pointage, 'id'>)
      }));

      data.sort((a, b) => b.id.localeCompare(a.id));
      setHistorique(data);
    });

    return () => unsubscribe();
  }, [nomEntreprise]);

  const notifier = (titre: string, text: string, type: 'succes' | 'erreur' | 'info' = 'info') => {
    setModaleInfo({ ouverte: true, titre, text, type });
  };

  // Calcul de la distance GPS (Formule Haversine en Mètres)
  const calculerDistanceEnMetres = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Création d'une Entreprise par l'Admin
  const InscrireEntreprise = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomClean = nouvelleEntrepriseInput.trim();
    if (!nomClean) return;

    try {
      await setDoc(doc(db, 'entreprises', nomClean), { nom: nomClean, dateCreation: new Date() });
      setNomEntreprise(nomClean);
      localStorage.setItem('prh_entreprise', nomClean);
      setNouvelleEntrepriseInput('');
      notifier('Entreprise Créée !', `L'entreprise "${nomClean}" est disponible dans le Cloud.`, 'succes');
    } catch (err) {
      notifier('Erreur', 'Impossible de créer l\'entreprise.', 'erreur');
    }
  };

  const ChangerEntreprise = (nouveauNom: string) => {
    setNomEntreprise(nouveauNom);
    localStorage.setItem('prh_entreprise', nouveauNom);
  };

  // Traitement du Pointage avec vérification GPS Réelle
  const EnregistrerPointage = (type: 'Arrivée' | 'Départ') => {
    if (!nomEntreprise) {
      notifier('Entreprise requise', 'Veuillez sélectionner votre entreprise avant de pointer.', 'erreur');
      return;
    }
    if (!nomEmploye.trim()) {
      notifier('Champ Requis', 'Veuillez saisir votre Nom et Prénom.', 'erreur');
      return;
    }

    // Vérification Expiration Abonnement
    if (Date.now() > dateExpiration) {
      notifier('Abonnement Expiré', 'Le service est expiré. Veuillez recharger votre compte dans l\'onglet Service.', 'erreur');
      return;
    }

    setChargementGPS(true);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const dist = calculerDistanceEnMetres(lat, lng, ZONE_LAT, ZONE_LNG);
          const dansLaZone = dist <= RAYON_MAX_METRES;

          await SauvegarderPointageFirebase(type, `${lat.toFixed(4)}, ${lng.toFixed(4)}`, dansLaZone, dist);
        },
        async () => {
          // GPS Désactivé / Refusé -> fallback par défaut
          await SauvegarderPointageFirebase(type, 'GPS Désactivé', true, 0);
        },
        { timeout: 8000 }
      );
    } else {
      SauvegarderPointageFirebase(type, 'GPS Non supporté', true, 0);
    }
  };

  const SauvegarderPointageFirebase = async (type: 'Arrivée' | 'Départ', gpsStr: string, estDansZone: boolean, dist: number) => {
    const maintenant = new Date();
    const dateStr = maintenant.toLocaleDateString('fr-FR');
    const heureStr = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    try {
      await addDoc(collection(db, 'pointages'), {
        nom: nomEmploye.trim(),
        entreprise: nomEntreprise,
        type,
        heure: heureStr,
        date: dateStr,
        gps: gpsStr,
        estDansLaZone: estDansZone,
        distanceMetres: dist
      });

      const userSaved = nomEmploye;
      setNomEmploye('');
      setChargementGPS(false);
      notifier(
        'Pointage Réussi',
        `Pointage d'${type} enregistré pour ${userSaved}.\nStatut GPS : ${estDansZone ? '🟢 Dans la zone' : `🔴 Hors zone (${dist}m)`}`,
        'succes'
      );
    } catch (err) {
      setChargementGPS(false);
      notifier('Erreur Cloud', 'Impossible d\'enregistrer le pointage.', 'erreur');
    }
  };

  // Recharger 30 jours d'abonnement
  const ValiderAbonnement = (e: React.FormEvent) => {
    e.preventDefault();
    const codeClean = codeSaisiAbonnement.trim().toUpperCase();

    if (CODES_ABONNEMENT_VALIDES.includes(codeClean)) {
      const nouvelleExpiration = Date.now() + 30 * 24 * 60 * 60 * 1000;
      setDateExpiration(nouvelleExpiration);
      localStorage.setItem('prh_expiration', nouvelleExpiration.toString());
      setCodeSaisiAbonnement('');
      notifier('Abonnement Activé', 'Votre abonnement a été prolongé de 30 jours avec succès !', 'succes');
    } else {
      notifier('Code Invalide', 'Code de recharge incorrect. Veuillez vérifier ou contacter le service client.', 'erreur');
    }
  };

  const GenererLienEmploye = () => {
    const url = `${window.location.origin}?entreprise=${encodeURIComponent(nomEntreprise)}`;
    navigator.clipboard.writeText(url);
    notifier('Lien Copié !', `Lien WhatsApp copié pour ${nomEntreprise} :\n${url}`, 'succes');
  };

  const CopierRapport = () => {
    if (historique.length === 0) {
      notifier('Données vides', 'Aucun pointage à copier.', 'info');
      return;
    }
    let texteRapport = `📋 RAPPORT DE POINTAGE - ${nomEntreprise}\n\n`;
    historique.forEach((p, idx) => {
      texteRapport += `${idx + 1}. ${p.nom} - ${p.type.toUpperCase()}\n   Date : ${p.date} à ${p.heure}\n   Zone : ${p.estDansLaZone ? '🟢 Dans la zone' : `🔴 Hors zone (${p.distanceMetres}m)`}\n\n`;
    });
    navigator.clipboard.writeText(texteRapport);
    notifier('Copié !', 'Rapport RH copié dans le presse-papiers.', 'succes');
  };

  // Suppression complète des pointages de l'entreprise
  const ViderHistoriqueCloud = async () => {
    try {
      const q = query(collection(db, 'pointages'), where('entreprise', '==', nomEntreprise));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      setModaleConfirmationVidage(false);
      notifier('Corbeille Vidée', `Tous les pointages de ${nomEntreprise} ont été supprimés.`, 'succes');
    } catch (err) {
      setModaleConfirmationVidage(false);
      notifier('Erreur', 'Impossible de vider l\'historique.', 'erreur');
    }
  };

  // Calcul des jours d'abonnement restants
  const joursRestants = Math.max(0, Math.ceil((dateExpiration - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ backgroundColor: '#0f172a', color: '#fff', padding: '16px 20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Pointage-RH Cloud</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
              {nomEntreprise ? `Entreprise : ${nomEntreprise}` : 'Sélectionnez une entreprise'}
            </p>
          </div>
          <div style={{ backgroundColor: joursRestants > 5 ? '#15803d' : '#b91c1c', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
            Abonnement : {joursRestants}j
          </div>
        </div>
      </header>

      {/* NAV TABS */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex' }}>
          <button onClick={() => setOnglets('pointage')} style={{ flex: 1, padding: '14px 0', border: 'none', backgroundColor: 'transparent', borderBottom: onglets === 'pointage' ? '3px solid #2563eb' : 'none', fontWeight: '700', cursor: 'pointer', color: onglets === 'pointage' ? '#2563eb' : '#64748b' }}>📌 Pointage</button>
          <button onClick={() => setOnglets('admin')} style={{ flex: 1, padding: '14px 0', border: 'none', backgroundColor: 'transparent', borderBottom: onglets === 'admin' ? '3px solid #2563eb' : 'none', fontWeight: '700', cursor: 'pointer', color: onglets === 'admin' ? '#2563eb' : '#64748b' }}>📊 Administration</button>
          <button onClick={() => setOnglets('abonnement')} style={{ flex: 1, padding: '14px 0', border: 'none', backgroundColor: 'transparent', borderBottom: onglets === 'abonnement' ? '3px solid #2563eb' : 'none', fontWeight: '700', cursor: 'pointer', color: onglets === 'abonnement' ? '#2563eb' : '#64748b' }}>💳 Service</button>
        </div>
      </div>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px' }}>

        {/* ONGLET 1: POINTAGE */}
        {onglets === 'pointage' && (
          <div>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                🏢 Entreprise active :
              </label>
              <select
                value={nomEntreprise}
                onChange={(e) => ChangerEntreprise(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', backgroundColor: '#f8fafc', fontWeight: '600' }}
              >
                <option value="">-- Choisir une entreprise --</option>
                {listeEntreprises.map((ent) => (
                  <option key={ent.id} value={ent.nom}>{ent.nom}</option>
                ))}
              </select>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: '700' }}>Pointer sa présence</h2>
              <input
                type="text"
                placeholder="Votre Nom & Prénom"
                value={nomEmploye}
                onChange={(e) => setNomEmploye(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', marginBottom: '16px', boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  disabled={chargementGPS}
                  onClick={() => EnregistrerPointage('Arrivée')}
                  style={{ flex: 1, padding: '16px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', opacity: chargementGPS ? 0.6 : 1 }}
                >
                  {chargementGPS ? 'GPS...' : '🟢 ARRIVÉE'}
                </button>
                <button
                  disabled={chargementGPS}
                  onClick={() => EnregistrerPointage('Départ')}
                  style={{ flex: 1, padding: '16px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', opacity: chargementGPS ? 0.6 : 1 }}
                >
                  {chargementGPS ? 'GPS...' : '🔴 DÉPART'}
                </button>
              </div>
            </div>

            {nomEntreprise && (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '700', color: '#64748b' }}>Pointages récents - {nomEntreprise}</h3>
                {historique.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>Aucun pointage trouvé.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {historique.slice(0, 5).map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                        <div>
                          <strong>{item.nom}</strong>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{item.date} à {item.heure}</div>
                          <div style={{ fontSize: '11px', color: item.estDansLaZone ? '#16a34a' : '#dc2626', fontWeight: '700' }}>
                            {item.estDansLaZone ? '🟢 Dans la zone' : `🔴 Hors zone (${item.distanceMetres}m)`}
                          </div>
                        </div>
                        <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', backgroundColor: item.type === 'Arrivée' ? '#dcfce7' : '#fee2e2', color: item.type === 'Arrivée' ? '#15803d' : '#b91c1c' }}>
                          {item.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ONGLET 2: ADMINISTRATION */}
        {onglets === 'admin' && (
          <div>
            {!estAdminAuthentifie ? (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ marginTop: 0, fontSize: '18px', fontWeight: '800' }}>Accès Sécurisé RH</h2>
                <form onSubmit={(e) => { e.preventDefault(); codeAdminInput === 'admin123' ? setEstAdminAuthentifie(true) : setErreurAdmin('Code incorrect'); }}>
                  <input type="password" placeholder="Code Admin (admin123)" value={codeAdminInput} onChange={(e) => setCodeAdminInput(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' }} />
                  {erreurAdmin && <p style={{ color: '#ef4444', fontSize: '13px' }}>{erreurAdmin}</p>}
                  <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700' }}>Se Connecter</button>
                </form>
              </div>
            ) : (
              <div>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '700' }}>➕ Créer une nouvelle Entreprise</h3>
                  <form onSubmit={InscrireEntreprise} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Nom (Ex: Congo Services)"
                      value={nouvelleEntrepriseInput}
                      onChange={(e) => setNouvelleEntrepriseInput(e.target.value)}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                    <button type="submit" style={{ padding: '10px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700' }}>Créer</button>
                  </form>
                </div>

                {nomEntreprise && (
                  <>
                    <button onClick={GenererLienEmploye} style={{ width: '100%', padding: '14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', marginBottom: '16px', cursor: 'pointer' }}>
                      🔗 Copier le Lien WhatsApp pour les Employés ({nomEntreprise})
                    </button>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                      <button onClick={CopierRapport} style={{ flex: 1, padding: '14px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>📋 Rapport RH</button>
                      <button onClick={() => setModaleConfirmationVidage(true)} style={{ flex: 1, padding: '14px', backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>🗑️ Vider</button>
                    </div>

                    <div style={{ ba
