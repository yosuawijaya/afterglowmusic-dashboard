'use client'

import { useState } from 'react'

interface Props {
  username: string
  onClose: () => void
}

const STEPS = [
  {
    emoji: null,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5L21 3V16M9 18C9 19.1 7.66 20 6 20C4.34 20 3 19.1 3 18C3 16.9 4.34 16 6 16C7.66 16 9 16.9 9 18ZM21 16C21 17.1 19.66 18 18 18C16.34 18 15 17.1 15 16C15 14.9 16.34 14 18 14C19.66 14 21 14.9 21 16Z"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))',
    border: 'rgba(99,102,241,0.3)',
    title: (name: string) => `Welcome, ${name}`,
    desc: 'Your all-in-one music distribution portal. Get your music on 120+ platforms worldwide.',
    checklist: null,
    tip: null,
  },
  {
    emoji: null,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12l7-7 7 7"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.05))',
    border: 'rgba(16,185,129,0.25)',
    title: () => 'Submit Your First Release',
    desc: 'Click "+ New Release" to get started. Here\'s what you\'ll need:',
    checklist: [
      { icon: null, text: 'Cover art — 3000×3000px, JPG or PNG' },
      { icon: null, text: 'Audio files — WAV format only' },
      { icon: null, text: 'Track metadata — composer, ISRC, etc.' },
      { icon: null, text: 'Your Spotify & Apple Music artist URLs' },
    ],
    tip: 'Submit at least 2 weeks before your desired release date.',
  },
  {
    emoji: null,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.05))',
    border: 'rgba(245,158,11,0.2)',
    title: () => 'Worldwide Distribution',
    desc: 'Once approved, your music goes live across all major platforms:',
    checklist: [
      { icon: null, text: 'Spotify, Apple Music, YouTube Music' },
      { icon: null, text: 'TikTok, Instagram, Facebook' },
      { icon: null, text: 'JOOX, KKBOX, JioSaavn & more' },
      { icon: null, text: 'You keep 85% of all royalties' },
    ],
    tip: 'Use the Promotion page to create pre-save links for your fans.',
  },
  {
    emoji: null,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    gradient: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(219,39,119,0.05))',
    border: 'rgba(236,72,153,0.2)',
    title: () => 'Track Everything',
    desc: 'Your dashboard gives you full visibility:',
    checklist: [
      { icon: null, text: 'Analytics — catalog performance overview' },
      { icon: null, text: 'Royalties — earnings & payout history' },
      { icon: null, text: 'Notifications — status updates in real-time' },
      { icon: null, text: 'Edit releases — update info anytime' },
    ],
    tip: null,
  },
  {
    emoji: null,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
      { icon: '💵', text: 'Royalties — earnings & payout history' },
      { icon: '🔔', text: 'Notifications — status updates in real-time' },
      { icon: '✏️', text: 'Edit releases — update info anytime' },
    ],
    tip: null,
  },
  {
    emoji: '✅',
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(236,72,153,0.08))',
    border: 'rgba(99,102,241,0.25)',
    title: () => "You're All Set!",
    desc: 'Our team reviews submissions within 2–3 business days. You\'ll get an email when your release is approved.',
    checklist: null,
    tip: null,
  },
]

export default function OnboardingModal({ username, onClose }: Props) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '20px',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        background: '#0a0a18',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        width: '100%', maxWidth: '480px',
        boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
        animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
      }}>
        {/* Progress bar */}
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ height: '100%', width: `${((step + 1) / STEPS.length) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #ec4899)', transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }} />
        </div>

        <div style={{ padding: '36px 36px 32px' }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              {STEPS.map((_, i) => (
                <div key={i} onClick={() => i < step && setStep(i)} style={{
                  width: i === step ? '24px' : '6px', height: '6px', borderRadius: '3px',
                  background: i === step ? '#6366f1' : i < step ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.3s', cursor: i < step ? 'pointer' : 'default',
                }} />
              ))}
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
              {step + 1} / {STEPS.length}
            </span>
          </div>

          {/* Icon + gradient card */}
          <div style={{ background: current.gradient, border: `1px solid ${current.border}`, borderRadius: '16px', padding: '24px', marginBottom: '24px', textAlign: 'center', transition: 'all 0.3s' }}>
            <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.06)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>{current.icon}</div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: '8px', lineHeight: 1.2 }}>
              {current.title(username)}
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', margin: 0 }}>
              {current.desc}
            </p>
          </div>

          {/* Checklist */}
          {current.checklist && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {current.checklist.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(165,180,252,0.5)', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tip */}
          {current.tip && (
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '14px', flexShrink: 0 }}>💡</span>
              <span style={{ fontSize: '12px', color: '#818cf8', lineHeight: 1.6 }}>{current.tip}</span>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ padding: '11px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                ← Back
              </button>
            )}
            <button onClick={isLast ? onClose : () => setStep(s => s + 1)}
              style={{ flex: 1, padding: '12px 24px', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(99,102,241,0.4)', transition: 'all 0.2s' }}>
              {isLast ? "Let's Go! 🚀" : step === 0 ? 'Get Started →' : 'Next →'}
            </button>
          </div>

          {!isLast && (
            <button onClick={onClose}
              style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Skip tour
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  )
}
