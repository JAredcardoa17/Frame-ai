import React, { useState, useRef, useCallback } from 'react'
import { cx, Badge, Spinner } from '../components/UI.jsx'

/* ── Mock photo data ── */
const MOCK_PHOTOS = [
  { id:1,  name:'IMG_4821', size:'24.1 MB', status:'analyzing', score:null,  w:4, h:3 },
  { id:2,  name:'IMG_4822', size:'23.8 MB', status:'approved',  score:94,    w:3, h:4 },
  { id:3,  name:'IMG_4823', size:'22.5 MB', status:'review',    score:31,    w:4, h:3, reason:'Motion blur' },
  { id:4,  name:'IMG_4824', size:'25.0 MB', status:'approved',  score:88,    w:4, h:3 },
  { id:5,  name:'IMG_4825', size:'21.3 MB', status:'review',    score:18,    w:3, h:4, reason:'Eyes closed' },
  { id:6,  name:'IMG_4826', size:'24.7 MB', status:'approved',  score:91,    w:4, h:3 },
  { id:7,  name:'IMG_4827', size:'23.1 MB', status:'analyzing', score:null,  w:3, h:4 },
  { id:8,  name:'IMG_4828', size:'22.9 MB', status:'approved',  score:96,    w:4, h:3 },
  { id:9,  name:'IMG_4829', size:'20.8 MB', status:'review',    score:22,    w:4, h:3, reason:'Overexposed' },
  { id:10, name:'IMG_4830', size:'24.2 MB', status:'approved',  score:85,    w:3, h:4 },
  { id:11, name:'IMG_4831', size:'23.5 MB', status:'approved',  score:90,    w:4, h:3 },
  { id:12, name:'IMG_4832', size:'21.9 MB', status:'review',    score:15,    w:4, h:3, reason:'Accidental fire' },
]

const INTENT_QUESTIONS = [
  { q: 'What type of shoot?',           opts: ['Wedding','Portrait','Event','Commercial','Street','Other'] },
  { q: 'Target editing style?',         opts: ['Bright & Airy','Moody & Dark','True to Life','Film Emulation','Custom'] },
  { q: 'Primary delivery format?',      opts: ['Print (High-res)','Web / Social','Client Gallery','Archive'] },
  { q: 'Acceptable keeper rate?',       opts: ['Top 10%','Top 25%','Top 50%','Keep All Viable'] },
  { q: 'Eye / face detection priority?',opts: ['Critical','Important','Not Applicable'] },
  { q: 'Exposure tolerance?',           opts: ['Strict ±0.5EV','Moderate ±1EV','Lenient ±2EV'] },
]

