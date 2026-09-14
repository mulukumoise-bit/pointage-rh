import React, { useState, useEffect } from 'react';

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
  // --- CONFIGURATION ADMIN & PAIEMENT ---
  const numeroAirtel = '+243995473958';
  const numeroWhatsApp = '243995473958';
  
  // Coordonnées du lieu de travail
  const ZONE_TRAVAIL_LAT = -11.6609;
  const ZONE_TRAVAIL_LNG = 27.4794;
  const RAYON_MAX_METRES = 100;

  // Liste de codes d'activation uniques
  const [codesValides, setCodesValides] = useState<string[]>([
    'RH2026-A1X9', 'RH2026-B8Z2', 'RH2026-C3M7', 'RH2026-D4K0', 'RH2026-E9P5'
  ]);

  // --- ÉTATS GENERAL ---
  const [nomEntreprise, setNomEntreprise] = useState<string>('');
  const [estInscrit, setEstInscrit] = useState<boolean>(false);
  const [nomEmploye, setNomEmploye] = useState<string>('');

  // --- ETATS MODALES PERSONNALISÉES (Remplace les pop-ups natives) ---
  const [modaleAlerte, setModaleAlerte] = useState<{ ouverte: boolean; titre: string; message: string }>({
    ouverte: false,
    titre: '',
    message: ''
  });
  const [afficherModaleSuppression, setAfficherModaleSuppression] = useState<boolean>(false);

  // Gestion de l'abonnement (30 jours)
  const [dateExpiration, setDateExpiration] = useState<number | null>(null);
  const [abonnementActif, setAbonnementActif] = useState<boolean>(true);
  const [codeReabonnement, setCodeReabonnement] = useState<string>('');
  const [erreurCode, setErreurCode] = useState<string>('');

  // Historique et registre
  const [historique, setHistorique] = useState<Pointage[]>([]);
  const [registreRapports, setRegistreRapports] = useState<Pointage[]>([]);

  // Authentification Admin (admin123)
  const [codeAdmin, setCodeAdmin] = useState<string>('');
  const [estAdmin, setEstAdmin] = useState<boolean>(false);
  const [erreurAdmin, setErreurAdmin] = useState<string>('');

  useEffect(() => {
    if (dateExpiration) {
      const maintenant = Date.now();
      if (maintenant >= dateExpiration) {
        setAbonnementActif(false);
      }
    }
  }, [dateExpiration]);

  const afficherNotification = (titre: string, message: string) => {
    setModaleAlerte({ ouverte: true, titre, message });
  };

  const calculerDistanceMetres = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleCreationEntreprise = (e: React.FormEvent) => {
    e.preventDefault();
    if (nomEntreprise.trim()) {
      setEstInscrit(true);
      const dans30Jours = Date.now() + 30 * 24 * 60 * 60 * 1000;
      setDateExpiration(dans30Jours);
      setAbonnementActif(true);
    }
  };

  const handleRenouvellement = (e: React.FormEvent) => {
    e.preventDefault();
    const codeSaisi = codeReabonnement.trim().toUpperCase();

    if (codesValides.includes(codeSaisi)) {
      setCodesValides(codesValides.filter((c) => c !== codeSaisi));
      const nouveauDelai = Date.now() + 30 * 24 * 60 * 60 * 1000;
      setDateExpiration(nouveauDelai);
      setAbonnementActif(true);
      setCodeReabonnement('');
      setErreurCode('');
      afficherNotification('Succès', 'Abonnement renouvelé avec succès pour 30 jours !');
    } else {
      setErreurCode('Code invalide ou déjà utilisé.');
    }
  };

  const handleConnexionAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeAdmin === 'admin123') {
      setEstAdmin(true);
      setErreurAdmin('');
    } else {
      setErreurAdmin('Code incorrect. Accès refusé.');
    }
  };

  const fairePointage = (type: 'Arrivée' | 'Départ') => {
    const nomSaisi = nomEmploye.trim();
    if (!nomSaisi) {
      afficherNotification('Champ requis', 'Veuillez entrer votre nom avant de pointer.');
      return;
    }

    const nouveauId = Date.now().toString();
    const dateActuelle = new Date().toLocaleDateString('fr-FR');
    const heureActuelle = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setNomEmploye('');

    const initialLat = ZONE_TRAVAIL_LAT;
    const initialLng = ZONE_TRAVAIL_LNG;

    const nouveauPointage: Pointage = {
      id: nouveauId,
      nom: nomSaisi,
      type: type,
      heure: heureActuelle,
      date: dateActuelle,
      gps: `${initialLat.toFixed(4)}, ${initialLng.toFixed(4)}`,
      lat: initialLat,
      lng: initialLng,
      estDansLaZone: true
    };

    setHistorique((prev) => [nouveauPointage, ...prev]);
    setRegistreRapports((prev) => [nouveauPointage, ...prev]);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const distance = calculerDistanceMetres(lat, lng, ZONE_TRAVAIL_LAT, ZONE_TRAVAIL_LNG);
          const estDansZone = distance <= RAYON_MAX_METRES;
          const gpsFormate = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

          setHistorique((prev) =>
            prev.map((item) =>
              item.id === nouveauId
                ? { ...item, gps: gpsFormate, lat, lng, estDansLaZone: estDansZone }
                : item
            )
          );
          setRegistreRapports((prev) =>
            prev.map((item) =>
              item.id === nouveauId
                ? { ...item, gps: gpsFormate, lat, lng, estDansLaZone: estDansZone }
                : item
            )
          );
        },
        () => {},
        { enableHighAccuracy: true, timeout: 3000 }
      );
    }
  };

  const confirmerVidage = () => {
    setHistorique([]);
    setRegistreRapports([]);
    setAfficherModaleSuppression(false);
  };

  const ouvrirWhatsApp = () => {
    const message = encodeURIComponent(`Bonjour Service Client, je souhaite renouveler mon abonnement Pointage RH pour l'entreprise : ${nomEntreprise || 'Mon Entreprise'}`);
    window.open(`https://wa.me/${numeroWhatsApp}?text=${message}`, '_blank');
  };

  const joursRestants = dateExpiration
    ? Math.max(0, Math.ceil((dateExpiration - Date.now()) / (1000 * 60 * 60 * 24)))
    : 30;

  // ECRAN D'ABONNEMENT EXPIRÉ
  if (!abonnementActif) {
    return (
      <div style={{ padding: '25px', textAlign: 'center', backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <h2 style={{ color: '#dc3545', fontSize: '22px' }}>🔒 Abonnement Expiré</h2>
        <p style={{ color: '#6c757d', fontSize: '15px' }}>
          L'accès pour <strong>{nomEntreprise || 'votre entreprise'}</strong> est suspendu.
        </p>

        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #e9ecef', borderRadius: '12px', backgroundColor: '#ffffff', textAlign: 'left', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, textAlign: 'center', color: '#212529', fontSize: '18px' }}>Réactivation du Service</h3>
          
          <p style={{ fontSize: '14px', color: '#495057' }}>1. Règlement par <strong>Airtel Money</strong> au :</p>
          <div style={{ backgroundColor: '#e8f5e9', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px', color: '#2e7d32', marginBottom: '15px' }}>
            {numeroAirtel}
          </div>

          <p style={{ fontSize: '14px', color: '#495057' }}>2. Recevez votre code sur WhatsApp :</p>
          <button
            onClick={ouvrirWhatsApp}
            style={{ width: '100%', padding: '12px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            💬 Discuter avec le Service Client
          </button>

          <p style={{ fontSize: '14px', color: '#495057' }}>3. Entrez le code d'activation :</p>
          <form onSubmit={handleRenouvellement}>
            <input
              type="text"
              placeholder="Ex: RH2026-A1X9"
              value={codeReabonnement}
              onChange={(e) => setCodeReabonnement(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ced4da', boxSizing: 'border-box', fontSize: '16px', marginBottom: '10px', textTransform: 'uppercase' }}
              required
            />
            {erreurCode && <p style={{ color: '#dc3545', fontSize: '13px', marginTop: 0 }}>{erreurCode}</p>}
            <button
              type="submit"
              style={{ width: '100%', padding: '12px', backgroundColor: '#0d6efd', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
            >
              Débloquer 30 Jours
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ECRAN CRÉATION D'ENTREPRISE
  if (!estInscrit) {
    return (
      <div style={{ padding: '30px 20px', maxWidth: '400px', margin: 'auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <h2 style={{ textAlign: 'center', color: '#212529' }}>Créer votre Entreprise</h2>
        <form onSubmit={handleCreationEntreprise}>
          <input
            type="text"
            placeholder="Nom de votre entreprise"
            value={nomEntreprise}
            onChange={(e) => setNomEntreprise(e.target.value)}
            style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ced4da', boxSizing: 'border-box', fontSize: '16px' }}
            required
          />
          <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#0d6efd', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
            Valider et Continuer
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '15px', maxWidth: '600px', margin: 'auto', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#212529' }}>
      <header style={{ borderBottom: '1px solid #e9ecef', paddingBottom: '12px', marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700' }}>Pointage-RH</h1>
        <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>Entreprise : <strong>{nomEntreprise}</strong></p>
        <span style={{ fontSize: '12px', backgroundColor: '#e7f1ff', color: '#0c63e4', padding: '4px 10px', borderRadius: '12px', marginTop: '8px', display: 'inline-block', fontWeight: '600' }}>
          Abonnement : {joursRestants} jour(s) restant(s)
        </span>
      </header>

      {/* ESPACE EMPLOYÉ */}
      <section style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e9ecef', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <h3 style={{ marginTop: 0, fontSize: '16px', color: '#495057' }}>Espace Employé</h3>
        <input
          type="text"
          placeholder="Entrez votre nom complet"
          value={nomEmploye}
          onChange={(e) => setNomEmploye(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ced4da', boxSizing: 'border-box', fontSize: '16px' }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => fairePointage('Arrivée')} 
            style={{ flex: 1, padding: '12px', backgroundColor: '#198754', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}
          >
            Arrivée
          </button>
          <button 
            onClick={() => fairePointage('Départ')} 
            style={{ flex: 1, padding: '12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}
          >
            Départ
          </button>
        </div>
      </section>

      {/* ESPACE ADMINISTRATEUR */}
      <section style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e9ecef', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <h3 style={{ marginTop: 0, fontSize: '16px', color: '#495057' }}>Espace Administrateur</h3>
        {!estAdmin ? (
          <form onSubmit={handleConnexionAdmin}>
            <input
              type="password"
              placeholder="Entrez le code d'accès admin"
              value={codeAdmin}
              onChange={(e) => setCodeAdmin(e.target.value)}
              style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ced4da', boxSizing: 'border-box' }}
            />
            {erreurAdmin && <p style={{ color: '#dc3545', marginTop: 0, fontSize: '13px' }}>{erreurAdmin}</p>}
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#212529', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              Déverrouiller le Tableau de Bord
            </button>
          </form>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ color: '#198754', fontWeight: '600', fontSize: '14px' }}>✓ Accès Admin Actif</span>
              {historique.length > 0 && (
                <button 
                  onClick={() => setAfficherModaleSuppression(true)}
                  style={{ padding: '6px 12px', backgroundColor: '#fff3cd', color: '#664d03', border: '1px solid #ffecb5', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                >
                  🗑️ Vider l'historique
                </button>
              )}
            </div>
            
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Historique en Direct</h4>

            {/* TABLEAU PROFESSIONNEL ERGONOMIQUE */}
            {historique.length === 0 ? (
              <p style={{ color: '#6c757d', fontSize: '14px', textAlign: 'center', padding: '20px', border: '1px dashed #dee2e6', borderRadius: '8px' }}>
                Aucun enregistrement de pointage.
              </p>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e9ecef', color: '#495057' }}>
                      <th style={{ padding: '10px 12px' }}>Horodatage</th>
                      <th style={{ padding: '10px 12px' }}>Employé</th>
                      <th style={{ padding: '10px 12px' }}>Type</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Localisation GPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historique.map((p, index) => (
                      <tr 
                        key={p.id} 
                        style={{ 
                          borderBottom: index !== historique.length - 1 ? '1px solid #f1f3f5' : 'none',
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa'
                        }}
                      >
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: '600' }}>{p.heure}</div>
                          <div style={{ fontSize: '11px', color: '#6c757d' }}>{p.date}</div>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: '600', color: '#212529' }}>
                          {p.nom}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '12px', 
                            fontSize: '11px', 
                            fontWeight: '700',
                            backgroundColor: p.type === 'Arrivée' ? '#d1e7dd' : '#f8d7da',
                            color: p.type === 'Arrivée' ? '#0f5132' : '#842029'
                          }}>
                            {p.type}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <a
                            href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              textDecoration: 'none',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              display: 'inline-block',
                              backgroundColor: p.estDansLaZone ? '#f8f9fa' : '#dc3545',
                              color: p.estDansLaZone ? '#212529' : '#ffffff',
                              border: p.estDansLaZone ? '1px solid #dee2e6' : 'none'
                            }}
                          >
                            📍 {p.gps} {p.estDansLaZone ? '' : '⚠️ (Hors Zone)'}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#6c757d' }}>Données conservées : <strong>{registreRapports.length}</strong></span>
              <button 
                onClick={() => afficherNotification('Exportation', 'Le fichier CSV du rapport est en cours de téléchargement.')} 
                style={{ padding: '8px 12px', backgroundColor: '#0dcaf0', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
              >
                Télécharger le Rapport CSV
              </button>
            </div>
          </div>
        )}
      </section>

      {/* FOOTER WHATSAPP */}
      <footer style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e9ecef' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6c757d' }}>Assistance & Paiement Airtel Money : <strong>{numeroAirtel}</strong></p>
        <button 
          onClick={ouvrirWhatsApp}
          style={{ padding: '10px 20px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <span>💬</span> Contacter sur WhatsApp
        </button>
      </footer>

      {/* --- MODALE AVIS / ALERTE PERSONNALISÉE --- */}
      {modaleAlerte.ouverte && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyC
