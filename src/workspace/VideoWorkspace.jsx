import React, { useState, useRef } from 'react'
import { cx, Badge } from '../components/UI.jsx'

/* ── Mock data ── */
const INITIAL_CLIPS = [
  { id:1, name:'ceremony_wide_01.mp4',   dur:'4:32',  size:'2.1 GB', fps:'24fps', res:'4K' },
  { id:2, name:'ceremony_close_01.mp4',  dur:'3:18',  size:'1.6 GB', fps:'24fps', res:'4K' },
  { id:3, name:'reception_drone_01.mp4', dur:'2:45',  size:'1.3 GB', fps:'60fps', res:'4K' },
  { id:4, name:'speeches_cam1.mp4',      dur:'12:04', size:'5.8 GB', fps:'24fps', res:'1080p' },
  { id:5, name:'firstdance_wide.mp4',    dur:'5:22',  size:'2.5 GB', fps:'24fps', res:'4K' },
]

const INITIAL_TIMELINE = [
  { id:1, name:'ceremony_wide',  color:'#c9a84c', start:0,  dur:18 },
  { id:3, name:'drone_01',       color:'#2dd4bf', start:18, dur:11 },
  { id:5, name:'firstdance',     color:'#a78bfa', start:29, dur:22 },
  { id:2, name:'ceremony_close', color:'#f87171', start:51, dur:14 },
]

const AI_RESPONSES = [
  '✦ Applied: Beat-synced cuts every 3.2s · Warm cinematic LUT · Lower third at 0:08 · Audio ducked under voiceover',
  '✦ Applied: Color temperature shifted +800K · Skin tone protection active · Highlights recovered on clips 2 & 4',
  '✦ Applied: Warp stabilizer on all handheld shots · Smooth 60fps interpolation on drone clip · Noise reduction at 65%',
  '✦ Applied: 90-second highlight reel assembled · 8 best clips selected · Fade in/out transitions added',
  '✦ Applied: Multi-cam sequence created · 3 angles synced via audio waveform · Auto-switching enabled',
]

const QUICK_PROMPTS = [
  'Create a 90s highlight reel, warm tones, beat-synced cuts',
  'Stabilize all handheld shots and reduce noise',
  'Add lower thirds and match color across all clips',
  'Duck audio under voiceover and normalize levels',
]

