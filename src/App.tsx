import React, { useState } from 'react';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(true);

  // Exemple de données pour tester la structure
  const records = [
    { id: 1, name: 'Jean Paul', date: '2026-09-11' },
    { id: 2, name: 'Marie Mutombo', date: '2026-09-10' }
  ];

  const filteredRecords = records.filter(r => {
    const matchesName = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = dateFilter ? r.date === dateFilter : true;
    return matchesName && matchesDate;
  });

  const arrivalsToday = 2;
  const departuresToday = 0;
  const firstArrival = '08:30';
  const exportCSV = () => {};

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
        <input
          type="text"
          placeholder="Rechercher un nom..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
        />
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
        <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 'bold' }}>ARRIVÉES</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534' }}>{arrivalsToday}</div>
        </div>
        <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 'bold' }}>DÉPARTS</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#92400E' }}>{departuresToday}</div>
        </div>
        <div style={{ backgroundColor: '#F8FAFC', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 'bold' }}>1er POINTAGE</div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0F2M3A', marginTop: '4px' }}>{firstArrival}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F5F9', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#059669' }}>● SESSION ADMIN ACTIVE</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={exportCSV} style={{ padding: '6px 10px', backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px' }}>CSV</button>
          <button onClick={() => setIsAdminUnlocked(false)} style={{ padding: '6px 10px', backgroundColor: '#E2E8F0', color: '#334155', border: 'none', borderRadius: '6px', fontSize: '11px' }}>Verrouiller</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', fontSize: '13px', color: '#64748B' }}>Aucun enregistrement trouvé</div>
        ) : (
          filteredRecords.map(r => (
            <div key={r.id} style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{r.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
                     }

