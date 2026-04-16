import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { registerUser } from '../authSlice';

const signupSchema = z.object({
  firstName: z.string().min(3, 'Name must be at least 3 characters'),
  emailId: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const CODE_SNIPPETS = [
  'function twoSum(nums, target) {',
  '  const map = new Map();',
  '  for (let i = 0; i < nums.length; i++) {',
  'if (map.has(target - nums[i]))',
  'return [map.get(target - nums[i]), i];',
  'O(n log n) complexity',
  'const dp = Array(n).fill(0);',
  'while (left < right) {',
  'mid = (left + right) >> 1;',
  'graph[u].push([v, w]);',
  'priority_queue<pair<int,int>> pq;',
  'return dfs(node, visited);',
  'memo[n] = memo[n-1] + memo[n-2];',
  'stack.push(current);',
  'if (root === null) return 0;',
];

function FloatingParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    snippet: CODE_SNIPPETS[i % CODE_SNIPPETS.length],
    left: `${(i * 37 + 5) % 90}%`,
    duration: `${14 + (i * 3) % 12}s`,
    delay: `${(i * 1.7) % 10}s`,
    opacity: 0.06 + (i % 4) * 0.03,
    size: 10 + (i % 3) * 1.5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute font-mono whitespace-nowrap animate-float-up"
          style={{
            left: p.left,
            bottom: '-60px',
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

function EyeOpenIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

// Password strength calculator
function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  const levels = [
    { label: 'Very Weak', color: '#ef4444' },
    { label: 'Weak',      color: '#f97316' },
    { label: 'Fair',      color: '#eab308' },
    { label: 'Good',      color: '#22c55e' },
    { label: 'Strong',    color: '#10b981' },
    { label: 'Very Strong', color: '#6366f1' },
  ];
  return { score, ...levels[Math.min(score, 5)] };
}

function PasswordStrengthBar({ password }) {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: '4px', borderRadius: '2px',
              background: i <= score ? color : 'rgba(255,255,255,0.1)',
              transition: 'background 0.35s ease',
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: '0.72rem', color, fontWeight: 600, letterSpacing: '0.03em' }}>
        {label}
      </p>
    </div>
  );
}

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
  });

  // Watch password for strength meter
  const watchedPassword = watch('password', '');
  useEffect(() => { setPasswordValue(watchedPassword); }, [watchedPassword]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (isAuthenticated) navigate('/'); }, [isAuthenticated, navigate]);

  const onSubmit = (data) => dispatch(registerUser(data));

  return (
    <>
      <style>{`
        @keyframes float-up {
          0%   { transform: translateY(0px) translateX(0px);   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.8; }
          100% { transform: translateY(-110vh) translateX(20px); opacity: 0; }
        }
        @keyframes card-in {
          from { opacity: 0; transform: translateY(32px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes logo-glow {
          0%, 100% { text-shadow: 0 0 20px rgba(139,92,246,0.5), 0 0 40px rgba(139,92,246,0.2); }
          50%       { text-shadow: 0 0 30px rgba(139,92,246,0.8), 0 0 60px rgba(139,92,246,0.4); }
        }
        @keyframes gradient-shift {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
        @keyframes shimmer {
          0%   { left: -100%; }
          100% { left: 200%; }
        }
        @keyframes field-appear {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-float-up { animation: float-up linear infinite; }
        .card-animate      { animation: card-in 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .logo-animate      { animation: logo-glow 3s ease-in-out infinite; }
        .field-animate     { animation: field-appear 0.4s ease forwards; }
        .bg-animate {
          background: linear-gradient(135deg, #0f0a1e, #1a0a2e, #0a0f1e, #1a1040);
          background-size: 400% 400%;
          animation: gradient-shift 10s ease infinite;
        }
        .glass-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .field-focused { border-color: #8b5cf6 !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.2) !important; }
        .field-error   { border-color: #f87171 !important; box-shadow: 0 0 0 3px rgba(248,113,113,0.15) !important; }
        .glow-btn {
          background: linear-gradient(135deg, #7c3aed, #6d28d9, #5b21b6);
          position: relative; overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(124,58,237,0.4);
        }
        .glow-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(124,58,237,0.6);
        }
        .glow-btn:active:not(:disabled) { transform: translateY(0px); }
        .glow-btn::after {
          content: ''; position: absolute;
          top: -50%; left: -100%; width: 60%; height: 200%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: skewX(-20deg);
          animation: shimmer 2.5s infinite;
        }
        .input-custom {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          color: #e2e8f0 !important;
          transition: all 0.25s ease !important;
          border-radius: 10px !important;
        }
        .input-custom::placeholder { color: rgba(148,163,184,0.5) !important; }
        .input-custom:focus { outline: none !important; }
        .divider-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent);
        }
        .feature-tag {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 99px;
          background: rgba(139,92,246,0.1);
          border: 1px solid rgba(139,92,246,0.25);
          color: #a78bfa; font-size: 0.72rem; font-weight: 600;
        }
      `}</style>

      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-animate">
        {/* Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div style={{
            position: 'absolute', top: '10%', right: '12%',
            width: '320px', height: '320px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)',
            filter: 'blur(40px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '15%', left: '8%',
            width: '260px', height: '260px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)',
            filter: 'blur(40px)',
          }} />
          <div style={{
            position: 'absolute', top: '60%', left: '60%',
            width: '180px', height: '180px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.1), transparent 70%)',
            filter: 'blur(30px)',
          }} />
        </div>

        <FloatingParticles />

        {/* Card */}
        <div
          className={`glass-card rounded-2xl p-8 w-full max-w-md relative z-10 ${mounted ? 'card-animate' : 'opacity-0'}`}
        >
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 900, color: 'white',
                boxShadow: '0 4px 14px rgba(124,58,237,0.5)',
              }}>
                {'{ }'}
              </div>
            </div>
            <h1
              className="logo-animate"
              style={{
                fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #a78bfa, #60a5fa, #34d399)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}
            >
              CodeJudge
            </h1>
            <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: '0.875rem', marginTop: '4px' }}>
              Join thousands of competitive coders
            </p>

            {/* Feature tags */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span className="feature-tag">⚡ 500+ Problems</span>
              <span className="feature-tag">🤖 AI Tutor</span>
              <span className="feature-tag">🏆 Leaderboard</span>
            </div>
          </div>

          <div className="divider-line mb-6" />

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* First Name */}
            <div style={{ marginBottom: '18px' }} className="field-animate">
              <label style={{ display: 'block', color: 'rgba(148,163,184,0.9)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.5)', pointerEvents: 'none' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="John Doe"
                  style={{ paddingLeft: '40px', height: '48px', width: '100%' }}
                  className={`input-custom input ${errors.firstName ? 'field-error' : focusedField === 'name' ? 'field-focused' : ''}`}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  {...register('firstName')}
                />
              </div>
              {errors.firstName && (
                <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>✕</span> {errors.firstName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="field-animate" style={{ animationDelay: '0.05s', marginBottom: '18px' }}>
              <label style={{ display: 'block', color: 'rgba(148,163,184,0.9)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.5)', pointerEvents: 'none' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  style={{ paddingLeft: '40px', height: '48px', width: '100%' }}
                  className={`input-custom input ${errors.emailId ? 'field-error' : focusedField === 'email' ? 'field-focused' : ''}`}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  {...register('emailId')}
                />
              </div>
              {errors.emailId && (
                <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>✕</span> {errors.emailId.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="field-animate" style={{ animationDelay: '0.1s', marginBottom: '26px' }}>
              <label style={{ display: 'block', color: 'rgba(148,163,184,0.9)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.5)', pointerEvents: 'none' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  style={{ paddingLeft: '40px', paddingRight: '44px', height: '48px', width: '100%' }}
                  className={`input-custom input ${errors.password ? 'field-error' : focusedField === 'password' ? 'field-focused' : ''}`}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: 'rgba(148,163,184,0.6)', background: 'none', border: 'none', cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(148,163,184,0.6)'}
                >
                  {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
              {errors.password ? (
                <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>✕</span> {errors.password.message}
                </p>
              ) : (
                <PasswordStrengthBar password={passwordValue} />
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="glow-btn w-full btn border-0"
              style={{
                height: '50px', borderRadius: '12px', color: 'white',
                fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.02em',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="loading loading-spinner loading-sm" />
                  Creating account…
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Create Account
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          <div className="divider-line mt-6 mb-5" />

          {/* Login link */}
          <p style={{ textAlign: 'center', color: 'rgba(148,163,184,0.7)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <NavLink
              to="/login"
              style={{
                color: '#a78bfa', fontWeight: 600, textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#c4b5fd'}
              onMouseLeave={e => e.currentTarget.style.color = '#a78bfa'}
            >
              Sign In →
            </NavLink>
          </p>

          {/* Terms note */}
          <p style={{ textAlign: 'center', color: 'rgba(100,116,139,0.6)', fontSize: '0.7rem', marginTop: '14px' }}>
            By signing up, you agree to our Terms of Service &amp; Privacy Policy
          </p>
        </div>
      </div>
    </>
  );
}

export default Signup;