/* ── Photo thumbnail ── */
function PhotoThumb({ photo, onRescue }) {
  const hues = [200,220,240,260,280,40,60,80,100,120,160,180]
  const hue  = hues[photo.id % hues.length]

  const borderColor = {
    approved:  'border-[#2dd4bf]/25',
    review:    'border-rose-500/25',
    analyzing: 'border-white/10',
  }[photo.status]

  return (
    <div
      className={cx(
        'rounded-xl border overflow-hidden relative group cursor-pointer transition-all duration-200 hover:scale-[1.02]',
        borderColor
      )}
      style={{ aspectRatio: `${photo.w}/${photo.h}` }}
    >
      {/* simulated photo background */}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(135deg,hsl(${hue},30%,12%) 0%,hsl(${hue+30},25%,18%) 100%)` }}
      />
      {/* simulated subject glow */}
      <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
        <div
          className="rounded-full"
          style={{
            width: '45%', height: '65%',
            background: `radial-gradient(circle,hsl(${hue},40%,60%) 0%,transparent 70%)`
          }}
        />
      </div>
      {/* vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

      {/* status badge */}
      <div className="absolute top-1.5 right-1.5">
        {photo.status === 'approved' && (
          <div className="w-4 h-4 rounded-full bg-[#2dd4bf] flex items-center justify-center text-[8px] font-black text-black">✓</div>
        )}
        {photo.status === 'review' && (
          <div className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-[8px] font-black text-white">!</div>
        )}
        {photo.status === 'analyzing' && (
          <div className="w-4 h-4 rounded-full bg-[#c9a84c]/80 flex items-center justify-center">
            <div className="w-2 h-2 border border-black border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* bottom info */}
      <div className="absolute bottom-1.5 left-1.5 right-1.5">
        {photo.score !== null ? (
          <div className="flex items-end justify-between">
            <span className="text-[9px] font-bold text-white/40 truncate">{photo.name}</span>
            <span className={cx('text-[9px] font-black ml-1 shrink-0', photo.score > 70 ? 'text-[#2dd4bf]' : 'text-rose-400')}>
              {photo.score}
            </span>
          </div>
        ) : photo.status === 'analyzing' ? (
          <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#c9a84c] rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        ) : null}
        {photo.reason && (
          <p className="text-[9px] font-bold text-rose-300 mt-0.5">{photo.reason}</p>
        )}
      </div>

      {/* rescue overlay on hover (review photos only) */}
      {photo.status === 'review' && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={() => onRescue(photo.id)}
            className="px-3 py-1.5 rounded-lg bg-[#c9a84c]/90 text-black text-[10px] font-black hover:bg-[#e8c96a] transition-colors"
          >
            Rescue
          </button>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════
   PHOTO WORKSPACE
══════════════════════════════════════════════════ */
export default function PhotoWorkspace() {
  const [stage,    setStage]    = useState('drop')   // drop | dialog | curating | results
  const [dragOver, setDragOver] = useState(false)
  const [answers,  setAnswers]  = useState({})
  const [currentQ, setCurrentQ] = useState(0)
  const [progress, setProgress] = useState(0)
  const [filter,   setFilter]   = useState('all')
  const [photos,   setPhotos]   = useState(MOCK_PHOTOS)
  const fileRef = useRef()

  const startImport = useCallback(() => {
    setStage('dialog')
    setCurrentQ(0)
    setAnswers({})
  }, [])

  const handleAnswer = (opt) => {
    const next = { ...answers, [currentQ]: opt }
    setAnswers(next)
    if (currentQ < INTENT_QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1)
    } else {
      // all questions answered — run AI analysis
      setStage('curating')
      setProgress(0)
      let p = 0
      const iv = setInterval(() => {
        p += Math.random() * 8 + 3
        if (p >= 100) {
          p = 100
          clearInterval(iv)
          setTimeout(() => setStage('results'), 350)
        }
        setProgress(Math.min(p, 100))
      }, 110)
    }
  }

  const rescuePhoto = (id) => {
    setPhotos(prev => prev.map(ph => ph.id === id ? { ...ph, status: 'approved', score: 72, reason: undefined } : ph))
  }

  const approved  = photos.filter(p => p.status === 'approved')
  const review    = photos.filter(p => p.status === 'review')
  const analyzing = photos.filter(p => p.status === 'analyzing')
  const displayed = filter === 'approved' ? approved : filter === 'review' ? review : photos

  /* ── DROP ZONE ── */
  if (stage === 'drop') return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); startImport() }}
        onClick={() => fileRef.current?.click()}
        className={cx(
          'w-full max-w-xl rounded-3xl border-2 border-dashed flex flex-col items-center justify-center py-20 px-8 cursor-pointer transition-all duration-300 relative overflow-hidden select-none',
          dragOver
            ? 'border-[#c9a84c] bg-[#c9a84c]/[0.07] shadow-[0_0_60px_-10px_rgba(201,168,76,0.3)]'
            : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]'
        )}
      >
        <input ref={fileRef} type="file" multiple accept="image/*,.raw,.heic,.tiff" className="hidden" onChange={startImport} />

        {/* inner rings when dragging */}
        <div className={cx('absolute inset-0 rounded-3xl transition-opacity duration-300 pointer-events-none', dragOver ? 'opacity-100' : 'opacity-0')}>
          <div className="absolute inset-4 rounded-2xl border border-[#c9a84c]/20" />
          <div className="absolute inset-8 rounded-xl border border-[#c9a84c]/10" />
        </div>

        <div className={cx('w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300',
          dragOver ? 'bg-[#c9a84c]/20 scale-110' : 'bg-white/[0.05]')}>
          <span className="text-4xl select-none">{dragOver ? '✦' : '◻'}</span>
        </div>

        <p className="text-white font-black text-xl mb-2 text-center">
          {dragOver ? 'Release to Import' : 'Drop Your Photos Here'}
        </p>
        <p className="text-white/35 text-sm text-center mb-6">
          Drag a folder of RAW, JPEG, HEIC, or TIFF files — any batch size
        </p>
        <div className="flex gap-2 flex-wrap justify-center">
          {['RAW','JPEG','HEIC','PNG','TIFF','DNG'].map(f => (
            <span key={f} className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/30 font-mono">{f}</span>
          ))}
        </div>
        <p className="text-[11px] text-white/20 mt-6">or click to browse files</p>
      </div>

      {/* recent sessions */}
      <div className="mt-6 flex items-center gap-3 text-xs text-white/25 flex-wrap justify-center">
        <span className="shrink-0">Recent:</span>
        {['Wedding_May2026','Portrait_Session_12','Event_Gala_Apr'].map(r => (
          <button
            key={r}
            onClick={startImport}
            className="px-3 py-1 rounded-full border border-white/8 hover:border-[#c9a84c]/30 hover:text-[#e8c96a] transition-colors"
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  )

  /* ── INTENT DIALOG ── */
  if (stage === 'dialog') {
    const q = INTENT_QUESTIONS[currentQ]
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-lg">
          {/* progress dots */}
          <div className="flex gap-2 justify-center mb-8">
            {INTENT_QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={cx('h-1 rounded-full transition-all duration-300',
                  i < currentQ  ? 'w-6 bg-[#c9a84c]' :
                  i === currentQ ? 'w-10 bg-[#e8c96a]' :
                                   'w-6 bg-white/15'
                )}
              />
            ))}
          </div>

          <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#c9a84c] text-center mb-2">
            AI Intent Dialog · {currentQ + 1} of {INTENT_QUESTIONS.length}
          </p>
          <h2 className="text-2xl font-black text-white text-center mb-8">{q.q}</h2>

          <div className="grid grid-cols-2 gap-3">
            {q.opts.map(opt => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                className={cx(
                  'rounded-2xl border p-4 text-left transition-all duration-200 group',
                  answers[currentQ] === opt
                    ? 'border-[#c9a84c]/50 bg-[#c9a84c]/15 shadow-[0_0_20px_-5px_rgba(201,168,76,0.3)]'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                )}
              >
                <span className={cx('text-sm font-bold transition-colors',
                  answers[currentQ] === opt ? 'text-[#e8c96a]' : 'text-white/70 group-hover:text-white'
                )}>
                  {opt}
                </span>
              </button>
            ))}
          </div>

          {currentQ > 0 && (
            <button
              onClick={() => setCurrentQ(q => q - 1)}
              className="mt-6 w-full text-center text-xs text-white/25 hover:text-white/50 transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
      </div>
    )
  }

  /* ── CURATING ── */
  if (stage === 'curating') return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center mx-auto mb-6">
          <Spinner size={8} />
        </div>
        <p className="text-[11px] font-bold tracking-widest uppercase text-[#c9a84c] mb-2">AI Analysis Running</p>
        <h2 className="text-xl font-black text-white mb-2">Analyzing {MOCK_PHOTOS.length} photos</h2>
        <p className="text-white/35 text-sm mb-8">
          Scoring sharpness, exposure, composition, eye detection…
        </p>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-white/30 text-xs font-mono">{Math.round(progress)}% complete</p>
      </div>
    </div>
  )

  /* ── RESULTS ── */
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* toolbar */}
      <div className="px-6 py-3 border-b border-white/8 flex items-center gap-3 shrink-0 flex-wrap">
        <div className="flex gap-1 border border-white/10 rounded-xl p-1">
          {[
            { key:'all',      label:'All',          count: photos.length },
            { key:'approved', label:'✓ Approved',   count: approved.length },
            { key:'review',   label:'⚑ Review',     count: review.length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cx(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                filter === key ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
              )}
            >
              {label}
              <span className="ml-1.5 text-[10px] opacity-60">{count}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto flex-wrap">
          <Badge variant="teal">{approved.length} Approved</Badge>
          <Badge variant="rose">{review.length} Flagged</Badge>
          {analyzing.length > 0 && <Badge variant="gold">{analyzing.length} Analyzing</Badge>}
        </div>

        <button
          onClick={() => { setStage('drop'); setFilter('all'); setPhotos(MOCK_PHOTOS) }}
          className="text-xs text-white/25 hover:text-white/50 transition-colors"
        >
          + Import More
        </button>
      </div>

      {/* photo grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {displayed.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/20 text-sm">No photos in this category</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-2">
            {displayed.map(photo => (
              <div key={photo.id} className="break-inside-avoid mb-2">
                <PhotoThumb photo={photo} onRescue={rescuePhoto} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* export bar */}
      <div className="px-6 py-3 border-t border-white/8 flex items-center gap-3 shrink-0 flex-wrap">
        <p className="text-white/30 text-xs">{approved.length} photos ready for export</p>
        <div className="flex gap-2 ml-auto">
          <button className="px-4 py-2 rounded-xl border border-white/15 text-white/50 text-xs font-bold hover:border-white/30 hover:text-white/70 transition-all">
            Apply Style Preset
          </button>
          <button className="gold-btn px-4 py-2 rounded-xl text-xs">
            Export Approved ✦
          </button>
        </div>
      </div>
    </div>
  )
}
