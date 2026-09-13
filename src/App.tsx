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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const saved = localStorage.getItem('pointages_rh_pro_v3');
    if (saved) {
      try { setRecords(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    const savedCompany = localStorage.getItem('pointages_rh_company_v3');
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
    const newRecord = {
      id: Date.now(),
      name: name.trim(),
      type,
      date: currentTime.toLocaleDateString('fr-FR'),
      time: currentTime.toLocaleTimeString('fr-FR')
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    localStorage.setItem('pointages_rh_pro_v3', JSON.stringify(updated));
    setName('');
    showToast(`Pointage de type [${type}] enregistré pour ${newRecord.name}.`);
  };

  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin123') {
      setIsAdminUnlocked(true);
      setAdminPasswordInput('');
      showToast("Session administrateur ouverte.");
    } else {
      showToast("Clé d'accès invalide.", "error");
      setAdminPasswordInput('');
    }
  };

  const handleSaveCompany = (e) => {
    e.preventDefault();
    if (!newCompanyNameInput.trim()) {
      showToast("Le nom de l'entreprise ne peut être vide.", "error");
      return;
    }
    setCompany(newCompanyNameInput.trim());
    localStorage.setItem('pointages_rh_company_v3', newCompanyNameInput.trim());
    setIsEditingCompany(false);
    setNewCompanyNameInput('');
    showToast("Paramètres de l'entreprise mis à jour.");
  };

  const handleExportRealExcel = () => {
    if (records.length === 0) {
      showToast("Aucun registre à exporter.", "error");
      return;
    }
    let reportText = `REGISTRE DES PRÉSENCES - ${company}\n`;
    reportText += `Date : ${currentTime.toLocaleDateString('fr-FR')}\n\n`;
    records.forEach((r, index) => {
      reportText += `${index + 1}. ${r.name} | ${r.type} | ${r.time} (${r.date})\n`;
    });
    reportText += `\nTotal lignes : ${records.length}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(reportText).then(() => {
        showToast("Registre copié dans le presse-papier.");
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
      showToast("Registre copié.");
    } catch (err) {
      showToast("Échec de la copie.", "error");
    }
    document.body.removeChild(textArea);
  };

  const confirmClearHistory = () => {
    setRecords([]);
    localStorage.removeItem('pointages_rh_pro_v3');
    setShowClearModal(false);
    showToast("Registre des pointages réinitialisé.");
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '24px 16px', boxSizing: 'border-box', color: '#1e293b' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        
        {/* Notification Toast Corporate */}
        {notification && (
          <div style={{
            backgroundColor: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
            color: notification.type === 'error' ? '#991b1b' : '#166534',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: '500',
            border: `1px solid ${notification.type === 'error' ? '#fca5a5' : '#bbf7d0'}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            {notification.message}
          </div>
        )}

        {/* Header Pro Minimaliste & Sobre */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          padding: '24px 20px', 
          borderRadius: '12px', 
          marginBottom: '16px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>
              Pointage RH • Solution Pro
            </div>
            <h1 style={{ fontSize: '18px', margin: '0', fontWeight: '700', color: '#0f172a' }}>
              {company}
            </h1>
          </div>
          <button
            onClick={() => { setIsEditingCompany(true); setNewCompanyNameInput(company); }}
            style={{
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            Modifier
          </button>
        </div>

        {/* Horloge Administrative Pro */}
        <div style={{ backgroundColor: '#ffffff', padding: '18px 20px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 2px 0', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
              Date Actuelle
            </p>
            <p style={{ fontSize: '13px', color: '#0f172a', margin: '0', fontWeight: '600', textTransform: 'capitalize' }}>
              {currentTime.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 2px 0', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
              Heure
            </p>
            <h2 style={{ fontSize: '20px', color: '#0f172a', margin: '0', fontWeight: '700', fontFamily: 'monospace' }}>
              {currentTime.toLocaleTimeString('fr-FR')}
            </h2>
          </div>
        </div>

        {/* Section de Pointage Salarié */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px 20px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#334155', marginBottom: '8px', fontWeight: '600' }}>
            Identification du collaborateur
          </label>
          <input
            type="text"
            placeholder="Nom et Prénom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '11px 14px', 
              borderRadius: '8px', 
              border: '1px solid #cbd5e1', 
              marginBottom: '16px', 
              fontSize: '13px', 
              boxSizing: 'border-box',
              outline: 'none',
              backgroundColor: '#ffffff',
              color: '#0f172a',
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handlePointage('Arrivée')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #059669',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: '#ecfdf5',
                color: '#065f46',
                transition: 'background 0.15s'
              }}
            >
              Enregistrer Arrivée
            </button>
            <button
              type="button"
              onClick={() => handlePointage('Départ')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #dc2626',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                transition: 'background 0.15s'
              }}
            >
              Enregistrer Départ
            </button>
          </div>
        </div>

        {/* Espace Direction / Gestion RH */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px 20px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {!isAdminUnlocked ? (
            <div>
              <p style={{ fontSize: '13px', color: '#334155', marginBottom: '10px', fontWeight: '600' }}>
                Accès Sécurisé Direction / RH
              </p>
              <form onSubmit={handleAdminLoginSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  placeholder="Code d'accès (admin123)"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
                <button type="submit" style={{ padding: '10px 16px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Ouvrir
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ fontSize: '15px', margin: '0', color: '#0f172a', fontWeight: '700' }}>Registre des Pointages</h2>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>Total entrées : {records.length}</p>
                </div>
                <button
                  onClick={handleExportRealExcel}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Exporter texte
                </button>
              </div>

              {records.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '24px 0' }}>Aucun pointage répertorié ce jour.</p>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '10px' }}>Nom</th>
                        <th style={{ padding: '10px' }}>Type</th>
                        <th style={{ padding: '10px' }}>Date</th>
                        <th style={{ padding: '10px' }}>Heure</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, index) => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', fontWeight: '600', color: '#0f172a' }}>{r.name}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: r.type === 'Arrivée' ? '#ecfdf5' : '#fef2f2', color: r.type === 'Arrivée' ? '#065f46' : '#991b1b', fontWeight: '600', fontSize: '11px' }}>
                              {r.type}
                            </span>
                          </td>
                          <td style={{ padding: '10px', color: '#64748b' }}>{r.date}</td>
                          <td style={{ padding: '10px', color: '#64748b', fontFamily: 'monospace' }}>{r.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                <button onClick={() => setIsAdminUnlocked(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}>
                  Verrouiller la session
                </button>
                {records.length > 0 && (
                  <button onClick={() => setShowClearModal(true)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>
                    Vider le registre
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modales de configuration */}
      {isEditingCompany && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', maxWidth: '360px', width: '100%', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '16px', color: '#0f172a', margin: '0 0 6px 0', fontWeight: '700' }}>Nom de l'entreprise</h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>Définissez l'intitulé affiché sur l'interface.</p>
            <form onSubmit={handleSaveCompany}>
              <input
                type="text"
                placeholder="Raison sociale..."
                value={newCompanyNameInput}
                onChange={(e) => setNewCompanyNameInput(e.target.value)}
                style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '16px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setIsEditingCompany(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showClearModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: '1000', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', maxWidth: '360px', width: '100%', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '16px', color: '#0f172a', margin: '0 0 6px 0', fontWeight: '700' }}>Confirmation</h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>Voulez-vous réinitialiser l'ensemble des données de pointage ?</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowClearModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={confirmClearHistory} style={{ flex: '1', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
    }
    
