import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import logo from '../assets/spartanbtylogo.webp';
import loginBg from '../assets/login-bg.jpg';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaArrowRight, FaShieldAlt, FaUserTie, FaChartLine } from "react-icons/fa";

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login({ email, password });
      if (result.success) {
        navigate('/dashboard'); // Redirect to dashboard after successful login
      } else {
        setError(result.error || 'Login failed. Try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .login-card {
          animation: fadeUp 0.6s ease-out;
        }
        
        .login-left-section {
          animation: slideInLeft 0.6s ease-out 0.1s both;
        }
        
        .login-right-section {
          animation: slideInRight 0.6s ease-out 0.2s both;
        }
        
        .login-input:focus {
          border-color: #c24060 !important;
          box-shadow: 0 0 0 3px rgba(194, 64, 96, 0.1) !important;
        }
        
        .login-button:hover {
          background-color: #a83550 !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(194, 64, 96, 0.3) !important;
        }
        
        @media (max-width: 768px) {
          .login-card {
            flex-direction: column !important;
            max-width: 400px !important;
          }
          .login-left-section {
            display: none !important;
          }
          .login-right-section {
            padding: 40px 30px !important;
          }
          .login-welcome-title {
            display: none !important;
          }
          .login-welcome-subtitle {
            font-size: 14px !important;
            margin-bottom: 30px !important;
          }
          .login-features {
            gap: 16px !important;
          }
          .login-feature-icon {
            width: 40px !important;
            height: 40px !important;
            font-size: 18px !important;
          }
          .login-feature-text {
            font-size: 14px !important;
          }
          .login-brand-title {
            margin-bottom: 20px !important;
          }
          .login-logo-header {
            margin-bottom: 20px !important;
          }
          .login-logo {
            width: 40px !important;
          }
          .login-title {
            font-size: 28px !important;
          }
          .login-subtitle {
            font-size: 13px !important;
            margin-bottom: 24px !important;
          }
          .login-form {
            gap: 16px !important;
          }
          .login-input {
            padding: 12px 16px 12px 44px !important;
            font-size: 14px !important;
          }
          .login-input-icon {
            left: 14px !important;
            font-size: 16px !important;
          }
          .login-eye-icon {
            right: 14px !important;
            font-size: 16px !important;
          }
          .login-button {
            padding: 12px !important;
            font-size: 15px !important;
          }
          .login-back-link {
            margin-top: 20px !important;
          }
          .login-account-note {
            margin-top: 20px !important;
            padding-top: 20px !important;
          }
          .login-note-text {
            font-size: 12px !important;
          }
        }
      `}</style>
      <div style={{...styles.card}} className="login-card">
        {/* Left Section - Brand Info */}
        <div style={styles.leftSection} className="login-left-section">
          <div style={styles.leftContent}>
            <h2 style={styles.brandTitle} className="login-brand-title">SPARTAN BTY INC.</h2>
            <h1 style={styles.welcomeTitle} className="login-welcome-title">Welcome back!</h1>
            <p style={styles.welcomeSubtitle} className="login-welcome-subtitle">Sign in to continue to your Spartan BTY Inc. account</p>
            
            <div style={styles.features} className="login-features">
              <div style={styles.feature}>
                <div style={styles.featureIcon} className="login-feature-icon">
                  <FaShieldAlt />
                </div>
                <div style={styles.featureContent}>
                  <span style={styles.featureText} className="login-feature-text">Secure Access</span>
                  <span style={styles.featureDescription}>Your data is protected</span>
                </div>
              </div>
              <div style={styles.feature}>
                <div style={styles.featureIcon} className="login-feature-icon">
                  <FaUserTie />
                </div>
                <div style={styles.featureContent}>
                  <span style={styles.featureText} className="login-feature-text">Employee Portal</span>
                  <span style={styles.featureDescription}>Access your workspace</span>
                </div>
              </div>
              <div style={styles.feature}>
                <div style={styles.featureIcon} className="login-feature-icon">
                  <FaChartLine />
                </div>
                <div style={styles.featureContent}>
                  <span style={styles.featureText} className="login-feature-text">Stay Productive</span>
                  <span style={styles.featureDescription}>Tools to help you succeed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div style={styles.rightSection} className="login-right-section">
          <div style={styles.rightContent}>
            <div style={styles.logoHeader} className="login-logo-header">
              <img src={logo} alt="Spartan BTY Logo" style={styles.logo} className="login-logo" />
            </div>

            <h1 style={styles.loginTitle} className="login-title">Login</h1>
            <p style={styles.loginSubtitle} className="login-subtitle">Enter your credentials to access your account</p>

            <form onSubmit={handleLogin} style={styles.form} className="login-form">
              {error && <div style={styles.error}>{error}</div>}

              <div style={styles.inputGroup}>
                <div style={styles.inputWrapper}>
                  <FaEnvelope style={styles.inputIcon} className="login-input-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input} className="login-input"
                    placeholder="Email Address"
                    required
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <div style={styles.inputWrapper}>
                  <FaLock style={styles.inputIcon} className="login-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input} className="login-input"
                    placeholder="Password"
                    required
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon} className="login-eye-icon"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                style={loading ? styles.buttonDisabled : styles.button}
                className="login-button"
                disabled={loading}
              >
                {loading ? 'Logging in...' : (
                  <span style={styles.buttonContent}>
                    Login <FaArrowRight style={styles.buttonArrow} />
                  </span>
                )}
              </button>
            </form>

            <div style={styles.backLink} className="login-back-link">
              <span onClick={() => navigate('/')} style={styles.backLinkText}>
                ← Back to Website
              </span>
            </div>

            <div style={styles.accountNote} className="login-account-note">
              <div style={styles.accountNoteContent}>
                <FaUserTie style={styles.accountIcon} />
                <p style={styles.noteText} className="login-note-text">
                  Don't have an account? Contact your HR department to request access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'Segoe UI, sans-serif',
    padding: '20px',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '600px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    display: 'flex',
    overflow: 'hidden',
  },

  leftSection: {
    flex: 1,
    backgroundImage: `linear-gradient(135deg, rgba(194, 64, 96, 0.85) 0%, rgba(168, 53, 80, 0.85) 100%), url(${loginBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    padding: '40px 50px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  leftContent: {
    position: 'relative',
    zIndex: 1,
  },

  brandTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    margin: '0 0 24px 0',
    letterSpacing: '2px',
  },

  welcomeTitle: {
    fontSize: '42px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 16px 0',
    lineHeight: '1.2',
  },

  welcomeSubtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.85)',
    margin: '0 0 32px 0',
    lineHeight: '1.6',
  },

  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },

  featureIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '20px',
  },

  featureText: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#ffffff',
    display: 'block',
  },

  featureContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  featureDescription: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
  },

  rightSection: {
    flex: 1,
    padding: '40px 50px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },

  rightContent: {
    maxWidth: '400px',
  },

  logoHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    marginTop: '30px',
  },

  logo: {
    width: '100px',
    height: 'auto',
  },

  logoTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1c0e14',
    margin: 0,
    textAlign: 'center',
  },

  loginTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1c0e14',
    margin: '0 0 8px 0',
  },

  loginSubtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 32px 0',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  inputWrapper: {
    position: 'relative',
    display: 'flex',
  },

  inputIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#999',
    fontSize: '18px',
  },

  input: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    borderRadius: '10px',
    border: '1.5px solid #e5d3d9',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },

  eyeIcon: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    cursor: 'pointer',
    color: '#999',
    fontSize: '18px',
  },

  button: {
    padding: '14px',
    backgroundColor: '#c24060',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background-color 0.2s ease',
  },

  buttonDisabled: {
    padding: '14px',
    backgroundColor: '#d4a0a8',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'not-allowed',
    marginTop: '8px',
  },

  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },

  buttonArrow: {
    fontSize: '14px',
  },

  error: {
    backgroundColor: '#fff5f6',
    color: '#c24060',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center',
    border: '1px solid #fecdd3',
    fontWeight: '500',
  },

  backLink: {
    textAlign: 'center',
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #eee',
    borderBottom: '1px solid #eee',
    paddingBottom: '24px',
  },

  backLinkText: {
    color: '#c24060',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
  },

  accountNote: {
    marginTop: '24px',
    backgroundColor: '#fff5f6',
    borderRadius: '12px',
    padding: '20px',
  },

  accountNoteContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  accountIcon: {
    color: '#c24060',
    fontSize: '20px',
  },

  noteText: {
    color: '#666',
    fontSize: '13px',
    margin: 0,
    lineHeight: '1.5',
  },
};

export default Login;