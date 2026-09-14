import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, query, getDocs, where, setDoc, doc, deleteDoc } from 'firebase/firestore';

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
  dateExpiration?: number;
}

export default function App() {
  const NUMERO_WHATSAPP = "2435473958";
  
  const ZONE_LAT = -11.6609;
  const ZONE_LNG = 27.4794;
  const RAYON_MAX_METRES = 100;

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

  const [dateExpiration, setDateExpiration] = useState<number>(() => {
    const saved = localStorage.getItem('prh_expiration');
    return saved ? parseInt(saved, 10) : Date.now() + (30 * 24 * 60 * 60 * 1000);
  });
  const [codeSaisiAbonnement, setCodeSaisiAbonnement] = useState('');

  const [historique, setHistorique] = useState<Pointage[]>([]);
  const [modaleInfo, setModaleInfo] = useState<{ ouverte: boolean; titre: string; text: string }>({
    ouverte: false, titre: '', text: ''
  });
  const [modaleConfirmationReinitialisation, setModaleConfirmationReinitialisation] = useState(false);
  const [chargementEnCours, setChargementEnCours] = useState(false);

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

  useEffect(() => {
    const q = query(collection(db, 'entreprises'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Entreprise[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        nom: docSnap.data().nom,
        dateExpiration: docSnap.data().dateExpiration
      }));
      setListeEntreprises(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!nomEntreprise) return;

    const q = query(
      collection(db, 'pointages'),
      where('entreprise', '==', nomEntreprise)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Pointage[] = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          nom: d.nom || '',
          entreprise: d.entreprise || '',
          type: d.type || 'Arrivée',
          heure: d.heure || '',
          date: d.date || '',
          gps: d.gps || '',
          estDansLaZone: d.estDansLaZone ?? true,
          distanceMetres: d.distanceMetres ?? 0
        };
      });

      data.sort((a, b) => b.id.localeCompare(a.id));
      setHistorique(data);
    });

    return () => unsubscribe();
  }, [nomEntreprise]);

  const notifier = (titre: string, text: string) => {
    setModaleInfo({ ouverte: true, titre, text });
  };

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

  const InscrireEntreprise = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomClean = nouvelleEntrepriseInput.trim();
    if (!nomClean) return;

    try {
      await setDoc(doc(db, 'entreprises', nomClean), { 
        nom: nomClean, 
        dateCreation: new Date(),
        dateExpiration: Date.now() + (30 * 24 * 60 * 60 * 1000)
      });
      setNomEntreprise(nomClean);
      localStorage.setItem('prh_entreprise', nomClean);
      setNouvelleEntrepriseInput('');
      notifier('Succès', `L'entreprise "${nomClean}" a été créée avec succès.`);
    } catch (err) {
      notifier('Erreur', 'Impossible de créer l\'entreprise.');
    }
  };

  const ChangerEntreprise = (nouveauNom: string) => {
    setNomEntreprise(nouveauNom);
    localStorage.setItem('prh_entreprise', nouveauNom);
  };

  const EnregistrerPointage = (type: 'Arrivée' | 'Départ') => {
    if (!nomEntreprise) {
      notifier('Entreprise requise', 'Veuillez sélectionner une entreprise dans la liste.');
      return;
    }
    if (!nomEmploye.trim()) {
      notifier('Nom requis', 'Veuillez saisir votre Nom et Prénom.');
      return;
    }

    if (Date.now() > dateExpiration) {
      notifier('Abonnement Expiré', 'Votre abonnement est expiré. Allez dans l\'onglet Service.');
      return;
    }

    setChargementEnCours(true);

    let sauvegardeFaite = false;

    const executerAjoutFirebase = async (lat?: number, lng?: number) => {
      if (sauvegardeFaite) return;
      sauvegardeFaite = true;

      let dansLaZone = true;
      let dist = 0;
      let gpsStr = "GPS Ignoré";

      if (lat !== undefined && lng !== undefined) {
        dist = calculerDistanceEnMetres(lat, lng, ZONE_LAT, ZONE_LNG);
        dansLaZone = dist <= RAYON_MAX_METRES;
        gpsStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

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
          estDansLaZone: dansLaZone,
          distanceMetres: dist
        });

        const nomPrecedent = nomEmploye;
        setNomEmploye('');
        setChargementEnCours(false);
        notifier('Pointage Validé !', `Pointage d'${type} enregistré pour ${nomPrecedent}.`);
      } catch (err) {
        setChargementEnCours(false);
        notifier('Erreur', 'Impossible d\'enregistrer dans la base de données.');
      }
    };

    const securiteTimeout = setTimeout(() => {
      executerAjoutFirebase();
    }, 3000);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(securiteTimeout);
          executerAjoutFirebase(position.coords.latitude, position.coords.longitude);
        },
        () => {
          clearTimeout(securiteTimeout);
          executerAjoutFirebase();
        },
        { timeout: 2500, enableHighAccuracy: true }
      );
    } else {
      clearTimeout(securiteTimeout);
      executerAjoutFirebase();
    }
  };

  const ValiderAbonnement = (e: React.FormEvent) => {
    e.preventDefault();
    const codeClean = codeSaisiAbonnement.trim().toUpperCase();

    if (CODES_ABONNEMENT_VALIDES.includes(codeClean)) {
      const nouvelleExpiration = Date.now() + (30 * 24 * 60 * 60 * 1000);
      setDateExpiration(nouvelleExpiration);
      localStorage.setItem('prh_expiration', nouvelleExpiration.toString());
      setCodeSaisiAbonnement('');
      notifier('Abonnement Activé', 'Recharge de 30 jours validée avec succès !');
    } else {
      notifier('Code Invalide', 'Le code de recharge saisi est incorrect.');
    }
  };

  const GenererLienEmploye = () => {
    const url = `${window.location.origin}?entreprise=${encodeURIComponent(nomEntreprise)}`;
    navigator.clipboard.writeText(url);
    notifier('Lien Copié !', `Le lien d'accès pour ${nomEntreprise} a été copié.`);
  };

  const CopierRapport = () => {
    if (historique.length === 0) {
      notifier('Vide', 'Aucun pointage disponible pour le rapport.');
      return;
    }
    let texteRapport = `📋 RAPPORT DE POINTAGE - ${nomEntreprise}\n\n`;
    historique.forEach((p, idx) => {
      texteRapport += `${idx + 1}. ${p.nom} - ${p.type} (${p.date} ${p.heure})\n`;
    });
    navigator.clipboard.writeText(texteRapport);
    notifier('Copié !', 'Le rapport complet a été copié.');
  };

  const ExecutionReinitialisation = async () => {
    try {
      const q = query(collection(db, 'pointages'), where('entreprise', '==', nomEntreprise));
      const snapshot = await getDocs(q);
      const promises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(promises);

      setModaleConfirmationReinitialisation(false);
      notifier('Réussi', 'L\'historique a été réinitialisé.');
    } catch (err) {
      setModaleConfirmationReinitialisation(false);
      notifier('Erreur', 'Impossible de vider l\'historique.');
    }
  };

  const joursRestants = Math.max(0, Math.ceil((dateExpiration - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'sans-serif' }}>
      <header style={{ backgroundColor: '#0f172a', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px' }}>Pointage-RH Cloud</h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>{nomEntreprise || 'Aucune entreprise'}</p>
        </div>
        <div style={{ backgroundColor: '#16a34a', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
          {joursRestants}j
        </div>
      </header>

      <div style={{ display: 'flex', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <button onClick={() => setOnglets('pointage')} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontWeight: 'bold', color: onglets === 'pointage' ? '#2563eb' : '#64748b', borderBottom: onglets === 'pointage' ? '2px solid #2563eb' : 'none', cursor: 'pointer' }}>Pointage</button>
        <button onClick={() => setOnglets('admin')} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontWeight: 'bold', color: onglets === 'admin' ? '#2563eb' : '#64748b', borderBottom: onglets === 'admin' ? '2px solid #2563eb' : 'none', cursor: 'pointer' }}>Admin</button>
        <button onClick={() => setOnglets('abonnement')} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontWeight: 'bold', color: onglets === 'abonnement' ? '#2563eb' : '#64748b', borderBottom: onglets === 'abonnement' ? '2px solid #2563eb' : 'none', cursor: 'pointer' }}>Service</button>
      </div>

      <main style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
        {onglets === 'pointage' && (
          <div>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Entreprise :</label>
              <select value={nomEntreprise} onChange={(e) => ChangerEntreprise(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <option value="">-- Choisir --</option>
                {listeEntreprises.map((ent) => (
                  <option key={ent.id} value={ent.nom}>{ent.nom}</option>
                ))}
              </select>
            </div>

            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', marginTop: 0 }}>Pointer</h2>
              <input type="text" placeholder="Nom & Prénom" value={nomEmploye} onChange={(e) => setNomEmploye(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" disabled={chargementEnCours} onClick={() => EnregistrerPointage('Arrivée')} style={{ flex: 1, padding: '14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: chargementEnCours ? 0.6 : 1 }}>
                  {chargementEnCours ? '...' : 'ARRIVÉE'}
                </button>
                <button type="button" disabled={chargementEnCours} onClick={() => EnregistrerPointage('Départ')} style={{ flex: 1, padding: '14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: chargementEnCours ? 0.6 : 1 }}>
                  {chargementEnCours ? '...' : 'DÉPART'}
                </button>
              </div>
            </div>

            {nomEntreprise && (
              <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '14px', marginTop: 0, color: '#64748b' }}>Historique récent</h3>
                {historique.length === 0 ? <p style={{ fontSize: '13px', color: '#94a3b8' }}>Aucun pointage.</p> : (
                  historique.slice(0, 5).map(item => (
                    <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{item.nom}</strong> <span style={{ fontSize: '12px', color: '#64748b' }}>({item.type})</span>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.date} - {item.heure}</div>
                      </div>
                      <span style={{ fontSize: '11px', color: item.estDansLaZone ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                        {item.estDansLaZone ? '🟢 OK' : '🔴 Hors zone'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {onglets === 'admin' && (
          <div>
            {!estAdminAuthentifie ? (
              <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '16px', marginTop: 0 }}>Accès Admin</h2>
                <form onSubmit={(e) => { e.preventDefault(); codeAdminInput === 'admin123' ? setEstAdminAuthentifie(true) : setErreurAdmin('Incorrect'); }}>
                  <input type="password" placeholder="Code (admin123)" value={codeAdminInput} onChange={(e) => setCodeAdminInput(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' }} />
                  {erreurAdmin && <p style={{ color: 'red', fontSize: '12px' }}>{erreurAdmin}</p>}
                  <button type="submit" style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Valider</button>
                </form>
              </div>
            ) : (
              <div>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14px', marginTop: 0 }}>Créer une Entreprise</h3>
                  <form onSubmit={InscrireEntreprise} style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="Nom de l'entreprise" value={nouvelleEntrepriseInput} onChange={(e) => setNouvelleEntrepriseInput(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    <button type="submit" style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Créer</button>
                  </form>
                </div>

                {nomEntreprise && (
                  <div>
                    <button type="button" onClick={GenererLienEmploye} style={{ width: '100%', padding: '12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginBottom: '10px', cursor: 'pointer' }}>🔗 Copier le lien employés</button>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                      <button type="button" onClick={CopierRapport} style={{ flex: 1, padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>📋 Rapport</button>
                      <button type="button" onClick={() => setModaleConfirmationReinitialisation(true)} style={{ flex: 1, padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Vider</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {onglets === 'abonnement' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', marginTop: 0 }}>Service Client & Support</h2>
              <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>Contactez-nous directement sur WhatsApp pour obtenir vos codes d'activation :</p>
              
              <a
                href={`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent('Bonjour, je souhaite obtenir un code de recharge pour Pointage-RH.')}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  backgroundColor: '#25D366',
                  color: '#ffffff',
                  padding: '14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '15px'
                }}
              >
                💬 Discuter sur WhatsApp (+243 {NUMERO_WHATSAPP})
              </a>
            </div>

            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', marginTop: 0 }}>Activer un Code 30 Jours</h3>
              <form onSubmit={ValiderAbonnement} style={{ marginTop: '12px' }}>
                <input type="text" placeholder="Code (ex: RH2026-A1X9)" value={codeSaisiAbonnement} onChange={(e) => setCodeSaisiAbonnement(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' }} />
                <button type="submit" style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Activer la recharge</button>
              </form>
       
