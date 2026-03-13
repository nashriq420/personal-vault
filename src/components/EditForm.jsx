import React, { useState, useEffect } from 'react';
import { Save, User, Phone, Mail, Hash, Plus, Trash2, Users, MapPin, CreditCard, Shield, Landmark, ChevronDown, ChevronRight, X } from 'lucide-react';

const RecordFields = ({ data, onChange, onDynamicChange, onAddDynamic, onRemoveDynamic, onRelationshipChange, onRemoveLink, index = null }) => (
  <div style={{ padding: index !== null ? '1.5rem' : '0', background: index !== null ? 'rgba(255, 255, 255, 0.03)' : 'none', borderRadius: '16px', border: index !== null ? '1px solid var(--border)' : 'none', marginBottom: index !== null ? '1.5rem' : '0' }}>
    <div className="grid-2">
      <div className="input-group">
        <label className="input-label" style={{ marginBottom: '0.4rem' }}>Full Name</label>
        <input type="text" name="name" value={data.name} onChange={(e) => onChange(e, index)} placeholder="Full Name" required={index === null} />
      </div>
      {index !== null && (
        <div className="input-group">
          <label className="input-label" style={{ marginBottom: '0.4rem' }}>Relationship</label>
          <input type="text" value={data.relationship} onChange={(e) => onRelationshipChange(index, e.target.value)} placeholder="e.g. Spouse, Child" />
        </div>
      )}
    </div>
    
    <div className="grid-2">
      <div className="input-group">
        <label className="input-label" style={{ marginBottom: '0.4rem' }}>NRIC/ID Number</label>
        <input type="text" name="nric" value={data.nric} onChange={(e) => onChange(e, index)} placeholder="S1234567X" />
      </div>
      <div className="input-group">
        <label className="input-label" style={{ marginBottom: '0.4rem' }}>Student ID</label>
        <input type="text" name="studentId" value={data.studentId} onChange={(e) => onChange(e, index)} placeholder="A0123456B" />
      </div>
    </div>

    <div className="grid-2">
      <div className="input-group">
        <label className="input-label" style={{ marginBottom: '0.4rem' }}>Tax Number</label>
        <input type="text" name="taxNumber" value={data.taxNumber} onChange={(e) => onChange(e, index)} placeholder="T12345678" />
      </div>
      <div className="input-group">
        <label className="input-label" style={{ marginBottom: '0.4rem' }}>Bank Account</label>
        <input type="text" name="bankAccount" value={data.bankAccount} onChange={(e) => onChange(e, index)} placeholder="DBS 123-45678-9" />
      </div>
    </div>

    <div className="input-group">
      <label className="input-label" style={{ marginBottom: '0.4rem' }}>Home Address</label>
      <textarea name="address" value={data.address} onChange={(e) => onChange(e, index)} placeholder="123 Street, #01-01, Country" rows="3" />
    </div>

    <div className="section-title" style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
      Dynamic Information (Phones, Emails, etc.)
    </div>

    {data.dynamicFields?.map((field, fIndex) => (
      <div key={fIndex} className="grid-2" style={{ marginBottom: '1rem', alignItems: 'end' }}>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label className="input-label">{field.label}</label>
          <input 
            type={field.type === 'email' ? 'email' : 'text'} 
            value={field.value} 
            onChange={(e) => onDynamicChange(fIndex, e.target.value, index)} 
            placeholder={`Enter ${field.type}...`}
          />
        </div>
        <button type="button" onClick={() => onRemoveDynamic(fIndex, index)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '0.75rem', borderRadius: '12px', color: '#ef4444' }}>
          <Trash2 size={18} />
        </button>
      </div>
    ))}
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
      {['phone', 'email', 'hint', 'social', 'hash', 'others'].map(type => (
        <button key={type} type="button" onClick={() => onAddDynamic(type, index)} style={{ flex: 1, background: 'rgba(99, 102, 241, 0.1)', border: '1px dashed var(--primary)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.65rem', color: 'var(--primary)', textTransform: 'uppercase' }}>
          + {type}
        </button>
      ))}
    </div>
    {index !== null && (
      <div style={{ textAlign: 'right', marginTop: '1rem' }}>
        <button type="button" onClick={() => onRemoveLink(index)} style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <X size={14} /> Remove Relationship Record
        </button>
      </div>
    )}
  </div>
);

