'use client';

import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className={styles.wrap}>
      <div className={styles.top}>
        <div className={styles.brandIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.2" fill="currentColor" stroke="none" />
            <circle cx="8.6" cy="14.5" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="15.4" cy="14.5" r="1.4" fill="currentColor" stroke="none" />
          </svg>
        </div>

        <h1 className={styles.title}>
          <span className={styles.titleSpacer}>Bus</span>Buddy
        </h1>
        <p className={styles.titleSub}>Safe Rides. Connected Families.</p>

        <p className={styles.tagline}>
          We connect drivers to students and keep parents informed with real-time location tracking.
        </p>
      </div>

      <section className={styles.features}>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="12" r="7" />
              <path d="M8.5 12l3.5 2.5L15 9.5" />
              <circle cx="15.5" cy="14.5" r="1.6" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <p className={styles.featureName}>Drivers</p>
          <p className={styles.featureRole}>get organized</p>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="8" r="3" />
              <path d="M3 20a7 7 0 0 1 14 0" />
              <path d="M9 12l3-3 2 2 4-4" />
              <circle cx="15" cy="6" r="2" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <p className={styles.featureName}>Students</p>
          <p className={styles.featureRole}>travel safely</p>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-6 8-11a8 8 0 1 0-16 0c0 5 8 11 8 11z" />
              <path d="M12 10v6" />
              <path d="M12 8h.01" />
              <circle cx="12" cy="16" r="1.6" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <p className={styles.featureName}>Parents</p>
          <p className={styles.featureRole}>track in real time</p>
        </div>
      </section>

      <section className={styles.illustration}>
        <svg
          viewBox="0 0 600 260"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          style={{ maxWidth: '100%', height: 'auto' }}
        >
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#08d9d6" />
              <stop offset="0.45" stopColor="#243bdb" />
              <stop offset="1" stopColor="#b000ff" />
            </linearGradient>
            <linearGradient id="road" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#b000ff" />
              <stop offset="0.5" stopColor="#08d9d6" />
              <stop offset="1" stopColor="#b000ff" />
            </linearGradient>
          </defs>

          <path
            d="M0 190 Q60 150 130 165 Q200 130 280 160 Q350 125 430 165 Q500 135 600 175 L600 220 L0 220 Z"
            fill="#1B2A4A"
          />
          <path
            d="M0 205 Q90 180 180 195 Q270 165 360 195 Q450 170 540 195 L540 220 L0 220 Z"
            fill="#0F1B33"
          />
          <path
            d="M0 210 Q60 200 110 208 Q160 197 220 208 Q280 199 340 208 L340 220 L0 220 Z"
            fill="#162440"
          />

          <path
            d="M30 205 Q150 200 300 205 Q450 200 570 200 L570 215 L30 215 Z"
            fill="url(#road)"
          />
          <path
            d="M30 215 L570 215 L570 216 L30 216 Z"
            fill="#6B7280"
          />

          <g transform="translate(150, 120)">
            <rect x="0" y="0" width="140" height="46" rx="10" fill="#1F2A44" />
            <rect x="0" y="0" width="140" height="46" rx="10" fill="url(#road)" fillOpacity="0.15" />
            <rect x="18" y="30" width="14" height="14" rx="3" fill="#FFD700" opacity="0.9" />
            <rect x="108" y="30" width="14" height="14" rx="3" fill="#FFD700" opacity="0.9" />
            <circle cx="70" cy="23" r="8" fill="#ffffff" stroke="#08d9d6" strokeWidth="2" />
            <rect x="66" y="19.5" width="8" height="7" rx="1" fill="#08d9d6" />
            <circle cx="35" cy="40" r="9" fill="#6B7280" stroke="#374151" strokeWidth="2" />
            <circle cx="105" cy="40" r="9" fill="#6B7280" stroke="#374151" strokeWidth="2" />
            <circle cx="35" cy="40" r="3.5" fill="#374151" />
            <circle cx="105" cy="40" r="3.5" fill="#374151" />
          </g>

          <path
            d="M150 196 Q200 192 260 198 Q320 204 380 196 Q440 188 500 194 Q540 197 550 198"
            stroke="rgba(255,215,0,0.85)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="500" cy="198" r="6" fill="#FFD700" opacity="0.9" />

          <g transform="translate(235, 58)">
            <rect x="0" y="0" width="140" height="64" rx="12" fill="#374151" opacity="0.85" />
            <circle cx="22" cy="20" r="10" fill="#ffffff" stroke="#08d9d6" strokeWidth="1.5" />
            <rect x="16" y="14" width="12" height="12" rx="3" fill="#08d9d6" />
            <rect x="46" y="14" width="58" height="10" rx="5" fill="#1F2A44" />
            <text x="75" y="23" fill="#ffffff" fontSize="12" fontWeight="700" textAnchor="middle">Bus 12</text>
            <rect x="46" y="28" width="70" height="8" rx="4" fill="#1F2A44" />
            <text x="81" y="34" fill="#08d9d6" fontSize="9" textAnchor="middle">On time • 2 min away</text>
            <polygon points="132,34 136,38 140,34" fill="#ffffff" stroke="none" />
          </g>

          <path
            d="M345,185 Q380,165 460,162"
            stroke="#9CA3AF"
            strokeWidth="1.5"
            strokeDasharray="3 2"
            fill="none"
          />

          <g transform="translate(500, 140)">
            <rect x="0" y="0" width="26" height="48" rx="6" fill="#1F2A44" />
            <rect x="6" y="18" width="14" height="12" rx="3" fill="#B0BEC5" />
            <rect x="8" y="34" width="10" height="2" rx="1" fill="#6B7280" />
            <rect x="14" y="34" width="14" height="12" rx="3" fill="#111827" />
            <rect x="16" y="37" width="10" height="8" rx="1.5" fill="#1F2A44" />
            <path
              d="M20,37 Q21,39 22,41 Q23,43 24,44 L24,45 L20,45 Z"
              fill="#08d9d6"
            />
          </g>
        </svg>
      </section>

      <div className={styles.controls}>
        <Link className={styles.getStarted} href="/get-started">Get Started →</Link>
      </div>
    </main>
  );
}
