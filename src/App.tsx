import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, query, getDocs, where, setDoc, doc, deleteDoc } from 'firebase/firestore';

interface PointageRecord {
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

interface EntrepriseRecord {
  id: string;
  nom: string;
  dateExpiration?: number;
}

export default function MainApp() {
  const NUMERO_WHATSAPP = "2435473958";
  
  const ZONE_LAT = -11.6609;
  const ZONE_LNG = 27.4794;
  const RAYON_MAX_METRES = 100;

  const CODES_VALIDES = [
    'RH2026-A1X9', 'RH2026-B0Z2', 'RH2026-C3M7', 'RH2026-D4K0', 'RH2026-E9P5'
  ];

  const [ongletActif, setOngletActif] = useState<'pointage' | 'admin' | 'abonnement'>('pointage');
  const [entreprises, setEntreprises] = useState<EntrepriseRecord[]>([]);
  const [entrepriseActive, setEntrepriseActive] = useState<string>('');
  const [nouvelleEntInput, setNouvelleEntInput] = useState('');

  const [nomSaisi, setNomSaisi] = useState('');
  const [codeAdmin, setCodeAdmin] = useState('');
  const [isAdminConnecte, setIsAdminConnecte] = useState(false);
  const [erreurCodeAdmin, setErreurCodeAdmin] = useState('');

  const [expiration, setExpiration] = useState<number>(() => {
    const saved = localStorage.getItem('prh_expiration');
    return saved ? parseInt(saved, 10) : Date.now() + (30 * 24 * 60 * 60 * 1000);
  });
  const [codeRecharge, setCodeRecharge] = useState('');

  const [historiquePointages, setHistoriquePointages] = useState<PointageRecord[]>([]);
  const [alerte, setAlerte] = useState<{ visible: boolean; titre: string; message: string }>({
    visible: false, titre: '', message: ''
  });
  const [confirmationVidage, setConfirmationVidage] = useState(false);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const entUrl = params.get('entreprise');

    if (entUrl) {
      setEntrepriseActive(entUrl);
      localStorage.setItem('prh_entreprise', entUrl);
    } else {
      const savedEnt = localStorage.getItem('prh_entreprise');
      if (savedEnt) setEntrepriseActive(savedEnt);
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'entreprises'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: EntrepriseRecord[] = snapshot.docs.map(d => ({
        id: d.id,
        nom: d.data().nom,
        dateExpiration: d.data().dateExpiration
      }));
      setEntreprises(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!entrepriseActive) return;

    const q = query(
      collection(db, 'pointages'),
      where('entreprise', '==', entrepriseActive)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data: PointageRecord[] = snapshot.docs.map(docSnap => {
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
      setHistoriquePointages(data);
    });

    return () => unsub();
  }, [entrepriseActive]);

  const afficherMessage = (titre: string, message: string) => {
    setAlerte({ visible: true, titre, message });
  };

  const calculerDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const creerNouvelleEntreprise = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomClean = nouvelleEntInput.trim();
    if (!nomClean) return;

    try {
      await setDoc(doc(db, 'entreprises', nomClean), { 
        nom: nomClean, 
        dateCreation: new Date(),
        dateExpiration: Date.now() + (30 * 24 * 60 * 60 * 1000)
      });
      setEntrepriseActive(nomClean);
      localStorage.setItem('prh_entreprise', nomClean);
      setNouvelleEntInput('');
      afficherMessage('Succès', `Entreprise "${nomClean}" enregistrée.`);
    } catch {
      afficherMessage('Erreur', 'Impossible de créer l\'entreprise.');
    }
  };

