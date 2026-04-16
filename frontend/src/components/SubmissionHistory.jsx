import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axiosClient from '../utils/axiosClient';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  accepted: { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  text: '#4ade80', label: 'Accepted' },
  wrong:    { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  text: '#f87171', label: 'Wrong Answer' },
  error:    { bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.3)',  text: '#facc15', label: 'Runtime Error' },
  pending:  { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa', label: 'Pending' },
};

const getStatusStyle = (status) =>
  STATUS_STYLES[status?.toLowerCase()] || {
    bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', text: '#94a3b8',
    label: status ? (status.charAt(0).toUpperCase() + status.slice(1)) : 'Unknown',
  };

const formatMemory = (mem) => {
  if (mem == null) return '–';
  return mem < 1024 ? `${mem} KB` : `${(mem / 1024).toFixed(2)} MB`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '–';
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

// ─── Code Modal (rendered via Portal to avoid stacking-context issues) ────────

function CodeModal({ sub, onClose }) {
  const st = getStatusStyle(sub.status);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f0a1e',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: '18px',
          padding: '28px 30px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h3 style={{
            margin: 0, fontSize: '1.1rem', fontWeight: 800,
            background: 'linear-gradient(135deg,#e2e8f0,#a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Submission Details
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px', color: 'rgba(148,163,184,0.7)',
              width: '30px', height: '30px', cursor: 'pointer',
              fontSize: '1rem', fontWeight: 700, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.18s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          >
            ✕
          </button>
        </div>

        {/* Meta badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {/* Status */}
          <span style={{
            padding: '4px 14px', borderRadius: '99px', fontWeight: 700, fontSize: '0.78rem',
            background: st.bg, border: `1px solid ${st.border}`, color: st.text,
          }}>
            {st.label}
          </span>

          {/* Language */}
          <span style={{
            padding: '4px 14px', borderRadius: '99px', fontWeight: 600, fontSize: '0.78rem',
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa',
          }}>
            {sub.language}
          </span>

          {/* Runtime */}
          {sub.runtime != null && (
            <span style={{
              padding: '4px 14px', borderRadius: '99px', fontWeight: 600, fontSize: '0.78rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1',
            }}>
              ⚡ {sub.runtime}s
            </span>
          )}

          {/* Memory */}
          {sub.memory != null && (
            <span style={{
              padding: '4px 14px', borderRadius: '99px', fontWeight: 600, fontSize: '0.78rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1',
            }}>
              💾 {formatMemory(sub.memory)}
            </span>
          )}

          {/* Test cases */}
          <span style={{
            padding: '4px 14px', borderRadius: '99px', fontWeight: 600, fontSize: '0.78rem',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1',
          }}>
            ✓ {sub.testCasesPassed ?? '–'}/{sub.testCasesTotal ?? '–'} passed
          </span>
        </div>

        {/* Error message */}
        {sub.errorMessage && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '10px', padding: '12px 16px', color: '#f87171',
            fontSize: '0.8rem', marginBottom: '14px', fontFamily: 'monospace',
          }}>
            {sub.errorMessage}
          </div>
        )}

        {/* Code block */}
        <div style={{ marginBottom: '6px', color: 'rgba(148,163,184,0.45)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Source Code
        </div>
        <div style={{
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px',
          padding: '20px',
          overflowX: 'auto',
          fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
          fontSize: '0.82rem',
          lineHeight: 1.7,
          color: '#e2e8f0',
          whiteSpace: 'pre',
        }}>
          {sub.code || '// No code stored for this submission.'}
        </div>

        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem',
              background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
              color: '#a78bfa', cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.15)'}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const SubmissionHistory = ({ problemId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [selected, setSelected]       = useState(null);

  useEffect(() => {
    if (!problemId) return;
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosClient.get(`/problem/submittedProblem/${problemId}`);
        const raw  = response.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.submissions)
          ? raw.submissions
          : [];
        setSubmissions(list);
      } catch (err) {
        setError('Failed to fetch submission history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [problemId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '180px' }}>
        <span className="loading loading-spinner loading-lg" style={{ color: '#a78bfa' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: '12px', padding: '16px 20px', color: '#f87171',
        display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem',
      }}>
        ⚠️ {error}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📭</div>
        <p style={{ color: 'rgba(148,163,184,0.55)', fontSize: '0.95rem' }}>
          No submissions yet for this problem.
        </p>
      </div>
    );
  }

  const COL = '36px 80px 130px 80px 84px 90px 1fr 70px';

  return (
    <>
      {/* Header row */}
      <div style={{
        display: 'grid', gridTemplateColumns: COL, gap: '8px',
        padding: '6px 16px 10px',
        color: 'rgba(148,163,184,0.4)', fontSize: '0.68rem',
        fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        <span>#</span><span>Lang</span><span>Status</span>
        <span>Runtime</span><span>Memory</span><span>Tests</span>
        <span>Submitted</span><span>Code</span>
      </div>

      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(139,92,246,0.3),transparent)', marginBottom: '10px' }} />

      {/* Data rows */}
      {submissions.map((sub, idx) => {
        const st = getStatusStyle(sub.status);
        return (
          <div
            key={sub._id || idx}
            style={{
              display: 'grid', gridTemplateColumns: COL, alignItems: 'center',
              gap: '8px', padding: '12px 16px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(255,255,255,0.025)',
              marginBottom: '6px', fontSize: '0.8rem',
              transition: 'background 0.18s, border-color 0.18s',
              cursor: 'default',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.06)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.22)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
          >
            <span style={{ color: 'rgba(148,163,184,0.45)', fontWeight: 700, fontSize: '0.72rem' }}>{idx + 1}</span>

            <span style={{ color: '#60a5fa', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.78rem' }}>
              {sub.language || '–'}
            </span>

            <span style={{
              padding: '3px 10px', borderRadius: '99px', fontWeight: 700, fontSize: '0.7rem',
              background: st.bg, border: `1px solid ${st.border}`, color: st.text,
              display: 'inline-block', width: 'fit-content',
            }}>
              {st.label}
            </span>

            <span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.78rem' }}>
              {sub.runtime != null ? `${sub.runtime}s` : '–'}
            </span>

            <span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.78rem' }}>
              {formatMemory(sub.memory)}
            </span>

            <span style={{
              fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 600,
              color: sub.testCasesPassed === sub.testCasesTotal ? '#4ade80' : '#f87171',
            }}>
              {sub.testCasesPassed ?? '–'}/{sub.testCasesTotal ?? '–'}
            </span>

            <span style={{ color: 'rgba(148,163,184,0.5)', fontSize: '0.72rem' }}>
              {formatDate(sub.createdAt)}
            </span>

            <button
              onClick={() => setSelected(sub)}
              style={{
                padding: '5px 12px', borderRadius: '7px', fontSize: '0.72rem', fontWeight: 700,
                background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.28)',
                color: '#a78bfa', cursor: 'pointer', transition: 'background 0.18s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.12)'}
            >
              View
            </button>
          </div>
        );
      })}

      <div style={{ marginTop: '12px', color: 'rgba(148,163,184,0.3)', fontSize: '0.72rem', textAlign: 'right' }}>
        {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
      </div>

      {/* Portal modal */}
      {selected && <CodeModal sub={selected} onClose={() => setSelected(null)} />}
    </>
  );
};

export default SubmissionHistory;
