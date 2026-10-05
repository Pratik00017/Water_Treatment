import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, ErrorState } from '../components/common/UI';
import { signupUser } from '../services/api';

export default function Signup() {
  const [f, setF] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');

    if (f.password !== f.confirmPassword) {
      setErr('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await signupUser({
        name: f.name,
        email: f.email,
        password: f.password
      });

      setErr('Account created successfully. Please login.');
    } catch (x) {
      setErr(x.userMessage || x.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-overlay">
          <div className="brand-lockup">
            <div className="brand-mark">💧</div>

            <div>
              <strong>
                Aqua<span>XAI</span>
              </strong>

              <small>AI-Powered Water Quality Analysis</small>
            </div>
          </div>

          <div className="hero-copy">
            <p className="eyebrow">AQUAXAI</p>

            <h1>Join AquaXAI</h1>

            <p>
              Smarter water analysis for a cleaner future.
            </p>
          </div>
        </div>
      </div>

      <div className="auth-card-wrap">
        <div className="auth-card">

          <div className="mobile-auth-brand">
            <div className="brand-mark">💧</div>

            <strong>
              Aqua<span>XAI</span>
            </strong>
          </div>

          <div className="auth-heading">
            <h2>Create Account</h2>
            <p>Set up your AquaXAI workspace</p>
          </div>

          {err && <ErrorState message={err} />}

          <form onSubmit={submit} className="form-stack">

            <label>
              Full Name

              <input
                required
                value={f.name}
                onChange={(e) =>
                  setF({ ...f, name: e.target.value })
                }
              />
            </label>

            <label>
              Email Address

              <input
                required
                type="email"
                value={f.email}
                onChange={(e) =>
                  setF({ ...f, email: e.target.value })
                }
              />
            </label>

            <label>
              Password

              <input
                required
                type="password"
                value={f.password}
                onChange={(e) =>
                  setF({ ...f, password: e.target.value })
                }
              />
            </label>

            <label>
              Confirm Password

              <input
                required
                type="password"
                value={f.confirmPassword}
                onChange={(e) =>
                  setF({
                    ...f,
                    confirmPassword: e.target.value
                  })
                }
              />
            </label>

            <Button type="submit" loading={loading}>
              Sign Up
            </Button>

          </form>

          <p className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Login</Link>
          </p>

        </div>
      </div>
    </div>
  );
}