  const effectuerPointage = (type: 'Arrivée' | 'Départ') => {
    if (!entrepriseActive) {
      afficherMessage('Attention', 'Veuillez sélectionner une entreprise.');
      return;
    }
    if (!nomSaisi.trim()) {
      afficherMessage('Attention', 'Veuillez saisir votre Nom et Prénom.');
      return;
    }

    if (Date.now() > expiration) {
      afficherMessage('Expiré', 'Votre abonnement est expiré. Rendez-vous dans l\'onglet Service.');
      return;
    }

    setEnCours(true);
    let execute = false;

    const enregistrerFirebase = async (lat?: number, lng?: number) => {
      if (execute) return;
      execute = true;

      let dansZone = true;
      let dist = 0;
      let gpsStr = "GPS non disponible";

      if (lat !== undefined && lng !== undefined) {
        dist = calculerDistance(lat, lng, ZONE_LAT, ZONE_LNG);
        dansZone = dist <= RAYON_MAX_METRES;
        gpsStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

      const maintenant = new Date();
      const dateStr = maintenant.toLocaleDateString('fr-FR');
      const heureStr = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      try {
        await addDoc(collection(db, 'pointages'), {
          nom: nomSaisi.trim(),
          entreprise: entrepriseActive,
          type,
          heure: heureStr,
          date: dateStr,
          gps: gpsStr,
          estDansLaZone: dansZone,
          distanceMetres: dist
        });

        const sauvegardeNom = nomSaisi;
        setNomSaisi('');
        setEnCours(false);
        afficherMessage('Validé', `Pointage d'${type} enregistré pour ${sauvegardeNom}.`);
      } catch {
        setEnCours(false);
        afficherMessage('Erreur', 'Échec de l\'enregistrement cloud.');
      }
    };

    const securiteTimer = setTimeout(() => {
      enregistrerFirebase();
    }, 3000);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(securiteTimer);
          enregistrerFirebase(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          clearTimeout(securiteTimer);
          enregistrerFirebase();
        },
        { timeout: 2500, enableHighAccuracy: true }
      );
    } else {
      clearTimeout(securiteTimer);
      enregistrerFirebase();
    }
  };

  const validerCodeAbonnement = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = codeRecharge.trim().toUpperCase();

    if (CODES_VALIDES.includes(cleanCode)) {
      const nouvelleExp = Date.now() + (30 * 24 * 60 * 60 * 1000);
      setExpiration(nouvelleExp);
      localStorage.setItem('prh_expiration', nouvelleExp.toString());
      setCodeRecharge('');
      afficherMessage('Activé', 'Abonnement prolongé de 30 jours avec succès !');
    } else {
      afficherMessage('Invalide', 'Le code de recharge est incorrect.');
    }
  };

  const copierLien = () => {
    const url = `${window.location.origin}?entreprise=${encodeURIComponent(entrepriseActive)}`;
    navigator.clipboard.writeText(url);
    afficherMessage('Copié', 'Le lien d\'accès employé a été copié.');
  };

  const copierRapport = () => {
    if (historiquePointages.length === 0) {
      afficherMessage('Vide', 'Aucun pointage à exporter.');
      return;
    }
    let texte = `📊 RAPPORT - ${entrepriseActive}\n\n`;
    historiquePointages.forEach((p, i) => {
      texte += `${i + 1}. ${p.nom} [${p.type}] - ${p.date} à ${p.heure}\n`;
    });
    navigator.clipboard.writeText(texte);
    afficherMessage('Copié', 'Rapport copié dans le presse-papier.');
  };

  const viderHistoriqueCloud = async () => {
    try {
      const q = query(collection(db, 'pointages'), where('entreprise', '==', entrepriseActive));
      const snap = await getDocs(q);
      const promesses = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(promesses);

      setConfirmationVidage(false);
      afficherMessage('Effacé', 'L\'historique a été réinitialisé.');
    } catch {
      setConfirmationVidage(false);
      afficherMessage('Erreur', 'Impossible de vider l\'historique.');
    }
  };

  const joursRestants = Math.max(0, Math.ceil((expiration - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'sans-serif' }}>
      <header style={{ backgroundColor: '#0f172a', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px' }}>Pointage-RH</h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>{entrepriseActive || 'Sélectionnez une entreprise'}</p>
        </div>
        <div style={{ backgroundColor: '#16a34a', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
          {joursRestants}j restants
        </div>
      </header>

      <div style={{ display: 'flex', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <button onClick={() => setOngletActif('pointage')} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontWeight: 'bold', color: ongletActif === 'pointage' ? '#2563eb' : '#64748b', borderBottom: ongletActif === 'pointage' ? '2px solid #2563eb' : 'none', cursor: 'pointer' }}>Pointage</button>
        <button onClick={() => setOngletActif('admin')} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontWeight: 'bold', color: ongletActif === 'admin' ? '#2563eb' : '#64748b', borderBottom: ongletActif === 'admin' ? '2px solid #2563eb' : 'none', cursor: 'pointer' }}>Admin</button>
        <button onClick={() => setOngletActif('abonnement')} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontWeight: 'bold', color: ongletActif === 'abonnement' ? '#2563eb' : '#64748b', borderBottom: ongletActif === 'abonnement' ? '2px solid #2563eb' : 'none', cursor: 'pointer' }}>Service</button>
      </div>

      <main style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
        {ongletActif === 'pointage' && (
          <div>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Mon Entreprise :</label>
              <select value={entrepriseActive} onChange={(e) => { setEntrepriseActive(e.target.value); localStorage.setItem('prh_entreprise', e.target.value); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <option value="">-- Choisir une entreprise --</option>
                {entreprises.map((ent) => (
                  <option key={ent.id} value={ent.nom}>{ent.nom}</option>
                ))}
              </select>
            </div>

            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', marginTop: 0 }}>Effectuer un pointage</h2>
              <input type="text" placeholder="Entrez votre Nom & Prénom" value={nomSaisi} onChange={(e) => setNomSaisi(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" disabled={enCours} onClick={() => effectuerPointage('Arrivée')} style={{ flex: 1, padding: '14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: enCours ? 0.6 : 1 }}>
                  {enCours ? '...' : 'ARRIVÉE'}
                </button>
                <button type="button" disabled={enCours} onClick={() => effectuerPointage('Départ')} style={{ flex: 1, padding: '14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: enCours ? 0.6 : 1 }}>
                  {enCours ? '...' : 'DÉPART'}
                </button>
              </div>
            </div>

            {entrepriseActive && (
              <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '14px', marginTop: 0, color: '#64748b' }}>Derniers pointages</h3>
                {historiquePointages.length === 0 ? <p style={{ fontSize: '13px', color: '#94a3b8' }}>Aucun enregistrement pour le moment.</p> : (
                  historiquePointages.slice(0, 5).map(item => (
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

        {ongletActif === 'admin' && (
          <div>
            {!isAdminConnecte ? (
              <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '16px', marginTop: 0 }}>Connexion Admin</h2>
                <form onSubmit={(e) => { e.preventDefault(); codeAdmin === 'admin123' ? setIsAdminConnecte(true) : setErreurCodeAdmin('Code incorrect (admin123)'); }}>
                  <input type="password" placeholder="Code admin" value={codeAdmin} onChange={(e) => setCodeAdmin(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' }} />
                  {erreurCodeAdmin && <p style={{ color: 'red', fontSize: '12px' }}>{erreurCodeAdmin}</p>}
                  <button type="submit" style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Se connecter</button>
                </form>
              </div>
            ) : (
              <div>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14px', marginTop: 0 }}>Ajouter une entreprise</h3>
                  <form onSubmit={creerNouvelleEntreprise} style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="Nom de l'entreprise" value={nouvelleEntInput} onChange={(e) => setNouvelleEntInput(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    <button type="submit" style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Créer</button>
                  </form>
                </div>

                {entrepriseActive && (
                  <div>
                    <button type="button" onClick={copierLien} style={{ width: '100%', padding: '12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginBottom: '10px', cursor: 'pointer' }}>🔗 Copier le lien employés</button>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="button" onClick={copierRapport} style={{ flex: 1, padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>📋 Rapport</button>
                      <button type="button" onClick={() => setConfirmationVidage(true)} style={{ flex: 1, padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Vider</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {ongletActif === 'abonnement' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', marginTop: 0 }}>Support & Activation</h2>
              <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>Contactez le support technique pour vos codes d'activation :</p>
              
              <a
                href={`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent('Bonjour, je souhaite renouveler mon abonnement Pointage-RH.')}`}
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
                💬 WhatsApp (+243 {NUMERO_WHATSAPP})
              </a>
            </div>

            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', marginTop: 0 }}>Entrer un code de recharge</h3>
              <form onSubmit={validerCodeAbonnement} style={{ marginTop: '12px' }}>
                <input type="text" placeholder="Code (ex: RH2026-A1X9)" value={codeRecharge} onChange={(e) => setCodeRecharge(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' }} />
                <button type="submit" style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Activer</button>
              </form>
            </div>
          </div>
        )}
      </main>

      {confirmationVidage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', maxWidth: '300px', width: '100%' }}>
            <h3 style={{ marginTop: 0, color: '#dc2626' }}>Vider l'historique ?</h3
