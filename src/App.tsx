import React, { useState, useEffect } from 'react';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "https://ton-projet.supabase.co";
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "ta-cle-anon-publique";

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
  
  const getTodayFormatted = () => new Date().toLocaleDateString('fr-FR');
  const [selectedDateFilter, setSelectedDateFilter] = useState(getTodayFormatted());
  
  const [name, setName] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const getStoredRecords = () => {
    const saved = localStorage.getItem('pointage_records_v11');
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
    localStorage.setItem('pointage_records_v11', JSON.stringify(updatedRecords));

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
            localStorage.setItem('pointage_records_v11', JSON.stringify(refined));
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
      localStorage.removeItem('pointage_records_v11');
      
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

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert("Aucune donnée à exporter pour cette sélection.");
      return;
    }

    const headers = ["Nom", "Type", "Date", "Heure", "Coordonnees GPS"];
    const rows = filteredRecords.map(r => [
      `"${r.name}"`,
      `"${r.type}"`,
      `"${r.date}"`,
      `"${r.time}"`,
      `"${r.coords}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Pointage_RH_${company.replace(/\s+/g, '_')}_${selectedDateFilter || 'global'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const availableDates = Array.from(new Set(records.map(r => r.date))).filter(Boolean);

  const filteredRecords = records.filter(r => {
    const matchesName = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'Tous' || r.type === filterType;
    const matchesDate = !selectedDateFilter || r.date === selectedDateFilter;
    return matchesName && matchesType && matchesDate;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f9', fontFamily: 'Arial, sans-serif', padding: '12px', color: '#333', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', backgroundColor: '#ffffff', padding: '12px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div>
            <h1 style={{ fontSize: '16px', margin: '0 0 2px 0', color: '#0f3d3e' }}>Pointage-RH</h1>
            <p style={{ fontSize: '12px', margin: 0, color: '#666', fontWeight: 'bold' }}>{company}</p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {isAdminUnlocked && (
              <button 
                onClick={() => setIsChangingCompany(!isChangingCompany)}
                style={{ padding: '6px 8px', fontSize: '11px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Config
              </button>
            )}
            {isAdminUnlocked && (
              <button 
                onClick={() => setIsAdminUnlocked(false)}
                style={{ padding: '6px 8px', fontSize: '11px', backgroundColor: '#b91c1c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Fermer
              </button>
            )}
          </div>
        </div>

        {isAdminUnlocked && isChangingCompany && (
          <form onSubmit={handleSaveCompany} style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <input 
              type="text" 
              value={tempCompany} 
              onChange={e => setTempCompany(e.target.value)}
              placeholder="Nom de l'entreprise"
              style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
            />
            <button type="submit" style={{ width: '100%', padding: '8px', backgroundColor: '#0f3d3e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px' }}>
              Enregistrer
            </button>
          </form>
        )}

        {/* Horloge */}
        <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '12px', marginBottom: '12px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f3d3e' }}>
            {currentTime.toLocaleTimeString()}
          </div>
        </div>

        {/* Formulaire de Pointage */}
        <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '12px', color: '#475569', marginBottom: '10px', marginTop: 0 }}>
            Indiquez votre nom et validez :
          </p>

          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre Nom et Prénom"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handlePointer('Arrivée')}
              style={{ flex: 1, backgroundColor: '#0f3d3e', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ➔ Arrivée
            </button>
            <button
              type="button"
              onClick={() => handlePointer('Départ')}
              style={{ flex: 1, backgroundColor: '#b91c1c', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ← Départ
            </button>
          </div>

          {successMessage && (
            <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', marginTop: '8px' }}>
              {successMessage}
            </div>
          )}
        </div>

        {/* Tableau de Bord Admin */}
        {!isAdminUnlocked ? (
          <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', marginBottom: '12px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>🔒 Espace RH / Direction verrouillé.</p>
            <form onSubmit={handleAdminLoginSubmit} style={{ display: 'flex', gap: '6px', maxWidth: '280px', margin: '0 auto' }}>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={e => setAdminPasswordInput(e.target.value)}
                placeholder="Code (admin123)"
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />
              <button type="submit" style={{ padding: '8px 12px', backgroundColor: '#0f3d3e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                Ouvrir
              </button>
            </form>
          </div>
        ) : (
          <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', marginBottom: '12px', border: '2px solid #0f3d3e', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            
            {/* En-tête du tableau avec bouton Excel bien visible */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '14px', margin: 0, color: '#0f3d3e' }}>📊 Tableau RH ({filteredRecords.length})</h2>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  onClick={handleExportCSV}
                  style={{ fontSize: '11px', backgroundColor: '#166534', color: 'white', border: 'none', padding: '6px 8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  📥 Excel
                </button>
                <button 
                  onClick={fetchCloudRecords}
                  style={{ fontSize: '11px', backgroundColor: '#e2e8f0', border: 'none', padding: '6px 8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', color: '#334155' }}
                >
                  🔄
                </button>
              </div>
            </div>

            {/* Filtres empilés verticalement pour s'adapter à l'écran du téléphone sans dépasser */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Filtrer par nom..."
                style={{ width: '100%', padding: '8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                >
                  <option value="Tous">Tous types</option>
                  <option value="Arrivée">Arrivée</option>
                  <option value="Départ">Départ</option>
                </select>
                <select
                  value={selectedDateFilter}
                  onChange={e => setSelectedDateFilter(e.target.value)}
                  style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: '#f8fafc', fontWeight: 'bold', color: '#0f3d3e' }}
                >
                  <option value="">Toutes les dates</option>
                  <option value={getTodayFormatted()}>Aujourd'hui</option>
                  {availableDates.filter(d => d !== getTodayFormatted()).map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredRecords.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', margin: '15px 0' }}>Aucun pointage trouvé.</p>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f3d3e', color: 'white' }}>
                      <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Nom</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Type</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Date</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Heure</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>GPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r, index) => (
                      <tr key={r.id || index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold', color: '#1e293b' }}>{r.name}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ padding: '2px 4px', borderRadius: '4px', backgroundColor: r.type === 'Arrivée' ? '#dcfce7' : '#fee2e2', color: r.type === 'Arrivée' ? '#166534' : '#991b1b', fontWeight: 'bold' }}>
                            {r.type}
                          </span>
                        </td>
                        <td style={{ padding: '8px', color: '#64748b' }}>{r.date}</td>
                        <td style={{ padding: '8px', color: '#64748b', fontWeight: 'bold' }}>{r.time}</td>
                        <td style={{ padding: '8px' }}>
                          <a href={`https://www.google.com/maps?q=${r.coords}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0f3d3e', fontWeight: 'bold', textDecoration: 'none' }}>
                            Carte 🗺️
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
              <button 
                onClick={() => setShowClearConfirm(true)}
                style={{ padding: '6px 8px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🗑️ Vider
              </button>
              <button 
                onClick={() => setIsAdminUnlocked(false)}
                style={{ padding: '6px 8px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🔒 Verrouiller
              </button>
            </div>

          </div>
        )}

        {/* Modal de suppression */}
        {showClearConfirm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <
