import React from 'react'

export const cx = (...cs) => cs.filter(Boolean).join(' ')

/* ── Badge ── */
export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-white/10 text-white/50 border-white/15',
    gold:    'bg-[#c9a84c]/15 text-[#e8c96a] border-[#c9a84c]/30',
    teal:    'bg-[#2dd4bf]/10 text-[#2dd4bf] border-[#2dd4bf]/25',
    rose:    'bg-rose-500/15 text-rose-300 border-rose-500/25',
    sky:     'bg-sky-400/10 text-sky-300 border-sky-400/20',
    violet:  'bg-violet-400/10 text-violet-300 border-violet-400/20',
  }
  return (
    <span className={cx(
      'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest border uppercase',
      variants[variant] ?? variants.default
    )}>
      {children}
    </span>
  )
}

/* ── Card ── */
export function Card({ children, glow = false, className = '' }) {
  return (
    <div className={cx(
      'rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 relative overflow-hidden',
      glow && 'shadow-[0_0_40px_-8px_rgba(201,168,76,0.15)]',
      className
    )}>
      {glow && (
        <div className="absolute inset-0 rounded-2xl border border-[#c9a84c]/10 pointer-events-none" />
      )}
      {children}
    </div>
  )
}

/* ── Step (pipeline step with connector line) ── */
export function Step({ num, title, desc, tags = [], last = false }) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c9a84c]/30 to-[#c9a84c]/10 border border-[#c9a84c]/40 flex items-center justify-center text-[#e8c96a] text-xs font-black shrink-0">
          {num}
        </div>
        {!last && (
          <div className="w-px flex-1 mt-2 bg-gradient-to-b from-[#c9a84c]/20 to-transparent" />
        )}
      </div>
      <div className={cx('flex-1', !last && 'pb-7')}>
        <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
        <p className="text-white/45 text-xs leading-relaxed mb-2">{desc}</p>
        <div className="flex flex-wrap gap-1">
          {tags.map(t => (
            <span key={t} className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/8 uppercase tracking-wider">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── SectionHeading ── */
export function SectionHeading({ eyebrow, title }) {
  return (
    <div className="mb-10">
      {eyebrow && (
        <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#c9a84c] mb-2">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-black tracking-tight text-white leading-tight">{title}</h2>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-px w-12 bg-[#c9a84c]" />
        <div className="h-px flex-1 bg-white/8" />
      </div>
    </div>
  )
}

/* ── Spinner ── */
export function Spinner({ size = 8 }) {
  return (
    <div
      className="rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin"
      style={{ width: size * 4, height: size * 4 }}
    />
  )
}
