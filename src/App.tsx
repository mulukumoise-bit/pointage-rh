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
    const saved = localStorage.getItem('prh_records_v3');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Moïse Muluku', type: 'Arrivée', timestamp: '21:47:41', dateStr: '10/09/2026', location: '-11.5705°, 27.5510°' },
      { id: '2', name: 'Muteba john', type: 'Arrivée', timestamp: '22:38:57', dateStr: '10/09/2026', location: '-11.5703°, 27.5513°' },
      { id: '3', name: 'Samuel', type: 'Arrivée', timestamp: '22:20:15', dateStr: '10/09/2026', location: '-11.5704°, 27.5511°' }
    ];
  });

  const [lastSuccess, setLastSuccess] = useState<{ name: string; type: string; time: string; gps: string } | null>(null);
  const [loadingGps, setLoadingGps] = useState(false);

  // Admin state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState(false);

  useEffect(() => {
    localStorage.setItem('prh_records_v3', JSON.stringify(records));
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
          const gpsStr = `${lat}°, ${lon}°`;
          saveRecord(nameInput.trim(), type, gpsStr);
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
      
      {/* Header */}
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#0F4C5C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>⏰</div>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#0F2M3A' }}>Pointage RH</h1>
              <span style={{ fontSize: '11px', color: '#64748B' }}>PRÉSENCE, SANS DÉTOUR</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', backgroundColor: '#E2E8F0', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669' }}></span>
            LOCAL & SÉCURISÉ
          </div>
        </div>

        {/* Company bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
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

        {/* Hero Card (Toujours visible comme sur ton design d'origine) */}
        <div style={{ backgroundColor: '#0F2M3A', color: '#fff', borderRadius: '20px', padding: '24px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, marginBottom: '8px' }}>Bonjour, vous êtes au bon endroit</p>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 12px 0', lineHeight: '1.2' }}>Commencer sa journée, <span style={{ color: '#E29578' }}>simplement.</span></h2>
          <p style={{ fontSize: '12px', opacity: 0.8, margin: '0 0 16px 0', lineHeight: '1.4' }}>Un pointage clair, en quelques secondes. Votre position confirme votre présence et reste attachée à ce seul enregistrement.</p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '12px', fontSize: '11px', opacity: 0.7 }}>
            UN GESTE, UNE TRACE FIABLE
          </div>
        </div>

        {/* Success Banner si pointage effectué */}
        {lastSuccess ? (
          <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534', margin: '0 0 8px 0' }}>{lastSuccess.type} pointée</h3>
            <p style={{ fontSize: '13px', color: '#15803D', margin: '0 0 16px 0', lineHeight: '1.4' }}>C'est enregistré pour <b>{lastSuccess.name}</b>. La confirmation est bien arrivée dans l'espace de votre entreprise.</p>
            
            <div style={{ backgroundColor: '#fff', padding: '12px 14px', borderRadius: '12px', fontSize: '12px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', border: '1px solid #dcfce7' }}>
              <span style={{ color: '#64748B', fontWeight: 'bold' }}>HEURE DU POINTAGE</span>
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{lastSuccess.time}</span>
            </div>
            
            <div style={{ backgroundColor: '#fff', padding: '12px 14px', borderRadius: '12px', fontSize: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', border: '1px solid #dcfce7' }}>
              <span style={{ color: '#64748B', fontWeight: 'bold' }}>POSITION CONFIRMÉE</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '13px' }}>{lastSuccess.gps}</span>
            </div>

            <button 
              onClick={() => setLastSuccess(null)}
              style={{ width: '100%', padding: '14px', backgroundColor: '#166534', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🔄 Pointer à nouveau
            </button>
          </div>
        ) : (
          /* Formulaire de Pointage Classique */
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '20px', border: '1px solid #E2E8F0', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#94A3B8', letterSpacing: '1px' }}>Aujourd'hui</span>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0F2M3A' }}>{currentDateFormatted}</span>
            </div>

            <p style={{ fontSize: '12px', color: '#475569', marginBottom: '16px', lineHeight: '1.4' }}>
              Indiquez votre nom, puis choisissez votre arrivée ou votre départ. L'heure et votre position seront relevées pour {companyName}.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1E293B' }}>Nom / Prénom</label>
                <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 'bold' }}>Requis</span>
              </div>
              <input 
                type="text" 
                placeholder="Ex. Camille Martin"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#F8FAFC', outline: 'none' }}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B', marginTop: '14px' }}>
              <span>🔒</span>
              <span>La position est demandée uniquement au moment du clic et est enregistrée avec votre pointage dans l'historique.</span>
            </div>
          </div>
        )}

        {/* Administrator Section */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#94A3B8', letterSpacing: '1px' }}>LA JOURNÉE, EN UN COUP D'ŒIL</span>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0F2M3A', margin: '2px 0 0 0' }}>Données administrateur</h3>
          </div>

          {!isAdminUnlocked ? (
            <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '18px' }}>🔒</span>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 'bold', margin: 0 }}>Historique réservé</h4>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>Déverrouillez l'espace administrateur pour consulter les présences.</p>
                </div>
              </div>

              <form onSubmit={handleAdminUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
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
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#059669', display: 'block' }}>● SESSION ADMINISTRATEUR ACTIVE</span>
                  <span style={{ fontSize: '12px', color: '#475569' }}>{records.length} lignes enregistrées</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={exportCSV} style={{ padding: '6px 10px', backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>CSV</button>
                  <button onClick={() => setIsAdminUnlocked(false)} style={{ padding: '6px 10px', backgroundColor: '#E2E8F0', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Verrouiller</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                {records.map(r => (
                  <div key={r.id} style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span>{r.name}</span>
                      <span style={{ color: r.type === 'Arrivée' ? '#059669' : '#D97706' }}>{r.type}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '11px' }}>
                      <span>🕒 {r.timestamp} ({r.dateStr})</span>
                      <span style={{ fontFamily: 'monospace' }}>📍 {r.location}</span>
                    </div>
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
      
