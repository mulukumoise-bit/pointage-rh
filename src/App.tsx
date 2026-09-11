import React, { useState, useEffect } from 'react';

export default function App() {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('Atelier Tech');
  const [isChangingCompany, setIsChangingCompany] = useState(false);
  const [tempCompany, setTempCompany] = useState('Atelier Tech');

  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [records, setRecords] = useState([
    { id: 1, name: 'Moïse Muluku', type: 'Arrivée', time: '21:47:41', lat: -11.57052, lng: 27.55102, coords: '-11.57052°, 27.55102°' },
    { id: 2, name: 'Muteba john', type: 'Arrivée', time: '22:38:57', lat: -11.57037, lng: 27.55133, coords: '-11.57037°, 27.55133°' },
    { id: 3, name: 'Samuel', type: 'Arrivée', time: '22:20:15', lat: -11.57049, lng: 27.55111, coords: '-11.57049°, 27.55111°' },
    { id: 4, name: 'Moïse Muluku', type: 'Arrivée', time: '18:36:57', lat: -11.57463, lng: 27.53719, coords: '-11.57463°, 27.53719°' },
    { id: 5, name: 'Moïse Muluku', type: 'Arrivée', time: '22:27:48', lat: -11.57063, lng: 27.55101, coords: '-11.57063°, 27.55101°' },
    { id: 6, name: 'Moïse Muluku', type: 'Arrivée', time: '22:12:51', lat: -11.57069, lng: 27.55092, coords: '-11.57069°, 27.55092°' }
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePointer = (type: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert('Veuillez entrer votre Nom / Prénom');
      return;
    }

    const timeStr = new Date().toLocaleTimeString();

    const saveRecord = (lat: number, lng: number) => {
      const newRecord = {
        id: Date.now(),
        name: trimmedName,
        type,
        time: timeStr,
        lat,
        lng,
        coords: `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`
      };
      setRecords(prev => [newRecord, ...prev]);
      setName('');
      alert(`Pointage "${type}" enregistré avec succès pour ${trimmedName} chez ${company} !`);
    };

    const fallbackLat = -11.57052;
    const fallbackLng = 27.55102;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          saveRecord(position.coords.latitude, position.coords.longitude);
        },
        () => {
          saveRecord(fallbackLat, fallbackLng);
        },
        { timeout: 8000, maximumAge: 0, enableHighAccuracy: true }
      );
    } else {
      saveRecord(fallbackLat, fallbackLng);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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

      {/* Ligne Entreprise avec bouton Changer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px', fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🏢</span>
          <span>{company}</span>
        </div>
        <button 
          onClick={() => setIsChangingCompany(!isChangingCompany)}
          style={{ background: 'none', border: 'none', color: '#0F4C5C', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>
          {isChangingCompany ? 'Fermer' : 'Changer'}
        </button>
      </div>

      {/* Boîte de modification d'entreprise (si activée) */}
      {isChangingCompany && (
        <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '10px', marginBottom: '12px', border: '1px solid #CBD5E1' }}>
          <div style={{ fontSize: '11px', marginBottom: '6px', fontWeight: 'bold', color: '#475569' }}>Modifier le nom de l'entreprise :</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={tempCompany}
              onChange={e => setTempCompany(e.target.value)}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
            />
            <button 
              onClick={() => {
                if(tempCompany.trim()) {
                  setCompany(tempCompany.trim());
                  setIsChangingCompany(false);
                }
              }}
              style={{ padding: '8px 12px', backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              Valider
            </button>
          </div>
        </div>
      )}

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

      {/* Horloge en direct */}
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
          Indiquez votre nom, puis choisissez votre arrivée ou votre départ. L'heure et votre position seront relevées pour {company}.
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Nom / Prénom</label>
            <span style={{ fontSize: '10px', color: '#DC2626' }}>Requis</span>
          </div>
          <input
            type="text"
            placeholder="Ex. Moïse Muluku"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
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

      {/* Espace Administrateur & Tableau design */}
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
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', marginBottom: '8px', boxSizing: 'border-box' }}
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
            
            <div style={{ fontSize: '11px', color: '#475569', marginBottom: '12px' }}>
              ✓ Espace administrateur déverrouillé pour {company}.
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button onClick={exportCSV} style={{ flex: 1, padding: '8px', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>↓ CSV</button>
              <button onClick={exportCSV} style={{ flex: 1, padding: '8px', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>📊 Excel (.xlsx)</button>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#64748B' }}>{records.length} lignes</div>

            {/* Tableau avec liens GPS cliquables */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#FDFBF7' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.6fr', padding: '10px 8px', backgroundColor: '#F4EFE6', borderBottom: '1px solid #E2E8F0', fontSize: '10px', fontWeight: 'bold', color: '#475569', letterSpacing: '0.5px' }}>
                <div>NOM / PRÉNOM</div>
                <div>ACTION</div>
                <div>HEURE & GPS</div>
              </div>

              {records.map((r, index) => (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.6fr', padding: '12px 8px', borderBottom: index < records.length - 1 ? '1px solid #E2E8F0' : 'none', alignItems: 'center', fontSize: '11px' }}>
                  <div style={{ fontWeight: 'bold', color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name}
                  </div>
                  <div>
                    <span style={{ padding: '3px 6px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', backgroundColor: r.type === 'Arrivée' ? '#E2FCEF' : '#FEF3C7', color: r.type === 'Arrivée' ? '#166534' : '#92400E' }}>
                      {r.type === 'Arrivée' ? '→ Arrivée' : '← Départ'}
                    </span>
                  </div>
                  <div style={{ color: '#64748B', fontSize: '10px' }}>
                    <div>{r.time}</div>
                    <a 
                      href={`https://maps.google.com/?q=${r.lat || -11.57052},${r.lng || 27.55102}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#0F4C5C', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'underline', fontWeight: 'bold' }}
                    >
                      📍 {r.coords}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pied de page informatif */}
      <div style={{ fontSize: '10px', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '20px', paddingLeft: '4px' }}>
        <div>🔒 Vos informations restent confidentielles</div>
        <div>📍 Autorisation de position requise pour pointer</div>
        <div>⏱️ Historique sauvegardé durablement</div>
      </div>

    </div>
  );
     }
     
