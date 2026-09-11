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
    { id: 1, name: 'Moïse Muluku', type: 'Arrivée', time: '21:47:41', lat: -11.57049, lng: 27.55102, coords: '-11.57049, 27.55102' },
    { id: 2, name: 'Muteba John', type: 'Arrivée', time: '22:38:57', lat: -11.57049, lng: 27.55102, coords: '-11.57049, 27.55102' },
    { id: 3, name: 'Samuel', type: 'Arrivée', time: '22:20:15', lat: -11.57049, lng: 27.55102, coords: '-11.57049, 27.55102' },
    { id: 4, name: 'Moïse Muluku', type: 'Arrivée', time: '18:36:57', lat: -11.57049, lng: 27.55102, coords: '-11.57049, 27.55102' },
    { id: 5, name: 'Moïse Muluku', type: 'Arrivée', time: '22:27:48', lat: -11.57049, lng: 27.55102, coords: '-11.57049, 27.55102' },
    { id: 6, name: 'Moïse Muluku', type: 'Arrivée', time: '22:12:51', lat: -11.57049, lng: 27.55102, coords: '-11.57049, 27.55102' },
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
        coords: `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      };
      setRecords(prev => [newRecord, ...prev]);
      setName('');
      alert(`Pointage "${type}" enregistré avec succès pour ${trimmedName}`);
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

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,ID,Nom,Type,Heure,Coordonnees\n";
    records.forEach(r => {
      csvContent += `${r.id},"${r.name}","${r.type}",${r.time},"${r.coords}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pointage_${company.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setIsAdminUnlocked(true);
      setAdminPassword('');
    } else {
      alert('Mot de passe incorrect (indice : admin123)');
    }
  };

  const handleSaveCompany = () => {
    if (tempCompany.trim()) {
      setCompany(tempCompany.trim());
      setIsChangingCompany(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '440px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflow: 'hidden', padding: '24px', boxSizing: 'border-box' }}>
        
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{company}</h1>
            <button 
              onClick={() => { setTempCompany(company); setIsChangingCompany(!isChangingCompany); }}
              style={{ fontSize: '12px', background: '#e5e7eb', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', color: '#374151' }}
            >
              Changer
            </button>
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>Système de Pointage RH & GPS</p>

          {isChangingCompany && (
            <div style={{ marginTop: '12px', padding: '10px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
              <input 
                type="text"
                value={tempCompany}
                onChange={(e) => setTempCompany(e.target.value)}
                placeholder="Nom de l'entreprise"
                style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
              />
              <button 
                onClick={handleSaveCompany}
                style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
              >
                OK
              </button>
            </div>
          )}
        </div>

        {/* Bloc Horloge et Heure */}
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '14px', padding: '20px', color: 'white', textAlign: 'center', marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '4px' }}>
            {currentTime.toLocaleTimeString()}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'capitalize' }}>
            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Formulaire de Pointage */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Votre Nom et Prénom
          </label>
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Moïse Muluku"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', boxSizing: 'border-box', outline: 'none', marginBottom: '14px' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button 
              onClick={() => handlePointer('Arrivée')}
              style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }}
            >
              Pointer Arrivée
            </button>
            <button 
              onClick={() => handlePointer('Départ')}
              style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)' }}
            >
              Pointer Départ
            </button>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />

        {/* Section Administration / Rapports */}
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937', marginBottom: '10px' }}>Espace Administrateur</h2>
          
          {!isAdminUnlocked ? (
            <form onSubmit={handleAdminLogin} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Mot de passe (admin123)"
                style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
              />
              <button 
                type="submit"
                style={{ backgroundColor: '#4b5563', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
              >
                Entrer
              </button>
            </form>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: '#059669', fontWeight: 'bold' }}>✓ Mode Admin Actif</span>
                <button 
                  onClick={exportCSV}
                  style={{ backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Télécharger Rapport CSV
                </button>
              </div>

              <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', padding: '8px' }}>
                {records.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', margin: '10px 0' }}>Aucun pointage enregistré.</p>
                ) : (
                  records.map((r) => (
                    <div key={r.id} style={{ fontSize: '12px', padding: '6px 8px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{r.name}</strong> <span style={{ color: r.type === 'Arrivée' ? '#059669' : '#dc2626' }}>({r.type})</span>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>{r.time} • GPS: {r.coords}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
      }
                 
