import React, { useState } from 'react';

interface Pointage {
  id: string;
  nom: string;
  type: 'Arrivée' | 'Départ';
  heure: string;
  date: string;
  gps: string;
}

export default function App() {
  // Numéro WhatsApp du Service Client (à modifier avec votre numéro)
  const numeroWhatsApp = '243000000000';

  // États de l'application
  const [nomEntreprise, setNomEntreprise] = useState<string>('');
  const [estInscrit, setEstInscrit] = useState<boolean>(false);
  const [nomEmploye, setNomEmploye] = useState<string>('');
  
  // Gestion de l'abonnement
  const [abonnementActif, setAbonnementActif] = useState<boolean>(true);

  // Historique et registre
  const [historique, setHistorique] = useState<Pointage[]>([]);
  const [registreRapports, setRegistreRapports] = useState<Pointage[]>([]);

  // Authentification Admin (admin123)
  const [codeAdmin, setCodeAdmin] = useState<string>('');
  const [estAdmin, setEstAdmin] = useState<boolean>(false);
  const [erreurAdmin, setErreurAdmin] = useState<string>('');

  // Coordonnées GPS par défaut si le GPS mobile n'est pas activé
  const gpsParDefaut = '-11.6609, 27.4794';

  const handleCreationEntreprise = (e: React.FormEvent) => {
    e.preventDefault();
    if (nomEntreprise.trim()) {
      setEstInscrit(true);
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

  // POINTAGE INSTANTANÉ (ZÉRO DELAI)
  const fairePointage = (type: 'Arrivée' | 'Départ') => {
    const nomSaisi = nomEmploye.trim();
    if (!nomSaisi) {
      alert('Veuillez entrer votre nom avant de pointer.');
      return;
    }

    const nouveauId = Date.now().toString();
    const dateActuelle = new Date().toLocaleDateString('fr-FR');
    const heureActuelle = new Date().toLocaleTimeString('fr-FR');

    // 1. On vider immédiatement le champ nom
    setNomEmploye('');

    // 2. Création immédiate de la ligne dans l'historique
    const nouveauPointage: Pointage = {
      id: nouveauId,
      nom: nomSaisi,
      type: type,
      heure: heureActuelle,
      date: dateActuelle,
      gps: gpsParDefaut
    };

    setHistorique((prev) => [nouveauPointage, ...prev]);
    setRegistreRapports((prev) => [nouveauPointage, ...prev]);

    // 3. Récupération GPS asynchrone sans bloquer l'affichage
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(4);
          const lng = position.coords.longitude.toFixed(4);
          const vraiGps = `${lat}, ${lng}`;

          // Mettre à jour les coordonnées dans l'historique
          setHistorique((prev) =>
            prev.map((item) => (item.id === nouveauId ? { ...item, gps: vraiGps } : item))
          );
          setRegistreRapports((prev) =>
            prev.map((item) => (item.id === nouveauId ? { ...item, gps: vraiGps } : item))
          );
        },
        () => {},
        { enableHighAccuracy: false, timeout: 2000 }
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
    const message = encodeURIComponent(`Bonjour Service Client Pointage RH, je vous contacte concernant l'entreprise : ${nomEntreprise || 'Pointage RH'}`);
    window.open(`https://wa.me/${numeroWhatsApp}?text=${message}`, '_blank');
  };

  // ECRAN ABONNEMENT EXPIRE
  if (!abonnementActif) {
    return (
      <div style={{ padding: '25px', textAlign: 'center', backgroundColor: '#fff0f0', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: '#d32f2f', fontSize: '24px' }}>⚠️ Abonnement Expiré</h2>
        <p style={{ color: '#555', fontSize: '16px', lineHeight: '1.5' }}>
          L'accès à votre application <strong>Pointage RH</strong> est suspendu. Veuillez renouveler votre forfait.
        </p>
        
        <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ffcdd2', borderRadius: '12px', backgroundColor: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>📞 Service Client</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>Contactez-nous sur WhatsApp pour réactiver vos accès :</p>
          <button 
            onClick={ouvrirWhatsApp}
            style={{ width: '100%', padding: '12px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
          >
            💬 Contacter sur WhatsApp
          </button>
        </div>

        <button 
          onClick={() => setAbonnementActif(true)} 
          style={{ marginTop: '30px', background: 'none', border: 'none', color: '#888', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}
        >
          [Admin : Débloquer l'abonnement]
        </button>
      </div>
    );
  }

  // ECRAN CREATION D'ENTREPRISE
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
            Valider et Continuer
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
      </header>

      {/* ESPACE EMPLOYE */}
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
            
            <h4>Historique en Direct (Date, Nom, Heure, GPS)</h4>
            {historique.length === 0 ? (
              <p style={{ color: '#777' }}>Aucun pointage récent.</p>
            ) : (
              <ul style={{ paddingLeft: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                {historique.map((p) => (
                  <li key={p.id} style={{ marginBottom: '8px' }}>
                    <strong>{p.date}</strong> à <strong>{p.heure}</strong> - <strong>{p.nom}</strong> ({p.type}) | GPS: {p.gps}
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

      {/* SERVICE CLIENT WHATSAPP */}
      <footer style={{ backgroundColor: '#eef2f5', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 5px 0' }}>📞 Service Client</h4>
        <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#555' }}>Besoin d'aide ou renouvellement d'abonnement ?</p>
        <button 
          onClick={ouvrirWhatsApp}
          style={{ padding: '10px 18px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
        >
          💬 Discuter sur WhatsApp
        </button>
      </footer>
    </div>
  );
  }
      
