import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Github,
  Mail,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, ErrorState } from '../components/common/UI';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login success animation
  const [showWaterAnimation, setShowWaterAnimation] = useState(false);
  const [animationSuccess, setAnimationSuccess] = useState(false);

  const { login } = useAuth();

  const submit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError('');
    setLoading(true);

    try {
      // =====================================================
      // REAL BACKEND LOGIN
      // =====================================================

      const response = await loginUser(form);

      const user =
        response.data?.user ||
        response.data;

      // Preserve existing authentication
      login(user);

      // =====================================================
      // START WATER SUCCESS ANIMATION
      // =====================================================

      setShowWaterAnimation(true);

      // After the water impact begins
      setTimeout(() => {
        setAnimationSuccess(true);
      }, 1900);

      // Redirect after animation
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 3600);

    } catch (err) {
      setLoading(false);

      const detail =
        err.response?.data?.detail;

      let message =
        'Login failed. Please check your email and password.';

      if (Array.isArray(detail)) {
        message = detail
          .map((item) => {
            if (typeof item === 'string') {
              return item;
            }

            return (
              item?.msg ||
              item?.message ||
              'Invalid login details.'
            );
          })
          .join(' | ');
      } else if (typeof detail === 'string') {
        message = detail;
      } else if (
        typeof err.userMessage === 'string'
      ) {
        message = err.userMessage;
      }

      setError(message);
    }
  };

  return (
    <div className="auth-page">

      {/* =====================================================
          REALISTIC LOGIN SUCCESS WATER ANIMATION
      ====================================================== */}

      {showWaterAnimation && (
        <div className="login-water-transition">

          {/* Photorealistic generated water scene */}
          <img
            src="/login-success-water.png"
            alt=""
            className="login-water-image"
          />

          {/* Cinematic overlay */}
          <div className="login-water-shade"></div>

          {/* Soft light */}
          <div className="login-water-glow"></div>

          {/* Expanding impact ripples */}
          <div className="login-impact-ripple ripple-1"></div>
          <div className="login-impact-ripple ripple-2"></div>
          <div className="login-impact-ripple ripple-3"></div>

          {/* Additional water droplets */}
          <span className="login-splash-drop splash-drop-1"></span>
          <span className="login-splash-drop splash-drop-2"></span>
          <span className="login-splash-drop splash-drop-3"></span>
          <span className="login-splash-drop splash-drop-4"></span>
          <span className="login-splash-drop splash-drop-5"></span>

          {/* Center message */}
          <div className="login-water-content">

            <div className="login-water-brand">
              Aqua<span>XAI</span>
            </div>

            <div className="login-water-subtitle">
              AI-Powered Water Quality Analysis
            </div>

            <div className="login-water-progress">
              <span></span>
            </div>

            {!animationSuccess ? (
              <>
                <h2>
                  Signing you in...
                </h2>

                <p>
                  Preparing your AquaXAI dashboard
                </p>
              </>
            ) : (
              <>
                <div className="login-success-circle">
                  ✓
                </div>

                <h2>
                  Login successful
                </h2>

                <p>
                  Welcome to AquaXAI
                </p>
              </>
            )}

          </div>
        </div>
      )}

      {/* =====================================================
          ORIGINAL LOGIN PAGE
      ====================================================== */}

      <div className="auth-visual">

        <div className="auth-overlay">

          <div className="brand-lockup">

            <div className="brand-mark">
              💧
            </div>

            <div>
              <strong>
                Aqua<span>XAI</span>
              </strong>

              <small>
                AI-Powered Water Quality Analysis
              </small>
            </div>

          </div>

          <div className="hero-copy">

            <p className="eyebrow">
              WATER INTELLIGENCE
            </p>

            <h1>
              Clean Water
              <br />
              Brighter Tomorrow
            </h1>

            <p>
              Analyze water quality using AI and make
              data-driven decisions for a safer and
              healthier environment.
            </p>

            <div className="benefits">
              <span>AI Analysis</span>
              <span>Safer Communities</span>
              <span>Sustainable Future</span>
            </div>

          </div>

        </div>

      </div>

      <div className="auth-card-wrap">

        <div className="auth-card">

          <div className="mobile-auth-brand">

            <div className="brand-mark">
              💧
            </div>

            <strong>
              Aqua<span>XAI</span>
            </strong>

          </div>

          <div className="auth-heading">

            <h2>
              Welcome Back
            </h2>

            <p>
              Login to continue to AquaXAI
            </p>

          </div>

          {error && (
            <ErrorState message={error} />
          )}

          <form
            onSubmit={submit}
            className="form-stack"
          >

            {/* EMAIL */}

            <label>
              Email address

              <input
                type="email"
                required
                autoComplete="email"
                placeholder="pratik@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
              />
            </label>

            {/* PASSWORD */}

            <label>
              Password

              <div className="password-field">

                <input
                  type={
                    show
                      ? 'text'
                      : 'password'
                  }
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                />

                <button
                  type="button"
                  aria-label={
                    show
                      ? 'Hide password'
                      : 'Show password'
                  }
                  onClick={() =>
                    setShow((value) => !value)
                  }
                >
                  {show ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>

              </div>
            </label>

            {/* OPTIONS */}

            <div className="form-row">

              <label className="check">

                <input type="checkbox" />

                Remember me

              </label>

              <Link to="/forgot-password">
                Forgot password?
              </Link>

            </div>

            {/* LOGIN */}

            <Button
              type="submit"
              loading={loading && !showWaterAnimation}
              disabled={loading}
            >
              Login
            </Button>

          </form>

          {/* DIVIDER */}

          <div className="divider">
            <span>
              or continue with
            </span>
          </div>

          {/* SOCIAL */}

          <div className="social-row">

            <button type="button">
              <Mail size={17} />
              Google
            </button>

            <button type="button">
              <Github size={17} />
              GitHub
            </button>

            <button type="button">
              <span className="microsoft-icon">
                M
              </span>
              Microsoft
            </button>

          </div>

          {/* SIGN UP */}

          <p className="auth-footer">

            Don't have an account?{' '}

            <Link to="/signup">
              Sign up
            </Link>

          </p>

        </div>

      </div>

    </div>
  );
}