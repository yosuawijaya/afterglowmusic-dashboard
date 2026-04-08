'use client'

import { useRouter } from 'next/navigation'

export default function LegalPage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#05050d', fontFamily: "'Inter', sans-serif", color: '#f0f0ff' }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .legal-section { animation: fadeUp 0.4s ease-out both; }
        h2 { font-size: 15px; font-weight: 800; color: #a5b4fc; margin: 32px 0 12px; letter-spacing: -0.2px; }
        p, li { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.8; }
        li { margin-bottom: 6px; }
        ul { padding-left: 20px; margin: 8px 0; }
        a { color: #818cf8; text-decoration: none; }
        a:hover { text-decoration: underline; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(5,5,13,0.95)', backdropFilter: 'blur(20px)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 14px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>Last updated: April 2026</div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 40px 80px' }}>

        {/* Hero */}
        <div className="legal-section" style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(165,180,252,0.5)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>Legal</div>
          <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#fff', letterSpacing: '-1px', marginBottom: '12px', lineHeight: 1.1 }}>Terms & Privacy</h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
            These terms govern your use of Afterglow Music's distribution platform. By submitting a release, you agree to these terms.
            Questions? Contact our CEO at <a href="mailto:yosuaawijayaaa@gmail.com">yosuaawijayaaa@gmail.com</a>
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)', marginBottom: '48px' }} />

        {/* Terms of Service */}
        <div className="legal-section" style={{ animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '32px', height: '32px', background: 'rgba(99,102,241,0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="#a5b4fc"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd"/></svg>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>Terms of Service</h1>
          </div>

          <h2>1. Eligibility</h2>
          <p>You must be at least 18 years old and have the legal right to distribute the content you submit. By creating an account, you confirm you meet these requirements.</p>

          <h2>2. Content Rights</h2>
          <p>By submitting a release, you confirm that:</p>
          <ul>
            <li>You own or control all rights to the submitted content</li>
            <li>The content does not infringe any third-party copyrights, trademarks, or other rights</li>
            <li>You have obtained all necessary licenses, clearances, and permissions</li>
            <li>The content does not contain unlicensed samples</li>
          </ul>

          <h2>3. Distribution License</h2>
          <p>You grant Afterglow Music a <strong style={{ color: 'rgba(255,255,255,0.7)' }}>non-exclusive, worldwide license</strong> to distribute, reproduce, and make available your content on digital platforms. This license remains in effect until you request removal of your content.</p>

          <h2>4. Revenue & Royalties</h2>
          <ul>
            <li>You receive <strong style={{ color: '#10b981' }}>85% of net revenue</strong> generated from your releases</li>
            <li>Afterglow Music retains 15% as a distribution and administration fee</li>
            <li>Royalties are calculated based on reports received from digital platforms</li>
            <li>Payments are processed after a minimum threshold is reached</li>
          </ul>

          <h2>5. Review & Approval</h2>
          <p>All submissions are subject to review. Afterglow Music reserves the right to reject content that violates these terms, platform guidelines, or applicable law. Submission does not guarantee distribution.</p>

          <h2>6. ISRC & UPC</h2>
          <p>Afterglow Music assigns ISRC codes (format: ID-AGM-YY-NNNNN) to tracks and UPC barcodes to releases. These identifiers are used for tracking and royalty collection across all platforms.</p>

          <h2>7. Termination</h2>
          <p>Either party may terminate the distribution agreement with 30 days written notice. Upon termination, content will be removed from all platforms within 30–60 days depending on platform processing times.</p>

          <h2>8. Limitation of Liability</h2>
          <p>Afterglow Music is not liable for delays, errors, or omissions by third-party platforms. Our liability is limited to the fees paid by you in the 12 months preceding any claim.</p>
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)', margin: '48px 0' }} />

        {/* Privacy Policy */}
        <div className="legal-section" style={{ animationDelay: '0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '32px', height: '32px', background: 'rgba(236,72,153,0.12)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="#f472b6"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>Privacy Policy</h1>
          </div>

          <h2>Data We Collect</h2>
          <ul>
            <li>Account information: name, email address, username</li>
            <li>Release data: music files, cover art, metadata</li>
            <li>Usage data: login times, pages visited, actions taken</li>
            <li>Payment information: processed securely, not stored by us</li>
          </ul>

          <h2>How We Use Your Data</h2>
          <ul>
            <li>To distribute your music to digital platforms</li>
            <li>To send you status updates and royalty reports</li>
            <li>To improve our platform and services</li>
            <li>To comply with legal obligations</li>
          </ul>

          <h2>Data Sharing</h2>
          <p>We share your data only with digital platforms necessary for distribution (Spotify, Apple Music, etc.) and service providers who help us operate the platform. We do not sell your personal data.</p>

          <h2>Data Retention</h2>
          <p>We retain your data for as long as your account is active. Upon account deletion, your personal data is removed within 30 days, except where required by law.</p>

          <h2>Your Rights</h2>
          <ul>
            <li>Access and download your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and data</li>
            <li>Opt out of non-essential communications</li>
          </ul>

          <h2>Contact</h2>
          <p>For privacy requests or questions, contact our CEO directly at <a href="mailto:yosuaawijayaaa@gmail.com">yosuaawijayaaa@gmail.com</a></p>
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)', margin: '48px 0' }} />

        {/* Contact card */}
        <div className="legal-section" style={{ animationDelay: '0.3s', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '16px', padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>Questions about these terms?</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Our CEO responds personally to all legal inquiries.</div>
          </div>
          <a href="mailto:yosuaawijayaaa@gmail.com" style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)', borderRadius: '10px', padding: '10px 22px', color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
            Contact CEO →
          </a>
        </div>

      </div>
    </div>
  )
}
