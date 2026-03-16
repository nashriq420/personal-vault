import React, { useState, useMemo, useRef } from 'react';
import { Eye, EyeOff, Copy, Check, Users, Trash2, Edit2, Search, ChevronDown, ChevronRight, Printer } from 'lucide-react';
import { printPerson } from '../utils/printUtils';

const DataTable = ({ people, onEdit, onDelete, userRole }) => {
  const [showSensitive, setShowSensitive] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  
  const topScrollRef = useRef(null);
  const tableScrollRef = useRef(null);

  const handleTopScroll = () => {
    if (tableScrollRef.current && topScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (tableScrollRef.current && topScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  };
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const copyToClipboard = async (text, id) => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-HTTPS (like local network cPanel IP testing)
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
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
    let result = people;
    
    // First, filter by search term if present
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = people.filter(p => 
        p.name?.toLowerCase().includes(lowerSearch) ||
        p.nric?.toLowerCase().includes(lowerSearch) ||
        p.taxNumber?.toLowerCase().includes(lowerSearch) ||
        p.dynamicFields?.some(f => f.value?.toLowerCase().includes(lowerSearch)) ||
        p.linkedPeople?.some(lp => lp.name?.toLowerCase().includes(lowerSearch))
      );
    }

    // Now, sort the result alphabetically by name
    // We create a copy of the array using spread syntax because sort() mutates the original array
    return [...result].sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB);
    });
  }, [people, searchTerm]);

  // Reset to page 1 when searching
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredPeople.length / itemsPerPage);
  const paginatedPeople = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredPeople.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredPeople, currentPage, itemsPerPage]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

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
    const isCopied = copiedId === copyId;

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
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              {isCopied && (
                <span style={{ 
                  position: 'absolute', 
                  right: '100%', 
                  marginRight: '0.5rem', 
                  background: 'var(--primary)', 
                  color: 'white', 
                  fontSize: '0.65rem', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  animation: 'fadeIn 0.2s'
                }}>
                  Copied!
                </span>
              )}
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(value, copyId); }}
                style={{ background: 'none', border: 'none', color: isCopied ? 'var(--primary)' : 'var(--text-muted)', opacity: isCopied ? 1 : 0.4, cursor: 'pointer', padding: 0, display: 'flex' }}
                title="Copy to clipboard"
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
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
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); printPerson(person); }} 
                  style={{ background: 'rgba(16, 185, 129, 0.2)', border: 'none', color: '#10b981', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                  title="Print Profile"
                >
                  <Printer size={18} />
                </button>
                {userRole !== 'viewer' && (
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(person); }} 
                    style={{ background: 'rgba(99, 102, 241, 0.2)', border: 'none', color: 'var(--primary)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                    title="Edit Record"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
                {!isSubRow && userRole !== 'viewer' && (
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(person.id); }} 
                    style={{ background: 'rgba(239, 68, 68, 0.2)', border: 'none', color: '#ef4444', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                    title="Delete Record"
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

      {/* Top Scrollbar Dummy Element */}
      <div 
        ref={topScrollRef} 
        onScroll={handleTopScroll} 
        style={{ overflowX: 'auto', marginBottom: '0.5rem', height: '12px' }}
      >
        <div style={{ width: '1800px', height: '1px' }}></div>
      </div>

      <div 
        ref={tableScrollRef} 
        onScroll={handleTableScroll} 
        style={{ overflowX: 'auto', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '16px', border: '1px solid var(--border)' }}
      >
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
            {paginatedPeople.map((person, index) => renderPersonRows(person, (currentPage - 1) * itemsPerPage + index))}
          </tbody>
        </table>
      </div>
      {filteredPeople.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '1.25rem' }}>
          No records match your search.
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border)',
          borderRadius: '12px'
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPeople.length)} of {filteredPeople.length} records
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              style={{
                background: currentPage === 1 ? 'rgba(255, 255, 255, 0.05)' : 'var(--primary)',
                color: currentPage === 1 ? 'var(--text-muted)' : 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              Previous
            </button>
            <span style={{ margin: '0 0.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              style={{
                background: currentPage === totalPages ? 'rgba(255, 255, 255, 0.05)' : 'var(--primary)',
                color: currentPage === totalPages ? 'var(--text-muted)' : 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
