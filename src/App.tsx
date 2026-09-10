import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { 
  Users, Clock, FileSpreadsheet, CheckCircle2, 
  UserPlus, LogIn, LogOut, Search, ShieldAlert, Building2 
} from 'lucide-react';

const queryClient = new QueryClient();

interface Employee {
  id: string;
  name: string;
  department: string;
  pin: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: 'IN' | 'OUT';
  timestamp: string;
}

function PointageApp() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pointage' | 'employees'>('dashboard');
  
  // Initial state with local storage support
  const [employees, setEmployees] = useState<Employee[]>([
    { id: '1', name: 'Jean-Paul Muluku', department: 'Administration', pin: '1234' },
    { id: '2', name: 'Synthiche Muluku', department: 'Ressources Humaines', pin: '5678' }
  ]);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [pinInput, setPinInput] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New employee form state
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newPin, setNewPin] = useState('');

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(item => item.pin === pinInput);
    if (!emp) {
      setMessage({ text: 'PIN incorrect ou employé introuvable.', type: 'error' });
      return;
    }

    const lastRecord = records.filter(r => r.employeeId === emp.id).pop();
    const nextType: 'IN' | 'OUT' = lastRecord && lastRecord.type === 'IN' ? 'OUT' : 'IN';

    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      type: nextType,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setRecords([newRecord, ...records]);
    setMessage({ 
      text: `Pointage validé pour ${emp.name} (${nextType === 'IN' ? 'Entrée' : 'Sortie'})`, 
      type: 'success' 
    });
    setPinInput('');
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newDept || !newPin) {
      setMessage({ text: 'Veuillez remplir tous les champs.', type: 'error' });
      return;
    }

    const newEmp: Employee = {
      id: Date.now().toString(),
      name: newName,
      department: newDept,
      pin: newPin
    };

    setEmployees([...employees, newEmp]);
    setNewName('');
    setNewDept('');
    setNewPin('');
    setMessage({ text: 'Employé ajouté avec succès !', type: 'success' });
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(records);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pointages");
    XLSX.writeFile(workbook, "Rapport_Pointage_RH.xlsx");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Building2 className="w-8 h-8" />
            <h1 className="text-xl font-bold">Pointage RH</h1>
          </div>
          <nav className="flex space-x-2">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}
            >
              Tableau de bord
            </button>
            <button 
              onClick={() => setActiveTab('pointage')} 
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'pointage' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}
            >
              Pointer
            </button>
            <button 
              onClick={() => setActiveTab('employees')} 
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'employees' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}
            >
              Employés
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {message && (
          <div className={`p-4 mb-4 rounded-lg flex items-center space-x-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <ShieldAlert className="w-5 h-5" />
            <span>{message.text}</span>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Employés</p>
                  <h3 className="text-2xl font-bold">{employees.length}</h3>
                </div>
                <Users className="w-10 h-10 text-blue-500" />
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pointages du jour</p>
                  <h3 className="text-2xl font-bold">{records.length}</h3>
                </div>
                <Clock className="w-10 h-10 text-emerald-500" />
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Exportation</p>
                  <button 
                    onClick={exportToExcel}
                    className="mt-1 inline-flex items-center space-x-1 text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-semibold mb-4">Historique Récent</h3>
              {records.length === 0 ? (
                <p className="text-slate-500 text-sm">Aucun pointage enregistré pour le moment.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-xs text-slate-400 uppercase">
                        <th className="py-3 px-4">Employé</th>
                        <th className="py-3 px-4">Département</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Heure</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {records.map(rec => (
                        <tr key={rec.id}>
                          <td className="py-3 px-4 font-medium">{rec.employeeName}</td>
                          <td className="py-3 px-4 text-slate-500">{rec.department}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rec.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {rec.type === 'IN' ? 'Entrée' : 'Sortie'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{rec.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pointage' && (
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Borne de Pointage</h2>
            <p className="text-slate-500 text-sm mb-6">Entrez votre code PIN personnel pour pointer</p>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input 
                type="password" 
                maxLength={6}
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                placeholder="Entrez votre PIN"
                className="w-full text-center text-2xl tracking-widest px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                type="submit"
                className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition"
              >
                Valider le Pointage
              </button>
            </form>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-semibold mb-4">Ajouter un employé</h3>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Moïse Muluku"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Département</label>
                  <input 
                    type="text" 
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Informatique"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code PIN (4 chiffres)</label>
                  <input 
                    type="password" 
                    maxLength={4}
                    value={newPin}
                    onChange={e => setNewPin(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 1234"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-lg hover:bg-slate-800 transition"
                >
                  Enregistrer l'employé
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-semibold mb-4">Liste des employés</h3>
              <div className="space-y-3">
                {employees.map(emp => (
                  <div key={emp.id} className="p-3 border rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-xs text-slate-500">{emp.department}</p>
                    </div>
                    <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-md font-mono">PIN: ****</span>
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PointageApp />
    </QueryClientProvider>
  );
                                       }
      
