import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, Loader2 } from 'lucide-react';

export function Card({ children, className = '' }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function Button({ children, variant = 'primary', loading = false, className = '', ...props }) {
  return <button className={`btn btn-${variant} ${className}`} disabled={loading || props.disabled} {...props}>
    {loading ? <><Loader2 size={17} className="spin" /> Processing...</> : children}
  </button>;
}

export function StatusBadge({ status }) {
  const value = String(status || 'Unknown');
  const tone = value.toLowerCase().includes('safe') || value.toLowerCase().includes('good') || value.toLowerCase().includes('normal') ? 'success' :
    value.toLowerCase().includes('critical') ? 'danger' : value.toLowerCase().includes('treatment') || value.toLowerCase().includes('warning') ? 'warning' : 'neutral';
  return <span className={`status-badge ${tone}`}>{value}</span>;
}

export function ErrorState({ message }) {
  return <div className="inline-error"><XCircle size={18} /> <span>{message}</span></div>;
}

export function SuccessState({ message }) {
  return <div className="inline-success"><CheckCircle2 size={18} /> <span>{message}</span></div>;
}

export function EmptyState({ title, message }) {
  return <div className="empty-state"><Info size={22} /><div><strong>{title}</strong><p>{message}</p></div></div>;
}

export function Spinner({ label = 'Loading...' }) {
  return <div className="page-loading"><Loader2 className="spin" size={22} /> {label}</div>;
}
