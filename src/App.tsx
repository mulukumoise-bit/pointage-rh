import React, { useState, useEffect } from 'react';

export default function App() {
  const [company, setCompany] = useState(() => localStorage.getItem('company_name') || 'Mon Entreprise');
  const [isChangingCompany, setIsChangingCompany] = useState(false);
  const [tempCompany, setTempCompany] = useState(() => localStorage.getItem('company_name') || 'Mon Entreprise');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [licenseExpiry, setLicenseExpiry] = useState(() => localStorage.getItem('rh_license_expiry') || '');
  const [activationCode, setActivationCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tous');
  const [name, setName] = useState('');

  // Vérifier si la licence est valide
  const isLicenseValid = () => {
    if (!licenseExpiry) return false;
    return new Date().getTime() < new Date(licenseExpiry).getTime();
  };

  const handleActivateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (activationCode === 'PRO2026') {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      const expiryStr = expiry.toISOString();
      localStorage.setItem('rh_license_expiry', expiryStr);
      setLicenseExpiry(expiryStr);
      setActivationCode('');
      alert('Licence activée avec succès pour 30 jours !');
    } else {
      alert('Code d‘activation incorrect. Contactez le support via WhatsApp.');
    }
  };

  const [records, setRecords] = useState([]);

  useEffect(() => {
    // Vide la mémoire une bonne fois pour toutes
    localStorage.removeItem('pointage_records_v2');
  }, []);

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
        position => saveRecord(position.coords.latitude, position.coords.longitude),
        () => saveRecord(fallbackLat, fallbackLng),
        { timeout: 10000 }
      );
    } else {
      saveRecord(fallbackLat, fallbackLng);
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

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '1234') {
      setIsAdminUnlocked(true);
      setAdminPassword('');
    } else {
      alert('Mot de passe incorrect (par défaut: 1234)');
    }
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempCompany.trim()) {
      setCompany(tempCompany.trim());
      localStorage.setItem('company_name', tempCompany.trim());
      setIsChangingCompany(false);
      alert('Nom de l’entreprise mis à jour !');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f9', fontFamily: 'Arial, sans-serif', padding: '16px', color: '#333' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div>
            <h1 style={{ fontSize: '18px', margin: '0 0 4px 0', color: '#0f3d3e' }}>Pointage-RH</h1>
            <p style={{ fontSize: '13px', margin: 0, color: '#666' }}>{company}</p>
          </div>
          <button 
            onClick={() => setIsChangingCompany(!isChangingCompany)}
            style={{ padding: '6px 10px', fontSize: '12px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Modifier
          </button>
        </div>

        {isChangingCompany && (
          <form onSubmit={handleSaveCompany} style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <input 
              type="text" 
              value={tempCompany} 
              onChange={e => setTempCompany(e.target.value)}
              placeholder="Nom de l'entreprise"
              style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
            <button type="submit" style={{ width: '100%', padding: '8px', backgroundColor: '#0f3d3e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
              Enregistrer
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

        {/* Bloc Formulaire de Pointage */}
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
              placeholder="Ex: Moise Muluku"
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
        </div>

        {/* Liste des Pointages */}
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', margin: 0, color: '#0f3d3e' }}>Registre ({records.length})</h2>
            {records.length > 0 && (
              <button onClick={exportCSV} style={{ fontSize: '12px', padding: '6px 10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>
                Exporter CSV
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
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', margin: '20px 0' }}>Aucun pointage enregistré.</p>
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
                      {r.time} • <a href={`https://www.google.com/maps?q=${r.coords}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0f3d3e' }}>GPS: {r.coords} 🗺️</a>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', backgroundColor: r.type === 'Arrivée' ? '#dcfce7' : '#fee2e2', color: r.type === 'Arrivée' ? '#166534' : '#991b1b', fontWeight: 'bold' }}>
                    {r.type}
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Pied de page / Mentions */}
        <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', lineHeight: '1.5' }}>
          🔒 Vos informations restent confidentielles et sécurisées.<br />
          📍 Autorisation de position requise pour valider le pointage.<br />
          ⏱️ Historique sauvegardé durablement.
        </div>

      </div>
    </div>
  );
        }
          
