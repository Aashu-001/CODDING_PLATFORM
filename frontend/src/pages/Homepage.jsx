import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';

// ─── Shared design tokens ────────────────────────────────────────────────────

const CODE_SNIPPETS = [
  'function twoSum(nums, target) {',
  'const map = new Map();',
  'while (left < right) {',
  'mid = (left + right) >> 1;',
  'graph[u].push([v, w]);',
  'return dfs(node, visited);',
  'memo[n] = memo[n-1] + memo[n-2];',
  'stack.push(current);',
  'if (root === null) return 0;',
  'dp[i] = Math.max(dp[i-1], val);',
  'priority_queue<int> pq;',
  'sort(arr.begin(), arr.end());',
];

const DIFF_STYLES = {
  easy:   { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  text: '#4ade80' },
  medium: { bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.3)',  text: '#facc15' },
  hard:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  text: '#f87171' },
};

// ─── Floating particles ──────────────────────────────────────────────────────

function FloatingParticles() {
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    snippet: CODE_SNIPPETS[i % CODE_SNIPPETS.length],
    left: `${(i * 43 + 3) % 92}%`,
    duration: `${16 + (i * 3) % 14}s`,
    delay: `${(i * 1.9) % 12}s`,
    opacity: 0.04 + (i % 4) * 0.02,
    size: 10 + (i % 3) * 1.5,
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="animate-float-up"
          style={{
            position: 'absolute', left: p.left, bottom: '-60px',
            fontFamily: 'monospace', whiteSpace: 'nowrap',
            fontSize: `${p.size}px`, opacity: p.opacity, color: '#a78bfa',
            animationDuration: p.duration, animationDelay: p.delay,
            animationTimingFunction: 'linear', animationIterationCount: 'infinite',
          }}
        >
          {p.snippet}
        </div>
      ))}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DiffBadge({ diff }) {
  const s = DIFF_STYLES[diff?.toLowerCase()] || { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.3)', text: '#94a3b8' };
  return (
    <span style={{
      padding: '2px 10px', borderRadius: '99px',
      background: s.bg, border: `1px solid ${s.border}`, color: s.text,
      fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize',
    }}>
      {diff}
    </span>
  );
}

