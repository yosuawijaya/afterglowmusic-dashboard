'use client'

import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#05050d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", padding: '20px' }}>
          <div style={{ textAlign: 'center', maxWidth: '440px' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.4px', marginBottom: '10px' }}>Something went wrong</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6', marginBottom: '28px' }}>
              An unexpected error occurred. Your data is safe — try refreshing the page.
            </p>
            {this.state.error && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', textAlign: 'left' }}>
                <code style={{ fontSize: '11px', color: 'rgba(248,113,113,0.8)', fontFamily: 'monospace', lineHeight: '1.5' }}>
                  {this.state.error.message}
                </code>
              </div>
            )}
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
              style={{ padding: '11px 28px', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: 'white', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
