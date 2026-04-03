import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';

// API URL is baked in at build time by Vite from VITE_API_URL env var
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const Login: React.FC = () => {
    const { login, user } = useAuthStore();
    const navigate = useNavigate();
    const [devLoading, setDevLoading] = useState(false);
    const isProduction = import.meta.env.PROD;

    useEffect(() => {
        // Handle the OAuth callback token in query params (?token=...)
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            login(token).then(() => navigate('/'));
        }
    }, [login, navigate]);

    useEffect(() => {
        if (user) navigate('/');
    }, [user, navigate]);

    const handleGoogleLogin = () => {
        window.location.href = `${API_URL}/api/v1/auth/google`;
    };

    const handleDevLogin = async () => {
        setDevLoading(true);
        try {
            const res = await api.post('/api/v1/auth/dev-login', {});
            await login(res.data.accessToken);
            navigate('/');
        } catch (err) {
            console.error('Dev login failed', err);
        } finally {
            setDevLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', -apple-system, sans-serif",
            padding: '1rem',
        }}>
            {/* Animated background orbs */}
            <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute', width: 400, height: 400, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
                    top: '-10%', left: '-10%', animation: 'float 8s ease-in-out infinite',
                }} />
                <div style={{
                    position: 'absolute', width: 300, height: 300, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
                    bottom: '-5%', right: '5%', animation: 'float 10s ease-in-out infinite reverse',
                }} />
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                @keyframes float {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-20px) scale(1.05); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .login-card { animation: fadeInUp 0.6s ease-out; }
                .google-btn:hover { background: rgba(255,255,255,0.18) !important; transform: translateY(-1px); box-shadow: 0 8px 30px rgba(99,102,241,0.4) !important; }
                .google-btn:active { transform: translateY(0); }
                .dev-btn:hover { background: rgba(99,102,241,0.25) !important; }
            `}</style>

            <div className="login-card" style={{
                width: '100%',
                maxWidth: 420,
                background: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 24,
                padding: '2.5rem 2rem',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                textAlign: 'center',
            }}>
                {/* Logo / Icon */}
                <div style={{
                    width: 64, height: 64, borderRadius: 18,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    margin: '0 auto 1.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(99,102,241,0.5)',
                    fontSize: 28,
                }}>
                    ⚡
                </div>

                <h1 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Life Dashboard
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                    Tasks, habits, finance & focus — all in one place.
                </p>

                {/* Google Login Button */}
                <button
                    id="btn-google-login"
                    className="google-btn"
                    onClick={handleGoogleLogin}
                    style={{
                        width: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                        padding: '0.875rem 1.5rem',
                        background: 'rgba(255,255,255,0.12)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 12,
                        color: '#fff',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    }}
                >
                    <img
                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                        alt="Google"
                        style={{ width: 20, height: 20 }}
                    />
                    Continue with Google
                </button>

                {/* Dev Login — only in development */}
                {!isProduction && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
                            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>dev only</span>
                            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
                        </div>

                        <button
                            id="btn-dev-login"
                            className="dev-btn"
                            onClick={handleDevLogin}
                            disabled={devLoading}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'rgba(99,102,241,0.15)',
                                border: '1px dashed rgba(99,102,241,0.4)',
                                borderRadius: 12,
                                color: 'rgba(165,180,252,0.9)',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: devLoading ? 0.6 : 1,
                            }}
                        >
                            {devLoading ? '⏳ Logging in...' : '⚡ Dev Login (skip OAuth)'}
                        </button>
                    </>
                )}

                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
                    By signing in, you agree to our terms of service.
                </p>
            </div>
        </div>
    );
};
