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
    const saved = localStorage.getItem('pointages_rh');
    if (saved) {
      try { setRecords(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    const savedCompany = localStorage.getItem('pointages_rh_company');
    if (savedCompany) {
      setCompany(savedCompany);
    }
    return () => clearInterval(timer);
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handlePointage = (type) => {
    if (!name.trim()) {
      showToast("Veuillez d'abord entrer votre nom et prénom.", "error");
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
    localStorage.setItem('pointages_rh', JSON.stringify(updated));
    setName('');
    showToast(`Pointage (${type}) enregistré avec succès pour ${newRecord.name} !`);
  };

  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin123') {
      setIsAdminUnlocked(true);
      setAdminPasswordInput('');
      showToast("Accès administrateur autorisé.");
    } else {
      showToast("Code admin incorrect.", "error");
      setAdminPasswordInput('');
    }
  };

  const handleSaveCompany = (e) => {
    e.preventDefault();
    if (!newCompanyNameInput.trim()) {
      showToast("Le nom de l'entreprise ne peut pas être vide.", "error");
      return;
    }
    setCompany(newCompanyNameInput.trim());
    localStorage.setItem('pointages_rh_company', newCompanyNameInput.trim());
    setIsEditingCompany(false);
    setNewCompanyNameInput('');
    showToast("Nom de l'entreprise mis à jour avec succès !");
  };

  const handleExportRealExcel = () => {
    if (records.length === 0) {
      showToast("Aucune donnée à exporter.", "error");
      return;
    }
    let reportText = `📋 *REGISTRE DES PRÉSENCES - ${company}* \n`;
    reportText += `Date du jour : ${currentTime.toLocaleDateString('fr-FR')}\n\n`;
    
    records.forEach((r, index) => {
      reportText += `${index + 1}. *${r.name}* - ${r.type} à ${r.time} (${r.date})\n`;
    });
    
    reportText += `\nTotal enregistrements : ${records.length}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(reportText).then(() => {
        showToast("Rapport copié dans le presse-papier ! Prêt à être collé.");
      }).catch(() => {
        fallbackCopyText(reportText);
      });
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
      showToast("Rapport copié dans le presse-papier !");
    } catch (err) {
      showToast("Erreur lors de la copie du rapport.", "error");
    }
    document.body.removeChild(textArea);
  };

  const confirmClearHistory = () => {
    setRecords([]);
    localStorage.removeItem('pointages_rh');
    setShowClearModal(false);
    showToast("Historique réinitialisé avec succès.");
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#eef2f7', fontFamily: 'sans-serif', padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Notification Toast Élégante */}
        {notification && (
          <div style={{
            backgroundColor: notification.type === 'error' ? '#fde8e8' : '#def7ec',
            color: notification.type === 'error' ? '#9b1c1c' : '#03543f',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            borderLeft: `4px solid ${notification.type === 'error' ? '#e02424' : '#0e9f6e'}`,
            transition: 'all 0.3s ease'
          }}>
            {notification.message}
          </div>
        )}

        {/* En-tête coloré avec identité de marque */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 
          padding: '20px', 
          borderRadius: '16px', 
          marginBottom: '16px', 
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          color: '#ffffff'
        }}>
          <div>
            <h1 style={{ fontSize: '20px', margin: '0 0 4px 0', fontWeight: '800', letterSpacing: '0.5px' }}>Pointage-RH</h1>
            <p style={{ fontSize: '13px', margin: '0', opacity: '0.9', fontWeight: '500' }}>🏢 {company}</p>
          </div>
          <button
            onClick={() => { setIsEditingCompany(true); setNewCompanyNameInput(company); }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              backdropFilter: 'blur(5px)'
            }}
          >
            ✨ Créer Votre Entreprise
          </button>
        </div>

        {/* Horloge stylisée */}
        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '16px', marginBottom: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0', textTransform: 'capitalize', fontWeight: '600' }}>
            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h2 style={{ fontSize: '32px', color: '#1e3a8a', margin: '0', fontWeight: '800', letterSpacing: '1px' }}>
            {currentTime.toLocaleTimeString('fr-FR')}
          </h2>
        </div>

        {/* Formulaire de pointage dynamique */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '13px', color: '#334155', marginBottom: '12px', fontWeight: '700' }}>Indiquez votre nom puis pointez directement :</p>
          <input
            type="text"
            placeholder="Votre Nom et Prénom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px 14px', 
              borderRadius: '10px', 
              border: '2px solid #cbd5e1', 
              marginBottom: '14px', 
              fontSize: '14px', 
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => handlePointage('Arrivée')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: '#10b981',
                color: '#ffffff',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
                transition: 'transform 0.1s'
              }}
            >
              🟢 Arrivée
            </button>
            <button
              type="button"
              onClick={() => handlePointage('Départ')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)',
                transition: 'transform 0.1s'
              }}
            >
              🔴 Départ
            </button>
          </div>
        </div>

        {/* Espace Admin / Registre coloré */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
          {!isAdminUnlocked ? (
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '700' }}>🔐 Espace Direction / RH</p>
              <form onSubmit={handleAdminLoginSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  placeholder="Code admin (admin123)"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                />
                <button type="submit" style={{ padding: '10px 16px', backgroundColor: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Entrer
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '15px', margin: '0', color: '#1e3a8a', fontWeight: '800' }}>📊 Registre des Présences</h2>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0', fontWeight: '600' }}>Total : {records.length} enregistrement(s)</p>
                </div>
                <button
                  onClick={handleExportRealExcel}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  📋 Copier le rapport
                </button>
              </div>

              {records.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '24px 0' }}>Aucun pointage enregistré pour le moment.</p>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                        <th style={{ padding: '10px' }}>Nom</th>
                        <th style={{ padding: '10px' }}>Type</th>
                        <th style={{ padding: '10px' }}>Date</th>
                        <th style={{ padding: '10px' }}>Heure</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, index) => (
                        <tr key={r.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{r.name}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: r.type === 'Arrivée' ? '#def7ec' : '#fde8e8', color: r.type === 'Arrivée' ? '#03543f' : '#9b1c1c', fontWeight: 'bold' }}>
                              {r.type}
                            </span>
                          </td>
                          <td style={{ padding: '10px', color: '#64748b' }}>{r.date}</td>
                          <td style={{ padding: '10px', color: '#64748b' }}>{r.time}</td>
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
                  <button onClick={() => setShowClearModal(true)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Vider l'historique
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Fenêtre Modale : Créer / Modifier l'Entreprise */}
      {isEditingCompany && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '16px',
            maxWidth: '360px',
            width: '100%',
            boxShadow: '0 15px 30px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: '18px', color: '#1e3a8a', margin: '0 0 8px 0', fontWeight: '800' }}>Configuration de l'entreprise</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              Entrez le nom de votre structure pour personnaliser l'application et les rapports.
            </p>
            <form onSubmit={handleSaveCompany}>
              <input
                type="text"
                placeholder="Nom de l'entreprise"
                value={newCompanyNameInput}
                onChange={(e) => setNewCompanyNameInput(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #cbd5e1', marginBottom: '16px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditingCompany(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#1e3a8a',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(30, 58, 138, 0.3)'
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fenêtre Modale de Confirmation pour Vider l'historique */}
      {showClearModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '16px',
            maxWidth: '360px',
            width: '100%',
            boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '18px', color: '#1e3a8a', margin: '0 0 8px 0', fontWeight: '800' }}>Réinitialisation du registre</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0', lineHeight: '1.4' }}>
              Voulez-vous vraiment effacer tout l'historique des présences ? Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowClearModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={confirmClearHistory}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
        }
    
