import React, { useState, useEffect } from 'react';

const SUPABASE_URL = "https://ton-projet.supabase.co";
const SUPABASE_ANON_KEY = "ta-cle-anon-publique";

export default function App() {
  const [company, setCompany] = useState(() => localStorage.getItem('company_name') || 'Mon Entreprise');
  const [isChangingCompany, setIsChangingCompany] = useState(false);
  const [tempCompany, setTempCompany] = useState(() => localStorage.getItem('company_name') || 'Mon Entreprise');
  
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearPasswordInput, setClearPasswordInput] = useState('');
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tous');
  
  // Filtre par date : par défaut, la date du jour au format jj/mm/aaaa
  const getTodayFormatted = () => new Date().toLocaleDateString('fr-FR');
  const [selectedDateFilter, setSelectedDateFilter] = useState(getTodayFormatted());
  
  const [name, setName] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const getStoredRecords = () => {
    const saved = localStorage.getItem('pointage_records_v10');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  };

  const [records, setRecords] = useState(getStoredRecords);

  const fetchCloudRecords = async () => {
    if (SUPABASE_URL.includes("ton-projet")) return;
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/pointages?select=*&order=id.desc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (e) {
      console.error("Erreur de synchronisation cloud", e);
    }
  };

  useEffect(() => {
    let interval: any;
    if (isAdminUnlocked) {
      fetchCloudRecords();
      interval = setInterval(fetchCloudRecords, 5000);
    }
    return () => clearInterval(interval);
  }, [isAdminUnlocked]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePointer = async (type: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert('Veuillez entrer votre Nom et Prénom');
      return;
    }

    setName('');
    setSuccessMessage(`✓ Pointage "${type}" validé pour ${trimmedName}`);
    setTimeout(() => setSuccessMessage(''), 2500);

    const dateStr = new Date().toLocaleDateString('fr-FR');
    const timeStr = new Date().toLocaleTimeString();
    const fallbackLat = -11.57052;
    const fallbackLng = 27.55102;
    const defaultCoords = `${fallbackLat.toFixed(5)}, ${fallbackLng.toFixed(5)}`;

    const newRecordId = Date.now();
    const newRecord = {
      id: newRecordId,
      name: trimmedName,
      type,
      date: dateStr,
      time: timeStr,
      coords: defaultCoords
    };

    const updatedRecords = [newRecord, ...records];
    setRecords(updatedRecords);
    localStorage.setItem('pointage_records_v10', JSON.stringify(updatedRecords));

    if (!SUPABASE_URL.includes("ton-projet")) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/pointages`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(newRecord)
        });
      } catch (e) {
        console.error("Impossible d'envoyer au cloud", e);
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const exactCoords = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
          setRecords(prevRecords => {
            const refined = prevRecords.map(r => r.id === newRecordId ? { ...r, coords: exactCoords } : r);
            localStorage.setItem('pointage_records_v10', JSON.stringify(refined));
            return refined;
          });
        },
        () => {},
        { timeout: 3000, maximumAge: 60000 }
      );
    }
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin123') {
      setRecords(getStoredRecords());
      setIsAdminUnlocked(true);
      setAdminPasswordInput('');
      fetchCloudRecords();
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

  const handleConfirmClear = async () => {
    if (clearPasswordInput === 'admin123') {
      setRecords([]);
      localStorage.removeItem('pointage_records_v10');
      
      if (!SUPABASE_URL.includes("ton-projet")) {
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/pointages?id=gt.0`, {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });
        } catch (e) {
          console.error("Erreur suppression cloud", e);
        }
      }

      setShowClearConfirm(false);
      setClearPasswordInput('');
    } else {
      alert('Mot de passe de suppression incorrect !');
      setClearPasswordInput('');
    }
  };

  // Obtenir la liste unique des dates disponibles dans les enregistrements pour le filtre
  const availableDates = Array.from(new Set(records.map(r => r.date))).filter(Boolean);

  const filteredRecords = records.filter(r => {
    const matchesName = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'Tous' || r.type === filterType;
    const matchesDate = !selectedDateFilter || r.date === selectedDateFilter;
    return matchesName && matchesType && matchesDate;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f9', fontFamily: 'Arial, sans-serif', padding: '16px', color: '#333' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div>
            <h1 style={{ fontSize: '18px', margin: '0 0 4px 0', color: '#0f3d3e' }}>Pointage-RH</h1>
            <p style={{ fontSize: '13px', margin: 0, color: '#666', fontWeight: 'bold' }}>{company}</p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {isAdminUnlocked && (
              <button 
                onClick={() => setIsChangingCompany(!isChangingCompany)}
                style={{ padding: '6px 10px', fontSize: '12px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
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

        {/* Horloge */}
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', marginBottom: '16px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f3d3e' }}>
            {currentTime.toLocaleTimeString()}
          </div>
        </div>

        {/* Formulaire de Pointage (Pour les employés) */}
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
              type="button"
              onClick={() => handlePointer('Arrivée')}
              style={{ flex: 1, backgroundColor: '#0f3d3e', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ➔ Pointer l'arrivée
            </button>
            <button
              type="button"
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

        {/* Section Admin / Tableau Cloud Intégré avec Filtre par Date */}
        {!isAdminUnlocked ? (
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', marginBottom: '16px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px 0' }}>🔒 Le registre et les rapports RH sont verrouillés.</p>
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
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '2px solid #0f3d3e', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '15px', margin: 0, color: '#0f3d3e' }}>📊 Tableau Cloud RH ({filteredRecords.length})</h2>
              <button 
                onClick={fetchCloudRecords}
                style={{ fontSize: '11px', backgroundColor: '#e2e8f0', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', color: '#334155' }}
              >
                🔄 Actualiser
              </button>
            </div>

            {/* Barre de filtres (Recherche nom, Type, Date) */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Filtrer par nom..."
                style={{ padding: '8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                style={{ padding: '8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              >
                <option value="Tous">Tous types</option>
                <option value="Arrivée">Arrivée</option>
                <option value="Départ">Départ</option>
              </select>
              <select
                value={selectedDateFilter}
                onChange={e => setSelectedDateFilter(e.target.value)}
                style={{ padding: '8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: '#f8fafc', fontWeight: 'bold', color: '#0f3d3e' }}
              >
                <option value="">Toutes les dates</option>
                <option value={getTodayFormatted()}>Aujourd'hui ({getTodayFormatted()})</option>
                {availableDates.filter(d => d !== getTodayFormatted()).map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            </div>

            {filteredRecords.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', margin: '20px 0' }}>Aucun pointage trouvé pour cette sélection.</p>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f3d3e', color: 'white' }}>
                      <th style={{ padding: '10px', borderBottom: '1px solid #cbd5e1' }}>Nom</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #cbd5e1' }}>Type</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #cbd5e1' }}>Date</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #cbd5e1' }}>Heure</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #cbd5e1' }}>GPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r, index) => (
                      <tr key={r.id || index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{r.name}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ padding: '3px 6px', borderRadius: '4px', backgroundColor: r.type === 'Arrivée' ? '#dcfce7' : '#fee2e2', color: r.type === 'Arrivée' ? '#166534' : '#991b1b', fontWeight: 'bold' }}>
                            {r.type}
                          </span>
                        </td>
                        <td style={{ padding: '10px', color: '#64748b' }}>{r.date}</td>
                        <td style={{ padding: '10px', color: '#64748b', fontWeight: 'bold' }}>{r.time}</td>
                        <td style={{ padding: '10px' }}>
                          <a href={`https://www.google.com/maps?q=${r.coords}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0f3d3e', fontWeight: 'bold', textDecoration: 'none' }}>
                            {r.coords} 🗺️
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
              <button 
                onClick={() => setShowClearConfirm(true)}
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

        {/* MODAL SÉCURISÉ DE SUPPRESSION */}
        {showClearConfirm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', maxWidth: '360px', width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</div>
              <h3 style={{ fontSize: '16px', margin: '0 0 8px 0', color: '#1e293b' }}>Zone ultra-sensible</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                Effacer tout le registre va supprimer définitivement l'historique en ligne. Entrez le code administrateur :
              </p>
              <input
                type="password"
                value={clearPasswordInput}
                onChange={e => setClearPasswordInput(e.target.value)}
                placeholder="Code admin (admin123)"
                style={{ width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '8px', border: '1
