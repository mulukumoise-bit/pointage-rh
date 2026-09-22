import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, query, where, setDoc, doc, getDocs, deleteDoc } from 'firebase/firestore';

interface EnregistrementMobile {
  id: string;
  salarie: string;
  org: string;
  mouvement: 'Arrivée' | 'Départ';
  horaireExact: string;
  dateJournee: string;
  coordonnees: string;
  zoneValide: boolean;
}

interface OrgItem {
  id: string;
  nom: string;
}

export default function ApplicationPointageRH() {
  const WHATSAPP_NUM = "2435473958";
  const COORD_REF_LAT = -11.6609;
  const COORD_REF_LNG = 27.4794;
  const RAYON_MAX = 100;
  const TOKENS_VALIDES = ['RH2026-A1X9', 'RH2026-B0Z2', 'RH2026-C3M7'];

  const [onglet, setOnglet] = useState<'accueil' | 'administration' | 'assistance'>('accueil');
  const [listeOrgs, setListeOrgs] = useState<OrgItem[]>([]);
  const [orgActive, setOrgActive] = useState<string>('');
  const [saisieNomOrg, setSaisieNomOrg] = useState<string>('');

  const [nomSalarie, setNomSalarie] = useState<string>('');
  const [codeAdminInput, setCodeAdminInput] = useState<string>('');
  const [isAdminConnecte, setIsAdminConnecte] = useState<boolean>(false);
  const [erreurAdmin, setErreurAdmin] = useState<string>('');

  const [expirationMs, setExpirationMs] = useState<number>(() => {
    const cached = localStorage.getItem('prh_exp');
    return cached ? parseInt(cached, 10) : Date.now() + (30 * 86400000);
  });
  const [tokenRecharge, setTokenRecharge] = useState<string>('');

  const [journalFlux, setJournalFlux] = useState<EnregistrementMobile[]>([]);
  const [alerteBox, setAlerteBox] = useState<{ visible: boolean; titre: string; message: string }>({
    visible: false, titre: '', message: ''
  });
  const [confirmationDel, setConfirmationDel] = useState<boolean>(false);
  const [enCoursTraitement, setEnCoursTraitement] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orgParam = params.get('entreprise');
    if (orgParam) {
      setOrgActive(orgParam);
      localStorage.setItem('prh_org', orgParam);
    } else {
      const saved = localStorage.getItem('prh_org');
      if (saved) setOrgActive(saved);
    }
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'entreprises')), (snap) => {
      const data: OrgItem[] = snap.docs.map(d => ({ id: d.id, nom: d.data().nom }));
      setListeOrgs(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!orgActive) return;
    const unsubPt = onSnapshot(query(collection(db, 'pointages'), where('entreprise', '==', orgActive)), (snap) => {
      const dataPt: EnregistrementMobile[] = snap.docs.map(d => {
        const item = d.data();
        return {
          id: d.id,
          salarie: item.nom || '',
          org: item.entreprise || '',
          mouvement: item.type || 'Arrivée',
          horaireExact: item.heure || '',
          dateJournee: item.date || '',
          coordonnees: item.gps || '',
          zoneValide: item.estDansLaZone ?? true
        };
      });
      dataPt.sort((a, b) => b.id.localeCompare(a.id));
      setJournalFlux(dataPt);
    });
    return () => unsubPt();
  }, [orgActive]);

  const afficherPopup = (titre: string, message: string) => {
    setAlerteBox({ visible: true, titre, message });
  };

  const calculerDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return Math.round(R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))));
  };

  const creerOrganisation = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomClean = saisieNomOrg.trim();
    if (!nomClean) return;
    try {
      await setDoc(doc(db, 'entreprises', nomClean), { nom: nomClean, creation: new Date() });
      setOrgActive(nomClean);
      localStorage.setItem('prh_org', nomClean);
      setSaisieNomOrg('');
      afficherPopup('Succès', `Structure ${nomClean} ajoutée.`);
    } catch {
      afficherPopup('Erreur', 'Impossible de créer la structure.');
    }
  };

  const soumettrePointage = (typeMvt: 'Arrivée' | 'Départ') => {
    if (!orgActive) {
      afficherPopup('Attention', 'Veuillez sélectionner une entreprise.');
      return;
    }
    if (!nomSalarie.trim()) {
      afficherPopup('Attention', 'Veuillez saisir votre nom et prénom.');
      return;
    }
    if (Date.now() > expirationMs) {
      afficherPopup('Abonnement expiré', 'Veuillez renouveler via l\'onglet Assistance.');
      return;
    }

    setEnCoursTraitement(true);
    let executionFaite = false;

    const enregistrerEnBD = async (lat?: number, lng?: number) => {
      if (executionFaite) return;
      executionFaite = true;

      let dansZone = true;
      let gpsStr = "Non disponible";

      if (lat !== undefined && lng !== undefined) {
        const dist = calculerDistance(lat, lng, COORD_REF_LAT, COORD_REF_LNG);
        dansZone = dist <= RAYON_MAX;
        gpsStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

      const maintenant = new Date();
      try {
        await addDoc(collection(db, 'pointages'), {
          nom: nomSalarie.trim(),
          entreprise: orgActive,
          type: typeMvt,
          heure: maintenant.toLocaleTimeString('fr-FR'),
          date: maintenant.toLocaleDateString('fr-FR'),
          gps: gpsStr,
          estDansLaZone: dansZone
        });
        const memo = nomSalarie;
        setNomSalarie('');
        setEnCoursTraitement(false);
        afficherPopup('Validé', `Pointage de ${typeMvt} enregistré pour ${memo}.`);
      } catch {
        setEnCoursTraitement(false);
        afficherPopup('Erreur', 'Échec de l\'enregistrement distant.');
      }
    };

    const securiteTimer = setTimeout(() => enregistrerEnBD(), 3000);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(securiteTimer);
          enregistrerEnBD(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          clearTimeout(securiteTimer);
          enregistrerEnBD();
        },
        { timeout: 2500, enableHighAccuracy: true }
      );
    } else {
      clearTimeout(securiteTimer);
      enregistrerEnBD();
    }
  };

  const verifierCodeRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (TOKENS_VALIDES.includes(tokenRecharge.trim().toUpperCase())) {
      const nouvelleExp = Date.now() + (30 * 86400000);
      setExpirationMs(nouvelleExp);
      localStorage.setItem('prh_exp', nouvelleExp.toString());
      setTokenRecharge('');
      afficherPopup('Activé', 'Abonnement prolongé de 30 jours !');
    } else {
      afficherPopup('Erreur', 'Code de recharge invalide.');
    }
  };

  const copierLienEmployes = () => {
    const lien = `${window.location.origin}?entreprise=${encodeURIComponent(orgActive)}`;
    navigator.clipboard.writeText(lien);
    afficherPopup('Copié', 'Lien d\'accès copié dans le presse-papier.');
  };

  const viderHistoriqueOrg = async () => {
    try {
      const q = query(collection(db, 'pointages'), where('entreprise', '==', orgActive));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      setConfirmationDel(false);
      afficherPopup('Nettoyé', 'L\'historique a été réinitialisé.');
    } catch {
      setConfirmationDel(false);
      afficherPopup('Erreur', 'Impossible de vider l\'historique.');
    }
  };

  const joursRestants = Math.max(0, Math.ceil((expirationMs - Date.now()) / 86400000));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ background: '#0f172a', color: '#fff', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '17px' }}>Pointage-RH</h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>{orgActive || 'Aucune entreprise sélectionnée'}</p>
        </div>
        <span style={{ background: '#16a34a', color: '#fff', padding: '4px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
          {joursRestants}j restants
        </span>
      </header>

      <nav style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #cbd5e1' }}>
        <button onClick={() => setOnglet('accueil')} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontWeight: 'bold', color: onglet === 'accueil' ? '#2563eb' : '#64748b', borderBottom: onglet === 'accueil' ? '2px solid #2563eb' : 'none' }}>Pointage</button>
        <button onClick={() => setOnglet('administration')} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontWeight: 'bold', color: onglet === 'administration' ? '#2563eb' : '#64748b', borderBottom: onglet === 'administration' ? '2px solid #2563eb' : 'none' }}>Admin</button>
        <button onClick={() => setOnglet('assistance')} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontWeight: 'bold', color: onglet === 'assistance' ? '#2563eb' : '#64748b', borderBottom: onglet === 'assistance' ? '2px solid #2563eb' : 'none' }}>Assistance</button>
      </nav>

      <main style={{ padding: '15px', maxWidth: '500px', margin: '0 auto' }}>
        {onglet === 'accueil' && (
          <div>
            <div style={{ background: '#fff', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Sélectionner l'entreprise :</label>
              <select value={orgActive} onChange={(e) => { setOrgActive(e.target.value); localStorage.setItem('prh_org', e.target.value); }} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="">-- Choisir --</option>
                {listeOrgs.map(o => <option key={o.id} value={o.nom}>{o.nom}</option>)}
              </select>
            </div>

            <div style={{ background: '#fff', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '15px', marginTop: 0 }}>Enregistrer un mouvement</h2>
              <input type="text" placeholder="Nom et Prénom" value={nomSalarie} onChange={(e) => setNomSalarie(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button disabled={enCoursTraitement} onClick={() => soumettrePointage('Arrivée')} style={{ flex: 1, padding: '12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', opacity: enCoursTraitement ? 0.5 : 1 }}>ARRIVÉE</button>
                <button disabled={enCoursTraitement} onClick={() => soumettrePointage('Départ')} style={{ flex: 1, padding: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', opacity: enCoursTraitement ? 0.5 : 1 }}>DÉPART</button>
              </div>
            </div>

            {orgActive && (
              <div style={{ background: '#fff', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '13px', marginTop: 0, color: '#64748b' }}>Derniers pointages</h3>
                {journalFlux.length === 0 ? <p style={{ fontSize: '12px', color: '#94a3b8' }}>Aucun pointage récent.</p> : (
                  journalFlux.slice(0, 4).map(item => (
                    <div key={item.id} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <div><strong>{item.salarie}</strong> ({item.mouvement})<br/><span style={{ color: '#94a3b8', fontSize: '10px' }}>{item.dateJournee} - {item.horaireExact}</span></div>
                      <span style={{ color: item.zoneValide ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>{item.zoneValide ? 'OK' : 'Hors zone'}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {onglet === 'administration' && (
          <div>
            {!isAdminConnecte ? (
              <div style={{ background: '#fff', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '15px', marginTop: 0 }}>Espace Administrateur</h2>
                <form onSubmit={(e) => { e.preventDefault(); codeAdminInput === 'admin123' ? setIsAdminConnecte(true) : setErreurAdmin('Code erroné (admin123)'); }}>
                  <input type="password" placeholder="Mot de passe admin" value={codeAdminInput} onChange={(e) => setCodeAdminInput(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '8px', boxSizing: 'border-box' }} />
                  {erreurAdmin && <p style={{ color: 'red', fontSize: '11px' }}>{erreurAdmin}</p>}
                  <button type="submit" style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Connexion</button>
                </form>
              </div>
            ) : (
              <div>
                <div style={{ background: '#fff', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14px', marginTop: 0 }}>Créer une entreprise</h3>
                  <form onSubmit={creerOrganisation} style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="Nom de l'entreprise" value={saisieNomOrg} onChange={(e) => setSaisieNomOrg(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <button type="submit" style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Créer</button>
                  </form>
                </div>
                {orgActive && (
                  <div>
                    <button onClick={copierLienEmployes} style={{ width: '100%', padding: '10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', marginBottom: '10px' }}>Copier le lien d'accès</button>
                    <button onClick={() => setConfirmationDel(true)} style={{ width: '100%', padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Vider l'historique</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {onglet === 'assistance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ background: '#fff', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '15px', marginTop: 0 }}>Service & Support</h2>
              <a href={`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent('Bonjour, je souhaite un code d\'activation.')}`} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', background: '#25D366', color: '#fff', padding: '12px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', marginTop: '10px' }}>
                Contact WhatsApp
              </a>
            </div>
            <div style={{ background: '#fff', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', marginTop: 0 }}>Entrer un code d'activation</h3>
              <form onSubmit={verifierCodeRecharge}>
                <input type="text" placeholder="Code (ex: RH2026-A1X9)" value={tokenRecharge} onChange={(e) => setTokenRecharge(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' }} />
                <button type="submit" style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Activer</button>
              </form>
            </div>
          </div>
        )}
      </main>

      {confirmationDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', width: '100%', maxWidth: '280px' }}>
            <h3 style={{ marginTop: 0, color: '#dc2626', fontSize: '15px' }}>Confirmer la suppression ?</h3>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={() => setConfirmationDel(false)} style={{ flex: 1, padding: '8px', background: '#e2e8f0', border: 'none', borderRadius: '6px' }}>Annuler</button>
              <button onClick={viderHistoriqueOrg} style={{ flex: 1, padding: '8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px' }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {alerteBox.visible && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', width: '100%', maxWidth: '280px' }}>
            <h3 style={{ marginTop: 0, fontSize: '15px' }}>{alerteBox.titre}</h3>
            <p style={{ fontSize: '12px', color: '#475569' }}>{alerteBox.message}</p>
            <button onClick={() => setAlerteBox({ ...alerteBox, visible: false })} style={{ width: '100%', padding: '8px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', marginTop: '10px' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
      }
                             
