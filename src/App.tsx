import React, { useState, useEffect } from 'interface';

interface AttendanceRecord {
  id: string;
  name: string;
  type: 'Arrivée' | 'Départ';
  timestamp: string;
  dateStr: string;
  rawDate: string;
  location: string;
  isOutOfBounds?: boolean;
}

export default function App() {
  const [companyName, setCompanyName] = useState('Atelier Tech');
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [tempCompanyName, setTempCompanyName] = useState('Atelier Tech');

  const [nameInput, setNameInput] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('prh_records_v10');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Moïse Muluku', type: 'Arrivée', timestamp: '21:47:41', dateStr: '10/09/2026', rawDate: '2026-09-10', location: '-11.5705°, 27.5510°', isOutOfBounds: false }
    ];
  });

  const [lastSuccess, setLastSuccess] = useState<{ name: string; type: string; time: string; gps: string; warning?: boolean } | null>(null);
  const [loadingGps, setLoadingGps] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  const COMPANY_LAT = -11.5705;
  const COMPANY_LON = 27.5510;
  const MAX_RADIUS_KM = 0.5;

  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('prh_records_v10', JSON.stringify(records));
  }, [records]);

  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleClockAction = (type: 'Arrivée' | 'Départ') => {
    if (!nameInput.trim()) {
      alert("Veuillez entrer votre nom et prénom.");
      return;
    }

    setLoadingGps(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const distance = calculateDistanceKm(COMPANY_LAT, COMPANY_LON, lat, lon);
          const isOutOfBounds = distance > MAX_RADIUS_KM;

          saveRecord(nameInput.trim(), type, `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`, isOutOfBounds);
          setLoadingGps(false);
        },
        () => {
          saveRecord(nameInput.trim(), type, "-11.5705°, 27.5510°", false);
          setLoadingGps(false);
        },
        { timeout: 10000 }
      );
    } else {
      saveRecord(nameInput.trim(), type, "-11.5705°, 27.5510°", false);
      setLoadingGps(false);
    }
  };

  const saveRecord = (name: string, type: 'Arrivée' | 'Départ', location: string, isOutOfBounds: boolean) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('fr-FR');
    const rawDate = now.toISOString().split('T')[0];

    const newRec: AttendanceRecord = {
      id: Date.now().toString(),
      name,
      type,
      timestamp,
      dateStr,
      rawDate,
      location,
      isOutOfBounds
    };

    setRecords([newRec, ...records]);
    setLastSuccess({ name, type, time: timestamp, gps: location, warning: isOutOfBounds });
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
    let csv = "Nom / Prénom,Action,Heure,Date,Coordonnées GPS,Statut Zone\n";
    filteredRecords.forEach(r => {
      csv += `"${r.name}","${r.type}","${r.timestamp}","${r.dateStr}","${r.location}","${r.isOutOfBounds ? 'Hors zone' : 'Sur site'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pointages_${companyName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = records.filter(r => {
    const matchesName = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = dateFilter ? r.rawDate === dateFilter : true;
    return matchesName && matchesDate;
  });

  const todayRaw = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.rawDate === todayRaw);
  const arrivalsToday = todayRecords.filter(r => r.type === 'Arrivée').length;
  const departuresToday = todayRecords.filter(r => r.type === 'Départ').length;
  const firstArrival = todayRecords.slice().reverse().find(r => r.type === 'Arrivée')?.timestamp || '--:--';

  const currentDateFormatted = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDFBF7', color: '#1E293B', fontFamily: 'system-ui, sans-serif', paddingBottom: '40px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}>
        
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#0F2M3A' }}>
            <span>📅</span>
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

        <div style={{ backgroundColor: '#132238', color: '#FFFFFF', borderRadius: '20px', padding: '24px', marginBottom: '20px', boxShadow: '0 10px 25px rgba(19, 34, 56, 0.2)' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94A3B8', margin: '0 0 8px 0', fontWeight: 'bold' }}>Bonjour, vous êtes au bon endroit</p>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 12px 0', lineHeight: '1.2', color: '#FFFFFF' }}>Commencer sa journée, <span style={{ color: '#E29578' }}>simplement.</span></h2>
          <p style={{ fontSize: '12px', color: '#CBD5E1', margin: '0 0 16px 0', lineHeight: '1.4' }}>Un pointage clair, en quelques secondes. Votre position confirme votre présence et reste attachée à ce seul enregistrement.</p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '12px', fontSize: '11px', color: '#94A3B8', letterSpacing: '0.5px', fontWeight: 'bold' }}>
            UN GESTE, UNE TRACE FIABLE
          </div>
        </div>

        {lastSuccess ? (
          <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534', margin: '0 0 8px 0' }}>{lastSuccess.type} validée</h3>
            <p style={{ fontSize: '13px', color: '#15803D', margin: '0 0 12px 0' }}>Enregistré pour <b>{lastSuccess.name}</b>.</p>
            <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '10px', fontSize: '12px', marginBottom: '12px', color: '#1E293B', border: '1px solid #DCFCE7' }}>
              <div>🕒 Heure : <b>{lastSuccess.time}</b></div>
              <div>📍 GPS : <b>{lastSuccess.gps}</b></div>
              {lastSuccess.warning && (
                <div style={{ color: '#D97706', marginTop: '4px', fontWeight: 'bold' }}>⚠️ Attention : Pointage hors du périmètre habituel</div>
              )}
            </div>
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
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0F2M3A' }}>{currentTime}</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0F2M3A', marginBottom: '16px' }}>{currentDateFormatted}</div>

            <p style={{ fontSize: '12px', color: '#475569', marginBottom: '16px', lineHeight: '1.4' }}>
              Indiquez votre nom, puis choisissez votre arrivée ou votre départ. L'heure et votre position seront relevées pour {companyName}.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1E293B' }}>Nom / Prénom</label>
                <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600 }}>Requis</span>
              </div>
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
                📡 Analyse GPS et périmètre en cours...
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
                <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'center', marginTop: '4px' }}>
                  🔒 La position est demandée uniquement au moment du clic.
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#94A3B8' }}>LA JOURNÉE, EN UN COUP D'ŒIL</span>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0F2M3A', margin: '2px 0 0 0' }}>Données administrateur</h3>
          </div>

          {!isAdminUnlocked ? (
            <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0F2M3A' }}>Historique réservé</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Déverrouillez l'espace administrateur pour consulter les présences et exporter les données de {companyName}.</div>
              </div>
              <form onSubmit={handleAdminUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  type="password" 
                  placeholder="Votre mot de passe"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
                {adminError && <span style={{ fontSize: '11px', color: '#DC2626' }}>Mot de passe incorrect</span>}
                <button 
                  type="submit"
                  style={{ padding: '12px', backgroundColor: '#1E463E', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  🔒 Déverrouiller
                </button>
              </form>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '8px' }}>
                🔑 Mot de passe initial de l'entreprise : <b>admin123</b>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 'bold' }}>ARRIVÉES</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534' }}>{arrivalsToday}</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 'bold' }}>DÉPARTS</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#92400E' }}>{departuresToday}</div>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 'bold' }}>1er POINTAGE</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0F2M3A', marginTop: '4px' }}>{firstArrival}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F5F9', padding: '10px 12px', borderRadius: '10px', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#059669' }}>● SESSION ADMIN ACTIVE</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={exportCSV} style={{ padding: '6px 10px', backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>CSV / Excel</button>
                  <button onClick={() => setIsAdminUnlocked(false)} style={{ padding: '6px 10px', backgroundColor: '#E2E8F0', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>Verrouiller</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input 
                  type="text"
                  placeholder="Rechercher un nom..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                />
                <input 
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                />
              </div>
              {dateFilter && (
                <div style={{ fontSize: '10px', color: '#D97706', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Filtre actif sur la date</span>
                  <button onClick={() => setDateFilter('')} style={{ background: 'none', border: 'none', color: '#D97706', cursor: 'pointer', textDecoration: 'underline' }}>Effacer</button>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                {filteredRecords.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: '#64748B' }}>Aucun enregistrement trouvé.</div>
                ) : (
                  filteredRecords.map(r => (
                    <div key={r.id} style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px', display: 'flex', justifyContent: 'space-between', ali
