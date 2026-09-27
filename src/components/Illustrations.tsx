import { useId } from 'react';
import { motion } from 'framer-motion';
import type { PackageComponent } from '../types/domain';

export function PackageArt({
  variant = 'box',
  className = '',
  label = '纸箱包裹插画',
}: {
  variant?: 'box' | 'green' | 'paper' | 'tape' | 'bag';
  className?: string;
  label?: string;
}) {
  const id = useId();
  const green = variant === 'green';
  return (
    <svg className={`package-art ${className}`} viewBox="0 0 220 200" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`${id}-top`} x2="1" y2="1">
          <stop stopColor={green ? '#afd99a' : '#f6d18c'} />
          <stop offset="1" stopColor={green ? '#69ad66' : '#eeb362'} />
        </linearGradient>
      </defs>
      <ellipse cx="113" cy="177" rx="76" ry="13" fill="#426d33" opacity=".1" />
      {variant === 'tape' ? (
        <>
          <ellipse cx="113" cy="100" rx="64" ry="61" fill="#cf974b" />
          <ellipse cx="107" cy="88" rx="61" ry="58" fill="#efc888" />
          <ellipse cx="107" cy="88" rx="33" ry="31" fill="#a8793e" />
          <ellipse cx="109" cy="94" rx="26" ry="24" fill="#faf6e8" />
          <path d="M158 115v41l-32 13-9-19 28-11v-26" fill="#e4b56f" />
        </>
      ) : variant === 'paper' ? (
        <>
          <path
            d="m34 70 36-23 18 17 35-25 21 23 37-4 7 40-20 15 11 31-37 14-32-9-21 15-24-20-28 2 8-30-19-21z"
            fill="#d9c9a1"
          />
          <path
            d="m34 70 33 14 21-20 16 31 40-33-4 43 41-47-13 55-37-2 11 47-35-42-20 48-1-48-37 10 18-42"
            fill="none"
            stroke="#eee1c4"
            strokeWidth="8"
            strokeLinejoin="round"
          />
        </>
      ) : variant === 'bag' ? (
        <>
          <path d="m53 44 106 7 9 119-116-6z" fill="#acc9af" />
          <path d="m53 44 106 7-5 17-105-8z" fill="#cde0c6" />
          <path d="m67 98 53 3-2 37-53-4z" fill="#fff9e9" />
          <path d="m76 108 34 2m-34 9 23 2" stroke="#628c72" strokeWidth="4" />
        </>
      ) : (
        <>
          <path d="m32 68 78-35 80 37-77 39z" fill={`url(#${id}-top)`} />
          <path d="m32 68 81 41v71l-81-42z" fill={green ? '#70ae6b' : '#dc9f53'} />
          <path d="m113 109 77-39v71l-77 39z" fill={green ? '#40894f' : '#bf833f'} />
          <path d="m80 47 80 39-20 10-80-40z" fill={green ? '#c1e3a8' : '#ffe1a3'} />
          <path d="m140 96 20-10v30l-9-2-11 12z" fill={green ? '#b0d897' : '#f6d193'} />
          <path d="m43 119 31 16v23l-31-16z" fill="#fff0cb" opacity=".75" />
          <path d="m48 131 20 10m-20-4 13 7" stroke="#a8763e" strokeWidth="2" />
          <path
            d="m160 148 0-12m-5 6 5-6 5 1m-25 22 0-12m-5 6 5-6 5 1"
            stroke={green ? '#c6e8b7' : '#edbf7d'}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M72 110c0-19 17-24 27-21-1 17-10 29-27 21"
            fill={green ? '#e6f4d7' : '#538451'}
          />
          <path d="m69 118 18-21" stroke={green ? '#40894f' : '#386638'} strokeWidth="2" />
        </>
      )}
    </svg>
  );
}
export function LayersArt({ components }: { components: PackageComponent[] }) {
  return (
    <div className="layers-visual" aria-label={`包裹包含 ${components.length} 层包装`} role="img">
      <div className="layer-halo" />
      {components.slice(0, 6).map((c, i) => (
        <div
          className="floating-layer"
          style={{ top: `${i * 43 + 10}px`, zIndex: 10 - i }}
          key={c.id}
        >
          <svg viewBox="0 0 240 120" aria-hidden="true">
            <path
              d="m25 48 97-40 93 41-96 43z"
              fill={
                c.type.includes('plastic') || c.type === 'mailer_bag'
                  ? '#c3dcd7'
                  : c.type.includes('filler')
                    ? '#eddfbb'
                    : '#f0c580'
              }
            />
            <path d="m25 48 94 44v18L25 66z" fill="#d5a367" />
            <path d="m119 92 96-43v18l-96 43z" fill="#bd8b52" />
            <path d="m78 25 93 44 24-11-92-43z" fill="#ffe2ae" opacity=".8" />
          </svg>
          <span className="layer-number">{i + 1}</span>
        </div>
      ))}
      {components.length === 0 && <p>已明确不使用包装</p>}
    </div>
  );
}
export function JourneyMap({
  stage = 4,
  reduced = false,
  origin = '发货地',
  destination = '收货地',
  returning = false,
}: {
  stage?: number;
  reduced?: boolean;
  origin?: string;
  destination?: string;
  returning?: boolean;
}) {
  return (
    <div className="journey-map">
      <svg
        viewBox="0 0 800 370"
        role="img"
        aria-label={`${origin}到${destination}的解释性路线示意${returning ? '，包含退货' : ''}`}
      >
        <rect width="800" height="370" rx="28" fill="#dff0e4" />
        <path d="M0 245C150 174 225 346 376 279S580 150 800 209v161H0" fill="#b9def0" />
        <path
          d="M0 252C150 181 225 353 376 286S580 157 800 216"
          stroke="#edf6e1"
          strokeWidth="18"
          fill="none"
        />
        <ellipse cx="167" cy="179" rx="132" ry="80" fill="#cadfaa" />
        <ellipse cx="647" cy="143" rx="126" ry="88" fill="#cadfaa" />
        <path
          d="M154 193C254 330 318 47 425 185S555 277 638 161"
          stroke="#fff5d7"
          strokeWidth="45"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M154 193C254 330 318 47 425 185S555 277 638 161"
          stroke="#c7bb98"
          strokeWidth="29"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M154 193C254 330 318 47 425 185S555 277 638 161"
          stroke="#fffbea"
          strokeWidth="3"
          strokeDasharray="10 12"
          fill="none"
        />
        {returning && (
          <path
            d="M620 190Q410 355 176 215"
            stroke="#dd8650"
            strokeWidth="5"
            strokeDasharray="8 9"
            fill="none"
          />
        )}
        {[
          [70, 130],
          [258, 66],
          [565, 104],
          [721, 202],
          [527, 276],
          [57, 291],
          [330, 305],
          [734, 81],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <ellipse cy="22" rx="19" ry="7" fill="#6e9b64" opacity=".2" />
            <path d="M0 1v24" stroke="#a67b50" strokeWidth="8" />
            <ellipse cy="-9" rx="23" ry="28" fill={i % 2 ? '#78a75d' : '#5b965d'} />
            <ellipse cx="-6" cy="-15" rx="14" ry="19" fill="#9bc572" />
          </g>
        ))}
        <g transform="translate(102 102)">
          <path d="M0 24 54 1l53 25v70H0" fill="#f2d6a0" />
          <path d="m-9 24 62-33 65 33-12 15L53 9 1 39z" fill="#dc884e" />
          <path d="M34 53h43v43H34z" fill="#977b59" />
          <path d="M40 59h31v37H40z" fill="#b7aa83" />
          <path d="M9 48h16v20H9z" fill="#a7d8d5" />
        </g>
        <g transform="translate(595 71)">
          <path d="M0 36 51 3l58 32v63H0" fill="#f9e6b4" />
          <path d="m-12 36 63-43 71 43-14 11L51 11 0 47z" fill="#db8950" />
          <path d="M46 59h27v39H46z" fill="#76a59a" />
          <path d="M13 56h23v23H13zm70 0h17v23H83z" fill="#a7d8e1" />
        </g>
        <motion.g
          initial={false}
          animate={{
            x: stage >= 3 ? 563 : stage >= 1 ? 352 : 170,
            y: stage >= 3 ? 196 : stage >= 1 ? 165 : 200,
          }}
          transition={{ duration: reduced ? 0 : 1.2, ease: 'easeInOut' }}
        >
          <ellipse cx="18" cy="22" rx="44" ry="10" fill="#284e34" opacity=".16" />
          <rect x="-25" y="-19" width="52" height="36" rx="5" fill="#fff4d8" />
          <path d="M27-8h18l14 15v12H27" fill="#edb755" />
          <path d="M33-3h10l9 10H33z" fill="#93c8d5" />
          <circle cx="-10" cy="20" r="10" fill="#4e6259" />
          <circle cx="43" cy="20" r="10" fill="#4e6259" />
          <circle cx="-10" cy="20" r="4" fill="#eee5cd" />
          <circle cx="43" cy="20" r="4" fill="#eee5cd" />
          <path d="M-4 4C-11-12 7-13 14-12 13 1 8 8-4 4" fill="#74a75d" />
        </motion.g>
      </svg>
      <span className="map-label origin">
        <span className="dot" />
        {origin || '发货地未知'}
      </span>
      <span className="map-label destination">
        <span className="dot" />
        {destination || '收货地未知'}
      </span>
      <span className="map-caption">路线仅作示意 · 非真实物流追踪</span>
    </div>
  );
}
