'use client'

import { useRouter, usePathname } from 'next/navigation'

export default function MobileNav() {
  const router = useRouter()
  const pathname = usePathname()

  // Jangan tampil di halaman login dan admin
  if (pathname === '/' || pathname?.startsWith('/admin')) return null

  const items = [
    {
      label: 'Releases',
      path: '/dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
        </svg>
      ),
    },
    {
      label: 'Analytics',
      path: '/analytics',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <rect x="2" y="13" width="4" height="9" rx="1"/>
          <rect x="9" y="8" width="4" height="14" rx="1"/>
          <rect x="16" y="3" width="4" height="19" rx="1"/>
        </svg>
      ),
    },
    {
      label: 'Royalties',
      path: '/royalties',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
        </svg>
      ),
    },
    {
      label: 'Promo',
      path: '/promotion',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd"/>
        </svg>
      ),
    },
  ]

  return (
    <nav className="mobile-bottom-nav">
      {items.map(item => {
        const active = pathname === item.path
        return (
          <div
            key={item.path}
            className={`mobile-nav-item${active ? ' active' : ''}`}
            onClick={() => router.push(item.path)}
          >
            {item.icon}
            {item.label}
          </div>
        )
      })}
    </nav>
  )
}
