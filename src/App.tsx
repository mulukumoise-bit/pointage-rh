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
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Notification Toast Élégante */}
        {notification && (
          <div style={{
            backgroundColor: notification.type === 'error' ? '#fef2f2' : '#ecfdf5',
            color: notification.type === 'error' ? '#991b1b' : '#065f46',
            padding: '14px 18px',
            borderRadius: '12px',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
            borderLeft: `4px solid ${notification.type === 'error' ? '#dc2626' : '#059669'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{notification.message}</span>
          </div>
        )}

        {/* En-tête Pro SaaS (Bleu Nuit Profond & Indigo) */}
        <div style={{ 
          background: 'linear-gradient(135deg, #0f172a 1D%, #1e3a8a 100%)', 
          padding: '24px 20px', 
          borderRadius: '20px', 
          marginBottom: '16px', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
          color: '#ffffff',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#93c5fd', fontWeight: '700', marginBottom: '6px' }}>
            Pointage-RH 
          </div>
          <h1 style={{ fontSize: '22px', margin: '0 0 16px 0', fontWeight: '800', letterSpacing: '-0.5px' }}>
            🏢 {company}
          </h1>
          <button
            onClick={() => { setIsEditingCompany(true); setNewCompanyNameInput(company); }}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.2s',
              backdropFilter: 'blur(10px)'
            }}
          >
            ✨ Créer Votre Entreprise
          </button>
        </div>

        {/* Horloge Style Premium Card */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '20px', marginBottom: '16px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 6px 0', textTransform: 'capitalize', fontWeight: '700', letterSpacing: '0.5px' }}>
            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h2 style={{ fontSize: '36px', color: '#0f172a', margin: '0', fontWeight: '900', letterSpacing: '1px' }}>
            {currentTime.toLocaleTimeString('fr-FR')}
          </h2>
        </div>

        {/* Formulaire de Pointage Pro */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px 20px', borderRadius: '20px', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '13px', color: '#1e293b', marginBottom: '12px', fontWeight: '700' }}>
            Indiquez votre nom puis pointez directement :
          </p>
          <input
            type="text"
            placeholder="Votre Nom et Prénom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '14px 16px', 
              borderRadius: '12px', 
              border: '2px solid #e2e8f0', 
              marginBottom: '16px', 
              fontSize: '14px', 
              boxSizing: 'border-box',
              outline: 'none',
              backgroundColor: '#f8fafc',
              color: '#0f172a',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.backgroundColor = '#ffffff'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => handlePointage('Arrivée')}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: '#059669',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                letterSpacing: '0.3px'
              }}
            >
              🟢 Arrivée
            </button>
            <button
              type="button"
              onClick={() => handlePointage('Départ')}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                letterSpacing: '0.3px'
              }}
            >
              🔴 Départ
            </button>
          </div>
        </div>

        {/* Espace Direction / RH */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px 20px', borderRadius: '20px', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
          {!isAdminUnlocked ? (
            <div>
              <p style={{ fontSize: '13px', color: '#0f172a', marginBottom: '10px', fontWeight: '700' }}>
                🔐 Espace Direction / RH
              </p>
              <form onSubmit={handleAdminLoginSubmit} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="password"
                  placeholder="Code admin (admin123)"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  style={{ flex: 1, padding: '12px 14px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc' }}
                />
                <button type="submit" style={{ padding: '12px 18px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  Entrer
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', margin: '0', color: '#0f172a', fontWeight: '800' }}>📊 Registre des Présences</h2>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0', fontWeight: '600' }}>Total : {records.length} enregistrement(s)</p>
                </div>
                <button
                  onClick={handleExportRealExcel}
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                  }}
                >
                  📋 Copier le rapport
                </button>
              </div>

              {records.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '30px 0', fontWeight: '500' }}>Aucun pointage enregistré pour le moment.</p>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0f172a', color: 'white' }}>
                        <th style={{ padding: '12px' }}>Nom</th>
                        <th style={{ padding: '12px' }}>Type</th>
                        <th style={{ padding: '12px' }}>Date</th>
                        <th style={{ padding: '12px' }}>Heure</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, index) => (
                        <tr key={r.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px', fontWeight: '700', color: '#0f172a' }}>{r.name}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: r.type === 'Arrivée' ? '#ecfdf5' : '#fef2f2', color: r.type === 'Arrivée' ? '#065f46' : '#991b1b', fontWeight: '700', fontSize: '11px' }}>
                              {r.type}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#64748b', fontWeight: '500' }}>{r.date}</td>
                          <td style={{ padding: '12px', color: '#64748b', fontWeight: '500' }}>{r.time}</td>
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
                  <button onClick={() => setShowClearModal(true)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '12px', cursor: 'pointer', fontWeight: '700' }}>
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
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '28px 24px',
            borderRadius: '20px',
            maxWidth: '380px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', color: '#0f172a', margin: '0 0 8px 0', fontWeight: '800' }}>Configuration de l'entreprise</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0', lineHeight: '1.5', fontWeight: '500' }}>
              Entrez le nom de votre structure pour personnaliser l'application et l'en-tête.
            </p>
            <form onSubmit={handleSaveCompany}>
              <input
                type="text"
                placeholder="Ex: Clinique Universitaire, TechSARL..."
                value={newCompanyNameInput}
                onChange={(e) => setNewCompanyNameInput(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #e2e8f0', marginBottom: '20px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#f8fafc' }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditingCompany(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontWeight: '700',
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
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.3)'
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
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '28px 24px',
            borderRadius: '20px',
            maxWidth: '380px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '18px', color: '#0f172a', margin: '0 0 8px 0', fontWeight: '800' }}>Réinitialisation du registre</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0', lineHeight: '1.5', fontWeight: '500' }}>
              Voulez-vous vraiment effacer tout l'historique des présences ? Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowClearModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onCli
