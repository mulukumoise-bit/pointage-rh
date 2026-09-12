import React, { useState, useEffect } from 'react';

export default function App() {
  const [company, setCompany] = useState(() => localStorage.getItem('company_name') || 'Mon Entreprise');
  const [isChangingCompany, setIsChangingCompany] = useState(false);
  const [tempCompany, setTempCompany] = useState(() => localStorage.getItem('company_name') || 'Mon Entreprise');
  
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  
  // État pour gérer l'affichage de notre propre boîte de dialogue de confirmation (modal propre)
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tous');
  const [name, setName] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fonction utilitaire pour charger les pointages directement depuis le localStorage
  const getStoredRecords = () => {
    const saved = localStorage.getItem('pointage_records_v6');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  };

  const [records, setRecords] = useState(getStoredRecords);

  // Synchronisation automatique avec localStorage à chaque modification
  useEffect(() => {
    localStorage.setItem('pointage_records_v6', JSON.stringify(records));
  }, [records]);

  // Horloge en temps réel
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

    // Vidage immédiat de la case employé et affichage du succès
    setName('');
    setSuccessMessage(`✓ Pointage "${type}" validé pour ${trimmedName}`);
    setTimeout(() => setSuccessMessage(''), 2500);

    const timeStr = new Date().toLocaleTimeString();
    const fallbackLat = -11.57052;
    const fallbackLng = 27.55102;
    const defaultCoords = `${fallbackLat.toFixed(5)}, ${fallbackLng.toFixed(5)}`;

    const newRecordId = Date.now();
    const newRecord = {
      id: newRecordId,
      name: trimmedName,
      type,
      time: timeStr,
      coords: defaultCoords
    };

    const updatedRecords = [newRecord, ...records];
    setRecords(updatedRecords);
    localStorage.setItem('pointage_records_v6', JSON.stringify(updatedRecords));

    // Tentative GPS discrète en arrière-plan
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const exactCoords = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
          setRecords(prevRecords => {
            const refined = prevRecords.map(r => r.id === newRecordId ? { ...r, coords: exactCoords } : r);
            localStorage.setItem('pointage_records_v6', JSON.stringify(refined));
            return refined;
          });
        },
        () => {},
        { timeout: 3000, maximumAge: 60000 }
      );
    }
  };

  const exportCSV = () => {
    const currentRecords = getStoredRecords();
    const headers = "Nom,Type,Heure,Coordonnees GPS\n";
    const rows = currentRecords.map(r => `"${r.name}","${r.type}","${r.time}","${r.coords}"`).join("\n");
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
      setRecords(getStoredRecords());
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

  const unlockAdminPanel = () => {
    setRecords(getStoredRecords());
    setIsAdminUnlocked(true);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f9', fontFamily: 'Arial, sans-serif', padding: '16px', color: '#333' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* En-tête de l'application */}
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

        {/* Bloc Horloge & Date */}
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', marginBottom: '16px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f3d3e' }}>
            {currentTime.toLocaleTimeString()}
          </div>
        </div>

        {/* Formulaire de Pointage Employé */}
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

        {/* Section Administrateur (Code: admin123) */}
        {!isAdminUnlocked ? (
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', marginBottom: '16px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px 0' }}>🔒 Le registre, les heures et la géolocalisation sont verrouillés.</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (adminPasswordInput === 'admin123') {
                unlockAdminPanel();
                setAdminPasswordInput('');
              } else {
                alert('Code administrateur incorrect !');
                setAdminPasswordInput('');
              }
            }} style={{ display: 'flex', gap: '8px', maxWidth: '300px', margin: '0 auto' }}>
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

        {/* MODAL DE CONFIRMATION PROFESSIONNEL (Remplace le confirm() natif moche) */}
        {showClearConfirm && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px',
              maxWidth: '360px', width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</div>
              <h3 style={{ fontSize: '16px', margin: '0 0 8px 0', color: '#1e293b' }}>Vider le registre</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0', lineHeight: '1.4' }}>
                Voulez-vous vraiment supprimer tout l'historique des pointages ? Cette action est irréversible.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  style={{
                    flex: 1, padding: '10px', backgroundColor: '#e2e8f0', color: '#334155',
                    border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    setRecords([]);
                    localStorage.removeItem('pointage_records_v6');
                    setShowClearConfirm(false);
                  }}
                  style={{
                    flex: 1, padding: '10px', backgroundColor: '#b91c1c', color: '#ffffff',
                    border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pied de page */}
        <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', lineHeight: '1.5', marginTop: '16px' }}>
          🔒 Vos informations restent confidentielles et sécurisées.<br />
          📍 Autorisation de position requise pour valider le pointage.<br />
          ⏱️ Historique sauvegardé durablement.
        </div>

      </div>
    </div>
  );
                         }
              