function FilterChip({ label, options, value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: '8px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        color: '#cbd5e1', cursor: 'pointer', outline: 'none',
        transition: 'border-color 0.2s, background 0.2s',
        appearance: 'none', paddingRight: '32px',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a78bfa' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value} style={{ background: '#1a0a2e' }}>{o.label}</option>)}
    </select>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ difficulty: 'all', tag: 'all', status: 'all' });
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [probRes] = await Promise.all([
          axiosClient.get('/problem/getAllProblem'),
        ]);
        setProblems(probRes.data);
        if (user) {
          const solvedRes = await axiosClient.get('/problem/problemSolvedByUser');
          setSolvedProblems(solvedRes.data);
        }
      } catch (err) {
        console.error('Error fetching:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const handleLogout = () => { dispatch(logoutUser()); setSolvedProblems([]); };

  const isSolved = (id) => solvedProblems.some(sp => sp._id === id);

  const filtered = problems.filter(p => {
    const diffOk   = filters.difficulty === 'all' || p.difficulty === filters.difficulty;
    const tagOk    = filters.tag === 'all' || p.tags === filters.tag;
    const statusOk = filters.status === 'all' || (filters.status === 'solved' && isSolved(p._id)) || (filters.status === 'unsolved' && !isSolved(p._id));
    const searchOk = !search || p.title.toLowerCase().includes(search.toLowerCase());
    return diffOk && tagOk && statusOk && searchOk;
  });

  const solvedCount = solvedProblems.length;
  const initials    = user?.firstName?.[0]?.toUpperCase() || '?';

  const allTags = [...new Set(problems.map(p => p.tags).filter(Boolean))];

  return (
    <>
      <style>{`
        @keyframes float-up {
          0%   { transform: translateY(0);     opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.7; }
          100% { transform: translateY(-110vh); opacity: 0; }
        }
        @keyframes gradient-shift {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes shimmer-slide {
          0%   { left: -100%; }
          100% { left: 200%;  }
        }
        @keyframes logo-glow {
          0%,100% { text-shadow: 0 0 16px rgba(139,92,246,0.4); }
          50%     { text-shadow: 0 0 28px rgba(139,92,246,0.75); }
        }
        .animate-float-up { animation: float-up linear infinite; }
        .fade-up { animation: fade-up 0.5s ease forwards; }
        .bg-animate {
          background: linear-gradient(135deg,#0f0a1e,#1a0a2e,#0a0f1e,#1a1040);
          background-size: 400% 400%;
          animation: gradient-shift 12s ease infinite;
        }
        .glass {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.09);
          box-shadow: 0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .glass-nav {
          background: rgba(15,10,30,0.88);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .logo-glow { animation: logo-glow 3s ease-in-out infinite; }
        .problem-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.025);
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
          text-decoration: none; cursor: pointer; gap: 12px;
        }
        .problem-row:hover {
          background: rgba(139,92,246,0.07);
          border-color: rgba(139,92,246,0.28);
          transform: translateX(4px);
        }
        .ghost-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: #cbd5e1;
          font-weight: 600; cursor: pointer;
          transition: all 0.22s ease;
          padding: 7px 15px; font-size: 0.82rem;
          text-decoration: none; display: inline-block;
        }
        .ghost-btn:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.18); color: #e2e8f0; }
        .search-input {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: #e2e8f0 !important;
          border-radius: 10px !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }
        .search-input::placeholder { color: rgba(148,163,184,0.45) !important; }
        .search-input:focus {
          outline: none !important;
          border-color: rgba(139,92,246,0.5) !important;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.15) !important;
        }
        .divider { height:1px; background:linear-gradient(90deg,transparent,rgba(139,92,246,0.3),transparent); }
        .stat-pill {
          padding: 6px 16px; border-radius: 99px; font-size: 0.8rem; font-weight: 700;
          background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.25); color: #a78bfa;
        }
        .empty-state { text-align: center; padding: 64px 0; }
        .skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: shimmer-slide 1.5s infinite;
          border-radius: 12px; height: 60px; margin-bottom: 8px;
        }
      `}</style>

      <div className="min-h-screen bg-animate relative">
        {/* BG orbs */}
        <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position:'absolute', top:'8%', left:'5%', width:'350px', height:'350px', borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.12),transparent 70%)', filter:'blur(50px)' }} />
          <div style={{ position:'absolute', bottom:'10%', right:'5%', width:'280px', height:'280px', borderRadius:'50%', background:'radial-gradient(circle,rgba(59,130,246,0.1),transparent 70%)', filter:'blur(45px)' }} />
          <div style={{ position:'absolute', top:'50%', left:'55%', width:'200px', height:'200px', borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,0.08),transparent 70%)', filter:'blur(35px)' }} />
        </div>

        <FloatingParticles />

        {/* ── Navbar ── */}
        <nav className="glass-nav sticky top-0 z-50" style={{ padding: '0 28px', height: '62px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <NavLink to="/problems" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '9px',
              background: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 900, color: 'white',
              boxShadow: '0 4px 12px rgba(124,58,237,0.45)',
            }}>{'{ }'}</div>
            <span className="logo-glow" style={{
              fontSize: '1.15rem', fontWeight: 800,
              background: 'linear-gradient(135deg,#a78bfa,#60a5fa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>CodeJudge</span>
          </NavLink>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Solved pill */}
            {solvedCount > 0 && (
              <span className="stat-pill">🏆 {solvedCount} Solved</span>
            )}

            <NavLink to="/" className="ghost-btn">Profile</NavLink>

            {user?.role === 'admin' && (
              <NavLink to="/admin" className="ghost-btn" style={{ color: '#a78bfa', borderColor: 'rgba(139,92,246,0.3)' }}>Admin</NavLink>
            )}

            {/* Avatar + dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
                  border: '2px solid rgba(139,92,246,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.9rem', color: 'white', cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.35)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                {initials}
              </button>
              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '46px', minWidth: '160px',
                  background: 'rgba(15,10,30,0.97)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', padding: '8px', zIndex: 100,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)',
                }}>
                  {[
                    { label: '👤 My Profile', to: '/', danger: false },
                  ].map(item => (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: 'block', padding: '10px 14px', borderRadius: '8px',
                        color: '#cbd5e1', fontWeight: 600, fontSize: '0.875rem',
                        textDecoration: 'none', transition: 'background 0.18s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                  <div className="divider" style={{ margin: '6px 0' }} />
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px',
                      background: 'none', border: 'none', color: '#f87171',
                      fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.18s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* ── Main ── */}
        <div className="relative z-10" style={{ maxWidth: '900px', margin: '0 auto', padding: '36px 24px 60px' }}>

          {/* Header */}
          <div className="fade-up" style={{ marginBottom: '28px' }}>
            <h1 style={{
              fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0,
              background: 'linear-gradient(135deg,#e2e8f0,#a78bfa,#60a5fa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Problem Set
            </h1>
            <p style={{ color: 'rgba(148,163,184,0.6)', fontSize: '0.9rem', marginTop: '6px' }}>
              {problems.length} problems · {solvedCount} solved · sharpen your skills
            </p>
          </div>

          {/* ── Search + Filters ── */}
          <div className="glass fade-up" style={{ borderRadius: '16px', padding: '18px 20px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.45)', pointerEvents: 'none' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 0 5 11a6 6 0 0 0 12 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search problems…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search-input"
                style={{ width: '100%', height: '40px', paddingLeft: '36px', paddingRight: '12px' }}
              />
            </div>

            <FilterChip
              value={filters.status}
              onChange={v => setFilters(f => ({ ...f, status: v }))}
              options={[{ value: 'all', label: 'All Status' }, { value: 'solved', label: '✓ Solved' }, { value: 'unsolved', label: '○ Unsolved' }]}
            />
            <FilterChip
              value={filters.difficulty}
              onChange={v => setFilters(f => ({ ...f, difficulty: v }))}
              options={[{ value: 'all', label: 'All Levels' }, { value: 'easy', label: '🟢 Easy' }, { value: 'medium', label: '🟡 Medium' }, { value: 'hard', label: '🔴 Hard' }]}
            />
            <FilterChip
              value={filters.tag}
              onChange={v => setFilters(f => ({ ...f, tag: v }))}
              options={[{ value: 'all', label: 'All Tags' }, ...allTags.map(t => ({ value: t, label: t }))]}
            />
          </div>

          {/* ── Problem list ── */}
          <div className="glass fade-up" style={{ borderRadius: '18px', padding: '20px', animationDelay: '0.1s' }}>
            {/* List header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '40px 1fr auto',
              padding: '8px 20px', marginBottom: '10px',
              color: 'rgba(148,163,184,0.45)', fontSize: '0.72rem', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              <span>#</span>
              <span>Title</span>
              <span>Info</span>
            </div>
            <div className="divider" style={{ marginBottom: '12px' }} />

            {loading ? (
              <div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
                <p style={{ color: 'rgba(148,163,184,0.5)', fontSize: '1rem' }}>
                  No problems match your filters.
                </p>
                <button
                  onClick={() => { setFilters({ difficulty: 'all', tag: 'all', status: 'all' }); setSearch(''); }}
                  style={{
                    marginTop: '16px', padding: '8px 20px', borderRadius: '10px',
                    background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                    color: '#a78bfa', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div>
                {filtered.map((problem, idx) => {
                  const solved = isSolved(problem._id);
                  return (
                    <NavLink
                      key={problem._id}
                      to={`/problem/${problem._id}`}
                      className="problem-row"
                      style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', textDecoration: 'none', marginBottom: '6px' }}
                    >
                      {/* Index */}
                      <span style={{
                        width: '28px', height: '28px', borderRadius: '7px',
                        background: solved ? 'rgba(34,197,94,0.1)' : 'rgba(139,92,246,0.1)',
                        border: `1px solid ${solved ? 'rgba(34,197,94,0.25)' : 'rgba(139,92,246,0.2)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: solved ? '#4ade80' : '#a78bfa',
                        fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                      }}>
                        {solved ? '✓' : idx + 1}
                      </span>

                      {/* Title */}
                      <span style={{
                        color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        paddingRight: '12px',
                      }}>
                        {problem.title}
                      </span>

                      {/* Right meta */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {problem.tags && (
                          <span style={{
                            padding: '2px 9px', borderRadius: '99px',
                            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.22)',
                            color: '#60a5fa', fontSize: '0.68rem', fontWeight: 600,
                          }}>
                            {problem.tags}
                          </span>
                        )}
                        <DiffBadge diff={problem.difficulty} />
                        {solved && (
                          <span style={{
                            padding: '2px 9px', borderRadius: '99px',
                            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                            color: '#4ade80', fontSize: '0.68rem', fontWeight: 700,
                          }}>
                            Solved
                          </span>
                        )}
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            )}

            {/* Footer count */}
            {!loading && filtered.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: 'rgba(148,163,184,0.4)', fontSize: '0.78rem' }}>
                Showing {filtered.length} of {problems.length} problems
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Homepage;
