import { useState } from 'react';
import { User, CreditCard, Mail, Phone, MapPin, Hash, Globe, Copy, Check, Eye, EyeOff, Shield } from 'lucide-react';

const InfoCard = ({ data }) => {
  const [copiedField, setCopiedField] = useState(null);
  const [showSensitive, setShowSensitive] = useState(false);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const Field = ({ icon: Icon, label, value, sensitive, copyable = true }) => {
    if (!value && label !== 'Social Media') return null;

    const displayValue = sensitive && !showSensitive ? '•'.repeat(10) : value;

    return (
      <div className="info-field" style={{ marginBottom: '1.25rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Icon size={18} color="var(--text-muted)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</div>
              <div style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-main)', marginTop: '0.125rem' }}>{displayValue}</div>
            </div>
          </div>
          {copyable && value && (
            <button 
              onClick={() => copyToClipboard(value, label)}
              style={{ background: 'none', border: 'none', color: copiedField === label ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              {copiedField === label ? <Check size={18} /> : <Copy size={18} />}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Stored Information</h2>
        <button 
          onClick={() => setShowSensitive(!showSensitive)}
          style={{ background: 'none', border: '1px solid var(--border)', padding: '0.4rem 0.75rem', borderRadius: '8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
        >
          {showSensitive ? <EyeOff size={16} /> : <Eye size={16} />}
          {showSensitive ? 'Hide Sensitive' : 'Show Sensitive'}
        </button>
      </div>

      <div className="info-sections">
        <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem', marginTop: '1.5rem' }}>Identity</h3>
        <div className="grid-2">
          <Field icon={User} label="Name" value={data.name} />
          <Field icon={Shield} label="NRIC/ID" value={data.nric} sensitive />
        </div>
        <div className="grid-2">
          <Field icon={Hash} label="Hint" value={data.hint} />
          <Field icon={User} label="Student ID" value={data.studentId} />
        </div>

        <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem', marginTop: '1.5rem' }}>Contact</h3>
        <div className="grid-2">
          <Field icon={Phone} label="Primary Phone" value={data.phones.primary} />
          <Field icon={Phone} label="Secondary Phone" value={data.phones.secondary} />
        </div>
        <div className="grid-2">
          <Field icon={Mail} label="Primary Email" value={data.emails.primary} />
          <Field icon={Mail} label="Secondary Email" value={data.emails.secondary} />
        </div>
        <Field icon={MapPin} label="Address" value={data.address} />

        <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem', marginTop: '1.5rem' }}>Banking</h3>
        <div className="grid-2">
          <Field icon={CreditCard} label="Bank" value={data.bankDetails.bankName} />
          <Field icon={CreditCard} label="Account No" value={data.bankDetails.accountNo} sensitive />
        </div>

        <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem', marginTop: '1.5rem' }}>Social & Meta</h3>
        <Field icon={Hash} label="Stored Hash" value={data.hash} />
        
        {data.socials && data.socials.length > 0 && (
          <div className="grid-2">
            {data.socials.map((social, idx) => (
              <Field key={idx} icon={Globe} label={social.platform || 'Social'} value={social.link} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoCard;
