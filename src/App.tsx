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
    const saved = localStorage.getItem('pointages_rh_lux_v4');
    if (saved) {
      try { setRecords(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    const savedCompany = localStorage.getItem('pointages_rh_company_lux_v4');
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
    localStorage.setItem('pointages_rh_lux_v4', JSON.stringify(updated));
    setName('');
    showToast(`Pointage (${type}) validé pour ${newRecord.name}.`);
  };

  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin123') {
      setIsAdminUnlocked(true);
      setAdminPasswordInput('');
      showToast("Espace direction ouvert.");
    } else {
      showToast("Mot de passe incorrect.", "error");
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
    localStorage.setItem('pointages_rh_company_lux_v4', newCompanyNameInput.trim());
    setIsEditingCompany(false);
    setNewCompanyNameInput('');
    showToast("Entreprise mise à jour avec succès.");
  };

  const handleExportRealExcel = () => {
    if (records.length === 0) {
      showToast("Aucun historique à exporter.", "error");
      return;
    }
    let reportText = `📋 REGISTRE DES PRÉSENCES - ${company}\n`;
    reportText += `Date : ${currentTime.toLocaleDateString('fr-FR')}\n\n`;
    records.forEach((r, index) => {
      reportText += `${index + 1}. ${r.name} - ${r.type} à ${r.time} (${r.date})\n`;
    });
    reportText += `\nTotal : ${records.length} enregistrements`;

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
    localStorage.removeItem('pointages_rh_lux_v4');
    setShowClearModal(false);
    showToast("Historique réinitialisé.");
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fbf9f6', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '16px', boxSizing: 'border-box', color: '#1e293b' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        
        {/* Notification Toast */}
        {notification && (
          <div style={{
            backgroundColor: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
            color: notification.type === 'error' ? '#991b1b' : '#166534',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: '600',
            border: `1px solid ${notification.type === 'error' ? '#fca5a5' : '#bbf7d0'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            {notification.message}
          </div>
        )}

        {/* Top bar style épuré luxe */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ backgroundColor: '#112233', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px' }}>⏱️</div>
            <div>
              <h2 style={{ fontSize: '15px', margin: '0', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>Pointage RH</h2>
              <p style={{ fontSize: '10px', margin: '0', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700' }}>Présence, sans détour</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#0f172a', fontWeight: '600', backgroundColor: '#f1ede4', padding: '4px 10px', borderRadius: '20px' }}>
            <span style={{ width: '6px', height: '6px', backgroundColor: '#059669', borderRadius: '50%' }}></span>
            Local & sécurisé
          </div>
        </div>

        {/* Ligne Entreprise + Bouton Changer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '0 4px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🏢</span> {company}
          </div>
          <button
            onClick={() => { setIsEditingCompany(true); setNewCompanyNameInput(company); }}
            style={{ background: 'none', border: 'none', color: '#0f172a', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Changer
          </button>
        </div>

        {/* Grande Carte Sombre "Hero Card" raffinée */}
        <div style={{ 
          backgroundColor: '#112233', 
          color: '#ffffff', 
          padding: '32px 24px', 
          borderRadius: '24px', 
          marginBottom: '16px', 
          boxShadow: '0 20px 40px -15px rgba(17, 34, 51, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#94a3b8', fontWeight: '700', marginBottom: '12px' }}>
            Bonjour, vous êtes au bon endroit
          </p>
          <h1 style={{ fontSize: '26px', margin: '0 0 16px 0', fontWeight: '900', lineHeight: '1.2', letterSpacing: '-0.5px', color: '#ffffff' }}>
            Commencer sa journée, <span style={{ color: '#f89b74' }}>simplement.</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 24px 0', lineHeight: '1.6', fontWeight: '400' }}>
            Un pointage clair, en quelques secondes. Votre position confirme votre présence et reste attachée à ce seul enregistrement.
          </p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#f89b74', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Un geste</span>
            <span style={{ color: '#475569' }}>•</span>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Une trace fiable</span>
          </div>
        </div>

        {/* Bloc Horloge & Pointage */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px 20px', borderRadius: '24px', marginBottom: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1ede4' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <p style={{ fontSize: '10px', color: '#94a3b8', margin: '0 0 2px 0', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px' }}>
                Aujourd'hui
              </p>
              <h3 style={{ fontSize: '16px', color: '#0f172a', margin: '0', fontWeight: '800' }}>
                {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#112233', fontFamily: 'monospace', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              {currentTime.toLocaleTimeString('fr-FR')}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '700' }}>
              Prêt à commencer ?
            </label>
            <input
              type="text"
              placeholder="Votre Nom et Prénom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                borderRadius: '14px', 
                border: '1.5px solid #e2e8f0', 
                marginBottom: '16px', 
                fontSize: '14px', 
                boxSizing: 'border-box',
                outline: 'none',
                backgroundColor: '#fcfcfc',
                color: '#0f172a',
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
                border: 'none',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: '#e6f4ea',
                color: '#137333',
                boxShadow: '0 2px 6px rgba(19, 115, 51, 0.1)',
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
                borderRadius: '14px',
                border: 'none',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                backgroundColor: '#fce8e6',
                color: '#c5221f',
                boxShadow: '0 2px 6px rgba(197, 34, 31, 0.1)',
              }}
            >
              🔴 Départ
            </button>
          </div>
        </div>

        {/* Espace Admin / RH */}
        <div style={{ backgroundColor: '#ffffff', padding: '24px 20px', borderRadius: '24px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1ede4' }}>
          {!isAdminUnlocked ? (
            <div>
              <p style={{ fontSize: '13px', color: '#0f172a', marginBottom: '10px', fontWeight: '800' }}>
                🔒 Espace Direction / RH
              </p>
              <form onSubmit={handleAdminLoginSubmit} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="password"
                  placeholder="Code admin (admin123)"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none', backgroundColor: '#fcfcfc' }}
                />
                <button type="submit" style={{ padding: '12px 18px', backgroundColor: '#112233', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  Entrer
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', margin: '0', color: '#0f172a', fontWeight: '800' }}>📊 Registre des Présences</h3>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0', fontWeight: '600' }}>Total : {records.length} pointage(s)</p>
                </div>
                <button
                  onClick={handleExportRealExcel}
                  style={{
                    backgroundColor: '#137333',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  📋 Copier le rapport
                </button>
              </div>

              {records.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '30px 0' }}>Aucun pointage enregistré pour l'instant.</p>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#112233', color: '#ffffff' }}>
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
                            <span style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: r.type === 'Arrivée' ? '#e6f4ea' : '#fce8e6', color: r.type === 'Arrivée' ? '#137333' : '#c5221f', fontWeight: '700', fontSize: '11px' }}>
                              {r.type}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#64748b' }}>{r.date}</td>
                          <td style={{ padding: '12px', color: '#64748b', fontFamily: 'monospace' }}>{r.time}</td>
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
                  <button onClick={() => setShowClearModal(true)} style={{ background: 'none', border: 'none', color: '#c5221f', fontSize: '12px', cursor: 'pointer', fontWeight: '700' }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17, 34, 51, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '28px 24px', borderRadius: '24px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '18px', color: '#0f172a', margin: '0 0 8px 0', fontWeight: '800' }}>Nom de l'entreprise</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>Personnalisez l'en-tête de votre application.</p>
            <form onSubmit={handleSaveCompany}>
              <input
                type="text"
                placeholder="Ex: Atelier Tech..."
                value={newCompanyNameInput}
                onChange={(e) => setNewCompanyNameInput(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', marginBottom: '20px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#fcfcfc' }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setIsEditingCompany(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#112233', color: '#ffffff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale Supprimer l'historique */}
      {showClearModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17, 34, 51, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '28px 24px', borderRadius: '24px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '18px', color: '#0f172a', margin: '0 0 8px 0', fontWeight: '800' }}>Confirmation</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>Voulez-vous vraiment effacer tout l'historique des présences ?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowClearModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={confirmClearHi
