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
  const numeroWhatsApp = '243995473958'; // Sans le signe + pour le lien WhatsApp
  
  // Coordonnées du lieu de travail (Exemple : Lubumbashi)
  const ZONE_TRAVAIL_LAT = -11.6609;
  const ZONE_TRAVAIL_LNG = 27.4794;
  const RAYON_MAX_METRES = 100; // Rayon autorisé en mètres

  // Liste de codes d'activation uniques (à donner au client un par un)
  const [codesValides, setCodesValides] = useState<string[]>([
    'RH2026-A1X9', 'RH2026-B8Z2', 'RH2026-C3M7', 'RH2026-D4K0', 'RH2026-E9P5'
  ]);

  // --- ÉTATS ---
  const [nomEntreprise, setNomEntreprise] = useState<string>('');
  const [estInscrit, setEstInscrit] = useState<boolean>(false);
  const [nomEmploye, setNomEmploye] = useState<string>('');

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

  // Vérification de l'échéance des 30 jours
  useEffect(() => {
    if (dateExpiration) {
      const maintenant = Date.now();
      if (maintenant >= dateExpiration) {
        setAbonnementActif(false);
      }
    }
  }, [dateExpiration]);

  // Distance GPS (Haversine)
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
      alert('Abonnement renouvelé avec succès pour 30 jours !');
    } else {
      setErreurCode('Code invalide ou déjà utilisé. Contactez le Service Client.');
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
      alert('Veuillez entrer votre nom avant de pointer.');
      return;
    }

    const nouveauId = Date.now().toString();
    const dateActuelle = new Date().toLocaleDateString('fr-FR');
    const heureActuelle = new Date().toLocaleTimeString('fr-FR');

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

  const viderHistorique = () => {
    if (window.confirm('Voulez-vous vraiment effacer tout l\'historique et le registre ?')) {
      setHistorique([]);
      setRegistreRapports([]);
    }
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
      <div style={{ padding: '25px', textAlign: 'center', backgroundColor: '#fff0f0', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: '#d32f2f', fontSize: '22px' }}>🔒 Abonnement Expiré (30 jours)</h2>
        <p style={{ color: '#555', fontSize: '15px' }}>
          L'accès à l'application pour <strong>{nomEntreprise || 'votre entreprise'}</strong> est suspendu.
        </p>

        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ffcdd2', borderRadius: '12px', backgroundColor: '#fff', textAlign: 'left' }}>
          <h3 style={{ marginTop: 0, textAlign: 'center', color: '#d32f2f' }}>Procédure de Réactivation</h3>
          
          <p style={{ fontSize: '14px', color: '#333' }}>
            1. Envoyez le paiement via <strong>Airtel Money</strong> au :
          </p>
          <div style={{ backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px', color: '#2e7d32', marginBottom: '15px' }}>
            {numeroAirtel}
          </div>

          <p style={{ fontSize: '14px', color: '#333' }}>
            2. Contactez-nous sur WhatsApp pour obtenir votre code d'activation :
          </p>
          <button
            onClick={ouvrirWhatsApp}
            style={{ width: '100%', padding: '12px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span>💬</span> Contacter le Service Client sur WhatsApp
          </button>

          <p style={{ fontSize: '14px', color: '#333' }}>
            3. Entrez le code d'activation reçu :
          </p>
          <form onSubmit={handleRenouvellement}>
            <input
              type="text"
              placeholder="Ex: RH2026-A1X9"
              value={codeReabonnement}
              onChange={(e) => setCodeReabonnement(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '16px', marginBottom: '10px', textTransform: 'uppercase' }}
              required
            />
            {erreurCode && <p style={{ color: 'red', fontSize: '13px', marginTop: 0 }}>{erreurCode}</p>}
            <button
              type="submit"
              style={{ width: '100%', padding: '12px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
            >
              Débloquer pour 30 jours
            </button>
          </form>
        </div>

        <button 
          onClick={() => setAbonnementActif(true)} 
          style={{ marginTop: '25px', background: 'none', border: 'none', color: '#888', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}
        >
          [Mode Débogage Admin]
        </button>
      </div>
    );
  }

  // ECRAN CRÉATION D'ENTREPRISE
  if (!estInscrit) {
    return (
      <div style={{ padding: '25px', maxWidth: '400px', margin: 'auto', fontFamily: 'sans-serif' }}>
        <h2 style={{ textAlign: 'center' }}>Créer votre Entreprise</h2>
        <form onSubmit={handleCreationEntreprise}>
          <input
            type="text"
            placeholder="Nom de votre entreprise"
            value={nomEntreprise}
            onChange={(e) => setNomEntreprise(e.target.value)}
            style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '16px' }}
            required
          />
          <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
            Valider et Débuter (30 Jours Offerts)
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 5px 0' }}>Pointage-RH</h1>
        <p style={{ margin: 0, color: '#555' }}>Entreprise : <strong>{nomEntreprise}</strong></p>
        <span style={{ fontSize: '12px', backgroundColor: '#e3f2fd', color: '#0d47a1', padding: '3px 8px', borderRadius: '10px', marginTop: '5px', display: 'inline-block' }}>
          Abonnement : {joursRestants} jour(s) restant(s)
        </span>
      </header>

      {/* ESPACE EMPLOYÉ */}
      <section style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #e0e0e0' }}>
        <h3 style={{ marginTop: 0 }}>Espace Employé</h3>
        <input
          type="text"
          placeholder="Entrez votre nom complet"
          value={nomEmploye}
          onChange={(e) => setNomEmploye(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '16px' }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => fairePointage('Arrivée')} 
            style={{ flex: 1, padding: '12px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
          >
            Arrivée
          </button>
          <button 
            onClick={() => fairePointage('Départ')} 
            style={{ flex: 1, padding: '12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
          >
            Départ
          </button>
        </div>
      </section>

      {/* ESPACE ADMINISTRATEUR */}
      <section style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Espace Administrateur</h3>
        {!estAdmin ? (
          <form onSubmit={handleConnexionAdmin}>
            <input
              type="password"
              placeholder="Entrez le code d'accès"
              value={codeAdmin}
              onChange={(e) => setCodeAdmin(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
            {erreurAdmin && <p style={{ color: 'red', marginTop: 0 }}>{erreurAdmin}</p>}
            <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Déverrouiller l'Historique
            </button>
          </form>
        ) : (
          <div>
            <p style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Accès Administrateur Déverrouillé</p>
            
            <h4>Historique en Direct</h4>
            {historique.length === 0 ? (
              <p style={{ color: '#777' }}>Aucun pointage récent.</p>
            ) : (
              <ul style={{ paddingLeft: '0', listStyle: 'none', maxHeight: '250px', overflowY: 'auto' }}>
                {historique.map((p) => (
                  <li 
                    key={p.id} 
                    style={{ 
                      marginBottom: '10px', 
                      padding: '10px', 
                      borderRadius: '6px', 
                      border: '1px solid #eee',
                      backgroundColor: p.estDansLaZone ? '#ffffff' : '#ffebee' 
                    }}
                  >
                    <div>
                      <strong>{p.date}</strong> à <strong>{p.heure}</strong> - <strong>{p.nom}</strong> ({p.type})
                    </div>
                    <div style={{ marginTop: '5px', fontSize: '13px' }}>
                      GPS :{' '}
                      <a
                        href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontWeight: 'bold',
                          textDecoration: 'none',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          color: p.estDansLaZone ? '#333' : '#ffffff',
                          backgroundColor: p.estDansLaZone ? '#f0f0f0' : '#d32f2f',
                          display: 'inline-block'
                        }}
                      >
                        📍 {p.gps} {p.estDansLaZone ? '(Dans la zone)' : '(Hors zone - ROUGE)'}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {historique.length > 0 && (
              <button 
                onClick={viderHistorique}
                style={{ padding: '8px 12px', backgroundColor: '#ff9800', color: '#fff', border: 'none', borderRadius: '5px', marginTop: '10px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                🗑️ Vider l'historique
              </button>
            )}

            <hr style={{ margin: '20px 0' }} />

            <h4>Registre de Rapport (Archives)</h4>
            <p>Données conservées : <strong>{registreRapports.length}</strong> enregistrement(s)</p>
            <button 
              onClick={() => alert('Téléchargement du rapport CSV...')} 
              style={{ padding: '10px 14px', backgroundColor: '#17a2b8', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Télécharger le Rapport CSV
            </button>

            <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px dashed #ccc' }}>
              <button 
                onClick={() => setAbonnementActif(false)} 
                style={{ padding: '6px 10px', backgroundColor: '#d32f2f', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
              >
                [Tester le blocage de l'abonnement]
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SERVICE CLIENT & WHATSAPP */}
      <footer style={{ backgroundColor: '#eef2f5', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 5px 0' }}>📲 Service Client & Abonnement</h4>
        <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>Paiement Airtel Money : <strong>{numeroAirtel}</strong></p>
        <button 
          onClick={ouvrirWhatsApp}
          style={{ padding: '10px 18px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <span>💬</span> Discuter sur WhatsApp
        </button>
      </footer>
    </div>
  );
      }
                  
