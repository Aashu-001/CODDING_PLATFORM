import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';

// ─── Floating code particles (shared design language) ───────────────────────

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
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="animate-float-up"
                    style={{
                        position: 'absolute',
                        left: p.left,
                        bottom: '-60px',
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap',
                        fontSize: `${p.size}px`,
                        opacity: p.opacity,
                        color: '#a78bfa',
                        animationDuration: p.duration,
                        animationDelay: p.delay,
                        animationTimingFunction: 'linear',
                        animationIterationCount: 'infinite',
                    }}
                >
                    {p.snippet}
                </div>
            ))}
        </div>
    );
}

// ─── Circular progress ring ──────────────────────────────────────────────────

function CircularProgress({ percent, solved, total }) {
    const r = 54;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    return (
        <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
            <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <circle
                    cx="70" cy="70" r={r} fill="none"
                    stroke="url(#ring-grad)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
                />
                <defs>
                    <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                </defs>
            </svg>
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#e2e8f0', lineHeight: 1 }}>{solved}</span>
                <span style={{ fontSize: '0.7rem', color: 'rgba(148,163,184,0.6)', marginTop: '2px' }}>/ {total}</span>
                <span style={{ fontSize: '0.65rem', color: '#a78bfa', fontWeight: 600, marginTop: '2px' }}>{percent}%</span>
            </div>
        </div>
    );
}

// ─── Difficulty badge colours ────────────────────────────────────────────────

const DIFF_STYLES = {
    easy:   { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  text: '#4ade80' },
    medium: { bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.3)',  text: '#facc15' },
    hard:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  text: '#f87171' },
};

function DiffBadge({ diff }) {
    const s = DIFF_STYLES[diff?.toLowerCase()] || { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.3)', text: '#94a3b8' };
    return (
        <span style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: '99px',
            background: s.bg, border: `1px solid ${s.border}`, color: s.text,
            fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize',
        }}>
            {diff}
        </span>
    );
}

// ─── Main component ──────────────────────────────────────────────────────────

