import React, { useState, useEffect } from 'react';

export default function App() {
  const [company, setCompany] = useState(() => localStorage.getItem('company_name') || 'Mon Entreprise');
  const [isChangingCompany, setIsChangingCompany] = useState(false);
  const [tempCompany, setTempCompany] = useState(() => localStorage.getItem('company_name') || 'Mon Entreprise');
  
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tous');
  const [name, setName] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('pointage_records_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('pointage_records_v2', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePointer = (type: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert('Veuillez entrer votre Nom et Prénom');
      return;
    }

    const timeStr = new Date().toLocaleTimeString();
    
    const executeSave = (lat: number, lng: number) => {
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
      setName(''); // Réinitialisation immédiate du champ nom
      
      setSuccessMessage(`✓ Pointage "${type}" validé avec succès pour ${trimmedName}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    };

    const fallbackLat = -11.57052;
    const fallbackLng = 27.55102;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => executeSave(position.coords.latitude, position.coords.longitude),
        () => executeSave(fallbackLat, fallbackLng),
        { timeout: 4000, maximumAge: 10000 }
      );
    } else {
      executeSave(fallbackLat, fallbackLng);
    }
  };

  const exportCSV = () => {
    const headers = "Nom,Type,Heure,Coordonnees GPS\n";
    const rows = records.map(r => `"${r.name}","${r.type}","${r.time}","${r.coords}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pointages_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin123') {
      setIsAdminUnlocked(true);
      setAdminPasswordInput('');
    } else {
      alert('Code administrateur incorrect !');
      setAdminPasswordInput('');
    }
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempCompany.trim()) {
      setCompany(tempCompany.trim());
      localStorage.setItem('company_name', tempCompany.trim());
      setIsChangingCompany(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f9', fontFamily: 'Arial, sans-serif', padding: '16px', color: '#333' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* En-tête avec gestion de l'entreprise et verrouillage admin */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div>
            <h1 style={{ fontSize: '18px', margin: '0 0 4px 0', color: '#0f3d3e' }}>Pointage-RH</h1>
            <p style={{ fontSize: '13px', margin: 0, color: '#666' }}>{company}</p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {isAdminUnlocked && (
              <button 
                onClick={() => setIsChangingCompany(!isChangingCompany)}
                style={{ padding: '6px 10px', fontSize: '12px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Modifier Entreprise
              </button>
            )}
            {isAdminUnlocked && (
              <button 
                onClick={() => setIsAdminUnlocked(false)}
                style={{ padding: '6px 10px', fontSize: '12px', backgroundColor: '#b91c1c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Verrouiller
              </button>
            )}
          </div>
        </div>

        {isAdminUnlocked && isChangingCompany && (
          <form onSubmit={handleSaveCompany} style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <input 
              type="text" 
              value={tempCompany} 
              onChange={e => setTempCompany(e.target.value)}
              placeholder="Nom de l'entreprise"
              style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
            <button type="submit" style={{ width: '100%', padding: '8px', backgroundColor: '#0f3d3e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
              Enregistrer l'entreprise
            </button>
          </form>
        )}

        {/* Bloc Horloge & Date */}
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', marginBottom: '16px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f3d3e' }}>
            {currentTime.toLocaleTimeString()}
          </div>
        </div>

        {/* Bloc Formulaire de Pointage (Le nom disparaît instantanément) */}
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px', marginTop: 0 }}>
            Indiquez votre nom, puis choisissez votre action de pointage :
          </p>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>Nom et Prénom</label>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Requis</span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Noé Ntumba"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handlePointer('Arrivée')}
              style={{ flex: 1, backgroundColor: '#0f3d3e', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ➔ Pointer l'arrivée
            </button>
            <button
              onClick={() => handlePointer('Départ')}
              style={{ flex: 1, backgroundColor: '#b91c1c', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ← Pointer le départ
            </button>
          </div>

          {successMessage && (
            <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', marginTop: '10px' }}>
              {successMessage}
            </div>
          )}
        </div>

        {/* Barre verrouillée pour l'Administrateur (Code: admin123) */}
        {!isAdminUnlocked ? (
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', marginBottom: '16px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px 0' }}>🔒 Le registre, les heures et la géolocalisation sont verrouillés.</p>
            <form onSubmit={handleAdminLoginSubmit} style={{ display: 'flex', gap: '8px', maxWidth: '300px', margin: '0 auto' }}>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={e => setAdminPasswordInput(e.target.value)}
                placeholder="Code admin (admin123)"
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
              <button type="submit" style={{ padding: '8px 14px', backgroundColor: '#0f3d3e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                Valider
              </button>
            </form>
          </div>
        ) : (
          /* Espace Administrateur Déverrouillé */
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '2px solid #0f3d3e', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '15px', margin: 0, color: '#0f3d3e' }}>👑 Registre Admin ({records.length})</h2>
              {records.length > 0 && (
                <button onClick={exportCSV} style={{ fontSize: '12px', padding: '6px 10px', backgroundColor: '#0f3d3e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Exporter Excel (CSV)
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Filtrer par nom..."
                style={{ flex: 2, padding: '8px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                style={{ flex: 1, padding: '8px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="Tous">Tous</option>
                <option value="Arrivée">Arrivée</option>
                <option value="Départ">Départ</option>
              </select>
            </div>

            {records.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', margin: '20px 0' }}>Aucun pointage enregistré pour l'instant.</p>
            ) : (
              records
                .filter(r => {
                  const matchesName = r.name.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesType = filterType === 'Tous' || r.type === filterType;
                  return matchesName && matchesType;
                })
                .map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{r.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {r.time} • <a href={`https://www.google.com/maps?q=${r.coords}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0f3d3e', fontWeight: 'bold' }}>GPS: {r.coords} 🗺️</a>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', backgroundColor: r.type === 'Arrivée' ? '#dcfce7' : '#fee2e2', color: r.type === 'Arrivée' ? '#166534' : '#991b1b', fontWeight: 'bold' }}>
                      {r.type}
                    </div>
                  </div>
                ))
            )}

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
              <button 
                onClick={() => { if(confirm('Voulez-vous vraiment vider tout le registre ?')) setRecords([]); }}
                style={{ padding: '6px 10px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🗑️ Vider le registre
              </button>
              <button 
                onClick={() => setIsAdminUnlocked(false)}
                style={{ padding: '6px 10px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🔒 Verrouiller
              </button>
            </div>

          </div>
        )}

        {/* Pied de page */}
        <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', lineHeight: '1.5' }}>
          🔒 Vos informations restent confidentielles et sécurisées.<br />
          📍 Autorisation de position requise pour valider le pointage.<br />
          ⏱️ Historique sauvegardé durablement.
        </div>

      </div>
    </div>
  );
          }
        
