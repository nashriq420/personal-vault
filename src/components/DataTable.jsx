import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, Copy, Check, Users, Trash2, Edit2, Search, ChevronDown, ChevronRight } from 'lucide-react';

const DataTable = ({ people, onEdit, onDelete }) => {
  const [showSensitive, setShowSensitive] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredPeople = useMemo(() => {
    if (!searchTerm) return people;
    const lowerSearch = searchTerm.toLowerCase();
    return people.filter(p => 
      p.name?.toLowerCase().includes(lowerSearch) ||
      p.nric?.toLowerCase().includes(lowerSearch) ||
      p.taxNumber?.toLowerCase().includes(lowerSearch) ||
      p.dynamicFields?.some(f => f.value?.toLowerCase().includes(lowerSearch)) ||
      p.linkedPeople?.some(lp => lp.name?.toLowerCase().includes(lowerSearch))
    );
  }, [people, searchTerm]);

  if (!people || people.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', fontSize: '1.25rem' }}>
        No records found. Start adding info!
      </div>
    );
  }

  const DataCell = ({ value, label, id, sensitive, isSubRow, rowIndex }) => {
    const isSensitive = sensitive && !showSensitive;
    const displayValue = isSensitive ? '••••••••' : (value || '');
    const copyId = `${id}-${label}-${rowIndex}`;

    return (
      <td style={{ 
        padding: '0.75rem 1rem', 
        borderRight: '1px solid var(--border)',
        verticalAlign: 'top',
        minHeight: '2.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <span style={{ 
            whiteSpace: 'pre-wrap', 
            color: value ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: isSubRow ? '400' : '500'
          }}>
            {displayValue}
          </span>
          {value && (
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(value, copyId); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', opacity: 0.4, cursor: 'pointer', padding: 0 }}
            >
              {copiedId === copyId ? <Check size={16} /> : <Copy size={16} />}
            </button>
          )}
        </div>
      </td>
    );
  };

  const renderPersonRows = (person, globalIndex, isSubRow = false) => {
    if (!person.id && !isSubRow) console.warn('Record missing ID:', person);
    const isExpanded = expandedRows.has(person.id);
    const hasLinks = person.linkedPeople && person.linkedPeople.length > 0;

    const grouped = {
      phone: person.dynamicFields?.filter(f => f.type === 'phone') || [],
      email: person.dynamicFields?.filter(f => f.type === 'email') || [],
      hint: person.dynamicFields?.filter(f => f.type === 'hint') || [],
      hash: person.dynamicFields?.filter(f => f.type === 'hash') || [],
      social: person.dynamicFields?.filter(f => f.type === 'social') || [],
      others: person.dynamicFields?.filter(f => f.type === 'others') || []
    };

    const maxDynamicRows = Math.max(
      grouped.phone.length,
      grouped.email.length,
      grouped.hint.length,
      grouped.hash.length,
      grouped.social.length,
      grouped.others.length,
      1
    );

    const rows = [];

    for (let i = 0; i < maxDynamicRows; i++) {
      const isFirstRow = i === 0;
      
      rows.push(
        <tr key={`${person.id}-${i}`} style={{ 
          background: isSubRow ? 'rgba(99, 102, 241, 0.04)' : 'none',
          borderBottom: i === maxDynamicRows - 1 ? '2px solid var(--border)' : '1px solid var(--border)',
          transition: 'background 0.2s'
        }} className="table-row-hover">
          <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
            {isFirstRow && !isSubRow ? (
              <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{globalIndex + 1}</span>
            ) : ''}
          </td>

          <td style={{ padding: '0.75rem', borderRight: '1px solid var(--border)' }}>
            {isFirstRow && (
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(person); }} 
                  style={{ background: 'rgba(99, 102, 241, 0.2)', border: 'none', color: 'var(--primary)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <Edit2 size={18} />
                </button>
                {!isSubRow && (
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(person.id); }} 
                    style={{ background: 'rgba(239, 68, 68, 0.2)', border: 'none', color: '#ef4444', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )}
          </td>

          <td style={{ padding: '0.75rem 1rem', borderRight: '1px solid var(--border)', verticalAlign: 'top' }}>
            {isFirstRow && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: isSubRow ? '2rem' : '0' }}>
                {!isSubRow && hasLinks && (
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleRow(person.id); }}
                    style={{ background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 0 }}
                  >
                    {isExpanded ? <ChevronDown size={20} color="var(--primary)" /> : <ChevronRight size={20} color="var(--text-muted)" />}
                  </button>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: isSubRow ? '600' : '700', color: isSubRow ? 'var(--accent)' : 'var(--text-main)' }}>{person.name}</span>
                  {isSubRow && <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Relationship: {person.relationship}</span>}
                </div>
              </div>
            )}
          </td>

          <DataCell value={isFirstRow ? person.nric : ''} label="NRIC" id={person.id} sensitive rowIndex={i} isSubRow={isSubRow} />
          <DataCell value={grouped.hint[i]?.value} label="HINT" id={person.id} sensitive rowIndex={i} isSubRow={isSubRow} />
          <DataCell value={isFirstRow ? person.studentId : ''} label="Student ID" id={person.id} rowIndex={i} isSubRow={isSubRow} />
          <DataCell value={grouped.phone[i]?.value} label="Phone" id={person.id} sensitive rowIndex={i} isSubRow={isSubRow} />
          <DataCell value={grouped.email[i]?.value} label="Email" id={person.id} rowIndex={i} isSubRow={isSubRow} />
          <DataCell value={isFirstRow ? person.address : ''} label="Address" id={person.id} rowIndex={i} isSubRow={isSubRow} />
          <DataCell value={isFirstRow ? person.bankAccount : ''} label="Bank Account" id={person.id} sensitive rowIndex={i} isSubRow={isSubRow} />
          <DataCell value={isFirstRow ? person.taxNumber : ''} label="TAX" id={person.id} sensitive rowIndex={i} isSubRow={isSubRow} />
          <DataCell value={grouped.hash[i]?.value} label="HASH" id={person.id} sensitive rowIndex={i} isSubRow={isSubRow} />
          <DataCell value={grouped.social[i]?.value} label="SOCIAL" id={person.id} rowIndex={i} isSubRow={isSubRow} />
          <DataCell value={grouped.others[i]?.value} label="OTHERS" id={person.id} rowIndex={i} isSubRow={isSubRow} />
        </tr>
      );
    }

    if (isExpanded && hasLinks) {
      person.linkedPeople.forEach((link, lIdx) => {
        rows.push(...renderPersonRows(link, lIdx, true));
      });
    }

    return rows;
  };

  return (
    <div className="fade-in" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1.5rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Vault Dashboard ({people.length})</h2>
        
        <div style={{ display: 'flex', gap: '1.5rem', flex: 1, justifyContent: 'flex-end', minWidth: '400px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
            <input 
              type="text" 
              placeholder="Search by name, ID, or any field..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '3rem', width: '100%', height: '3.5rem' }}
            />
          </div>
          <button 
            type="button"
            onClick={() => setShowSensitive(!showSensitive)}
            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', padding: '0.75rem 1.25rem', borderRadius: '12px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
          >
            {showSensitive ? <EyeOff size={20} /> : <Eye size={20} />}
            {showSensitive ? 'Hide Sensitive' : 'Show Sensitive'}
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1800px' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: 'rgba(255, 255, 255, 0.05)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', width: '50px', borderRight: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>#</th>
              <th style={{ padding: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', width: '100px', borderRight: '1px solid var(--border)', color: 'var(--text-muted)' }}>Actions</th>
              <th style={{ padding: '1.25rem 1rem', fontSize: '1rem', textTransform: 'uppercase', borderRight: '1px solid var(--border)', color: 'var(--text-muted)' }}>Name</th>
              <th style={{ padding: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', borderRight: '1px solid var(--border)', color: 'var(--text-muted)' }}>NRIC</th>
              <th style={{ padding: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', borderRight: '1px solid var(--border)', color: 'var(--text-muted)' }}>HINT</th>
              <th style={{ padding: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', borderRight: '1px solid var(--border)', color: 'var(--text-muted)' }}>Student ID</th>
              <th style={{ padding: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', borderRight: '1px solid var(--border)', color: 'var(--text-muted)' }}>Phone</th>
              <th style={{ padding: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', borderRight: '1px solid var(--border)', color: 'var(--text-muted)' }}>Email</th>
              <th style={{ padding: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', borderRight: '1px solid var(--border)', color: 'var(--text-muted)' }}>Address</th>
              <th style={{ padding: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', borderRight: '1px solid var(--border)', color: 'var(--text-muted)' }}>Bank Account</th>
              <th style={{ padding: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', borderRight: '1px solid var(--border)', color: 'var(--text-muted)' }}>TAX</th>
              <th style={{ padding: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', borderRight: '1px solid var(--border)', color: 'var(--text-muted)' }}>HASH</th>
              <th style={{ padding: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', borderRight: '1px solid var(--border)', color: 'var(--text-muted)' }}>SOCIAL</th>
              <th style={{ padding: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>OTHERS</th>
            </tr>
          </thead>
          <tbody>
            {filteredPeople.map((person, index) => renderPersonRows(person, index))}
          </tbody>
        </table>
      </div>
      {filteredPeople.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '1.25rem' }}>
          No records match your search.
        </div>
      )}
    </div>
  );
};

export default DataTable;
