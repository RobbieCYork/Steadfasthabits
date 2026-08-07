import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GrowthMark } from '../components/Avatar';
import { QuoteCard } from '../components/QuoteCard';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  async function submit() {
    setError(null);
    if (!email.trim() || !password) return setError('Enter your email and password.');
    if (mode === 'signup' && !name.trim()) return setError('Tell us your name.');
    setSubmitting(true);
    const err = mode === 'signin' ? await signIn(email.trim(), password) : await signUp(email.trim(), password, name.trim());
    setSubmitting(false);
    if (err) return setError(err);
    if (mode === 'signup') setSignupDone(true);
  }

  return (
    <div className="wrap">
      <div className="hero">
        <div className="growth-motif">
          <GrowthMark size={64} />
        </div>
        <h1>Steadfast</h1>
        <p>Build habits that compound. Track streaks solo, or invite family and friends into a friendly points competition — one small day at a time.</p>
      </div>

      <div className="auth-card card">
        <div className="auth-toggle">
          <button className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setError(null); setSignupDone(false); }}>
            Sign In
          </button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(null); setSignupDone(false); }}>
            Create Account
          </button>
        </div>

        {signupDone ? (
          <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
            Check your email to confirm your account, then sign in. (If email confirmation is off for this project, you're already signed in — head back to Sign In.)
          </p>
        ) : (
          <>
            {error && <div className="auth-error">{error}</div>}
            {mode === 'signup' && (
              <div className="field">
                <label>Name</label>
                <input type="text" placeholder="e.g. Robbie" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </div>
            <button className="btn btn-primary btn-block" onClick={submit} disabled={submitting}>
              {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </>
        )}
      </div>

      <QuoteCard style={{ maxWidth: 520, margin: '46px auto 0' }} />
    </div>
  );
}
