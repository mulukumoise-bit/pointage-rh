import React, { useState, useEffect } from 'react';

interface Pointage {
  id: string;
  nom: string;
  type: 'Arrivée' | 'Départ';
  heure: string;
  date: string;
  gps: string;
}

export default function App() {
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

  // Saisie entreprise
  const handleCreationEntreprise = (e: React.FormEvent) => {
    e.preventDefault();
    if (nomEntreprise.trim()) {
      setEstInscrit(true);
    }
  };

  // Connexion Admin
  const handleConnexionAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeAdmin === 'admin123') {
      setEstAdmin(true);
      setErreurAdmin('');
    } else {
      setErreurAdmin('Code incorrect. Accès refusé.');
    }
  };

  // Enregistrement d'un pointage (Arrivée ou Départ)
  const fairePointage = (type: 'Arrivée' | 'Départ') => {
    if (!nomEmploye.trim()) {
      alert('Veuillez entrer votre nom avant de pointer.');
      return;
    }

    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nouveauPointage: Pointage = {
          id: Date.now().toString(),
          nom: nomEmploye,
          type: type,
          heure: new Date().toLocaleTimeString('fr-FR'),
          date: new Date().toLocaleDateString('fr-FR'),
          gps: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
        };

        setHistorique([nouveauPointage, ...historique]);
        setRegistreRapports([nouveauPointage, ...registreRapports]);
        alert(`Pointage d'${type} enregistré avec succès pour ${nomEmploye} !`);
        setNomEmploye('');
      },
      () => {
        alert('Impossible de récupérer votre position GPS.');
      }
    );
  };

  // BLOCAGE ABONNEMENT EXPIRE
  if (!abonnementActif) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fff0f0', height: '100vh', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: '#d32f2f' }}>⚠️ Application Bloquée</h2>
        <p>Votre abonnement a expiré. Veuillez contacter le service client pour réactiver votre accès.</p>
        <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h3>📞 Service Client</h3>
          <p>Email : support@pointagerh.com</p>
          <p>Téléphone / WhatsApp : +243 000 000 000</p>
        </div>
      </div>
    );
  }

  // ECRAN 1 : CREATION D'ENTREPRISE
  if (!estInscrit) {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', fontFamily: 'sans-serif' }}>
        <h2>Créer votre Entreprise</h2>
        <form onSubmit={handleCreationEntreprise}>
          <input
            type="text"
            placeholder="Nom de votre entreprise"
            value={nomEntreprise}
            onChange={(e) => setNomEntreprise(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
            required
          />
          <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px' }}>
            Valider et Continuer
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1>Pointage-RH</h1>
        <p>Entreprise : <strong>{nomEntreprise}</strong></p>
      </header>

      {/* SECTION POINTAGE EMPLOYE */}
      <section style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Espace Employé</h3>
        <input
          type="text"
          placeholder="Entrez votre nom complet"
          value={nomEmploye}
          onChange={(e) => setNomEmploye(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => fairePointage('Arrivée')} style={{ flex: 1, padding: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px' }}>
            Arrivée
          </button>
          <button onClick={() => fairePointage('Départ')} style={{ flex: 1, padding: '10px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '5px' }}>
            Départ
          </button>
        </div>
      </section>

      {/* ESPACE ADMINISTRATEUR (CODE admin123) */}
      <section style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Espace Administrateur</h3>
        {!estAdmin ? (
          <form onSubmit={handleConnexionAdmin}>
            <input
              type="password"
              placeholder="Entrez le code d'accès"
              value={codeAdmin}
              onChange={(e) => setCodeAdmin(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
            />
            {erreurAdmin && <p style={{ color: 'red' }}>{erreurAdmin}</p>}
            <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px' }}>
              Déverrouiller l'Historique
            </button>
          </form>
        ) : (
          <div>
            <p style={{ color: 'green' }}>✓ Accès Administrateur Déverrouillé</p>
            <h4>Historique en Direct (Date, Nom, Heure, GPS)</h4>
            {historique.length === 0 ? <p>Aucun pointage récent.</p> : (
              <ul style={{ paddingLeft: '20px' }}>
                {historique.map(p => (
                  <li key={p.id} style={{ marginBottom: '8px' }}>
                    <strong>{p.date}</strong> à <strong>{p.heure}</strong> - {p.nom} ({p.type}) | GPS: {p.gps}
                  </li>
                ))}
              </ul>
            )}

            {/* REGISTRE DE RAPPORT */}
            <hr style={{ margin: '15px 0' }} />
            <h4>Registre de Rapport (Archives de l'Admin)</h4>
            <p>Données conservées : {registreRapports.length} enregistrements</p>
            <button onClick={() => alert('Exportation du rapport en cours...')} style={{ padding: '8px 12px', backgroundColor: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px' }}>
              Télécharger le Rapport CSV
            </button>
          </div>
        )}
      </section>

      {/* SERVICE CLIENT */}
      <footer style={{ backgroundColor: '#eef2f5', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
        <h4>📞 Service Client</h4>
        <p style={{ margin: '5px 0' }}>Besoin d'assistance ou renouvellement d'abonnement ?</p>
        <p style={{ margin: '5px 0' }}><strong>Téléphone :</strong> +243 000 000 000</p>
        <p style={{ margin: '5px 0' }}><strong>Email :</strong> contact@pointagerh.com</p>
      </footer>
    </div>
  );
  }
        
