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
    const saved = localStorage.getItem('pointages_rh_v2');
    if (saved) {
      try { setRecords(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    const savedCompany = localStorage.getItem('pointages_rh_company_v2');
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
    localStorage.setItem('pointages_rh_v2', JSON.stringify(updated));
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
    localStorage.setItem('pointages_rh_company_v2', newCompanyNameInput.trim());
    setIsEditingCompany(false);
    setNewCompanyNameInput('');
    showToast("Nom de l'entreprise mis à jour !");
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
        showToast("Rapport copié dans le presse-papier !");
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
    localStorage.removeItem('pointages_rh_v2');
    setShowClearModal(false);
    showToast("Historique réinitialisé.");
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', fontFamily: 'Inter, system-ui, sans-serif', padding: '20px', boxSizing: 'border-box', color: '#f8fafc' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        
        {/* Notification Toast */}
        {notification && (
          <div style={{
            backgroundColor: notification.type === 'error' ? '#450a0a' : '#064e3b',
            color: notification.type === 'error' ? '#fca5a5' : '#6ee7b7',
            padding: '14px 18px',
            borderRadius: '14px',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: '600',
            border: `1px solid ${notification.type === 'error' ? '#dc2626' : '#059669'}`,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            {notification.message}
          </div>
        )}

        {/* En-tête Dark Mode Ultra Pro */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', 
          padding: '28px 22px', 
          borderRadius: '24px', 
          marginBottom: '20px', 
          boxShadow: '0 20px 40px -15px rgba(49, 46, 129, 0.5)',
          border: '1px solid rgba(129, 140, 248, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#a5b4fc', fontWeight: '800', marginBottom: '8px' }}>
            Portail Officiel • Pointage-RH
          </div>
          <h1 style={{ fontSize: '24px', margin: '0 0 18px 0', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px' }}>
            ⚡ {company}
          </h1>
          <button
            onClick={() => { setIsEditingCompany(true); setNewCompanyNameInput(company); }}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ⚙️ Modifier mon entreprise
          </button>
        </div>

        {/* Horloge Card Minimaliste Dark */}
        <div style={{ backgroundColor: '#111827', padding: '22px', borderRadius: '22px', marginBottom: '20px', textAlign: 'center', border: '1px solid #1f2937', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 min 6px 0', textTransform: 'capitalize', fontWeight: '600' }}>
            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h2 style={{ fontSize: '38px', color: '#f3f4f6', margin: '0', fontWeight: '900', letterSpacing: '1px' }}>
            {currentTime.toLocaleTimeString('fr-FR')}
          </h2>
        </div>

        {/* Zone de Pointage Principale */}
        <div style={{ backgroundColor: '#111827', padding: '24px 20px', borderRadius: '22px', marginBottom: '20px', border: '1px solid #1f2937', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
          <p style={{ fontSize: '13px', color: '#e5e7eb', marginBottom: '12px', fontWeight: '700' }}>
            Identifiez-vous pour valider votre présence :
          </p>
          <input
            type="text"
            placeholder="Entrez votre Nom et Prénom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '15px 16px', 
              borderRadius: '14px', 
              border: '2px solid #374151', 
              marginBottom: '18px', 
              fontSize: '14px', 
              boxSizing: 'border-box',
              outline: 'none',
              backgroundColor: '#1f2937',
              color: '#ffffff',
              fontWeight: '600',
            }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => handlePointage('Arrivée')}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '14px',
                border: 'none',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: '#10b981',
                color: '#064e3b',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
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
                borderRadius: '14px',
                border: 'none',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: '#f43f5e',
                color: '#4c0519',
                boxShadow: '0 4px 15px rgba(244, 63, 94, 0.4)',
              }}
            >
              🔴 Départ
            </button>
          </div>
        </div>

        {/* Espace Admin / RH */}
        <div style={{ backgroundColor: '#111827', padding: '24px 20px', borderRadius: '22px', marginBottom: '20px', border: '1px solid #1f2937', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
          {!isAdminUnlocked ? (
            <div>
              <p style={{ fontSize: '13px', color: '#f3f4f6', marginBottom: '12px', fontWeight: '700' }}>
                🔒 Espace Direction / RH
              </p>
              <form onSubmit={handleAdminLoginSubmit} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="password"
                  placeholder="Code admin (admin123)"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', border: '2px solid #374151', fontSize: '13px', outline: 'none', backgroundColor: '#1f2937', color: '#fff' }}
                />
                <button type="submit" style={{ padding: '12px 18px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  Accéder
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', margin: '0', color: '#f3f4f6', fontWeight: '800' }}>📊 Registre des Présences</h2>
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0', fontWeight: '600' }}>Total : {records.length} pointage(s)</p>
                </div>
                <button
                  onClick={handleExportRealExcel}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#064e3b',
                    border: 'none',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  📋 Copier rapport
                </button>
              </div>

              {records.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px', padding: '30px 0', fontWeight: '500' }}>Aucun enregistrement pour l'instant.</p>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #374151', borderRadius: '14px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1f2937', color: '#f3f4f6' }}>
                        <th style={{ padding: '12px' }}>Nom</th>
                        <th style={{ padding: '12px' }}>Type</th>
                        <th style={{ padding: '12px' }}>Date</th>
                        <th style={{ padding: '12px' }}>Heure</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, index) => (
                        <tr key={r.id} style={{ backgroundColor: index % 2 === 0 ? '#111827' : '#1f2937', borderBottom: '1px solid #374151' }}>
                          <td style={{ padding: '12px', fontWeight: '700', color: '#ffffff' }}>{r.name}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: r.type === 'Arrivée' ? '#064e3b' : '#4c0519', color: r.type === 'Arrivée' ? '#6ee7b7' : '#fca5a5', fontWeight: '800', fontSize: '11px' }}>
                              {r.type}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#9ca3af', fontWeight: '500' }}>{r.date}</td>
                          <td style={{ padding: '12px', color: '#9ca3af', fontWeight: '500' }}>{r.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <button onClick={() => setIsAdminUnlocked(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}>
                  Verrouiller l'espace
                </button>
                {records.length > 0 && (
                  <button onClick={() => setShowClearModal(true)} style={{ background: 'none', border: 'none', color: '#f43f5e', fontSize: '12px', cursor: 'pointer', fontWeight: '700' }}>
                    Effacer l'historique
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modale Paramétrage Entreprise */}
      {isEditingCompany && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#111827', padding: '28px 24px', borderRadius: '22px', maxWidth: '380px', width: '100%', border: '1px solid #374151', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '18px', color: '#ffffff', margin: '0 0 8px 0', fontWeight: '900' }}>Nom de l'entreprise</h3>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 20px 0', lineHeight: '1.5' }}>Personnalisez l'affichage pour vos clients.</p>
            <form onSubmit={handleSaveCompany}>
              <input
                type="text"
                placeholder="Ex: Clinique Lubumbashi, TechSARL..."
                value={newCompanyNameInput}
                onChange={(e) => setNewCompanyNameInput(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #374151', marginBottom: '20px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#1f2937', color: '#fff' }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setIsEditingCompany(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #4b5563', backgroundColor: 'transparent', color: '#d1d5db', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale Suppression */}
      {showClearModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#111827', padding: '28px 24px', borderRadius: '22px', maxWidth: '380px', width: '100%', border: '1px solid #374151', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '18px', color: '#ffffff', margin: '0 0 8px 0', fontWeight: '900' }}>Confirmation</h3>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 20px 0', lineHeight: '1.5' }}>Effacer définitivement l'historique des présences ?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowClearModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #4b5563', backgroundColor: 'transparent', color: '#d1d5db', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={confirmClearHistory} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#f43f5e', color: '#ffffff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                Effacer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
      }
      
