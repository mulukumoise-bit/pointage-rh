import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, query, orderBy, getDocs, where, setDoc, doc, writeBatch } from 'firebase/firestore';

interface Pointage {
  id: string;
  nom: string;
  entreprise: string;
  type: 'Arrivée' | 'Départ';
  heure: string;
  date: string;
  gps: string;
  estDansLaZone: boolean;
}

interface Entreprise {
  id: string;
  nom: string;
}

export default function App() {
  const NUMERO_AIRTEL = "+243995473958";
  const NUMERO_WHATSAPP = "243995473958";
  const ZONE_LAT = -11.6609;
  const ZONE_LNG = 27.4794;
  const RAYON_MAX = 100;

  const [codesAbonnement, setCodesAbonnement] = useState<string[]>([
    'RH2026-A1X9', 'RH2026-B0Z2', 'RH2026-C3M7', 'RH2026-D4K0', 'RH2026-E9P5'
  ]);

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
    return saved ? parseInt(saved, 10) : Date.now() + 30 * 24 * 60 * 60 * 1000;
  });
  const [codeSaisiAbonnement, setCodeSaisiAbonnement] = useState('');
  const [erreurAbonnement, setErreurAbonnement] = useState('');

  const [historique, setHistorique] = useState<Pointage[]>([]);
  const [modaleInfo, setModaleInfo] = useState<{ ouverte: boolean; titre: string; text: string; type: 'succes' | 'erreur' | 'info' }>({
    ouverte: false, titre: '', text: '', type: 'info'
  });
  const [modaleConfirmationVidage, setModaleConfirmationVidage] = useState(false);

  // 1. Détection automatique du nom d'entreprise via l'URL (?entreprise=Nom) ou LocalStorage
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

  // 2. Charger la liste globale des entreprises enregistrées dans Cloud Firebase
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

  // 3. Charger en temps réel les pointages filtrés par l'entreprise sélectionnée
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

      // Tri par date et heure
      data.sort((a, b) => b.id.localeCompare(a.id));
      setHistorique(data);
    });

    return () => unsubscribe();
  }, [nomEntreprise]);

  const notifier = (titre: string, text: string, type: 'succes' | 'erreur' | 'info' = 'info') => {
    setModaleInfo({ ouverte: true, titre, text, type });
  };

  // Créer une entreprise côté Chef (Admin)
  const InscrireEntreprise = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomClean = nouvelleEntrepriseInput.trim();
    if (!nomClean) return;

    try {
      await setDoc(doc(db, 'entreprises', nomClean), { nom: nomClean, dateCreation: new Date() });
      setNomEntreprise(nomClean);
      localStorage.setItem('prh_entreprise', nomClean);
      setNouvelleEntrepriseInput('');
      notifier('Entreprise Créée !', `Espace "${nomClean}" activé avec succès.`, 'succes');
    } catch (err) {
      notifier('Erreur', 'Impossible de créer l\'entreprise dans le Cloud.', 'erreur');
    }
  };

  const ChangerEntreprise = (nouveauNom: string) => {
    setNomEntreprise(nouveauNom);
    localStorage.setItem('prh_entreprise', nouveauNom);
  };

  // Enregistrer le pointage pour l'entreprise sélectionnée
  const EnregistrerPointage = async (type: 'Arrivée' | 'Départ') => {
    if (!nomEntreprise) {
      notifier('Entreprise requise', 'Veuillez sélectionner votre entreprise avant de pointer.', 'erreur');
      return;
    }
    if (!nomEmploye.trim()) {
      notifier('Champ Requis', 'Veuillez saisir votre Nom et Prénom.', 'erreur');
      return;
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
        gps: `${ZONE_LAT.toFixed(4)}, ${ZONE_LNG.toFixed(4)}`,
        estDansLaZone: true
      });

      const userSaved = nomEmploye;
      setNomEmploye('');
      notifier('Pointage Enregistré', `Pointage d'${type} validé pour ${userSaved} chez ${nomEntreprise}.`, 'succes');
    } catch (err) {
      notifier('Erreur Cloud', 'Impossible d\'enregistrer le pointage.', 'erreur');
    }
  };

  const GenererLienEmploye = () => {
    const url = `${window.location.origin}?entreprise=${encodeURIComponent(nomEntreprise)}`;
    navigator.clipboard.writeText(url);
    notifier('Lien Copié !', `Envoyez ce lien à vos employés par WhatsApp :\n${url}`, 'succes');
  };

  const CopierRapport = () => {
    if (historique.length === 0) {
      notifier('Données vides', 'Aucun pointage disponible à copier.', 'info');
      return;
    }
    let texteRapport = `📋 RAPPORT DE POINTAGE - ${nomEntreprise}\n\n`;
    historique.forEach((p, idx) => {
      texteRapport += `${idx + 1}. ${p.nom} - ${p.type.toUpperCase()}\n   Le ${p.date} à ${p.heure}\n\n`;
    });
    navigator.clipboard.writeText(texteRapport);
    notifier('Copié !', 'Rapport copié dans le presse-papiers.', 'succes');
  };

  const ViderHistoriqueCloud = async () => {
    try {
      const q = query(collection(db, 'pointages'), where('entreprise', '==', nomEntreprise));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      setModaleConfirmationVidage(false);
      notifier('Historique vidé', `Tous les pointages de ${nomEntreprise} ont été effacés.`, 'succes');
    } catch (err) {
      notifier('Erreur', 'Impossible de vider l\'historique.', 'erreur');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ backgroundColor: '#0f172a', color: '#fff', padding: '16px 20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Pointage-RH Cloud</h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
              {nomEntreprise ? `Entreprise : ${nomEntreprise}` : 'Aucune entreprise sélectionnée'}
            </p>
          </div>
        </div>
      </header>

      {/* BARRE DE NAVIGATION */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex' }}>
          <button onClick={() => setOnglets('pointage')} style={{ flex: 1, padding: '14px 0', border: 'none', backgroundColor: 'transparent', borderBottom: onglets === 'pointage' ? '3px solid #2563eb' : 'none', fontWeight: '700', cursor: 'pointer' }}>📌 Pointage</button>
          <button onClick={() => setOnglets('admin')} style={{ flex: 1, padding: '14px 0', border: 'none', backgroundColor: 'transparent', borderBottom: onglets === 'admin' ? '3px solid #2563eb' : 'none', fontWeight: '700', cursor: 'pointer' }}>📊 Administration</button>
          <button onClick={() => setOnglets('abonnement')} style={{ flex: 1, padding: '14px 0', border: 'none', backgroundColor: 'transparent', borderBottom: onglets === 'abonnement' ? '3px solid #2563eb' : 'none', fontWeight: '700', cursor: 'pointer' }}>💳 Service</button>
        </div>
      </div>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px' }}>

        {/* ONGLET 1: POINTAGE EMPLOYÉ */}
        {onglets === 'pointage' && (
          <div>
            {/* SELECTION / LISTE ENTREPRISE */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                🏢 Sélectionnez votre Entreprise :
              </label>
              <select
                value={nomEntreprise}
                onChange={(e) => ChangerEntreprise(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', backgroundColor: '#f8fafc' }}
              >
                <option value="">-- Choisir dans la liste --</option>
                {listeEntreprises.map((ent) => (
                  <option key={ent.id} value={ent.nom}>{ent.nom}</option>
                ))}
              </select>
            </div>

            {/* FORMULAIRE POINTAGE */}
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
                <button onClick={() => EnregistrerPointage('Arrivée')} style={{ flex: 1, padding: '16px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>🟢 ARRIVÉE</button>
                <button onClick={() => EnregistrerPointage('Départ')} style={{ flex: 1, padding: '16px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>🔴 DÉPART</button>
              </div>
            </div>

            {/* DERNIERS POINTAGES EN DIRECT */}
            {nomEntreprise && (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '700', color: '#64748b' }}>Pointages Récents - {nomEntreprise}</h3>
                {historique.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>Aucun pointage trouvé.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {historique.slice(0, 5).map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                        <div>
                          <strong>{item.nom}</strong>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{item.date} à {item.heure}</div>
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
                {/* FORMULAIRE CRÉATION NOUVELLE ENTREPRISE */}
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
                    <button onClick={GenererLienEmploye} style={{ width: '100%', padding: '12px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', marginBottom: '16px', cursor: 'pointer' }}>
                      🔗 Copier le Lien WhatsApp pour les Employés ({nomEntreprise})
                    </button>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                      <button onClick={CopierRapport} style={{ flex: 1, padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700' }}>📋 Rapport RH</button>
                      <button onClick={() => setModaleConfirmationVidage(true)} style={{ flex: 1, padding: '12px', backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700' }}>🗑️ Vider</button>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                      <h3 style={{ marginTop: 0 }}>Historique Cloud - {nomEntreprise}</h3>
                      {historique.map((p) => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <div><strong>{p.nom}</strong> ({p.type})</div>
                          <small>{p.date} - {p.heure}</small>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ONGLET 3: SERVICE */}
        {onglets === 'abonnement' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <h3>📲 Service Client</h3>
            <p>Paiement Airtel Money : <strong>{NUMERO_AIRTEL}</strong></p>
          </div>
        )}

      </main>

      {/* MODALE NOTIFICATION */}
      {modaleInfo.ouverte && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%' }}>
            <h3>{modaleInfo.titre}</h3>
            <p style={{ whiteSpace: 'pre-line' }}>{modaleInfo.text}</p>
            <button onClick={() => setModaleInfo({ ...modaleInfo, ouverte: false })} style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
      }
    
