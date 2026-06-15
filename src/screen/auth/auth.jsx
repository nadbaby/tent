import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, Award, Eye, EyeOff, MessageCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { auth, googleProvider, db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import fineLogo from '../../assets/Fine LOGO.png';
import './auth.css';

const Auth = () => {
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const redirectPath = queryParams.get('redirect') || '/';

  // Navigation State
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'

  useEffect(() => {
    const authStatus = localStorage.getItem('isAdminAuthenticated');
    if (authStatus === 'true') {
      navigate('/');
    }
  }, [navigate]);

  // Handle Firebase Email Link Callback
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let emailForLink = window.localStorage.getItem('emailForSignIn');
      if (!emailForLink) {
        emailForLink = window.prompt('Please provide your email for confirmation');
      }

      setIsLoading(true);
      signInWithEmailLink(auth, emailForLink, window.location.href)
        .then(async (result) => {
          window.localStorage.removeItem('emailForSignIn');
          const idToken = await result.user.getIdToken();
          await syncUserWithBackend(idToken);
          setSuccessMsg('Email login successful! Redirecting...');
          setTimeout(() => window.location.href = redirectPath, 1500);
        })
        .catch((error) => {
          console.error("Email link error:", error);
          setErrorMsg('Failed to sign in with link. It may have expired.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [navigate, redirectPath]);

  // Helper: Sync User with MongoDB
  const syncUserWithBackend = async (idToken, extraData = {}) => {
    try {
      const res = await fetch(apiUrl('/api/auth/sync'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(extraData)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', idToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        const role = data.user.role?.toLowerCase() || 'user';
        localStorage.setItem('role', role);
        localStorage.setItem('isAdminAuthenticated', role === 'admin' ? 'true' : 'false');
        return data.user;
      }
    } catch (err) {
      console.error("Sync error:", err);
      return { error: err.message };
    }
    return null;
  };



  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' | 'phone'

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isEmailLinkSent, setIsEmailLinkSent] = useState(false);
  const [isEmailVerificationRequired, setIsEmailVerificationRequired] = useState(false);

  // Spam Protection State
  const [honeypot, setHoneypot] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState({ num1: 0, num2: 0 });
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion({ num1, num2 });
    setCaptchaAnswer('');
    setCaptchaError(false);
  };

  useEffect(() => {
    generateCaptcha();
  }, [authMode, loginMethod]);

  const handleModeChange = (mode) => {
    setAuthMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
    setIsOtpSent(false);
  };

  // ─── Twilio: Phone OTP Login ─────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone) return setErrorMsg('Please enter a valid phone number');

    if (honeypot) {
      setErrorMsg('Verification failed. Please try again.');
      return;
    }
    if (parseInt(captchaAnswer) !== captchaQuestion.num1 + captchaQuestion.num2) {
      setErrorMsg('Please solve the math puzzle correctly.');
      setCaptchaError(true);
      generateCaptcha();
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(apiUrl('/api/auth/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsOtpSent(true);
        setSuccessMsg('OTP sent successfully!');
      } else {
        setErrorMsg(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setErrorMsg('Server error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return setErrorMsg('Please enter the 6-digit OTP');

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(apiUrl('/api/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('role', 'user');
        localStorage.setItem('isAdminAuthenticated', 'false');
        setSuccessMsg('Login successful! Redirecting...');
        setTimeout(() => window.location.href = redirectPath, 1000);
      } else {
        setErrorMsg(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setErrorMsg('Server error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Twilio: Phone OTP Signup ─────────────────────────────────────
  const handleSendSignupOtp = async (e) => {
    e.preventDefault();
    if (!phone) return setErrorMsg('Please enter a valid phone number');
    if (!name) return setErrorMsg('Please enter your full name');

    if (honeypot) {
      setErrorMsg('Verification failed. Please try again.');
      return;
    }
    if (parseInt(captchaAnswer) !== captchaQuestion.num1 + captchaQuestion.num2) {
      setErrorMsg('Please solve the math puzzle correctly.');
      setCaptchaError(true);
      generateCaptcha();
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(apiUrl('/api/auth/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsOtpSent(true);
        setSuccessMsg('OTP sent successfully!');
      } else {
        setErrorMsg(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setErrorMsg('Server error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignupOtp = async (e) => {
    e.preventDefault();
    if (!otp) return setErrorMsg('Please enter the 6-digit OTP');

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(apiUrl('/api/auth/register-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, name, company, gstNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('role', 'user');
        localStorage.setItem('isAdminAuthenticated', 'false');
        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => window.location.href = redirectPath, 1000);
      } else {
        setErrorMsg(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setErrorMsg('Server error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Firebase: Login ──────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (honeypot) {
      setErrorMsg('Verification failed. Please try again.');
      return;
    }
    if (parseInt(captchaAnswer) !== captchaQuestion.num1 + captchaQuestion.num2) {
      setErrorMsg('Please solve the math puzzle correctly.');
      setCaptchaError(true);
      generateCaptcha();
      return;
    }

    setIsLoading(true);
    setIsEmailVerificationRequired(false);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = userCredential.user;

      // User's request: Block login until verified and show "Invalid email or password"
      if (!fbUser.emailVerified) {
        // Send/Resend verification email automatically
        try {
          await sendEmailVerification(fbUser);
        } catch (vErr) {
          console.warn("Verification email retry failed:", vErr);
        }

        // Log out immediately to prevent session creation
        await auth.signOut();
        setErrorMsg("Invalid email or password.");
        setIsLoading(false);
        return;
      }

      const idToken = await fbUser.getIdToken();
      const syncedUser = await syncUserWithBackend(idToken);

      if (!syncedUser || syncedUser.error) {
        setErrorMsg(syncedUser?.error || "Failed to sync profile with database. Please try again.");
        setIsLoading(false);
        return;
      }

      setSuccessMsg("Login successful! Redirecting...");
      setTimeout(() => window.location.href = redirectPath, 1000);
    } catch (err) {
      console.error("Auth failed:", err);
      setErrorMsg(friendlyError(err.code || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLinkSend = async (e) => {
    e.preventDefault();
    if (!email) return setErrorMsg('Please enter your email');

    if (honeypot) {
      setErrorMsg('Verification failed. Please try again.');
      return;
    }
    if (parseInt(captchaAnswer) !== captchaQuestion.num1 + captchaQuestion.num2) {
      setErrorMsg('Please solve the math puzzle correctly.');
      setCaptchaError(true);
      generateCaptcha();
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    const actionCodeSettings = {
      url: window.location.origin + '/login?redirect=' + redirectPath,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setIsEmailLinkSent(true);
      setSuccessMsg('Login link sent to your email!');
    } catch (error) {
      setErrorMsg(friendlyError(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return setErrorMsg('Please enter your email to reset password');
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('Password reset link sent to your email!');
    } catch (error) {
      setErrorMsg(friendlyError(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (auth.currentUser) {
      setIsLoading(true);
      try {
        await sendEmailVerification(auth.currentUser);
        setSuccessMsg('Verification email resent!');
      } catch (error) {
        setErrorMsg(friendlyError(error.code));
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ─── Firebase: Email/Password Signup ─────────────────────────────────────
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!termsAccepted) {
      setErrorMsg('Please accept the Terms of Service to continue.');
      return;
    }

    if (honeypot) {
      setErrorMsg('Verification failed. Please try again.');
      return;
    }
    if (parseInt(captchaAnswer) !== captchaQuestion.num1 + captchaQuestion.num2) {
      setErrorMsg('Please solve the math puzzle correctly.');
      setCaptchaError(true);
      generateCaptcha();
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create in Firebase
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = credential.user;
      await updateProfile(fbUser, { displayName: name });

      // 2. Sync with MongoDB
      const idToken = await fbUser.getIdToken();
      const syncedUser = await syncUserWithBackend(idToken, {
        name,
        email: email.trim(),
        phone: phone.trim(),
        company: company || '',
        gstNumber: gstNumber || ''
      });

      if (!syncedUser) {
        setErrorMsg("Failed to sync profile with database. Account created in Firebase, but MongoDB record failed.");
        setIsLoading(false);
        return;
      }

      // 3. Send Verification Email (don't let it crash the whole process)
      try {
        await sendEmailVerification(fbUser);
        setSuccessMsg('Account created! Verification link sent to your email.');
      } catch (vErr) {
        console.warn("Initial verification email failed:", vErr);
        setSuccessMsg('Account created! (Verification email could not be sent)');
      }

      // 4. Log out so they can't access pages until they verify and log in properly
      await auth.signOut();

      setTimeout(() => navigate('/verify-email'), 2000);
    } catch (err) {
      console.error("Signup failed:", err);
      setErrorMsg(friendlyError(err.code || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const syncedUser = await syncUserWithBackend(idToken, {
        name: result.user.displayName,
        email: result.user.email,
        profilePic: result.user.photoURL
      });

      if (!syncedUser) {
        setErrorMsg("Failed to sync Google profile with database.");
        setIsLoading(false);
        return;
      }

      setSuccessMsg('Signed in with Google! Redirecting…');
      setTimeout(() => window.location.href = redirectPath, 1000);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(friendlyError(err.code));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const friendlyError = (code) => {
    switch (code) {
      case 'auth/email-already-in-use': return 'This email is already registered. Try logging in.';
      case 'auth/invalid-email': return 'Please enter a valid email address.';
      case 'auth/weak-password': return 'Password must be at least 6 characters.';
      case 'auth/user-not-found': return 'No account found with this email.';
      case 'auth/wrong-password': return 'Incorrect password. Please try again.';
      case 'auth/too-many-requests': return 'Too many attempts. Please wait a moment.';
      case 'auth/invalid-credential': return 'Invalid email or password. Please try again.';
      case 'auth/network-request-failed': return 'Network error. Please check your internet connection.';
      case 'auth/popup-closed-by-user': return 'Sign-in popup was closed.';
      default: return `Error (${code || 'unknown'}): Please try again.`;
    }
  };

  const renderSpamProtection = () => (
    <div className="spam-protection-container">
      {/* Honeypot field */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <input
          type="text"
          name="middle_name_verification"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex="-1"
          autoComplete="off"
        />
      </div>

      <div className="captcha-card">
        <div className="captcha-label-row">
          <label className="form-label" style={{ marginBottom: 0 }}>Captcha</label>
          <button
            type="button"
            onClick={generateCaptcha}
            className="captcha-refresh-btn"
            title="Get a new question"
          >
            Refresh
          </button>
        </div>
        <div className="captcha-input-row">
          <div className="captcha-question-box">
            <span>{captchaQuestion.num1} + {captchaQuestion.num2} = </span>
          </div>
          <input
            type="number"
            className={`form-input captcha-input ${captchaError ? 'captcha-error-border' : ''}`}
            placeholder="Answer"
            value={captchaAnswer}
            onChange={(e) => {
              setCaptchaAnswer(e.target.value);
              setCaptchaError(false);
            }}
            required
          />
        </div>
        <p className="captcha-hint">Solve this question to verify you are human.</p>
      </div>
    </div>
  );

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="desktop-back-btn"
        >
          <ArrowLeft size={18} />
          Back to Home
        </button>
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <img src={fineLogo} alt="Fine Bearing Logo" className="logo-image" style={{ height: '50px' }} />
          </div>
          <h1>Industrial Solutions You Can Trust</h1>
          <p className="subtitle">
            Access genuine bearings, seals, hydraulics, and machinery components with fast support and reliable sourcing.
          </p>
          <ul className="auth-trust-list">
            <li className="auth-trust-item"><Award size={14} strokeWidth={2.5} /> Genuine Industrial Brands</li>
            <li className="auth-trust-item"><Clock size={14} strokeWidth={2.5} /> Fast Inquiry Support</li>
            <li className="auth-trust-item"><ShieldCheck size={14} strokeWidth={2.5} /> Trusted Quality & Supply</li>
          </ul>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mobile-back-btn"
          >
            <ArrowLeft size={18} />
            Back to Home
          </button>
          <div className="auth-tabs" data-mode={authMode}>
            <button className={`auth-tab ${authMode === 'login' ? 'active' : ''}`} onClick={() => handleModeChange('login')}>Log In</button>
            <button className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`} onClick={() => handleModeChange('signup')}>Sign Up</button>
          </div>

          {errorMsg && <div className="auth-alert auth-alert-error">{errorMsg}</div>}
          {successMsg && <div className="auth-alert auth-alert-success">{successMsg}</div>}

          {authMode === 'login' ? (
            <>
              <div className="auth-header">
                <h2>Welcome Back</h2>
                <p>Login to access products, pricing, and business inquiries.</p>
              </div>

              <div className="auth-method-toggle" style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`method-btn ${loginMethod === 'email' ? 'active' : ''}`}
                  onClick={() => { setLoginMethod('email'); setIsOtpSent(false); }}
                  style={{ flex: 1, padding: '8px', minWidth: '80px', borderRadius: '8px', border: '1px solid #e2e8f0', background: loginMethod === 'email' ? '#1e293b' : 'white', color: loginMethod === 'email' ? 'white' : '#64748b', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                >
                  Password
                </button>
                <button
                  type="button"
                  className={`method-btn ${loginMethod === 'link' ? 'active' : ''}`}
                  onClick={() => { setLoginMethod('link'); setIsOtpSent(false); }}
                  style={{ flex: 1, padding: '8px', minWidth: '80px', borderRadius: '8px', border: '1px solid #e2e8f0', background: loginMethod === 'link' ? '#1e293b' : 'white', color: loginMethod === 'link' ? 'white' : '#64748b', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                >
                  Email Link
                </button>
                <button
                  type="button"
                  className={`method-btn ${loginMethod === 'phone' ? 'active' : ''}`}
                  onClick={() => setLoginMethod('phone')}
                  style={{ flex: 1, padding: '8px', minWidth: '80px', borderRadius: '8px', border: '1px solid #e2e8f0', background: loginMethod === 'phone' ? '#1e293b' : 'white', color: loginMethod === 'phone' ? 'white' : '#64748b', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                >
                  Phone OTP
                </button>
              </div>

              {loginMethod === 'email' ? (
                <form onSubmit={handlePasswordSubmit}>
                  <div className="form-group">
                    <label className="form-label">Email or Username</label>
                    <input type="text" className="form-input" placeholder="Email or Admin Username" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                      <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', cursor: 'pointer' }}>Forgot password?</button>
                    </div>
                    <div className="form-input-wrapper">
                      <input type={showPassword ? 'text' : 'password'} className="form-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                      <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </div>
                    </div>
                  </div>
                  {renderSpamProtection()}
                  <button type="submit" className="btn-submit" disabled={isLoading}>
                    {isLoading ? 'Logging in…' : <><span>Log In</span><ArrowRight size={18} className="btn-icon" /></>}
                  </button>
                </form>
              ) : loginMethod === 'link' ? (
                <form onSubmit={handleEmailLinkSend}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isEmailLinkSent}
                    />
                  </div>
                  {!isEmailLinkSent && renderSpamProtection()}
                  {isEmailLinkSent ? (
                    <div className="auth-alert auth-alert-success" style={{ marginBottom: '1.5rem' }}>
                      Check your email! We sent a secure login link to <strong>{email}</strong>.
                    </div>
                  ) : (
                    <button type="submit" className="btn-submit" disabled={isLoading}>
                      {isLoading ? 'Sending Link…' : <><span>Send Login Link</span><ArrowRight size={18} className="btn-icon" /></>}
                    </button>
                  )}
                  {isEmailLinkSent && (
                    <button type="button" onClick={() => setIsEmailLinkSent(false)} className="btn-submit" style={{ background: '#64748b' }}>
                      Change Email
                    </button>
                  )}
                </form>
              ) : (
                <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp}>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+91XXXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isOtpSent || isLoading}
                      required
                    />
                  </div>

                  {isOtpSent && (
                    <div className="form-group">
                      <label className="form-label">Enter 6-Digit OTP</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="123456"
                        maxLength="6"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                      <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', cursor: 'pointer' }} onClick={handleSendOtp}>
                        Didn't receive code? Resend
                      </p>
                    </div>
                  )}

                  {!isOtpSent && renderSpamProtection()}

                  <button type="submit" className="btn-submit" disabled={isLoading}>
                    {isLoading ? 'Please wait…' : (
                      isOtpSent ?
                        <><span>Verify & Login</span><ArrowRight size={18} className="btn-icon" /></> :
                        <><span>Send OTP</span><ArrowRight size={18} className="btn-icon" /></>
                    )}
                  </button>

                  {isOtpSent && (
                    <button
                      type="button"
                      onClick={() => setIsOtpSent(false)}
                      style={{ width: '100%', background: 'none', border: 'none', color: '#64748b', marginTop: '10px', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Change Phone Number
                    </button>
                  )}
                </form>
              )}
            </>
          ) : (
            <>
              <div className="auth-header">
                <h2>Create Account</h2>
                <p>Join Fine Bearing & Oil Seal Store for exclusive benefits.</p>
              </div>

              <form onSubmit={handleSignupSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="tel" className="form-input" placeholder="+91XXXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name (Optional)</label>
                  <input type="text" className="form-input" placeholder="ACME Corp" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">GST No. (Optional)</label>
                  <input type="text" className="form-input" placeholder="22AAAAA0000A1Z5" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="form-input-wrapper">
                    <input type={showPassword ? 'text' : 'password'} className="form-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                </div>
                <div className="terms-checkbox" style={{ marginBottom: '1.5rem' }}>
                  <label className="checkbox-label" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                    <span style={{ fontSize: '0.8125rem' }}>I agree to the Terms of Service and Privacy Policy.</span>
                  </label>
                </div>
                {renderSpamProtection()}
                <button type="submit" className="btn-submit" disabled={isLoading || !termsAccepted}>
                  {isLoading ? 'Creating Account…' : <><span>Sign Up</span><ArrowRight size={18} className="btn-icon" /></>}
                </button>
              </form>
            </>
          )}

          <div className="auth-divider">or continue with</div>
          <button type="button" className="btn-google" onClick={handleGoogleSignIn} disabled={isLoading}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
