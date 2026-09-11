import React, { useState, useEffect } from 'react';

export default function App() {
  const [name, setName] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Historique complet d'origine
  const [records, setRecords] = useState([
    { id: 1, name: 'Moïse Muluku', type: 'Arrivée', time: '21:47:41', coords: '-11.57052°, 27.55102°' },
    { id: 2, name: 'Muteba john', type: 'Arrivée', time: '22:38:57', coords: '-11.57037°, 27.55133°' },
    { id: 3, name: 'Samuel', type: 'Arrivée', time: '22:20:15', coords: '-11.57049°, 27.55111°' },
    { id: 4, name: 'Moïse Muluku', type: 'Arrivée', time: '18:36:57', coords: '-11.57463°, 27.53719°' },
    { id: 5, name: 'Moïse Muluku', type: 'Arrivée', time: '22:27:48', coords: '-11.57063°, 27.55101°' },
    { id: 6, name: 'Moïse Muluku', type: 'Arrivée', time: '22:12:51', coords: '-11.57069°, 27.55092°' }
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePointer = (type: string) => {
    if (!name.trim()) {
      alert('Veuillez entrer votre Nom / Prénom');
      return;
    }
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newRecord = {
            id: Date.now(),
            name: name.trim(),
            type,
            time: new Date().toLocaleTimeString(),
            coords: `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`
          };
          setRecords([newRecord, ...records]);
          setName('');
          alert(`Pointage "${type}" enregistré avec succès !`);
        },
        (error) => {
          setLocationError("Impossible de récupérer la position GPS.");
          const newRecord = {
            id: Date.now(),
            name: name.trim(),
            type,
            time: new Date().toLocaleTimeString(),
            coords: 'Non disponible'
          };
          setRecords([newRecord, ...records]);
          setName('');
        }
      );
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  };

  const handleAdminUnlock = () => {
    if (adminPassword === 'admin123') {
      setIsAdminUnlocked(true);
      setAdminPassword('');
    } else {
      alert('Mot de passe incorrect (Essayez: admin123)');
    }
  };

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + records.map(e => `${e.name},${e.type},${e.time},${e.coords}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "historique_pointages.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif', maxWidth: '480px', margin: '0 auto', backgroundColor: '#F8F6F0', minHeight: '100vh', color: '#1E293B' }}>
      
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ backgroundColor: '#0F4C5C', color: '#fff', padding: '8px', borderRadius: '8px', fontWeight: 'bold' }}>🕒</div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Pointage RH</div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>PRÉSENCE, SANS DÉTOUR</div>
          </div>
        </div>
        <div style={{ fontSize: '11px', backgroundColor: '#E2E8F0', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
          ● LOCAL & SÉCURISÉ
        </div>
      </div>

      {/* Bannière principale */}
      <div style={{ backgroundColor: '#102A43', color: '#FFFFFF', padding: '24px', borderRadius: '16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '1px', color: '#94A3B8', marginBottom: '8px' }}>BONJOUR, VOUS ÊTES AU BON ENDROIT</div>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', lineHeight: '1.3' }}>
          Commencer sa journée, <span style={{ color: '#F6AD55' }}>simplement.</span>
        </h1>
        <p style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.5' }}>
          Un pointage clair, en quelques secondes. Votre position confirme votre présence et reste attachée à ce seul enregistrement.
        </p>
      </div>

      {/* Date et Heure actuelle */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '14px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: '#64748B' }}>AUJOURD'HUI</span>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0F4C5C' }}>
            {currentTime.toLocaleTimeString()}
          </span>
        </div>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>
          {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Formulaire de Pointage */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '14px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px', lineHeight: '1.4' }}>
          Indiquez votre nom, puis choisissez votre arrivée ou votre départ. L'heure et votre position seront relevées pour Atelier Tech.
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Nom / Prénom</label>
            <span style={{ fontSize: '10px', color: '#DC2626' }}>Requis</span>
          </div>
          <input
            type="text"
            placeholder="Ex. Camille Martin"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'box-sizing' }}
          />
        </div>

        <button 
          onClick={() => handlePointer('Arrivée')}
          style={{ width: '100%', padding: '12px', backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', cursor: 'pointer' }}>
          → Pointer l'arrivée
        </button>

        <button 
          onClick={() => handlePointer('Départ')}
          style={{ width: '100%', padding: '12px', backgroundColor: '#FEEBC8', color: '#92400E', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
          ← Pointer le départ
        </button>
      </div>

      {/* Espace Administrateur */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '14px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>Données administrateur</div>

        {!isAdminUnlocked ? (
          <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Historique réservé</div>
            <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '10px' }}>Déverrouillez l'espace administrateur pour consulter les présences.</div>
            <input
              type="password"
              placeholder="Votre mot de passe"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', marginBottom: '8px', boxSizing: 'box-sizing' }}
            />
            <button 
              onClick={handleAdminUnlock}
              style={{ width: '100%', padding: '10px', backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
              Déverrouiller
            </button>
            <div style={{ fontSize: '10px', color: '#64748B', marginTop: '6px' }}>Mot de passe initial : admin123</div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', backgroundColor: '#F1F5F9', padding: '10px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#166534' }}>● SESSION ADMINISTRATEUR ACTIVE</span>
              <button onClick={() => setIsAdminUnlocked(false)} style={{ padding: '6px 10px', backgroundColor: '#E2E8F0', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Verrouiller</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button onClick={exportCSV} style={{ flex: 1, padding: '8px', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>↓ CSV</button>
              <button onClick={exportCSV} style={{ flex: 1, padding: '8px', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>📊 Excel (.xlsx)</button>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Historique des pointages ({records.length} lignes)</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {records.map(r => (
                <div key={r.id} style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{r.name}</div>
                    <div style={{ color: '#64748B', marginTop: '2px' }}>{r.time} - {r.coords}</div>
                  </div>
                  <span style={{ padding: '3px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', backgroundColor: r.type === 'Arrivée' ? '#DCFCE7' : '#FEF3C7', color: r.type === 'Arrivée' ? '#166534' : '#92400E' }}>
                    {r.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
     }
            