const EditForm = ({ initialData, onSave }) => {
  const getDefaultRecord = () => ({
    name: '',
    nric: '',
    studentId: '',
    taxNumber: '',
    address: '',
    bankAccount: '',
    dynamicFields: [
      { type: 'phone', label: 'Primary Phone', value: '' },
      { type: 'email', label: 'Primary Email', value: '' },
      { type: 'hint', label: 'Security Hint', value: '' },
      { type: 'hash', label: 'Reference Hash', value: '' }
    ],
    linkedPeople: []
  });

  const [formData, setFormData] = useState(initialData || getDefaultRecord());

  const handleChange = (e, recordIndex = null) => {
    const { name, value } = e.target;
    if (recordIndex === null) {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      const newLinks = [...formData.linkedPeople];
      newLinks[recordIndex] = { ...newLinks[recordIndex], [name]: value };
      setFormData(prev => ({ ...prev, linkedPeople: newLinks }));
    }
  };

  const handleDynamicChange = (index, value, recordIndex = null) => {
    if (recordIndex === null) {
      const newFields = [...formData.dynamicFields];
      newFields[index].value = value;
      setFormData(prev => ({ ...prev, dynamicFields: newFields }));
    } else {
      const newLinks = [...formData.linkedPeople];
      const newFields = [...newLinks[recordIndex].dynamicFields];
      newFields[index].value = value;
      newLinks[recordIndex] = { ...newLinks[recordIndex], dynamicFields: newFields };
      setFormData(prev => ({ ...prev, linkedPeople: newLinks }));
    }
  };

  const addDynamicField = (type, recordIndex = null) => {
    const newField = { type, label: `Extra ${type}`, value: '' };
    if (recordIndex === null) {
      setFormData(prev => ({
        ...prev,
        dynamicFields: [...prev.dynamicFields, newField]
      }));
    } else {
      const newLinks = [...formData.linkedPeople];
      newLinks[recordIndex].dynamicFields = [...newLinks[recordIndex].dynamicFields, newField];
      setFormData(prev => ({ ...prev, linkedPeople: newLinks }));
    }
  };

  const removeDynamicField = (index, recordIndex = null) => {
    if (recordIndex === null) {
      setFormData(prev => ({
        ...prev,
        dynamicFields: formData.dynamicFields.filter((_, i) => i !== index)
      }));
    } else {
      const newLinks = [...formData.linkedPeople];
      newLinks[recordIndex].dynamicFields = newLinks[recordIndex].dynamicFields.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, linkedPeople: newLinks }));
    }
  };

  const addLinkedPerson = () => {
    setFormData(prev => ({
      ...prev,
      linkedPeople: [...prev.linkedPeople, { ...getDefaultRecord(), relationship: 'Friend' }]
    }));
  };

  const removeLink = (index) => {
    setFormData(prev => ({
      ...prev,
      linkedPeople: formData.linkedPeople.filter((_, i) => i !== index)
    }));
  };

  const handleRelationshipChange = (index, value) => {
    const newLinks = [...formData.linkedPeople];
    newLinks[index].relationship = value;
    setFormData(prev => ({ ...prev, linkedPeople: newLinks }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="fade-in">
      <div className="section-title" style={{ color: 'var(--primary)', marginBottom: '2.5rem', fontWeight: '700', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <User size={28} /> Primary Record Information
      </div>
      
      <RecordFields 
        data={formData} 
        onChange={handleChange} 
        onDynamicChange={handleDynamicChange} 
        onAddDynamic={addDynamicField} 
        onRemoveDynamic={removeDynamicField} 
      />

      <div className="section-title" style={{ color: 'var(--accent)', margin: '3.5rem 0 1.5rem', fontWeight: '700', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '2px solid var(--border)', paddingTop: '2.5rem' }}>
        <Users size={28} /> Relationships & Linked Profiles
      </div>
      
      {formData.linkedPeople.map((link, index) => (
        <RecordFields 
          key={index}
          data={link} 
          index={index}
          onChange={handleChange} 
          onDynamicChange={handleDynamicChange} 
          onAddDynamic={addDynamicField} 
          onRemoveDynamic={removeDynamicField} 
          onRelationshipChange={handleRelationshipChange}
          onRemoveLink={removeLink}
        />
      ))}

      <button type="button" onClick={addLinkedPerson} style={{ width: '100%', background: 'rgba(16, 185, 129, 0.1)', border: '1px dashed var(--accent)', padding: '1rem', borderRadius: '16px', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        <Plus size={20} /> Add Detailed Relationship Record
      </button>

      <div style={{ marginTop: '2.5rem' }}>
        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.125rem' }}>
          <Save size={20} /> Save High-Detail Vault Data
        </button>
      </div>
    </form>
  );
};

export default EditForm;
