import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx'; // Import de la librairie Excel professionnelle

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "https://ton-projet.supabase.co";
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "ta-cle-anon-publique";

export default function App() {
  const [company, setCompany] = useState(() => localStorage.getItem('company_name') || 'Mon Entreprise');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearPasswordInput, setClearPasswordInput] = useState('');
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [name, setName] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const getStoredRecords = () => {
    const saved = localStorage.getItem('pointage_records_v12');
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
    localStorage.setItem('pointage_records_v12', JSON.stringify(updatedRecords));

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
            localStorage.setItem('pointage_records_v12', JSON.stringify(refined));
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

  const handleConfirmClear = async () => {
    if (clearPasswordInput === 'admin123') {
      setRecords([]);
      localStorage.removeItem('pointage_records_v12');
      
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

    // Export Excel robuste sans passer par le piège du WebView mobile
  const handleExportRealExcel = () => {
    if (records.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    const dataToExport = records.map(r => ({
      "Nom & Prénom": r.name,
      "Type de Pointage": r.type,
      "Date": r.date,
      "Heure": r.time,
      "Coordonnées GPS": r.coords
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Présences");

    // Génération directe en tableau binaire sécurisé pour mobile
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Création d'une URL de téléchargement explicite avec nom de fichier forcé
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pointage_${company.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`;
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f9', fontFamily: 'Arial, sans-serif', padding: '12px', color: '#333', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* En-tête de l'application */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', backgroundColor: '#ffffff', padding: '12px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div>
            <h1 style={{ fontSize: '16px', margin: '0 0 2px 0', color: '#0f3d3e' }}>Pointage-RH</h1>
            <p style={{ fontSize: '12px', margin: 0, color: '#666', fontWeight: 'bold' }}>{company}</p>
          </div>
          {isAdminUnlocked && (
            <button 
              onClick={() => setIsAdminUnlocked(false)}
              style={{ padding: '6px 10px', fontSize: '11px', backgroundColor: '#b91c1c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Verrouiller
            </button>
          )}
        </div>

        {/* Horloge en direct */}
        <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '12px', marginBottom: '12px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f3d3e' }}>
            {currentTime.toLocaleTimeString()}
          </div>
        </div>

        {/* Zone de Pointage Employé */}
        <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '12px', color: '#475569', marginBottom: '10px', marginTop: 0 }}>
            Indiquez votre nom et validez votre présence :
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

        {/* Connexion Admin ou Tableau de Bord Direction */}
        {!isAdminUnlocked ? (
          <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', marginBottom: '12px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>🔒 Espace Direction (Entrer le code admin)</p>
            <form onSubmit={handleAdminLoginSubmit} style={{ display: 'flex', gap: '6px', maxWidth: '280px', margin: '0 auto' }}>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={e => setAdminPasswordInput(e.target.value)}
                placeholder="Code admin"
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />
              <button type="submit" style={{ padding: '8px 12px', backgroundColor: '#0f3d3e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                Entrer
              </button>
            </form>
          </div>
        ) : (
          <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', marginBottom: '12px', border: '2px solid #0f3d3e', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            
            {/* Barre d'action Admin avec le bouton Vrai Export Excel (.xlsx) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '14px', margin: 0, color: '#0f3d3e' }}>📊 Registre des Présences</h2>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>Total enregistrements : {records.length}</p>
              </div>
              <button 
                onClick={handleExportRealExcel}
                style={{ fontSize: '12px', backgroundColor: '#166534', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                📥 Télécharger Excel (.xlsx)
              </button>
            </div>

            {records.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', margin: '20px 0' }}>Aucun pointage enregistré pour le moment.</p>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f3d3e', color: 'white' }}>
                      <th style={{ padding: '8px' }}>Nom</th>
                      <th style={{ padding: '8px' }}>Type</th>
                      <th style={{ padding: '8px' }}>Date</th>
                      <th style={{ padding: '8px' }}>Heure</th>
                      <th style={{ padding: '8px' }}>GPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, index) => (
                      <tr key={r.id || index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold', color: '#1e293b' }}>{r.name}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: r.type === 'Arrivée' ? '#dcfce7' : '#fee2e2', color: r.type === 'Arrivée' ? '#166534' : '#991b1b', fontWeight: 'bold' }}>
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
                🗑️ Vider l'historique
              </button>
            </div>

          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {showClearConfirm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', maxWidth: '320px', width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>⚠️</div>
              <h3 style={{ fontSize: '14px', margin: '0 0 6px 0', color: '#1e293b' }}>Attention</h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
                Entrez le mot de passe admin pour effacer tous les registres :
              </p>
              <input
                type="password"
                value={clearPasswordInput}
                onChange={e => setClearPasswordInput(e.target.value)}
                placeholder="Code admin"
                style={{ width: '100%', padding: '8px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setShowClearConfirm(false); setClearPasswordInput(''); }} style={{ flex: 1, padding: '8px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleConfirmClear} style={{ flex: 1, padding: '8px', backgroundColor: '#b91c1c', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Confirmer</button>
              </div>
            </div>
          </div>
        )}

        {/* Pied de page */}
        <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', marginTop: '12px' }}>
          Pointage-RH Professionnel • Gestion des présences
        </div>

      </div>
    </div>
  );
      }
                                                 
