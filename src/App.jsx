import { useState, useEffect } from 'react';
import EditForm from './components/EditForm';
import DataTable from './components/DataTable';
import LoginPage from './components/LoginPage';
import { db, getAllPeople, addPerson, updatePerson, deletePerson, findPersonByUnique } from './db/DataManager';
import { Shield, Plus, Table as TableIcon, UserPlus, Download, Upload } from 'lucide-react';
import { exportToExcel, parseExcelFile } from './utils/excelUtils';

const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const App = () => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vault_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [people, setPeople] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPerson, setCurrentPerson] = useState(null);
  const [view, setView] = useState('table'); // 'table' or 'form'
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    if (user) loadPeople();
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('vault_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vault_user');
  };

  const loadPeople = async () => {
    const data = await getAllPeople();
    setPeople(data);
    if (data.length === 0) setView('form');
  };

  const handleSave = async (formData) => {
    // Normalize names
    const normalizedData = {
      ...formData,
      name: toTitleCase(formData.name),
      linkedPeople: formData.linkedPeople.map(person => ({
        ...person,
        name: toTitleCase(person.name)
      }))
    };

    // Duplicate Check
    const existing = await findPersonByUnique(normalizedData.name, normalizedData.nric);
    if (existing && existing.id !== currentPerson?.id) {
      const confirmSave = window.confirm(
        `A record for "${existing.name}" ${normalizedData.nric ? `(${normalizedData.nric})` : ''} already exists. Are you sure you want to save this as a separate record?`
      );
      if (!confirmSave) return;
    }

    if (currentPerson?.id) {
      await updatePerson(currentPerson.id, normalizedData);
    } else {
      await addPerson(normalizedData);
    }
    setCurrentPerson(null);
    setIsEditing(false);
    setView('table');
    loadPeople();
  };

  const handleExport = () => {
    if (people.length === 0) return alert('No records to export!');
    exportToExcel(people);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const importedData = await parseExcelFile(file);
      let addedCount = 0;
      let skippedCount = 0;

      for (const record of importedData) {
        // Apply normalization and check for duplicates (similar to handleSave)
        const normalized = {
          ...record,
          name: toTitleCase(record.name),
          linkedPeople: record.linkedPeople?.map(l => ({ ...l, name: toTitleCase(l.name) })) || []
        };

        const existing = await findPersonByUnique(normalized.name, normalized.nric);
        if (existing) {
          skippedCount++;
          continue;
        }

        await addPerson(normalized);
        addedCount++;
      }

      alert(`Import complete!\nAdded: ${addedCount}\nSkipped (duplicates): ${skippedCount}`);
      loadPeople();
    } catch (err) {
      console.error('Import failed detail:', err);
      alert(`Import failed: ${err.message || 'Check file format or ensure backend is running.'}`);
    } finally {
      e.target.value = ''; // Reset input
    }
  };

  const handleEdit = (person) => {
    setCurrentPerson(person);
    setIsEditing(true);
    setView('form');
  };

  const handleDelete = (id) => {
    console.log('User initiated delete for ID:', id);
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      console.log('Executing delete for ID:', pendingDeleteId);
      await deletePerson(pendingDeleteId);
      setPendingDeleteId(null);
      loadPeople();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Delete failed. Please check console.');
    }
  };

  const handleAddNew = () => {
    setCurrentPerson(null);
    setIsEditing(true);
    setView('form');
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="vault-container" style={{ maxWidth: view === 'table' ? '1400px' : '800px' }}>
      <header className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={32} color="#6366f1" />
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Identity Vault</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="hide-mobile" style={{ marginRight: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            User: {user.email}
          </div>
          <button 
            className="btn-primary" 
            style={{ background: view === 'table' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border)' }}
            onClick={() => setView('table')}
          >
            <TableIcon size={18} /> Dashboard
          </button>
          <button 
            className="btn-primary" 
            style={{ background: view === 'form' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border)' }}
            onClick={handleAddNew}
          >
            <UserPlus size={18} /> Add New
          </button>
          
          <div style={{ display: 'flex', gap: '0.5rem', borderLeft: '1px solid var(--border)', paddingLeft: '1rem', marginLeft: '0.5rem' }}>
            <button 
              className="btn-primary" 
              style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', padding: '0.6rem 0.8rem' }}
              onClick={handleExport}
              title="Export to Excel"
            >
              <Download size={18} /> <span className="hide-mobile">Export</span>
            </button>
            <label 
              className="btn-primary" 
              style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', cursor: 'pointer', padding: '0.6rem 0.8rem' }}
              title="Bulk Import Excel"
            >
              <Upload size={18} /> <span className="hide-mobile">Import</span>
              <input type="file" accept=".xlsx" onChange={handleImport} style={{ display: 'none' }} />
            </label>
            <button 
              className="btn-primary" 
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', marginLeft: '0.5rem' }}
              onClick={handleLogout}
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main>
        {view === 'form' ? (
          <EditForm initialData={currentPerson} onSave={handleSave} />
        ) : (
          <DataTable 
            people={people} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        )}
      </main>

      {pendingDeleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'var(--bg-dark)', padding: '2rem', borderRadius: '24px', border: '2px solid #ef4444', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem', color: '#ef4444' }}>Confirm Deletion</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '1.1rem' }}>Are you sure you want to permanently delete this record? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setPendingDeleteId(null)} className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border)', justifyContent: 'center' }}>Cancel</button>
              <button onClick={confirmDelete} className="btn-primary" style={{ flex: 1, background: '#ef4444', color: 'white', justifyContent: 'center' }}>Delete Now</button>
            </div>
          </div>
        </div>
      )}

      <footer style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Database: IndexedDB | Performance optimized for 500+ records.
      </footer>
    </div>
  );
};

export default App;
