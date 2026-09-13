import React, { useState, useEffect } from 'react';

export default function App() {
  const [name, setName] = useState('');
  const [records, setRecords] = useState([]);
  const [company, setCompany] = useState('Atelier Tech');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notification, setNotification] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [newCompanyNameInput, setNewCompanyNameInput] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const saved = localStorage.getItem('pointage_rh_pro_v5');
    if (saved) {
      try { setRecords(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    const savedCompany = localStorage.getItem('pointage_rh_company_v5');
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
    localStorage.setItem('pointage_rh_pro_v5', JSON.stringify(updated));
    setName('');
    showToast(`Pointage (${type}) validé avec succès.`);
  };

  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin123') {
      setIsAdminUnlocked(true);
      setAdminPasswordInput('');
      showToast("Accès direction autorisé.");
    } else {
      showToast("Code d'accès incorrect.", "error");
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
    localStorage.setItem('pointage_rh_company_v5', newCompanyNameInput.trim());
    setIsEditingCompany(false);
    setNewCompanyNameInput('');
    showToast("Entreprise mise à jour.");
  };

  const handleExportRealExcel = () => {
    if (records.length === 0) {
      showToast("Aucun enregistrement à exporter.", "error");
      return;
    }
    let reportText = `📋 REGISTRE DES PRÉSENCES - ${company}\n`;
    reportText += `Date : ${currentTime.toLocaleDateString('fr-FR')}\n\n`;
    records.forEach((r, index) => {
      reportText += `${index + 1}. ${r.name} - ${r.type} à ${r.time} (${r.date})\n`;
    });
    
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
    localStorage.removeItem('pointage_rh_pro_v5');
    setShowClearModal(false);
    showToast("Historique réinitialisé.");
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0c1424', 
      backgroundImage: 'radial-gradient(circle at 50% 0%, #172a45 0%, #0c1424 75%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
      padding: '16px', 
      boxSizing: 'border-box', 
      color: '#f8fafc' 
    }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        
        {/* Notification Toast */}
        {notification && (
          <div style={{
            backgroundColor: notification.type === 'error' ? 'rgba(153, 27, 27, 0.9)' : 'rgba(16, 185, 129, 0.9)',
            color: '#ffffff',
            padding: '12px 16px',
            borderRadius: '14px',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: '600',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            {notification.message}
          </div>
        )}

        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #1abc9c, #16a085)', 
              width: '36px', 
              height: '36px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#fff', 
              fontSize: '16px',
              boxShadow: '0 4px 12px rgba(26, 188, 156, 0.3)'
            }}>⏱️</div>
            <div>
              <h2 style={{ fontSize: '16px', margin: '0', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.3px' }}>Pointage RH</h2>
              <p style={{ fontSize: '10px', margin: '0', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Présence, sans détour</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#cbd5e1', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ width: '6px', height: '6px', backgroundColor: '#1abc9c', borderRadius: '50%', boxShadow: '0 0 8px #1abc9c' }}></span>
            Local & sécurisé
          </div>
        </div>

        {/* Entreprise & Bouton Changer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 6px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🏢</span> <span style={{ color: '#1abc9c' }}>{company}</span>
          </div>
          <button
            onClick={() => { setIsEditingCompany(true); setNewCompanyNameInput(company); }}
            style={{ background: 'none', border: 'none', color: '#f89b74', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Changer
          </button>
        </div>

        {/* Hero Card raffiné avec dégradé et touches corail */}
        <div style={{ 
          background: 'linear-gradient(145deg, #132238 0%, #0d1929 100%)', 
          color: '#ffffff', 
          padding: '28px 24px', 
          borderRadius: '24px', 
          marginBottom: '20px', 
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(248, 155, 116, 0.2)'
        }}>
          {/* Cercles décoratifs lumineux en arrière-plan */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(248,155,116,0.15) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#f89b74', fontWeight: '800', marginBottom: '10px' }}>
            Bonjour, vous êtes au bon endroit
          </p>
          <h1 style={{ fontSize: '24px', margin: '0 0 14px 0', fontWeight: '900', lineHeight: '1.25', letterSpacing: '-0.5px', color: '#ffffff' }}>
            Commencer sa journée, <span style={{ color: '#f89b74' }}>simplement.</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0', lineHeight: '1.6', fontWeight: '400' }}>
            Un pointage clair, en quelques secondes. Votre position confirme votre présence et reste attachée à ce seul enregistrement.
          </p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#f89b74', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Un geste</span>
            <span style={{ color: '#475569' }}>•</span>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '600', textTransform: 'uppercase' }}>Une trace fiable</span>
          </div>
        </div>

        {/* Bloc Horloge & Saisie Collaborateur */}
        <div style={{ 
          backgroundColor: '#132238', 
          padding: '24px 20px', 
          borderRadius: '24px', 
          marginBottom: '20px', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)', 
          border: '1px solid rgba(255,255,255,0.08)' 
        }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <p style={{ fontSize: '10px', color: '#94a3b8', margin: '0 0 2px 0', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px' }}>
                Aujourd'hui
              </p>
              <h3 style={{ fontSize: '15px', color: '#ffffff', margin: '0', fontWeight: '800' }}>
                {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#1abc9c', fontFamily: 'monospace', backgroundColor: 'rgba(26, 188, 156, 0.1)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(26, 188, 156, 0.2)' }}>
              {currentTime.toLocaleTimeString('fr-FR')}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '8px', fontWeight: '700' }}>
              Identification du collaborateur
            </label>
            <input
              type="text"
              placeholder="Nom et Prénom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                borderRadius: '14px', 
                border: '1.5px solid rgba(255,255,255,0.12)', 
                marginBottom: '16px', 
                fontSize: '14px', 
                boxSizing: 'border-box',
                outline: 'none',
                backgroundColor: '#0c1424',
                color: '#ffffff',
                fontWeight: '600',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => handlePointage('Arrivée')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '14px',
                border: '1px solid rgba(26, 188, 156, 0.4)',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: 'rgba(26, 188, 156, 0.12)',
                color: '#2ecc71',
                boxShadow: '0 4px 12px rgba(26, 188, 156, 0.15)',
              }}
            >
              🟢 Enregistrer Arrivée
            </button>
            <button
              type="button"
              onClick={() => handlePointage('Départ')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '14px',
                border: '1px solid rgba(231, 76, 60, 0.4)',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: 'rgba(231, 76, 60, 0.12)',
                color: '#e74c3c',
                boxShadow: '0 4px 12px rgba(231, 76, 60, 0.15)',
              }}
            >
              🔴 Enregistrer Départ
            </button>
          </div>
        </div>

        {/* Espace Admin / RH Sécurisé */}
        <div style={{ 
          backgroundColor: '#132238', 
          padding: '24px 20px', 
          borderRadius: '24px', 
          marginBottom: '30px', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)', 
          border: '1px solid rgba(255,255,255,0.08)' 
        }}>
          {!isAdminUnlocked ? (
            <div>
              <p style={{ fontSize: '13px', color: '#ffffff', marginBottom: '10px', fontWeight: '800' }}>
                🔒 Accès Sécurisé Direction / RH
              </p>
              <form onSubmit={handleAdminLoginSubmit} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="password"
                  placeholder="Code d'accès (admin123)"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.12)', fontSize: '13px', outline: 'none', backgroundColor: '#0c1424', color: '#fff' }}
                />
                <button type="submit" style={{ padding: '12px 18px', backgroundColor: '#f89b74', color: '#0c1424', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                  Ouvrir
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', margin: '0', color: '#ffffff', fontWeight: '800' }}>📊 Registre des Présences</h3>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0', fontWeight: '600' }}>Total : {records.length} pointage(s)</p>
                </div>
                <button
                  onClick={handleExportRealExcel}
                  style={{
                    backgroundColor: '#1abc9c',
                    color: '#0c1424',
                    border: 'none',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  📋 Copier le rapport
                </button>
              </div>

              {records.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '24px 0' }}>Aucun pointage enregistré pour l'instant.</p>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0c1424', color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ padding: '12px' }}>Nom</th>
                        <th style={{ padding: '12px' }}>Type</th>
                        <th style={{ padding: '12px' }}>Date</th>
                        <th style={{ padding: '12px' }}>Heure</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, index) => (
                        <tr key={r.id} style={{ backgroundColor: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px', fontWeight: '700', color: '#ffffff' }}>{r.name}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: r.type === 'Arrivée' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)', color: r.type === 'Arrivée' ? '#2ecc71' : '#e74c3c', fontWeight: '700', fontSize: '11px' }}>
                              {r.type}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#94a3b8' }}>{r.date}</td>
                          <td style={{ padding: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>{r.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <button onClick={() => setIsAdminUnlocked(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}>
                  Verrouiller
                </button>
                {records.length > 0 && (
                  <button onClick={() => setShowClearModal(true)} style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '12px', cursor: 'pointer', fontWeight: '700' }}>
                    Vider l'historique
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modale Modifier Entreprise */}
      {isEditingCompany && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(12, 20, 36, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#132238', padding: '28px 24px', borderRadius: '24px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '18px', color: '#ffffff', margin: '0 0 8px 0', fontWeight: '800' }}>Nom de l'entreprise</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0' }}>Personnalisez l'en-tête de votre application.</p>
            <form onSubmit={handleSaveCompany}>
              <input
                type="text"
                placeholder="Ex: Atelier Tech..."
                value={newCompanyNameInput}
                onChange={(e) => setNewCompanyNameInput(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.15)', marginBottom: '20px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#0c1424', color: '#fff' }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setIsEditingCompany(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: '#cbd5e1', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'n
