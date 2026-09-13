import React, { useState, useEffect } from 'react';

export default function App() {
  const [name, setName] = useState('');
  const [records, setRecords] = useState([]);
  const [company, setCompany] = useState('Mon Entreprise');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notification, setNotification] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [newCompanyNameInput, setNewCompanyNameInput] = useState('');
  const [isLoadingGps, setIsLoadingGps] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const saved = localStorage.getItem('pointage_rh_gps_live_v9');
    if (saved) {
      try { setRecords(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    const savedCompany = localStorage.getItem('pointage_rh_company_v9');
    if (savedCompany) {
      setCompany(savedCompany);
    }
    return () => clearInterval(timer);
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handlePointage = (type) => {
    if (!name.trim()) {
      showToast("Veuillez indiquer votre nom et prénom.", "error");
      return;
    }

    setIsLoadingGps(true);
    showToast("Recherche de la position GPS en cours...", "success");

    if (!navigator.geolocation) {
      saveRecordWithLocation(type, "GPS non supporté");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        saveRecordWithLocation(type, locString);
      },
      (error) => {
        console.warn("Erreur GPS:", error);
        saveRecordWithLocation(type, "Position non disponible");
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const saveRecordWithLocation = (type, locationStr) => {
    setIsLoadingGps(false);
    const newRecord = {
      id: Date.now(),
      name: name.trim(),
      type,
      date: currentTime.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: currentTime.toLocaleTimeString('fr-FR'),
      location: locationStr
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    localStorage.setItem('pointage_rh_gps_live_v9', JSON.stringify(updated));
    setName('');
    showToast(`Pointage (${type}) validé avec succès ! (GPS: ${locationStr})`);
  };

  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin123') {
      setIsAdminUnlocked(true);
      setAdminPasswordInput('');
      showToast("Espace direction ouvert.");
    } else {
      showToast("Code admin incorrect.", "error");
      setAdminPasswordInput('');
    }
  };

  const handleSaveCompany = (e) => {
    e.preventDefault();
    if (!newCompanyNameInput.trim()) {
      showToast("Le nom ne peut être vide.", "error");
      return;
    }
    setCompany(newCompanyNameInput.trim());
    localStorage.setItem('pointage_rh_company_v9', newCompanyNameInput.trim());
    setIsEditingCompany(false);
    setNewCompanyNameInput('');
    showToast("Nom de l'entreprise mis à jour.");
  };

  const handleExportRealExcel = () => {
    if (records.length === 0) {
      showToast("Aucun historique à exporter.", "error");
      return;
    }
    let reportText = `📋 REGISTRE DES PRÉSENCES - ${company}\n`;
    reportText += `Date : ${currentTime.toLocaleDateString('fr-FR')}\n\n`;
    records.forEach((r, index) => {
      reportText += `${index + 1}. ${r.name} - ${r.type} à ${r.time} (${r.date}) [GPS: ${r.location}]\n`;
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(reportText).then(() => {
        showToast("Rapport copié !");
      }).catch(() => fallbackCopyText(reportText));
    } else {
      fallbackCopyText(reportText);
    }
  };

  const fallbackCopyText = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast("Rapport copié !");
    } catch (err) {
      showToast("Erreur lors de la copie.", "error");
    }
    document.body.removeChild(textArea);
  };

  const confirmClearHistory = () => {
    setRecords([]);
    localStorage.removeItem('pointage_rh_gps_live_v9');
    setShowClearModal(false);
    showToast("Historique réinitialisé.");
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f2eb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '16px', boxSizing: 'border-box', color: '#1e293b' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        
        {notification && (
          <div style={{ backgroundColor: notification.type === 'error' ? '#fee2e2' : '#dcfce7', color: notification.type === 'error' ? '#991b1b' : '#166534', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px', fontWeight: '600', border: `1px solid ${notification.type === 'error' ? '#fca5a5' : '#86efac'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            {notification.message}
          </div>
        )}

        {/* En-tête Titre + Étoile */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 4px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', margin: '0', backgroundColor: '#111827', padding: '6px 12px', borderRadius: '8px', letterSpacing: '-0.5px' }}>
            Pointage-RH
          </h1>
          <div style={{ fontSize: '24px' }}>⭐</div>
        </div>

        {/* Carte Bleue Supérieure Dégradée */}
        <div style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)', color: '#ffffff', padding: '24px 20px', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '22px', margin: '0 0 8px 0', fontWeight: '900', letterSpacing: '-0.5px' }}>
              Pointage-RH
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', opacity: '0.95' }}>
              <span>📅</span> {company}
            </div>
          </div>
          <button
            onClick={() => { setIsEditingCompany(true); setNewCompanyNameInput(company); }}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.4)', color: '#ffffff', padding: '10px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          >
            <span>🌌</span> Créer Votre Entreprise
          </button>
        </div>

        {/* Bloc Heure (Fond Beige) */}
        <div style={{ backgroundColor: '#faf8f5', padding: '20px', borderRadius: '20px', marginBottom: '20px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e7e2d6' }}>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 6px 0', fontWeight: '700' }}>
            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#1e3a8a', fontFamily: 'monospace', letterSpacing: '1px' }}>
            {currentTime.toLocaleTimeString('fr-FR')}
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#059669', fontWeight: '700' }}>
            📍 Le GPS se capture automatiquement au clic
          </div>
        </div>

        {/* Bloc Identification & Pointage (Fond Beige) */}
        <div style={{ backgroundColor: '#faf8f5', padding: '24px 20px', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e7e2d6' }}>
          <p style={{ fontSize: '13px', color: '#334155', marginBottom: '12px', fontWeight: '700', textAlign: 'center' }}>
            Indiquez votre nom puis pointez directement :
          </p>
          
          <input
            type="text"
            placeholder="Votre Nom et Prénom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #dcd5c7', marginBottom: '16px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: '600' }}
          />

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              disabled={isLoadingGps}
              onClick={() => handlePointage('Arrivée')}
              style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', backgroundColor: '#10b981', color: '#ffffff', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isLoadingGps ? 0.7 : 1 }}
            >
              <span style={{ width: '8px', height: '8px', backgroundColor: '#ffffff', borderRadius: '50%' }}></span>
              {isLoadingGps ? 'GPS...' : 'Arrivée'}
            </button>
            <button
              type="button"
              disabled={isLoadingGps}
              onClick={() => handlePointage('Départ')}
              style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', backgroundColor: '#ef4444', color: '#ffffff', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isLoadingGps ? 0.7 : 1 }}
            >
              <span style={{ width: '8px', height: '8px', backgroundColor: '#ffffff', borderRadius: '50%' }}></span>
              {isLoadingGps ? 'GPS...' : 'Départ'}
            </button>
          </div>
        </div>

        {/* Espace Direction / RH (Fond Beige) */}
        <div style={{ backgroundColor: '#faf8f5', padding: '24px 20px', borderRadius: '20px', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e7e2d6' }}>
          {!isAdminUnlocked ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span>🔓</span>
                <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '800' }}>Espace Direction / RH</span>
              </div>
              <form onSubmit={handleAdminLoginSubmit} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="password"
                  placeholder="Code admin (admin123)"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  style={{ flex: 1, padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #dcd5c7', fontSize: '13px', outline: 'none', backgroundColor: '#ffffff' }}
                />
                <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  Entrer
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', margin: '0', color: '#1e293b', fontWeight: '800' }}>📊 Registre & GPS</h3>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0', fontWeight: '600' }}>Total : {records.length} pointage(s)</p>
                </div>
                <button onClick={handleExportRealExcel} style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                  📋 Copier le rapport
                </button>
              </div>

              {records.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '24px 0' }}>Aucun pointage enregistré.</p>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #e7e2d6', borderRadius: '10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                        <th style={{ padding: '10px' }}>Nom</th>
                        <th style={{ padding: '10px' }}>Type</th>
                        <th style={{ padding: '10px' }}>Heure</th>
                        <th style={{ padding: '10px' }}>GPS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, index) => (
                        <tr key={r.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f5f2eb', borderBottom: '1px solid #e7e2d6' }}>
                          <td style={{ padding: '10px', fontWeight: '700', color: '#0f172a' }}>{r.name}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: r.type === 'Arrivée' ? '#dcfce7' : '#fee2e2', color: r.type === 'Arrivée' ? '#166534' : '#991b1b', fontWeight: '700', fontSize: '11px' }}>
                              {r.type}
                            </span>
                          </td>
                          <td style={{ padding: '10px', color: '#64748b', fontFamily: 'monospace' }}>{r.time}</td>
                          <td style={{ padding: '10px', color: '#059669', fontSize: '10px', fontFamily: 'monospace', fontWeight: '700' }}>{r.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <button onClick={() => setIsAdminUnlocked(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}>
                  Verrouiller
                </button>
                {records.length > 0 && (
                  <button onClick={() => setShowClearModal(true)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', fontWeight: '700' }}>
                    Vider l'historique
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modale Entreprise */}
      {isEditingCompany && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#faf8f5', padding: '24px', borderRadius: '20px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 25px rgba(0,0,0,0.15)', border: '1px solid #e7e2d6' }}>
            <h3 style={{ fontSize: '18px', color: '#0f172a', margin: '0 0 6px 0', fontWeight: '800' }}>Nom de l'entreprise</h3>
            <form onSubmit={handleSaveCompany}>
              <input
                type="text"
                placeholder="Ex: Mon Entreprise..."
                value={newCompanyNameInput}
                onChange={(e) => setNewCompanyNameInput(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #dcd5c7', marginBottom: '20px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#ffffff' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setIsEditingCompany(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #dcd5c7', backgroundColor: '#ffffff', color: '#334155', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Annuler</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#1e3a8a', color: '#ffffff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale Confirmation Suppression */}
      {showClearModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#faf8f5', padding: '24px', borderRadius: '20px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 20px 25px rgba(0,0,0,0.15)', border: '1px solid #e7e2d6' }}>
            <h3 style={{ fontSize: '18px', color: '#0f172a', margin: '0 0 6px 0', fontWeight: '800' }}>Confirmation</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>Voulez-vous vraiment effacer tout l'historique ?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowClearModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #dcd5c7', backgroundColor: '#ffffff', color: '#334155', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Annuler</button>
              <button onClick={confirmClearHistory} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#ef4444', color: '#ffffff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
      }
      
