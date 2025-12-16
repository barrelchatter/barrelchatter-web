import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import styles from '../styles/RegisterPage.module.scss';

function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pre-fill token from URL if present (?token=xxx)
  const initialToken = searchParams.get('token') || '';

  const [form, setForm] = useState({
    token: initialToken,
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Token validation state
  const [tokenStatus, setTokenStatus] = useState(null); // null | 'valid' | 'invalid' | 'expired'
  const [tokenInfo, setTokenInfo] = useState(null); // { email, role, expires_at }
  const [validatingToken, setValidatingToken] = useState(false);

  // Validate token when it changes
  useEffect(() => {
    const token = form.token.trim();
    if (!token || token.length < 10) {
      setTokenStatus(null);
      setTokenInfo(null);
      return;
    }

    let cancelled = false;

    async function validateToken() {
      setValidatingToken(true);
      try {
        const res = await api.get(`/v1/auth/invite/${token}`);
        if (cancelled) return;

        const data = res.data;
        if (data.valid) {
          setTokenStatus('valid');
          setTokenInfo({
            email: data.email,
            role: data.role,
            expires_at: data.expires_at,
          });
          // Pre-fill email if provided by token
          if (data.email) {
            setForm((prev) => ({ ...prev, email: data.email }));
          }
        } else {
          setTokenStatus(data.expired ? 'expired' : 'invalid');
          setTokenInfo(null);
        }
      } catch (err) {
        if (cancelled) return;
        const status = err?.response?.status;
        if (status === 404 || status === 400) {
          setTokenStatus('invalid');
        } else if (status === 410) {
          setTokenStatus('expired');
        } else {
          // Network error or other - don't block, just clear status
          setTokenStatus(null);
        }
        setTokenInfo(null);
      } finally {
        if (!cancelled) setValidatingToken(false);
      }
    }

    const debounce = setTimeout(validateToken, 400);
    return () => {
      cancelled = true;
      clearTimeout(debounce);
    };
  }, [form.token]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.token.trim()) {
      setError('Invite token is required.');
      return;
    }
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!form.email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!form.password) {
      setError('Password is required.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/v1/auth/register', {
        token: form.token.trim(),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      setSuccess(true);

      // Redirect to login after short delay
      setTimeout(() => {
        navigate('/login', { state: { registered: true } });
      }, 2000);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Registration failed. Please check your invite token and try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>BarrelChatter</h1>
          <div className={styles.successBox}>
            <p className={styles.successText}>
              Account created successfully!
            </p>
            <p className={styles.successSubtext}>
              Redirecting you to sign in...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>BarrelChatter</h1>
        <p className={styles.subtitle}>Create your account</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Invite Token *
            <input
              className={styles.input}
              type="text"
              name="token"
              value={form.token}
              onChange={handleChange}
              placeholder="Paste your invite token"
              autoComplete="off"
            />
            {validatingToken && (
              <span className={styles.tokenHint}>Validating...</span>
            )}
            {!validatingToken && tokenStatus === 'valid' && (
              <span className={styles.tokenValid}>
                ✓ Valid invite
                {tokenInfo?.role && ` (${tokenInfo.role})`}
              </span>
            )}
            {!validatingToken && tokenStatus === 'invalid' && (
              <span className={styles.tokenInvalid}>
                ✗ Invalid or already used token
              </span>
            )}
            {!validatingToken && tokenStatus === 'expired' && (
              <span className={styles.tokenInvalid}>
                ✗ This invite has expired
              </span>
            )}
          </label>

          <label className={styles.label}>
            Full Name *
            <input
              className={styles.input}
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              autoComplete="name"
            />
          </label>

          <label className={styles.label}>
            Email *
            <input
              className={styles.input}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={tokenInfo?.email}
            />
            {tokenInfo?.email && (
              <span className={styles.tokenHint}>
                Email is set by your invite
              </span>
            )}
          </label>

          <label className={styles.label}>
            Password *
            <input
              className={styles.input}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </label>

          <label className={styles.label}>
            Confirm Password *
            <input
              className={styles.input}
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
          </label>

          <button
            className={styles.button}
            type="submit"
            disabled={submitting || tokenStatus === 'invalid' || tokenStatus === 'expired'}
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className={styles.hint}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>
            Sign in
          </Link>
        </p>

        <p className={styles.hintSmall}>
          BarrelChatter is currently invite-only. Contact an admin if you
          need an invite.
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;