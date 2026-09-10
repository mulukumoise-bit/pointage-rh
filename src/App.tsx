import React, { useState, useEffect } from 'react';

interface Company {
  id: string;
  name: string;
  active: boolean;
}

interface Employee {
  id: string;
  name: string;
  pin: string;
  role: string;
}

interface AttendanceRecord {
  id: string;
  employeeName: string;
  type: 'IN' | 'OUT';
  timestamp: string;
  companyName: string;
}

export default function App() {
  const [currentCompany, setCurrentCompany] = useState<Company | null>(() => {
    const saved = localStorage.getItem('prh_company');
    return saved ? JSON.parse(saved) : null;
  });

  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem('prh_companies');
    return saved ? JSON.parse(saved) : [{ id: '1', name: 'Atelier Tech', active: true }];
  });

  const [newCompanyName, setNewCompanyName] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clock' | 'employees'>('dashboard');

  const [employees, setEmployees] = useState<Employee[]>([
    { id: '1', name: 'Jean Dupont', pin: '1234', role: 'Développeur' },
    { id: '2', name: 'Marie Curie', pin: '5678', role: 'RH' }
  ]);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [pinInput, setPinInput] = useState('');
  const [clockMessage, setClockMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpPin, setNewEmpPin] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');

  useEffect(() => {
    if (currentCompany) {
      localStorage.setItem('prh_company', JSON.stringify(currentCompany));
    } else {
      localStorage.removeItem('prh_company');
    }
  }, [currentCompany]);

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    const newComp: Company = {
      id: Date.now().toString(),
      name: newCompanyName.trim(),
      active: true
    };
    const updated = [...companies, newComp];
    setCompanies(updated);
    setCurrentCompany(newComp);
    setNewCompanyName('');
  };

  const handleClock = (type: 'IN' | 'OUT') => {
    if (!pinInput.trim()) return;
    const emp = employees.find(e => e.pin === pinInput);
    if (!emp) {
      setClockMessage({ text: 'PIN incorrect ou employé introuvable.', type: 'error' });
      setPinInput('');
      return;
    }

    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      employeeName: emp.name,
      type,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      companyName: currentCompany?.name || 'Entreprise'
    };

    setRecords([newRecord, ...records]);
    setClockMessage({ text: `Pointage ${type === 'IN' ? 'Entrée' : 'Sortie'} réussi pour ${emp.name} !`, type: 'success' });
    setPinInput('');
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName || !newEmpPin) return;
    const emp: Employee = {
      id: Date.now().toString(),
      name: newEmpName,
      pin: newEmpPin,
      role: newEmpRole || 'Salarié'
    };
    setEmployees([...employees, emp]);
    setNewEmpName('');
    setNewEmpPin('');
    setNewEmpRole('');
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
  };

  const exportToExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,Employe,Type,Heure,Entreprise\n";
    records.forEach(r => {
      csvContent += `"${r.employeeName}","${r.type}","${r.timestamp}","${r.companyName}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pointages.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Styles CSS intégrés directement pour garantir un rendu parfait à 100% sur Vercel
  const styles = {
    container: { minHeight: '100vh', backgroundColor: '#FDFBF7', color: '#1e293b', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '16px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', alignItems: 'center' },
    card: { maxWidth: '420px', width: '100%', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f1f1', padding: '32px', position: 'relative' as const, overflow: 'hidden' },
    topBar: { height: '6px', background: 'linear-gradient(to right, #f97316, #f59e0b)', position: 'absolute' as const, top: 0, left: 0, right: 0 },
    headerTitle: { fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: 0 },
    headerSub: { fontSize: '11px', color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em', fontWeight: 600, margin: 0 },
    badge: { fontSize: '10px', fontWeight: 'bold', color: '#059669', backgroundColor: '#ecfdf5', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' },
    buttonPrimary: { width: '100%', padding: '14px', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 600, borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
    input: { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, marginBottom: '12px' },
    companyBtn: { width: '100%', textAlign: 'left' as const, padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', transition: 'all 0.2s' },
    navTab: { flex: 1, padding: '10px', fontSize: '12px', fontWeight: 'bold', borderRadius: '10px', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }
  };

  if (!currentCompany) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.topBar}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>🕒</div>
              <div>
                <h1 style={styles.headerTitle}>Pointage RH</h1>
                <p style={styles.headerSub}>Présence, sans détour</p>
              </div>
            </div>
            <span style={styles.badge}>● ESPACE SÉCURISÉ</span>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>Choisissez votre entreprise.</h2>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
              Le pointage reste immédiat pour les salariés. Les données de présence sont ensuite réservées à l'administrateur.
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Entreprises existantes</label>
            {companies.map(comp => (
              <button
                key={comp.id}
                onClick={() => setCurrentCompany(comp)}
                style={styles.companyFileButton || styles.companyBtn}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                    {comp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#0f172a', margin: 0, fontSize: '14px' }}>{comp.name}</p>
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>ENTREPRISE ACTIVE</span>
                  </div>
                </div>
                <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>➔</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleCreateCompany} style={{ borderTop: '1px solid #f1f1f1', paddingTop: '20px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Créer une entreprise</label>
            <input
              type="text"
              placeholder="Ex. Atelier des Rives"
              value={newCompanyName}
              onChange={e => setNewCompanyName(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.buttonPrimary}>
              + Créer l'entreprise
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0' }}>🛡️ Vos informations restent confidentielles</p>
            <p style={{ fontSize: '10px', color: '#cbd5e1', margin: 0 }}>Une entreprise, un espace fiable</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDFBF7', color: '#1e293b', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>🕒</div>
            <div>
              <h1 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0 }}>Pointage RH</h1>
              <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: 600 }}>{currentCompany.name}</span>
            </div>
          </div>
          <button
            onClick={() => setCurrentCompany(null)}
            style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', backgroundColor: '#f1f5f9', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
          >
            ← Changer d'entreprise
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '600px', margin: '20px auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '12px', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{ ...styles.navTab, backgroundColor: activeTab === 'dashboard' ? '#fff' : 'transparent', color: activeTab === 'dashboard' ? '#0f172a' : '#64748b', boxShadow: activeTab === 'dashboard' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
          >
            Tableau de bord
          </button>
          <button
            onClick={() => setActiveTab('clock')}
            style={{ ...styles.navTab, backgroundColor: activeTab === 'clock' ? '#fff' : 'transparent', color: activeTab === 'clock' ? '#0f172a' : '#64748b', boxShadow: activeTab === 'clock' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
          >
            Borne de Pointage
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            style={{ ...styles.navTab, backgroundColor: activeTab === 'employees' ? '#fff' : 'transparent', color: activeTab === 'employees' ? '#0f172a' : '#64748b', boxShadow: activeTab === 'employees' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
          >
            Employés ({employees.length})
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Total Employés</span>
                <p style={{ fontSize: '28px', fontWeight: 'extrabold', color: '#0f172a', margin: '8px 0 0 0' }}>{employees.length}</p>
              </div>
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Pointages du jour</span>
                <p style={{ fontSize: '28px', fontWeight: 'extrabold', color: '#0f172a', margin: '8px 0 0 0' }}>{records.length}</p>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0 }}>Historique Récent</h3>
                <button onClick={exportToExcel} style={{ padding: '8px 14px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  📊 Exporter Excel
                </button>
              </div>
              {records.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '30px 0' }}>Aucun pointage enregistré.</p>
              ) : (
                records.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                    <span style={{ fontWeight: 'bold' }}>{r.employeeName}</span>
                    <span style={{ color: r.type === 'IN' ? '#059669' : '#d97706', fontWeight: 'bold' }}>{r.type === 'IN' ? 'Entrée' : 'Sortie'}</span>
                    <span style={{ color: '#64748b' }}>{r.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'clock' && (
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Borne de Pointage</h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Entrez votre code PIN pour pointer</p>

            {clockMessage && (
              <div style={{ padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', marginBottom: '16px', backgroundColor: clockMessage.type === 'success' ? '#ecfdf5' : '#fef2f2', color: clockMessage.type === 'success' ? '#059669' : '#dc2626' }}>
                {clockMessage.text}
              </div>
            )}

            <input
              type="password"
              maxLength={6}
              placeholder="••••"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              style={{ width: '100%', maxWidth: '200px', textAlign: 'center', fontSize: '24px', letterSpacing: '8px', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', margin: '0 auto 20px auto', display: 'block', outline: 'none' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button onClick={() => handleClock('IN')} style={{ padding: '14px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                Entrée (IN)
              </button>
              <button onClick={() => handleClock('OUT')} style={{ padding: '14px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                Sortie (OUT)
              </button>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 12px 0' }}>Ajouter un employé</h3>
              <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" placeholder="Nom complet" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} style={styles.input} />
                <input type="text" placeholder="Code PIN (ex: 1234)" value={newEmpPin} onChange={e => setNewEmpPin(e.target.value)} style={styles.input} />
                <button type="submit" style={{ padding: '12px', backgroundColor: '#ea580c', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>+ Ajouter l'employé</button>
              </form>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 12px 0' }}>Salariés enregistrés</h3>
              {employees.map(emp => (
                <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', margin: 0, fontSize: '14px' }}>{emp.name}</p>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Rôle : {emp.role}</span>
                  </div>
                  <button onClick={() => handleDeleteEmployee(emp.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
      }
        
