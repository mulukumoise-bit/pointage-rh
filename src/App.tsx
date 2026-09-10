import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Clock, FileSpreadsheet, Plus, Shield, 
  CheckCircle, AlertCircle, LogOut, Search, Trash2, Key, ChevronRight 
} from 'lucide-react';

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

  // Employees & Attendance states
  const [employees, setEmployees] = useState<Employee[]>([
    { id: '1', name: 'Jean Dupont', pin: '1234', role: 'Développeur' },
    { id: '2', name: 'Marie Curie', pin: '5678', role: 'RH' }
  ]);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [pinInput, setPinInput] = useState('');
  const [clockMessage, setClockMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New Employee Form
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

  // 1. Écran de sélection d'entreprise (si aucune entreprise choisie)
  if (!currentCompany) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-slate-800 flex flex-col justify-center items-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-stone-100 p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-amber-500"></div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold shadow-sm">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900">Pointage RH</h1>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Présence, sans détour</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ESPACE SÉCURISÉ
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Choisissez votre entreprise.</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Le pointage reste immédiat pour les salariés. Les données de présence sont ensuite réservées à l'administrateur de l'entreprise.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Entreprises existantes</label>
            {companies.map(comp => (
              <button
                key={comp.id}
                onClick={() => setCurrentCompany(comp)}
                className="w-full text-left p-4 rounded-xl border border-stone-200 hover:border-orange-500 hover:bg-orange-50/30 transition-all flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                    {comp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">{comp.name}</p>
                    <span className="text-xs text-emerald-600 font-medium">ENTREPRISE ACTIVE</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>

          <form onSubmit={handleCreateCompany} className="pt-4 border-t border-stone-100 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Créer une entreprise</label>
            <input
              type="text"
              placeholder="Ex. Atelier des Rives"
              value={newCompanyName}
              onChange={e => setNewCompanyName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
            />
            <button
              type="submit"
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-all shadow-md text-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Créer
            </button>
          </form>

          <div className="pt-4 text-center space-y-1">
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Vos informations restent confidentielles
            </p>
            <p className="text-[11px] text-stone-400">Une entreprise, un espace fiable</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Application principale une fois l'entreprise sélectionnée
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-none">Pointage RH</h1>
              <span className="text-xs text-orange-600 font-medium">{currentCompany.name}</span>
            </div>
          </div>
          
          <button
            onClick={() => setCurrentCompany(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 bg-stone-100 hover:bg-red-50 px-3 py-2 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" /> Changer d'entreprise
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="flex bg-stone-200/70 p-1 rounded-xl max-w-md mx-auto shadow-inner">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Tableau de bord
          </button>
          <button
            onClick={() => setActiveTab('clock')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'clock' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Borne de Pointage
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'employees' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Employés ({employees.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Employés</span>
                  <Users className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{employees.length}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pointages du jour</span>
                  <Clock className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{records.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Historique Récent</h3>
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Exporter en Excel
                </button>
              </div>

              {records.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Aucun pointage enregistré pour le moment.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-100 text-slate-400 text-xs uppercase">
                        <th className="pb-3 font-semibold">Employé</th>
                        <th className="pb-3 font-semibold">Type</th>
                        <th className="pb-3 font-semibold">Heure</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {records.map(r => (
                        <tr key={r.id} className="hover:bg-stone-50/50">
                          <td className="py-3 font-medium text-slate-900">{r.employeeName}</td>
                          <td className="py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {r.type === 'IN' ? 'Entrée' : 'Sortie'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500">{r.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'clock' && (
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-stone-200 p-8 shadow-sm space-y-6 text-center">
            <div>
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Borne de Pointage</h3>
              <p className="text-xs text-slate-500 mt-1">Entrez votre code PIN personnel pour pointer</p>
            </div>

            {clockMessage && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 ${clockMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {clockMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {clockMessage.text}
              </div>
            )}

            <input
              type="password"
              maxLength={6}
              placeholder="••••"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              className="w-full text-center text-3xl tracking-widest py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
            />

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleClock('IN')}
                className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm text-sm"
              >
                Entrée (IN)
              </button>
              <button
                onClick={() => handleClock('OUT')}
                className="py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-sm text-sm"
              >
                Sortie (OUT)
              </button>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900">Ajouter un employé</h3>
              <form onSubmit={handleAddEmployee} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={newEmpName}
                  onChange={e => setNewEmpName(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <input
                  type="text"
                  placeholder="Code PIN (ex: 1234)"
                  value={newEmpPin}
                  onChange={e => setNewEmpPin(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                />
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all text-sm shadow-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900">Liste des salariés</h3>
              <div className="divide-y divide-stone-100">
                {employees.map(emp => (
                  <div key={emp.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{emp.name}</p>
                      <span className="text-xs text-slate-400">PIN : •••• (Rôle : {emp.role})</span>
                    </div>
                    <button
                      onClick={() => handleDeleteEmployee(emp.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
      }
      
