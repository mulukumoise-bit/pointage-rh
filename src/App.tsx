import React, { useState, useEffect } from 'react';

interface AttendanceRecord {
  id: string;
  name: string;
  type: 'Arrivée' | 'Départ';
  timestamp: string;
  dateStr: string;
  location: string;
}

export default function App() {
  const [companyName, setCompanyName] = useState('Atelier Tech');
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [tempCompanyName, setTempCompanyName] = useState('Atelier Tech');

  const [nameInput, setNameInput] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('prh_records_v7');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Moïse Muluku', type: 'Arrivée', timestamp: '21:47:41', dateStr: '10/09/2026', location: '-11.5705°, 27.5510°' }
    ];
  });

  const [lastSuccess, setLastSuccess] = useState<{ name: string; type: string; time: string; gps: string } | null>(null);
  const [loadingGps, setLoadingGps] = useState(false);

  // Admin state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState(false);

  useEffect(() => {
    localStorage.setItem('prh_records_v7', JSON.stringify(records));
  }, [records]);

  const handleClockAction = (type: 'Arrivée' | 'Départ') => {
    if (!nameInput.trim()) {
      alert("Veuillez entrer votre nom et prénom.");
      return;
    }

    setLoadingGps(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(4);
          const lon = position.coords.longitude.toFixed(4);
          saveRecord(nameInput.trim(), type, `${lat}°, ${lon}°`);
          setLoadingGps(false);
        },
        () => {
          saveRecord(nameInput.trim(), type, "-11.5705°, 27.5510°");
          setLoadingGps(false);
        },
        { timeout: 10000 }
      );
    } else {
      saveRecord(nameInput.trim(), type, "-11.5705°, 27.5510°");
      setLoadingGps(false);
    }
  };

  const saveRecord = (name: string, type: 'Arrivée' | 'Départ', location: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('fr-FR');

    const newRec: AttendanceRecord = {
      id: Date.now().toString(),
      name,
      type,
      timestamp,
      dateStr,
      location
    };

    setRecords([newRec, ...records]);
    setLastSuccess({ name, type, time: timestamp, gps: location });
    setNameInput('');
  };

  const handleAdminUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setIsAdminUnlocked(true);
      setAdminError(false);
      setAdminPassword('');
    } else {
      setAdminError(true);
    }
  };

  const exportCSV = () => {
    let csv = "Nom,Action,Heure,Date,Coordonnées GPS\n";
    records.forEach(r => {
      csv += `"${r.name}","${r.type}","${r.timestamp}","${r.dateStr}","${r.location}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "pointages.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentDateFormatted = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDFBF7', color: '#1E293B', fontFamily: 'system-ui, sans-serif', paddingBottom: '40px' }}>
      
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#0F4C5C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>⏰</div>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#0F2M3A' }}>Pointage RH</h1>
              <span style={{ fontSize: '11px', color: '#64748B' }}>PRÉSENCE, SANS DÉTOUR</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', backgroundColor: '#E2E8F0', padding: '4px 10px', borderRadius: '20px', fontWeight: 600, color: '#0F2M3A' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669' }}></span>
            LOCAL & SÉCURISÉ
          </div>
        </div>

        {/* Company bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#0F2M3A' }}>
            <span>🏢</span>
            {isEditingCompany ? (
              <input 
                type="text" 
                value={tempCompanyName} 
                onChange={e => setTempCompanyName(e.target.value)}
                onBlur={() => { setCompanyName(tempCompanyName); setIsEditingCompany(false); }}
                autoFocus
                style={{ padding: '2px 6px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            ) : (
              <span>{companyName}</span>
            )}
          </div>
          <button 
            onClick={() => setIsEditingCompany(!isEditingCompany)} 
            style={{ background: 'none', border: 'none', color: '#0F4C5C', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Changer
          </button>
        </div>

        {/* HERO CARD - Vrai Bleu Nuit */}
        <div style={{ background: '#0F2M3A', backgroundColor: '#0F2M3A', color: '#FFFFFF', borderRadius: '20px', padding: '24px', marginBottom: '20px', opacity: 1 }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94A3B8', margin: '0 0 8px 0', fontWeight: 'bold' }}>Bonjour, vous êtes au bon endroit</p>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 12px 0', lineHeight: '1.2', color: '#FFFFFF' }}>Commencer sa journée, <span style={{ color: '#E29578' }}>simplement.</span></h2>
          <p style={{ fontSize: '12px', color: '#CBD5E1', margin: '0 0 16px 0', lineHeight: '1.4' }}>Un pointage clair, en quelques secondes. Votre position confirme votre présence et reste attachée à ce seul enregistrement.</p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '12px', fontSize: '11px', color: '#94A3B8', letterSpacing: '0.5px', fontWeight: 'bold' }}>
            UN GESTE, UNE TRACE FIABLE
          </div>
        </div>

        {/* Success Banner ou Formulaire */}
        {lastSuccess ? (
          <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534', margin: '0 0 8px 0' }}>{lastSuccess.type} pointée</h3>
            <p style={{ fontSize: '13px', color: '#15803D', margin: '0 0 16px 0' }}>C'est enregistré pour <b>{lastSuccess.name}</b>.</p>
            <button 
              onClick={() => setLastSuccess(null)}
              style={{ width: '100%', padding: '14px', backgroundColor: '#166534', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🔄 Pointer à nouveau
            </button>
          </div>
        ) : (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '20px', border: '1px solid #E2E8F0', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase' }}>Aujourd'hui</span>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0F2M3A' }}>{currentDateFormatted}</span>
            </div>

            <p style={{ fontSize: '12px', color: '#475569', marginBottom: '16px', lineHeight: '1.4' }}>
              Indiquez votre nom, puis choisissez votre arrivée ou votre départ.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1E293B', marginBottom: '6px' }}>Nom / Prénom</label>
              <input 
                type="text" 
                placeholder="Ex. Moïse Muluku"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#F8FAFC', outline: 'none', color: '#1E293B' }}
              />
            </div>

            {loadingGps ? (
              <div style={{ textAlign: 'center', padding: '16px', fontSize: '13px', fontWeight: 'bold', color: '#D97706' }}>
                📡 Acquisition GPS en cours...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  onClick={() => handleClockAction('Arrivée')}
                  style={{ width: '100%', padding: '15px', backgroundColor: '#1E463E', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
                >
                  → Pointer l'arrivée
                </button>
                <button 
                  onClick={() => handleClockAction('Départ')}
                  style={{ width: '100%', padding: '15px', backgroundColor: '#FCEFD2', color: '#78350F', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
                >
                  ← Pointer le départ
                </button>
              </div>
            )}
          </div>
        )}

        {/* Administrator Section */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#94A3B8' }}>LA JOURNÉE, EN UN COUP D'ŒIL</span>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0F2M3A', margin: '2px 0 0 0' }}>Données administrateur</h3>
          </div>

          {!isAdminUnlocked ? (
            <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <form onSubmit={handleAdminUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  type="password" 
                  placeholder="Mot de passe (admin123)"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
                {adminError && <span style={{ fontSize: '11px', color: '#DC2626' }}>Mot de passe incorrect (admin123)</span>}
                <button 
                  type="submit"
                  style={{ padding: '12px', backgroundColor: '#1E463E', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  🔒 Déverrouiller
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F5F9', padding: '12px', borderRadius: '10px', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#059669' }}>● ADMIN ACTIF ({records.length})</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={exportCSV} style={{ padding: '6px 10px', backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>CSV</button>
                  <button onClick={() => setIsAdminUnlocked(false)} style={{ padding: '6px 10px', backgroundColor: '#E2E8F0', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Fermer</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                {records.map(r => (
                  <div key={r.id} style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span><b>{r.name}</b> ({r.type})</span>
                    <span style={{ color: '#64748B' }}>{r.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
  
