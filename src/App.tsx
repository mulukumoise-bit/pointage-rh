import React, { useState } from 'react';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(true);

  // Remets ici tes enregistrements complets d'origine
  const [records, setRecords] = useState([
    { id: 1, name: 'Jean Paul', date: '2026-09-11', type: 'Arrivée', time: '08:30' },
    { id: 2, name: 'Marie Mutombo', date: '2026-09-10', type: 'Arrivée', time: '09:00' }
  ]);

  const filteredRecords = records.filter(r => {
    const matchesName = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = dateFilter ? r.date === dateFilter : true;
    return matchesName && matchesDate;
  });

  const arrivalsToday = records.filter(r => r.type === 'Arrivée').length;
  const departuresToday = records.filter(r => r.type === 'Départ').length;
  const firstArrival = records.length > 0 ? records[0].time : '--:--';

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + records.map(e => `${e.name},${e.date},${e.type},${e.time}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pointage_rh.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F2M3A', marginBottom: '16px', textAlign: 'center' }}>
          Tableau de Bord RH - Pointage
        </h1>

        {dateFilter && (
          <div style={{ fontSize: '11px', color: '#D97706', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FEF3C7', padding: '8px 12px', borderRadius: '6px' }}>
            <span>Filtre actif sur la date : {dateFilter}</span>
            <button onClick={() => setDateFilter('')} style={{ background: 'none', border: 'none', color: '#D97706', cursor: 'pointer', fontWeight: 'bold' }}>✕ Effacer</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          <input
            type="text"
            placeholder="Rechercher un nom..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none' }}
          />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
          <div style={{ backgroundColor: '#F1F5F9', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 'bold' }}>ARRIVÉES</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534', marginTop: '4px' }}>{arrivalsToday}</div>
          </div>
          <div style={{ backgroundColor: '#F1F5F9', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 'bold' }}>DÉPARTS</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#92400E', marginTop: '4px' }}>{departuresToday}</div>
          </div>
          <div style={{ backgroundColor: '#F1F5F9', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 'bold' }}>1er POINTAGE</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0F2M3A', marginTop: '6px' }}>{firstArrival}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: isAdminUnlocked ? '#059669' : '#DC2626' }}>
            {isAdminUnlocked ? '● SESSION ADMIN ACTIVE' : '● VERROUILLÉ'}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={exportCSV} style={{ padding: '6px 12px', backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>CSV</button>
            <button onClick={() => setIsAdminUnlocked(!isAdminUnlocked)} style={{ padding: '6px 12px', backgroundColor: '#E2E8F0', color: '#334155', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
              {isAdminUnlocked ? 'Verrouiller' : 'Déverrouiller'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', fontSize: '13px', color: '#64748B' }}>Aucun enregistrement trouvé</div>
          ) : (
            filteredRecords.map(r => (
              <div key={r.id} style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1E293B', fontSize: '13px' }}>{r.name}</div>
                  <div style={{ color: '#64748B', fontSize: '10px', marginTop: '2px' }}>{r.date} à {r.time}</div>
                </div>
                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', backgroundColor: r.type === 'Arrivée' ? '#DCFCE7' : '#FEF3C7', color: r.type === 'Arrivée' ? '#166534' : '#92400E' }}>
                  {r.type}
                </span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
      }
      