function Profile() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [solvedProblems, setSolvedProblems] = useState([]);
    const [totalProblems, setTotalProblems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [solvedRes, allRes] = await Promise.all([
                    axiosClient.get('/problem/problemSolvedByUser'),
                    axiosClient.get('/problem/getAllProblem'),
                ]);
                setSolvedProblems(solvedRes.data || []);
                setTotalProblems(allRes.data?.length || 0);
            } catch (err) {
                console.error('Error fetching profile data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLogout = () => dispatch(logoutUser());

    const easySolved   = solvedProblems.filter(p => p.difficulty === 'easy').length;
    const mediumSolved = solvedProblems.filter(p => p.difficulty === 'medium').length;
    const hardSolved   = solvedProblems.filter(p => p.difficulty === 'hard').length;
    const solvedCount  = solvedProblems.length;
    const progressPct  = totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;

    const initials = user?.firstName?.[0]?.toUpperCase() || '?';

    return (
        <>
            <style>{`
                @keyframes float-up {
                    0%   { transform: translateY(0px);    opacity: 0; }
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
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0);    }
                }
                @keyframes shimmer-slide {
                    0%   { left: -100%; }
                    100% { left: 200%;  }
                }
                @keyframes logo-glow {
                    0%, 100% { text-shadow: 0 0 16px rgba(139,92,246,0.4); }
                    50%       { text-shadow: 0 0 28px rgba(139,92,246,0.75); }
                }
                .animate-float-up { animation: float-up linear infinite; }
                .fade-up-1  { animation: fade-up 0.55s ease forwards; }
                .fade-up-2  { animation: fade-up 0.55s 0.1s ease both; }
                .fade-up-3  { animation: fade-up 0.55s 0.2s ease both; }
                .bg-animate {
                    background: linear-gradient(135deg,#0f0a1e,#1a0a2e,#0a0f1e,#1a1040);
                    background-size: 400% 400%;
                    animation: gradient-shift 12s ease infinite;
                }
                .glass {
                    background: rgba(255,255,255,0.04);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.09);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07);
                }
                .glass-nav {
                    background: rgba(15,10,30,0.85);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                }
                .logo-glow { animation: logo-glow 3s ease-in-out infinite; }
                .stat-card {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 16px;
                    padding: 20px 24px;
                    text-align: center;
                    transition: transform 0.25s ease, box-shadow 0.25s ease;
                }
                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 28px rgba(0,0,0,0.3);
                }
                .problem-row {
                    display: flex; align-items: center;
                    padding: 14px 20px;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.06);
                    background: rgba(255,255,255,0.03);
                    transition: background 0.2s, border-color 0.2s, transform 0.2s;
                    text-decoration: none;
                    margin-bottom: 8px;
                }
                .problem-row:hover {
                    background: rgba(139,92,246,0.07);
                    border-color: rgba(139,92,246,0.25);
                    transform: translateX(4px);
                }
                .glow-btn {
                    background: linear-gradient(135deg,#7c3aed,#6d28d9);
                    border: none; border-radius: 10px;
                    color: white; font-weight: 700; cursor: pointer;
                    transition: all 0.25s ease;
                    box-shadow: 0 4px 14px rgba(124,58,237,0.4);
                    position: relative; overflow: hidden;
                }
                .glow-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(124,58,237,0.55); }
                .glow-btn::after {
                    content:''; position:absolute;
                    top:-50%; left:-100%; width:60%; height:200%;
                    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent);
                    transform:skewX(-20deg); animation: shimmer-slide 2.5s infinite;
                }
                .ghost-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px; color: #cbd5e1;
                    font-weight: 600; cursor: pointer;
                    transition: all 0.22s ease;
                    padding: 8px 16px; font-size: 0.875rem;
                }
                .ghost-btn:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.18); }
                .avatar-ring {
                    width: 88px; height: 88px; border-radius: 50%;
                    background: linear-gradient(135deg,#7c3aed,#3b82f6);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 2.2rem; font-weight: 800; color: white; flex-shrink: 0;
                    box-shadow: 0 0 0 3px rgba(139,92,246,0.35), 0 0 24px rgba(124,58,237,0.4);
                }
                .divider { height:1px; background:linear-gradient(90deg,transparent,rgba(139,92,246,0.3),transparent); }
                .tag-chip {
                    display: inline-block; padding: 2px 10px; border-radius: 99px;
                    background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.25);
                    color: #60a5fa; font-size: 0.7rem; font-weight: 600;
                }
            `}</style>

            <div className="min-h-screen bg-animate relative overflow-x-hidden">
                {/* Background orbs */}
                <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
                    <div style={{ position:'absolute', top:'8%', left:'5%', width:'380px', height:'380px', borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.13),transparent 70%)', filter:'blur(50px)' }} />
                    <div style={{ position:'absolute', bottom:'10%', right:'5%', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle,rgba(59,130,246,0.11),transparent 70%)', filter:'blur(45px)' }} />
                    <div style={{ position:'absolute', top:'55%', left:'55%', width:'220px', height:'220px', borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,0.09),transparent 70%)', filter:'blur(35px)' }} />
                </div>
                <FloatingParticles />

                {/* ── Navbar ── */}
                <nav className="glass-nav sticky top-0 z-50" style={{ padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Logo */}
                    <NavLink to="/problems" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                        <div style={{
                            width: '30px', height: '30px', borderRadius: '8px',
                            background: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 900, color: 'white',
                        }}>{'{ }'}</div>
                        <span className="logo-glow" style={{
                            fontSize: '1.1rem', fontWeight: 800,
                            background: 'linear-gradient(135deg,#a78bfa,#60a5fa)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>CodeJudge</span>
                    </NavLink>

                    {/* Right actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <NavLink to="/problems" className="ghost-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
                            ← Problems
                        </NavLink>

                        {user?.role === 'admin' && (
                            <NavLink to="/admin" className="ghost-btn" style={{ textDecoration:'none', display:'inline-block', color:'#a78bfa', borderColor:'rgba(139,92,246,0.3)' }}>
                                Admin
                            </NavLink>
                        )}

                        {/* Avatar dropdown */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setMenuOpen(o => !o)}
                                style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
                                    border: '2px solid rgba(139,92,246,0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: '0.9rem', color: 'white', cursor: 'pointer',
                                }}
                            >
                                {initials}
                            </button>
                            {menuOpen && (
                                <div style={{
                                    position: 'absolute', right: 0, top: '44px',
                                    background: 'rgba(15,10,30,0.95)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px', padding: '8px', minWidth: '140px',
                                    boxShadow: '0 12px 32px rgba(0,0,0,0.4)', zIndex: 100,
                                    backdropFilter: 'blur(16px)',
                                }}>
                                    <button
                                        onClick={() => { setMenuOpen(false); handleLogout(); }}
                                        style={{
                                            width: '100%', padding: '10px 14px', borderRadius: '8px',
                                            background: 'none', border: 'none', color: '#f87171',
                                            fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                                            textAlign: 'left', transition: 'background 0.2s',
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

                {/* ── Profile Hero ── */}
                <div className="relative z-10" style={{ padding: '40px 24px 0' }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

                        {/* Hero card */}
                        <div className="glass fade-up-1" style={{ borderRadius: '20px', padding: '32px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '28px' }}>

                                {/* Avatar */}
                                <div className="avatar-ring">{initials}</div>

                                {/* User info */}
                                <div style={{ flex: 1, minWidth: '180px' }}>
                                    <h1 style={{
                                        fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em',
                                        background: 'linear-gradient(135deg,#e2e8f0,#a78bfa)',
                                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                        margin: 0,
                                    }}>
                                        {user?.firstName}
                                    </h1>
                                    <p style={{ color: 'rgba(148,163,184,0.65)', fontSize: '0.875rem', margin: '4px 0 10px' }}>
                                        {user?.emailId}
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <span style={{
                                            padding: '3px 12px', borderRadius: '99px',
                                            background: 'rgba(139,92,246,0.15)',
                                            border: '1px solid rgba(139,92,246,0.3)',
                                            color: '#a78bfa', fontSize: '0.72rem', fontWeight: 700,
                                            textTransform: 'capitalize',
                                        }}>
                                            {user?.role}
                                        </span>
                                        <span style={{
                                            padding: '3px 12px', borderRadius: '99px',
                                            background: 'rgba(16,185,129,0.1)',
                                            border: '1px solid rgba(16,185,129,0.25)',
                                            color: '#34d399', fontSize: '0.72rem', fontWeight: 700,
                                        }}>
                                            🏆 {solvedCount} Solved
                                        </span>
                                    </div>
                                </div>

                                {/* Circular progress */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <CircularProgress percent={progressPct} solved={solvedCount} total={totalProblems} />
                                    <span style={{ color: 'rgba(148,163,184,0.5)', fontSize: '0.72rem' }}>Overall Progress</span>
                                </div>
                            </div>

                            <div className="divider" style={{ margin: '24px 0' }} />

                            {/* Difficulty stat cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                                {[
                                    { label: 'Easy',   val: easySolved,   color: '#4ade80', shadow: 'rgba(74,222,128,0.25)',  bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)' },
                                    { label: 'Medium', val: mediumSolved, color: '#facc15', shadow: 'rgba(250,204,21,0.25)',  bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.2)' },
                                    { label: 'Hard',   val: hardSolved,   color: '#f87171', shadow: 'rgba(248,113,113,0.25)', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)' },
                                ].map(({ label, val, color, shadow, bg, border }) => (
                                    <div key={label} className="stat-card" style={{ background: bg, border: `1px solid ${border}` }}>
                                        <div style={{
                                            fontSize: '2rem', fontWeight: 800, color,
                                            textShadow: `0 0 16px ${shadow}`,
                                        }}>{val}</div>
                                        <div style={{ color, fontSize: '0.78rem', fontWeight: 700, marginTop: '4px', opacity: 0.85 }}>{label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Solved Problems list ── */}
                        <div className="glass fade-up-2" style={{ borderRadius: '20px', padding: '28px', marginBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h2 style={{
                                    fontSize: '1.1rem', fontWeight: 700, margin: 0,
                                    background: 'linear-gradient(135deg,#e2e8f0,#a78bfa)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                }}>
                                    Solved Problems
                                </h2>
                                <span style={{
                                    padding: '3px 12px', borderRadius: '99px',
                                    background: 'rgba(139,92,246,0.15)',
                                    border: '1px solid rgba(139,92,246,0.3)',
                                    color: '#a78bfa', fontSize: '0.75rem', fontWeight: 700,
                                }}>
                                    {solvedCount} / {totalProblems}
                                </span>
                            </div>

                            {loading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                                    <span className="loading loading-spinner loading-lg" style={{ color: '#a78bfa' }} />
                                </div>
                            ) : solvedProblems.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🧩</div>
                                    <p style={{ color: 'rgba(148,163,184,0.55)', fontSize: '1rem', marginBottom: '20px' }}>
                                        No problems solved yet. Start your journey!
                                    </p>
                                    <NavLink
                                        to="/problems"
                                        className="glow-btn"
                                        style={{
                                            display: 'inline-block', padding: '10px 24px',
                                            fontSize: '0.875rem', textDecoration: 'none',
                                        }}
                                    >
                                        Browse Problems →
                                    </NavLink>
                                </div>
                            ) : (
                                <div>
                                    {solvedProblems.map((problem, idx) => (
                                        <NavLink
                                            key={problem._id}
                                            to={`/problem/${problem._id}`}
                                            className="problem-row"
                                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                        >
                                            {/* Left: index + title */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                                                <span style={{
                                                    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                                                    background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#a78bfa', fontSize: '0.72rem', fontWeight: 700,
                                                }}>
                                                    {idx + 1}
                                                </span>
                                                <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {problem.title}
                                                </span>
                                            </div>

                                            {/* Right: tags + difficulty + solved badge */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                                                {problem.tags && (
                                                    <span className="tag-chip">{problem.tags}</span>
                                                )}
                                                <DiffBadge diff={problem.difficulty} />
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    padding: '2px 10px', borderRadius: '99px',
                                                    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                                                    color: '#4ade80', fontSize: '0.68rem', fontWeight: 700,
                                                }}>
                                                    ✓ Solved
                                                </span>
                                            </div>
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Profile;