/* ── Color wheel placeholder ── */
function ColorWheel({ label, offsetX = 0, offsetY = 0, hue = 0 }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center relative"
        style={{ background: `conic-gradient(from 0deg,hsl(${hue},40%,15%),hsl(${hue+60},30%,20%),hsl(${hue+120},40%,15%),hsl(${hue},40%,15%))` }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full bg-white/70 absolute"
          style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}
        />
      </div>
      <span className="text-[8px] text-white/25">{label}</span>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   VIDEO WORKSPACE
══════════════════════════════════════════════════ */
export default function VideoWorkspace() {
  const [clips,         setClips]         = useState(INITIAL_CLIPS)
  const [timelineClips, setTimelineClips] = useState(INITIAL_TIMELINE)
  const [selectedClip,  setSelectedClip]  = useState(null)
  const [dragOver,      setDragOver]      = useState(false)
  const [prompt,        setPrompt]        = useState('')
  const [aiStatus,      setAiStatus]      = useState('idle')   // idle | thinking | done
  const [aiResult,      setAiResult]      = useState('')
  const [playhead,      setPlayhead]      = useState(20)
  const [isPlaying,     setIsPlaying]     = useState(false)
  const promptRef = useRef()
  const playRef   = useRef(null)

  const totalDur = timelineClips.reduce((s, c) => Math.max(s, c.start + c.dur), 0) || 1

  /* AI prompt submit */
  const handlePromptSubmit = () => {
    if (!prompt.trim() || aiStatus === 'thinking') return
    const userPrompt = prompt
    setPrompt('')
    setAiStatus('thinking')
    setAiResult('')
    setTimeout(() => {
      setAiStatus('done')
      const idx = Math.floor(Math.random() * AI_RESPONSES.length)
      setAiResult(AI_RESPONSES[idx])
      setPlayhead(Math.floor(Math.random() * 40 + 10))
    }, 2000 + Math.random() * 800)
  }

  /* playback simulation */
  const togglePlay = () => {
    if (isPlaying) {
      clearInterval(playRef.current)
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      playRef.current = setInterval(() => {
        setPlayhead(p => {
          if (p >= totalDur) { clearInterval(playRef.current); setIsPlaying(false); return 0 }
          return p + 0.5
        })
      }, 100)
    }
  }

  /* timeline click to scrub */
  const handleTimelineClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = (e.clientX - rect.left) / rect.width
    setPlayhead(pct * totalDur)
  }

  /* insert clip to timeline */
  const insertClipToTimeline = (clip) => {
    const lastEnd = timelineClips.reduce((s, c) => Math.max(s, c.start + c.dur), 0)
    const colors  = ['#c9a84c','#2dd4bf','#a78bfa','#f87171','#60a5fa','#34d399']
    const color   = colors[timelineClips.length % colors.length]
    const dur     = parseInt(clip.dur.split(':')[0]) * 60 + parseInt(clip.dur.split(':')[1])
    const scaledDur = Math.round(dur / 10)
    setTimelineClips(prev => [
      ...prev,
      { id: clip.id + Date.now(), name: clip.name.replace('.mp4',''), color, start: lastEnd, dur: Math.max(scaledDur, 5) }
    ])
  }

  const timecodeDisplay = () => {
    const s = Math.floor(playhead)
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `00:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── TOP: three-panel layout ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── LEFT: Project Panel ── */}
        <div className="w-52 shrink-0 border-r border-white/8 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-widest uppercase text-white/25">Project</p>
            <button className="text-[10px] text-[#e8c96a]/60 hover:text-[#e8c96a] transition-colors">+ Import</button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {/* bins */}
            <p className="text-[9px] font-bold tracking-widest uppercase text-white/20 px-1 mb-2">Media Bins</p>
            {[
              { icon:'📁', label:'Raw Clips', count: clips.length },
              { icon:'🎵', label:'Music',     count: 3 },
              { icon:'🎬', label:'Graphics',  count: 2 },
              { icon:'🔊', label:'SFX',       count: 5 },
            ].map(b => (
              <div key={b.label}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer text-white/40 hover:text-white/70 text-xs transition-colors justify-between">
                <span>{b.icon} {b.label}</span>
                <span className="text-[9px] opacity-40">{b.count}</span>
              </div>
            ))}

            <div className="border-t border-white/8 my-2" />
            <p className="text-[9px] font-bold tracking-widest uppercase text-white/20 px-1 mb-2">Clips</p>

            {clips.map(clip => (
              <div
                key={clip.id}
                onClick={() => setSelectedClip(clip)}
                className={cx(
                  'px-2 py-2 rounded-lg cursor-pointer text-xs transition-all',
                  selectedClip?.id === clip.id
                    ? 'bg-[#c9a84c]/10 border border-[#c9a84c]/25 text-[#e8c96a]'
                    : 'hover:bg-white/[0.04] text-white/40 hover:text-white/70 border border-transparent'
                )}
              >
                <div className="font-semibold truncate text-[10px]">{clip.name.replace('.mp4','')}</div>
                <div className="text-[9px] opacity-50 mt-0.5 flex gap-2">
                  <span>{clip.dur}</span>
                  <span>{clip.res}</span>
                </div>
              </div>
            ))}

            {/* drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false) }}
              className={cx(
                'mt-2 rounded-xl border-dashed border p-3 text-center cursor-pointer transition-all',
                dragOver ? 'border-[#c9a84c]/60 bg-[#c9a84c]/[0.07]' : 'border-white/10 hover:border-white/25'
              )}
            >
              <p className="text-[9px] text-white/25">+ Drop clips here</p>
            </div>
          </div>
        </div>

        {/* ── CENTER: Program Monitor ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 bg-black/50 flex items-center justify-center relative overflow-hidden">
            {/* fake video frame */}
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at center,#1a1a2e 0%,#080810 100%)' }}
            />
            {/* cinematic bars */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-black z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-black z-10 pointer-events-none" />
            {/* simulated scene */}
            <div className="absolute inset-8 pointer-events-none">
              <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse 60% 80% at 40% 50%,hsl(40,30%,25%) 0%,transparent 70%)' }} />
              <div className="absolute inset-0 opacity-15" style={{ background: 'radial-gradient(ellipse 40% 60% at 65% 35%,hsl(220,20%,30%) 0%,transparent 70%)' }} />
              <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(ellipse 30% 40% at 55% 60%,hsl(10,20%,25%) 0%,transparent 60%)' }} />
            </div>

            {/* timecode */}
            <div className="absolute bottom-10 left-4 text-[10px] font-mono text-white/35 z-20">
              {timecodeDisplay()} · 4K 24fps
            </div>

            {/* status badge */}
            <div className="absolute top-10 right-4 z-20">
              <Badge variant={isPlaying ? 'teal' : 'gold'}>{isPlaying ? '● PLAYING' : 'PREVIEW'}</Badge>
            </div>

            {/* AI thinking overlay */}
            {aiStatus === 'thinking' && (
              <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-3 z-30">
                <div className="w-10 h-10 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#e8c96a] text-sm font-bold">AI Processing…</p>
                <p className="text-white/30 text-xs">Analyzing clips and building edit</p>
              </div>
            )}

            {/* play button overlay */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-20 group"
            >
              <div className="w-14 h-14 rounded-full bg-black/50 border border-white/20 flex items-center justify-center group-hover:bg-black/70 transition-colors">
                <span className="text-white text-xl ml-1">{isPlaying ? '⏸' : '▶'}</span>
              </div>
            </button>
          </div>

          {/* selected clip info bar */}
          {selectedClip && (
            <div className="border-t border-white/8 px-4 py-2 flex items-center gap-4 text-xs shrink-0 bg-black/20">
              <span className="text-white/60 font-semibold truncate">{selectedClip.name}</span>
              <span className="text-white/25 shrink-0">{selectedClip.dur}</span>
              <span className="text-white/25 shrink-0">{selectedClip.res} · {selectedClip.fps}</span>
              <span className="text-white/25 shrink-0">{selectedClip.size}</span>
              <button
                onClick={() => insertClipToTimeline(selectedClip)}
                className="ml-auto px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:border-white/25 transition-all text-[10px] font-bold shrink-0"
              >
                Insert to Timeline
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT: Color + Effects Panel ── */}
        <div className="w-52 shrink-0 border-l border-white/8 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-[10px] font-bold tracking-widest uppercase text-white/25">Color / Effects</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Lumetri color wheels */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-3">Lumetri Color</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <ColorWheel label="Lift"  offsetX={-3} offsetY={2}  hue={200} />
                <ColorWheel label="Gamma" offsetX={0}  offsetY={-3} hue={40}  />
                <ColorWheel label="Gain"  offsetX={3}  offsetY={2}  hue={160} />
              </div>

              {/* sliders */}
              {[
                { label:'Exposure',    val:52, color:'from-blue-900 to-white' },
                { label:'Contrast',    val:65, color:'from-black to-white' },
                { label:'Saturation',  val:48, color:'from-gray-400 to-rose-400' },
                { label:'Temperature', val:58, color:'from-sky-400 to-amber-400' },
                { label:'Highlights',  val:38, color:'from-white/20 to-white/60' },
                { label:'Shadows',     val:42, color:'from-black/60 to-gray-500' },
              ].map(({ label, val, color }) => (
                <div key={label} className="mb-2">
                  <div className="flex justify-between text-[9px] text-white/30 mb-1">
                    <span>{label}</span>
                    <span>{val}%</span>
                  </div>
                  <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className={cx('h-full rounded-full bg-gradient-to-r', color)}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/8 pt-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-2">Applied Effects</p>
              {[
                { name:'Warp Stabilizer', active:true },
                { name:'Auto Reframe',    active:true },
                { name:'Noise Reduction', active:true },
                { name:'Lens Correction', active:false },
                { name:'Vignette',        active:false },
              ].map(e => (
                <div key={e.name} className="flex items-center gap-2 py-1 cursor-pointer group">
                  <div className={cx('w-1.5 h-1.5 rounded-full transition-colors',
                    e.active ? 'bg-[#2dd4bf]' : 'bg-white/15 group-hover:bg-white/30')} />
                  <span className={cx('text-[10px] transition-colors',
                    e.active ? 'text-white/45' : 'text-white/20 group-hover:text-white/40')}>{e.name}</span>
                </div>
              ))}
            </div>

            {/* LUT preset */}
            <div className="border-t border-white/8 pt-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-2">LUT Preset</p>
              <div className="grid grid-cols-3 gap-1">
                {['Cinematic','Golden','Cool','Matte','Warm','B&W'].map((lut, i) => (
                  <button
                    key={lut}
                    className={cx(
                      'rounded-lg p-1.5 text-[8px] font-bold border transition-all',
                      i === 0
                        ? 'border-[#c9a84c]/40 bg-[#c9a84c]/10 text-[#e8c96a]'
                        : 'border-white/8 text-white/25 hover:border-white/20 hover:text-white/50'
                    )}
                  >
                    {lut}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Command Bar ── */}
      <div className="border-t border-white/8 px-4 py-2 shrink-0 bg-black/20">
        {aiResult && (
          <div className="mb-2 px-3 py-2 rounded-xl bg-[#c9a84c]/[0.07] border border-[#c9a84c]/20 text-[11px] text-[#e8c96a] leading-relaxed">
            {aiResult}
          </div>
        )}

        {/* quick prompts */}
        {aiStatus === 'idle' && !aiResult && (
          <div className="flex gap-1.5 mb-2 overflow-x-auto pb-0.5">
            {QUICK_PROMPTS.map(qp => (
              <button
                key={qp}
                onClick={() => { setPrompt(qp); promptRef.current?.focus() }}
                className="shrink-0 text-[9px] px-2 py-1 rounded-full border border-white/8 text-white/25 hover:border-[#c9a84c]/30 hover:text-[#e8c96a]/70 transition-all font-mono whitespace-nowrap"
              >
                {qp.length > 38 ? qp.slice(0,38)+'…' : qp}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-[#e8c96a] text-sm shrink-0 select-none">✦</span>
          <input
            ref={promptRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePromptSubmit()}
            placeholder='Describe what you want — e.g. "Create a 90-second highlight reel with warm tones and beat-synced cuts"'
            className="flex-1 bg-transparent text-white/70 text-xs placeholder:text-white/20 outline-none font-mono min-w-0"
          />
          <button
            onClick={handlePromptSubmit}
            disabled={aiStatus === 'thinking' || !prompt.trim()}
            className={cx(
              'px-4 py-1.5 rounded-xl text-xs font-black transition-all shrink-0',
              aiStatus === 'thinking' || !prompt.trim()
                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                : 'gold-btn'
            )}
          >
            {aiStatus === 'thinking' ? '…' : 'Run ✦'}
          </button>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="border-t border-white/8 shrink-0" style={{ height: '96px' }}>
        {/* timeline toolbar */}
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-white/5 bg-black/20">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">Timeline</p>
          <div className="flex gap-0.5 ml-3">
            {[
              { icon:'⏮', action:() => { setPlayhead(0); setIsPlaying(false) } },
              { icon:'⏪', action:() => setPlayhead(p => Math.max(0, p-5)) },
              { icon: isPlaying ? '⏸' : '▶', action: togglePlay },
              { icon:'⏩', action:() => setPlayhead(p => Math.min(totalDur, p+5)) },
              { icon:'⏭', action:() => { setPlayhead(totalDur); setIsPlaying(false) } },
            ].map(({ icon, action }, i) => (
              <button
                key={i}
                onClick={action}
                className="w-7 h-7 flex items-center justify-center text-xs text-white/30 hover:text-white/70 hover:bg-white/[0.05] rounded transition-all"
              >
                {icon}
              </button>
            ))}
          </div>
          <span className="text-[9px] font-mono text-white/20 ml-2">{timecodeDisplay()}</span>
          <div className="ml-auto flex gap-1">
            {['V1','V2','A1','A2'].map(track => (
              <span key={track} className="text-[8px] font-mono text-white/20 px-1.5 py-0.5 border border-white/8 rounded">{track}</span>
            ))}
          </div>
        </div>

        {/* track area */}
        <div
          className="relative mx-4 my-1.5 h-12 bg-white/[0.02] rounded-lg border border-white/6 overflow-hidden cursor-pointer"
          onClick={handleTimelineClick}
        >
          {/* time grid */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i}
              className="absolute top-0 bottom-0 border-l border-white/[0.04]"
              style={{ left: `${(i / 12) * 100}%` }}
            />
          ))}

          {/* clips */}
          {timelineClips.map(clip => (
            <div
              key={clip.id}
              className="absolute top-1 bottom-1 rounded-md flex items-center px-2 overflow-hidden hover:brightness-110 transition-all select-none"
              style={{
                left:  `${(clip.start / totalDur) * 100}%`,
                width: `${(clip.dur   / totalDur) * 100}%`,
                background: clip.color + '2a',
                borderLeft: `2px solid ${clip.color}`,
              }}
            >
              <span className="text-[8px] font-bold truncate" style={{ color: clip.color }}>
                {clip.name}
              </span>
            </div>
          ))}

          {/* playhead */}
          <div
            className="absolute top-0 bottom-0 w-px bg-white/80 pointer-events-none z-10"
            style={{ left: `${(playhead / totalDur) * 100}%` }}
          >
            <div className="w-2.5 h-2.5 bg-white rounded-full -translate-x-1/2 shadow-md" />
          </div>
        </div>
      </div>
    </div>
  )
}
