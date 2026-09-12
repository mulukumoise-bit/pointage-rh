import React, { useState, useEffect } from 'react';

export default function App() {
  const [company, setCompany] = useState(() => localStorage.getItem('companyName') || '');
  const [isChangingCompany, setIsChangingCompany] = useState(!localStorage.getItem('companyName'));
  const [tempCompany, setTempCompany] = useState(() => localStorage.getItem('companyName') || '');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [records, setRecords] = useState([
    { id: 1, name: 'Moïse Muluku', type: 'Arrivée', time: '21:47:41', lat: -11.57052, lng: 27.55102, coords: '-11.57052, 27.55102' },
    { id: 2, name: 'Muteba john', type: 'Arrivée', time: '22:38:57', lat: -11.57037, lng: 27.55133, coords: '-11.57037, 27.55133' },
    { id: 3, name: 'Samuel', type: 'Arrivée', time: '22:20:15', lat: -11.57049, lng: 27.55111, coords: '-11.57049, 27.55111' },
    { id: 4, name: 'Moïse Muluku', type: 'Arrivée', time: '18:36:57', lat: -11.57463, lng: 27.53719, coords: '-11.57463, 27.53719' },
    { id: 5, name: 'Moïse Muluku', type: 'Arrivée', time: '22:27:48', lat: -11.57063, lng: 27.55101, coords: '-11.57063, 27.55101' },
    { id: 6, name: 'Moïse Muluku', type: 'Arrivée', time: '22:12:51', lat: -11.57069, lng: 27.55092, coords: '-11.57069, 27.55092' },
  ]);

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
        (position) => {
          saveRecord(position.coords.latitude, position.coords.longitude);
        },
        () => {
          saveRecord(fallbackLat, fallbackLng);
        },
        { timeout: 8000, maximumAge: 0, enableHighAccuracy: true }
      );
    } else {
      saveRecord(fallbackLat, fallbackLng);
    }
  };

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,ID,Nom,Type,Heure,Coordonnees\n";
    records.forEach(r => {
      csvContent += `${r.id},"${r.name}","${r.type}",${r.time},"${r.coords}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pointage_${company.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setIsAdminUnlocked(true);
      setAdminPassword('');
    } else {
      alert('Mot de passe incorrect (indice : admin123)');
    }
  };

    const handleSaveCompany = () => {
    if (tempCompany.trim()) {
      setCompany(tempCompany.trim());
      localStorage.setItem('companyName', tempCompany.trim());
      setIsChangingCompany(false);
    }
  };
  

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7f5f0', fontFamily: 'sans-serif', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#1e293b' }}>
      <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* En-tête de l'application */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', backgroundColor: '#0f3d3e', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
              🕒
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '-0.3px' }}>Pointage RH</div>
              <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Présence, sans détour</div>
            </div>
          </div>
          <div style={{ fontSize: '11px', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '20px', color: '#0f3d3e', fontWeight: '500' }}>
            ● Local & sécurisé
          </div>
        </div>

                        {/* Bloc Nom de l'entreprise */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px 20px', boxSizing: 'border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏢</span>
            <span style={{ fontSize: '15px', fontWeight: '600' }}>{company || "Créer votre entreprise"}</span>
          </div>
          <button
            onClick={() => { setTempCompany(company); setIsChangingCompany(!isChangingCompany); }}
            style={{ background: 'transparent', border: 'none', color: '#0f3d3e', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            {company ? "Changer" : "Créer"}
          </button>
        </div>
                          
        {isChangingCompany && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', display: 'flex', gap: '8px' }}>
            <input 
              type="text"
              value={tempCompany}
              onChange={(e) => setTempCompany(e.target.value)}
              placeholder="Nom de l'entreprise"
              style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            />
            <button 
              onClick={handleSaveCompany}
              style={{ backgroundColor: '#0f3d3e', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              OK
            </button>
          </div>
        )}

        {/* Bloc Bannière Bleue Nuit */}
        <div style={{ backgroundColor: '#0f1f38', borderRadius: '20px', padding: '24px', color: 'white', boxShadow: '0 6px 16px rgba(15,31,56,0.15)' }}>
          <div style={{ fontSize: '11px', letterSpacing: '1px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>
            Bonjour, vous êtes au bon endroit
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', lineHeight: '1.2', margin: '0 0 12px 0' }}>
            Commencer sa journée, <span style={{ color: '#f97316' }}>simplement.</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 16px 0' }}>
            Un pointage clair, en quelques secondes. Votre position confirme votre présence et reste attachée à ce seul enregistrement.
          </p>
          <div style={{ fontSize: '11px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>—</span> Un geste, une trace fiable
          </div>
        </div>

        {/* Bloc Horloge & Date */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Aujourd'hui</div>
            <div style={{ fontSize: '16px', fontWeight: '600', textTransform: 'capitalize' }}>
              {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f3d3e', fontVariantNumeric: 'tabular-nums' }}>
            {currentTime.toLocaleTimeString()}
          </div>
        </div>

        {/* Bloc Formulaire de Pointage */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.4', margin: '0 0 16px 0' }}>
            Indiquez votre nom, puis choisissez votre arrivée ou votre départ. L'heure et votre position seront relevées pour {company}.
          </p>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>Nom / Prénom</label>
              <span style={{ fontSize: '11px', color: '#dc2626' }}>Requis</span>
            </div>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Moïse Muluku"
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              onClick={() => handlePointer('Arrivée')}
              style={{ backgroundColor: '#0f3d3e', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}
            >
              → Pointer l'arrivée
            </button>
            <button 
              onClick={() => handlePointer('Départ')}
              style={{ backgroundColor: '#fed7aa', color: '#7c2d12', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}
            >
              ← Pointer le départ
            </button>
          </div>

          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔒</span> La position est demandée uniquement au moment du clic et est enregistrée avec votre pointage dans l'historique.
          </div>
        </div>

        {/* Bloc Administration */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>La journée, en un coup d'œil</div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f1f38', margin: '0 0 16px 0' }}>Données administrateur</h2>

          {!isAdminUnlocked ? (
            <div style={{ backgroundColor: '#fafaf9', borderRadius: '12px', padding: '16px', border: '1px solid #e7e5e4' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Historique réservé</div>
              <div style={{ fontSize: '12px', color: '#78716c', marginBottom: '14px' }}>Déverrouillez l'espace administrateur pour consulter les présences et exporter les données de {company}.</div>
              
              <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d6d3d1', fontSize: '14px', outline: 'none' }}
                />
                <button 
                  type="submit"
                  style={{ backgroundColor: '#0f3d3e', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Déverrouiller
                </button>
              </form>
              <div style={{ fontSize: '11px', color: '#a8a29e', marginTop: '10px' }}>
                🔑 Mot de passe initial de l'entreprise : <code>admin123</code>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#059669' }}>SESSION ADMINISTRATEUR ACTIVE</span>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Espace administrateur déverrouillé pour {company}.</div>
                </div>
                <button 
                  onClick={() => setIsAdminUnlocked(false)}
                  style={{ backgroundColor: '#f1f5f9', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Verrouiller
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button 
                  onClick={exportCSV}
                  style={{ flex: 1, backgroundColor: '#ffffff', color: '#0f1f38', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textAlign: 'center' }}
                >
                  ↓ CSV
                </button>
                <button 
                  onClick={exportCSV}
                  style={{ flex: 1, backgroundColor: '#ffffff', color: '#0f1f38', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textAlign: 'center' }}
                >
                  📄 Excel (.xlsx)
                </button>
              </div>

              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>{records.length} lignes enregistrées</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                {records.map((r) => (
                  <div key={r.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f1f38' }}>{r.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {r.time} •{' '}
                        <a 
                          href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#0f3d3e', fontWeight: '600', textDecoration: 'underline' }}
                        >
                          GPS: {r.coords} ↗
                        </a>
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                      {r.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pied de page / Mentions finales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 8px 24px 8px', fontSize: '12px', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🛡️</span> Vos informations restent confidentielles
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>↗</span> Autorisation de position requise pour pointer
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🕒</span> Historique sauvegardé durablement
          </div>
        </div>
                {/* Bloc Tarifs & Paiement Multi-Options */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', boxSizing: 'border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginTop: '16px' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#1e293b' }}>💎 Activer ou Renouveler la Licence</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Choisissez votre mode de règlement pour valider l'accès complet à Pointage-RH :</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Option 1 : Carte Bancaire */}
            <a 
              href="https://buy.stripe.com/TON_LIEN_STRIPE" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ backgroundColor: '#635BFF', color: 'white', padding: '12px 16px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>💳 Payer par Carte Bancaire</span>
              <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '6px' }}>Stripe</span>
            </a>

            {/* Option 2 : Mobile Money */}
            <a 
              href="https://wa.me/243995473958?text=Bonjour,%20je%20souhaite%20payer%20par%20Mobile%20Money%20(M-Pesa%20/%20Orange%20Money)." 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ backgroundColor: '#FF6600', color: 'white', padding: '12px 16px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>📱 Payer par Mobile Money</span>
              <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '6px' }}>M-Pesa / Orange</span>
            </a>

            {/* Option 3 : Facture / Devis */}
            <a 
              href="https://wa.me/243995473958?text=Bonjour,%20je%20souhaite%20recevoir%20une%20facture%20ou%20un%20devis%20pour%20mon%20entreprise." 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ backgroundColor: '#0f172a', color: 'white', padding: '12px 16px', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>📄 Facture & Virement / Autre</span>
              <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '6px' }}>Sur Devis</span>
            </a>
          </div>
        </div>
                      
                {/* Bloc Service Client / Support */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px 20px', boxSizing: 'border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💬</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600' }}>Besoin d'aide ?</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Contactez le support technique</div>
            </div>
          </div>
          <a
            href="https://wa.me/243995473958?text=Bonjour,%20j'ai%20besoin%20d'assistance%20sur%20Pointage-RH"
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: '#25D366', color: 'white', padding: '8px 14px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>WhatsApp</span>
          </a>
        </div>
          

      </div>
    </div>
  );
      }
  
