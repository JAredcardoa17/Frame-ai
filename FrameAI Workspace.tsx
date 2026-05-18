import { useState, useRef, useCallback } from "react";

const cx = (...cs) => cs.filter(Boolean).join(" ");

/* ── mock data ── */
const MOCK_PHOTOS = [
  { id:1, name:"IMG_4821.RAW", size:"24.1 MB", status:"analyzing", score:null, w:4, h:3 },
  { id:2, name:"IMG_4822.RAW", size:"23.8 MB", status:"approved", score:94, w:3, h:4 },
  { id:3, name:"IMG_4823.RAW", size:"22.5 MB", status:"review", score:31, reason:"Motion blur", w:4, h:3 },
  { id:4, name:"IMG_4824.RAW", size:"25.0 MB", status:"approved", score:88, w:4, h:3 },
  { id:5, name:"IMG_4825.RAW", size:"21.3 MB", status:"review", score:18, reason:"Eyes closed", w:3, h:4 },
  { id:6, name:"IMG_4826.RAW", size:"24.7 MB", status:"approved", score:91, w:4, h:3 },
  { id:7, name:"IMG_4827.RAW", size:"23.1 MB", status:"analyzing", score:null, w:3, h:4 },
  { id:8, name:"IMG_4828.RAW", size:"22.9 MB", status:"approved", score:96, w:4, h:3 },
  { id:9, name:"IMG_4829.RAW", size:"20.8 MB", status:"review", score:22, reason:"Overexposed", w:4, h:3 },
  { id:10, name:"IMG_4830.RAW", size:"24.2 MB", status:"approved", score:85, w:3, h:4 },
  { id:11, name:"IMG_4831.RAW", size:"23.5 MB", status:"approved", score:90, w:4, h:3 },
  { id:12, name:"IMG_4832.RAW", size:"21.9 MB", status:"review", score:15, reason:"Accidental fire", w:4, h:3 },
];

const MOCK_CLIPS = [
  { id:1, name:"ceremony_wide_01.mp4", dur:"4:32", size:"2.1 GB", fps:"24fps", res:"4K" },
  { id:2, name:"ceremony_close_01.mp4", dur:"3:18", size:"1.6 GB", fps:"24fps", res:"4K" },
  { id:3, name:"reception_drone_01.mp4", dur:"2:45", size:"1.3 GB", fps:"60fps", res:"4K" },
  { id:4, name:"speeches_cam1.mp4", dur:"12:04", size:"5.8 GB", fps:"24fps", res:"1080p" },
  { id:5, name:"firstdance_wide.mp4", dur:"5:22", size:"2.5 GB", fps:"24fps", res:"4K" },
];

const INTENT_QUESTIONS = [
  { q: "What type of shoot?", opts: ["Wedding","Portrait","Event","Commercial","Street","Other"] },
  { q: "Target editing style?", opts: ["Bright & Airy","Moody & Dark","True to Life","Film Emulation","Custom"] },
  { q: "Primary delivery format?", opts: ["Print (High-res)","Web / Social","Client Gallery","Archive"] },
  { q: "Acceptable keeper rate?", opts: ["Top 10%","Top 25%","Top 50%","Keep All Viable"] },
  { q: "Eye detection priority?", opts: ["Critical","Important","Not Applicable"] },
  { q: "Exposure tolerance?", opts: ["Strict ±0.5EV","Moderate ±1EV","Lenient ±2EV"] },
];

/* ── palette ── */
const GOLD = "#c9a84c";
const GOLDT = "#e8c96a";

/* ── tiny components ── */
function Badge({ children, variant = "default" }) {
  const v = {
    default: "bg-white/10 text-white/50 border-white/15",
    gold: "bg-[#c9a84c]/15 text-[#e8c96a] border-[#c9a84c]/30",
    teal: "bg-[#2dd4bf]/10 text-[#2dd4bf] border-[#2dd4bf]/25",
    rose: "bg-rose-500/15 text-rose-300 border-rose-500/25",
    sky: "bg-sky-400/10 text-sky-300 border-sky-400/20",
  }[variant];
  return <span className={cx("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest border uppercase", v)}>{children}</span>;
}

function PhotoThumb({ photo }) {
  const colors = {
    approved: ["bg-emerald-900/40","border-[#2dd4bf]/25","text-[#2dd4bf]"],
    review:   ["bg-rose-900/30","border-rose-500/25","text-rose-400"],
    analyzing:["bg-white/[0.03]","border-white/10","text-white/20"],
  }[photo.status];

  const hues = [200,220,240,260,280,40,60,80,100,120,160,180];
  const hue = hues[photo.id % hues.length];

  return (
    <div className={cx("rounded-xl border overflow-hidden relative group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg", colors[0], colors[1])}
      style={{aspectRatio: photo.w+"/"+photo.h}}>
      {/* simulated photo bg */}
      <div className="absolute inset-0" style={{background:`linear-gradient(135deg,hsl(${hue},30%,12%) 0%,hsl(${hue+30},25%,18%) 100%)`}} />
      {/* simulated subject */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <div className="rounded-full border border-white/20" style={{width:"40%",height:"60%",background:`radial-gradient(circle,hsl(${hue},40%,60%) 0%,transparent 70%)`}} />
      </div>
      {/* overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      {/* status */}
      <div className="absolute top-1.5 right-1.5">
        {photo.status === "approved" && <div className="w-4 h-4 rounded-full bg-[#2dd4bf] flex items-center justify-center text-[8px] font-black text-black">✓</div>}
        {photo.status === "review" && <div className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-[8px] font-black text-white">!</div>}
        {photo.status === "analyzing" && <div className="w-4 h-4 rounded-full bg-[#c9a84c]/80 flex items-center justify-center"><div className="w-2 h-2 border border-black border-t-transparent rounded-full animate-spin" /></div>}
      </div>
      {/* score */}
      {photo.score !== null && (
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-end justify-between">
          <span className="text-[9px] font-bold text-white/50 truncate">{photo.name.split(".")[0]}</span>
          <span className={cx("text-[9px] font-black", photo.score>70?"text-[#2dd4bf]":"text-rose-400")}>{photo.score}</span>
        </div>
      )}
      {photo.status === "analyzing" && (
        <div className="absolute bottom-1.5 left-1.5 right-1.5">
          <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#c9a84c] rounded-full animate-pulse" style={{width:"60%"}} />
          </div>
        </div>
      )}
      {photo.reason && (
        <div className="absolute bottom-1.5 left-1.5 right-1.5">
          <span className="text-[9px] font-bold text-rose-300">{photo.reason}</span>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PHOTO WORKSPACE
══════════════════════════════════════════════════ */
function PhotoWorkspace() {
  const [stage, setStage] = useState("drop"); // drop | dialog | curating | results
  const [dragOver, setDragOver] = useState(false);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [progress, setProgress] = useState(0);
  const [filter, setFilter] = useState("all");
  const fileRef = useRef();

  const startImport = useCallback(() => {
    setStage("dialog");
    setCurrentQ(0);
    setAnswers({});
  }, []);

  const handleAnswer = (opt) => {
    const next = { ...answers, [currentQ]: opt };
    setAnswers(next);
    if (currentQ < INTENT_QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setStage("curating");
      setProgress(0);
      let p = 0;
      const iv = setInterval(() => {
        p += Math.random() * 8 + 3;
        if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => setStage("results"), 400); }
        setProgress(Math.min(p, 100));
      }, 120);
    }
  };

  const approved = MOCK_PHOTOS.filter(p => p.status === "approved");
  const review   = MOCK_PHOTOS.filter(p => p.status === "review");
  const analyzing= MOCK_PHOTOS.filter(p => p.status === "analyzing");

  const displayed = filter === "approved" ? approved : filter === "review" ? review : MOCK_PHOTOS;

  /* DROP ZONE */
  if (stage === "drop") return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); startImport(); }}
        onClick={() => { fileRef.current?.click(); }}
        className={cx(
          "w-full max-w-xl rounded-3xl border-2 border-dashed flex flex-col items-center justify-center py-20 px-8 cursor-pointer transition-all duration-300 relative overflow-hidden",
          dragOver
            ? "border-[#c9a84c] bg-[#c9a84c]/[0.07] shadow-[0_0_60px_-10px_rgba(201,168,76,0.3)]"
            : "border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]"
        )}>
        <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={startImport} />
        {/* decorative rings */}
        <div className={cx("absolute inset-0 rounded-3xl transition-opacity duration-300", dragOver?"opacity-100":"opacity-0")}>
          <div className="absolute inset-4 rounded-2xl border border-[#c9a84c]/20" />
          <div className="absolute inset-8 rounded-xl border border-[#c9a84c]/10" />
        </div>
        <div className={cx("w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300",
          dragOver?"bg-[#c9a84c]/20 scale-110":"bg-white/[0.05]")}>
          <span className="text-4xl">{dragOver ? "✦" : "◻"}</span>
        </div>
        <p className="text-white font-black text-xl mb-2 text-center">
          {dragOver ? "Release to Import" : "Drop Photos Here"}
        </p>
        <p className="text-white/35 text-sm text-center mb-6">Drag a folder of RAW, JPEG, or HEIC files — any batch size</p>
        <div className="flex gap-2 flex-wrap justify-center">
          {["RAW","JPEG","HEIC","PNG","TIFF"].map(f => (
            <span key={f} className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/30 font-mono">{f}</span>
          ))}
        </div>
        <p className="text-[11px] text-white/20 mt-6">or click to browse files</p>
      </div>
      {/* recent import hint */}
      <div className="mt-6 flex items-center gap-3 text-xs text-white/25">
        <span>Recent:</span>
        {["Wedding_May2026","Portrait_Session_12","Event_Gala"].map(r => (
          <button key={r} onClick={startImport} className="px-3 py-1 rounded-full border border-white/8 hover:border-[#c9a84c]/30 hover:text-[#e8c96a] transition-colors">{r}</button>
        ))}
      </div>
    </div>
  );

  /* INTENT DIALOG */
  if (stage === "dialog") {
    const q = INTENT_QUESTIONS[currentQ];
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-lg">
          {/* progress dots */}
          <div className="flex gap-2 justify-center mb-8">
            {INTENT_QUESTIONS.map((_, i) => (
              <div key={i} className={cx("h-1 rounded-full transition-all duration-300",
                i < currentQ ? "w-6 bg-[#c9a84c]" : i === currentQ ? "w-10 bg-[#e8c96a]" : "w-6 bg-white/15")} />
            ))}
          </div>
          {/* eyebrow */}
          <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#c9a84c] text-center mb-2">
            AI Intent Dialog · {currentQ + 1} of {INTENT_QUESTIONS.length}
          </p>
          <h2 className="text-2xl font-black text-white text-center mb-8">{q.q}</h2>
          {/* options */}
          <div className="grid grid-cols-2 gap-3">
            {q.opts.map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)}
                className={cx(
                  "rounded-2xl border p-4 text-left transition-all duration-200 group",
                  answers[currentQ] === opt
                    ? "border-[#c9a84c]/50 bg-[#c9a84c]/15 shadow-[0_0_20px_-5px_rgba(201,168,76,0.3)]"
                    : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
                )}>
                <span className={cx("text-sm font-bold transition-colors",
                  answers[currentQ] === opt ? "text-[#e8c96a]" : "text-white/70 group-hover:text-white")}>{opt}</span>
              </button>
            ))}
          </div>
          {currentQ > 0 && (
            <button onClick={() => setCurrentQ(currentQ - 1)}
              className="mt-6 w-full text-center text-xs text-white/25 hover:text-white/50 transition-colors">
              ← Back
            </button>
          )}
        </div>
      </div>
    );
  }

  /* CURATING */
  if (stage === "curating") return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center mx-auto mb-6">
          <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-[11px] font-bold tracking-widest uppercase text-[#c9a84c] mb-2">AI Analysis Running</p>
        <h2 className="text-xl font-black text-white mb-2">Analyzing {MOCK_PHOTOS.length} photos</h2>
        <p className="text-white/35 text-sm mb-8">Scoring sharpness, exposure, composition, eye detection…</p>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-gradient-to-r from-[#c9a84c] to-[#e8c96a] rounded-full transition-all duration-100"
            style={{width: progress + "%"}} />
        </div>
        <p className="text-white/30 text-xs font-mono">{Math.round(progress)}% complete</p>
      </div>
    </div>
  );

  /* RESULTS */
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* toolbar */}
      <div className="px-6 py-3 border-b border-white/8 flex items-center gap-3 shrink-0">
        <div className="flex gap-1 border border-white/10 rounded-xl p-1">
          {[["all","All","text-white/50"],["approved","✓ Approved","text-[#2dd4bf]"],["review","⚑ Review","text-rose-400"]].map(([key,label,tc]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={cx("px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                filter===key ? "bg-white/10 text-white" : cx("text-white/30 hover:text-white/60", tc))}>
              {label}
              {key==="approved" && <span className="ml-1.5 text-[10px] opacity-60">{approved.length}</span>}
              {key==="review" && <span className="ml-1.5 text-[10px] opacity-60">{review.length}</span>}
              {key==="all" && <span className="ml-1.5 text-[10px] opacity-60">{MOCK_PHOTOS.length}</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <Badge variant="teal">{approved.length} Approved</Badge>
          <Badge variant="rose">{review.length} Flagged</Badge>
          {analyzing.length>0 && <Badge variant="gold">{analyzing.length} Analyzing</Badge>}
        </div>
        <button onClick={() => setStage("drop")}
          className="text-xs text-white/25 hover:text-white/50 transition-colors ml-2">+ Import More</button>
      </div>
      {/* grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-2 space-y-2">
          {displayed.map(photo => (
            <div key={photo.id} className="break-inside-avoid mb-2">
              <PhotoThumb photo={photo} />
            </div>
          ))}
        </div>
      </div>
      {/* bottom action bar */}
      <div className="px-6 py-3 border-t border-white/8 flex items-center gap-3 shrink-0">
        <p className="text-white/30 text-xs">{approved.length} photos ready for export</p>
        <div className="flex gap-2 ml-auto">
          <button className="px-4 py-2 rounded-xl border border-white/15 text-white/50 text-xs font-bold hover:border-white/30 hover:text-white/70 transition-all">
            Apply Style Preset
          </button>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#a87d30] text-black text-xs font-black hover:brightness-110 transition-all shadow-[0_0_20px_-5px_rgba(201,168,76,0.5)]">
            Export Approved ✦
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   VIDEO WORKSPACE
══════════════════════════════════════════════════ */
function VideoWorkspace() {
  const [clips, setClips] = useState(MOCK_CLIPS);
  const [dragOver, setDragOver] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [aiStatus, setAiStatus] = useState("idle"); // idle | thinking | done
  const [aiResult, setAiResult] = useState("");
  const [selectedClip, setSelectedClip] = useState(null);
  const [timelineClips, setTimelineClips] = useState([
    { id:1, name:"ceremony_wide", color:"#c9a84c", start:0, dur:18 },
    { id:3, name:"drone_01", color:"#2dd4bf", start:18, dur:11 },
    { id:5, name:"firstdance", color:"#a78bfa", start:29, dur:22 },
    { id:2, name:"ceremony_close", color:"#f87171", start:51, dur:14 },
  ]);
  const [playhead, setPlayhead] = useState(20);
  const promptRef = useRef();

  const handlePromptSubmit = () => {
    if (!prompt.trim()) return;
    setAiStatus("thinking");
    setAiResult("");
    setTimeout(() => {
      setAiStatus("done");
      setAiResult("✦ Applied: Beat-synced cuts every 3.2s · Warm cinematic LUT added · Lower third queued at 0:08 · Audio ducked under voiceover tracks");
      setPlayhead(35);
    }, 2200);
  };

  const totalDur = timelineClips.reduce((s, c) => Math.max(s, c.start + c.dur), 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* top panels */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Project panel */}
        <div className="w-52 shrink-0 border-r border-white/8 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-[10px] font-bold tracking-widest uppercase text-white/25">Project Panel</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {/* bins */}
            <div className="text-[9px] font-bold tracking-widest uppercase text-white/20 px-1 mb-2">Media Bins</div>
            {["📁 Raw Clips","📁 Music","📁 Graphics","📁 SFX"].map(b => (
              <div key={b} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer text-white/40 hover:text-white/70 text-xs transition-colors">{b}</div>
            ))}
            <div className="border-t border-white/8 my-2" />
            <div className="text-[9px] font-bold tracking-widest uppercase text-white/20 px-1 mb-2">Imported Clips</div>
            {clips.map(clip => (
              <div key={clip.id} onClick={() => setSelectedClip(clip)}
                className={cx("px-2 py-2 rounded-lg cursor-pointer text-xs transition-all",
                  selectedClip?.id === clip.id ? "bg-[#c9a84c]/10 border border-[#c9a84c]/25 text-[#e8c96a]" : "hover:bg-white/[0.04] text-white/40 hover:text-white/70")}>
                <div className="font-semibold truncate text-[10px]">{clip.name}</div>
                <div className="text-[9px] opacity-50 mt-0.5">{clip.dur} · {clip.res}</div>
              </div>
            ))}
            {/* drop zone mini */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); }}
              className={cx("mt-2 rounded-xl border-dashed border p-3 text-center cursor-pointer transition-all",
                dragOver ? "border-[#c9a84c]/60 bg-[#c9a84c]/[0.07]" : "border-white/10 hover:border-white/25")}>
              <p className="text-[9px] text-white/25">+ Drop clips here</p>
            </div>
          </div>
        </div>

        {/* Program monitor */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 bg-black/40 flex items-center justify-center relative overflow-hidden">
            {/* fake video frame */}
            <div className="absolute inset-0" style={{background:"radial-gradient(ellipse at center,#1a1a2e 0%,#0a0a10 100%)"}}>
              {/* cinematic bars */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-black" />
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-black" />
              {/* fake scene */}
              <div className="absolute inset-8 flex items-center justify-center">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 rounded opacity-40" style={{background:"radial-gradient(ellipse 60% 80% at 40% 50%,hsl(40,30%,25%) 0%,transparent 70%)"}} />
                  <div className="absolute inset-0 rounded opacity-20" style={{background:"radial-gradient(ellipse 40% 60% at 60% 40%,hsl(220,20%,30%) 0%,transparent 70%)"}} />
                </div>
              </div>
            </div>
            {/* overlay info */}
            <div className="absolute bottom-10 left-4 text-[10px] font-mono text-white/30">
              00:{String(Math.floor(playhead)).padStart(2,"0")}:00 · 4K 24fps
            </div>
            <div className="absolute top-10 right-4">
              <Badge variant="gold">PREVIEW</Badge>
            </div>
            {aiStatus === "thinking" && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#e8c96a] text-sm font-bold">AI Processing…</p>
              </div>
            )}
          </div>
          {/* source clip info */}
          {selectedClip && (
            <div className="border-t border-white/8 px-4 py-2 flex items-center gap-4 text-xs shrink-0">
              <span className="text-white/60 font-semibold truncate">{selectedClip.name}</span>
              <span className="text-white/25">{selectedClip.dur}</span>
              <span className="text-white/25">{selectedClip.res} · {selectedClip.fps}</span>
              <span className="text-white/25">{selectedClip.size}</span>
              <button className="ml-auto px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:border-white/25 transition-all text-[10px] font-bold">
                Insert to Timeline
              </button>
            </div>
          )}
        </div>

        {/* Effects/Color panel */}
        <div className="w-52 shrink-0 border-l border-white/8 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-[10px] font-bold tracking-widest uppercase text-white/25">Color / Effects</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Color wheels placeholder */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-3">Lumetri Color</p>
              <div className="grid grid-cols-3 gap-2">
                {["Lift","Gamma","Gain"].map((n,i) => (
                  <div key={n} className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center relative"
                      style={{background:`conic-gradient(from 0deg,hsl(${i*120},40%,15%),hsl(${i*120+60},30%,20%),hsl(${i*120+120},40%,15%),hsl(${i*120},40%,15%))`}}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60" style={{transform:`translate(${i===0?-3:i===2?3:0}px,${i===1?-3:2}px)`}} />
                    </div>
                    <span className="text-[8px] text-white/25">{n}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* sliders */}
            {[["Exposure","52%"],["Contrast","65%"],["Saturation","48%"],["Temperature","58%"]].map(([label, val]) => (
              <div key={label}>
                <div className="flex justify-between text-[9px] text-white/30 mb-1">
                  <span>{label}</span><span>{val}</span>
                </div>
                <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#c9a84c]/60 to-[#e8c96a] rounded-full" style={{width:val}} />
                </div>
              </div>
            ))}
            <div className="border-t border-white/8 pt-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-2">Applied Effects</p>
              {["Warp Stabilizer","Auto Reframe","Noise Reduction"].map(e => (
                <div key={e} className="flex items-center gap-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]" />
                  <span className="text-[10px] text-white/35">{e}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Command Bar */}
      <div className="border-t border-white/8 px-4 py-2 shrink-0">
        {aiResult && (
          <div className="mb-2 px-3 py-2 rounded-xl bg-[#c9a84c]/[0.07] border border-[#c9a84c]/20 text-[11px] text-[#e8c96a]">
            {aiResult}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[#e8c96a] text-sm shrink-0">✦</span>
          <input
            ref={promptRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handlePromptSubmit()}
            placeholder='Try: "Create a 90-second highlight reel with warm color grade and beat-synced cuts"'
            className="flex-1 bg-transparent text-white/70 text-xs placeholder:text-white/20 outline-none font-mono"
          />
          <button onClick={handlePromptSubmit}
            disabled={aiStatus==="thinking"}
            className={cx("px-4 py-1.5 rounded-xl text-xs font-black transition-all shrink-0",
              aiStatus==="thinking"
                ? "bg-white/5 text-white/20 cursor-not-allowed"
                : "bg-gradient-to-r from-[#c9a84c] to-[#a87d30] text-black hover:brightness-110 shadow-[0_0_15px_-3px_rgba(201,168,76,0.4)]")}>
            {aiStatus==="thinking" ? "…" : "Run"}
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="border-t border-white/8 h-24 shrink-0 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-1.5 border-b border-white/5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">Timeline</p>
          <div className="flex gap-1 ml-auto">
            {["⏮","⏪","▶","⏩","⏭"].map(c => (
              <button key={c} className="w-6 h-6 text-[10px] text-white/30 hover:text-white/60 transition-colors">{c}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 relative overflow-hidden px-4 py-2">
          {/* track bg */}
          <div className="h-full bg-white/[0.02] rounded-lg border border-white/6 relative overflow-hidden">
            {/* time grid */}
            {Array.from({length: 12}).map((_,i) => (
              <div key={i} className="absolute top-0 bottom-0 border-l border-white/5"
                style={{left: (i / 12 * 100) + "%"}} />
            ))}
            {/* clips */}
            {timelineClips.map(clip => (
              <div key={clip.id}
                className="absolute top-1 bottom-1 rounded-md flex items-center px-2 overflow-hidden cursor-pointer hover:brightness-110 transition-all"
                style={{
                  left: (clip.start / totalDur * 100) + "%",
                  width: (clip.dur / totalDur * 100) + "%",
                  background: clip.color + "33",
                  borderLeft: `2px solid ${clip.color}`,
                }}>
                <span className="text-[9px] font-bold truncate" style={{color: clip.color}}>{clip.name}</span>
              </div>
            ))}
            {/* playhead */}
            <div className="absolute top-0 bottom-0 w-px bg-white/60 pointer-events-none z-10"
              style={{left: (playhead / totalDur * 100) + "%"}}>
              <div className="w-2.5 h-2.5 bg-white rounded-full -translate-x-1/2 -translate-y-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════ */
export default function App() {
  const [workspace, setWorkspace] = useState("video");

  return (
    <div className="h-screen flex flex-col overflow-hidden text-white" style={{
      fontFamily:"'Sora','DM Sans',system-ui,sans-serif",
      background:"#080810"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.2);border-radius:2px}
        .mesh{background:radial-gradient(ellipse 80% 50% at 20% 0%,rgba(201,168,76,0.05) 0%,transparent 50%),radial-gradient(ellipse 60% 40% at 80% 100%,rgba(45,212,191,0.03) 0%,transparent 50%),#080810}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        .fade{animation:fadeIn 0.25s ease both}
      `}</style>

      <div className="mesh h-full flex flex-col overflow-hidden">
        {/* ── Titlebar ── */}
        <header className="shrink-0 border-b border-white/[0.07] bg-black/50 backdrop-blur flex items-center px-4 h-11 gap-4">
          {/* logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#c9a84c] to-[#8a6520] flex items-center justify-center shadow-[0_0_12px_rgba(201,168,76,0.4)]">
              <span className="text-black text-[9px] font-black">F</span>
            </div>
            <span className="text-white font-black text-sm tracking-tight">FrameAI</span>
          </div>

          {/* workspace toggle — center */}
          <div className="flex-1 flex justify-center">
            <div className="flex gap-1 p-1 rounded-xl border border-white/10 bg-white/[0.03]">
              <button
                onClick={() => setWorkspace("video")}
                className={cx("flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200",
                  workspace === "video"
                    ? "bg-[#c9a84c]/20 border border-[#c9a84c]/40 text-[#e8c96a] shadow-[0_0_12px_-2px_rgba(201,168,76,0.3)]"
                    : "text-white/30 hover:text-white/60")}>
                <span>▶</span> Video
              </button>
              <button
                onClick={() => setWorkspace("photo")}
                className={cx("flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200",
                  workspace === "photo"
                    ? "bg-[#c9a84c]/20 border border-[#c9a84c]/40 text-[#e8c96a] shadow-[0_0_12px_-2px_rgba(201,168,76,0.3)]"
                    : "text-white/30 hover:text-white/60")}>
                <span>◻</span> Photo
              </button>
            </div>
          </div>

          {/* right controls */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="gold">{workspace === "video" ? "Video Workspace" : "Photo Workspace"}</Badge>
            <div className="w-6 h-6 rounded-full bg-[#c9a84c]/20 border border-[#c9a84c]/30 flex items-center justify-center text-[9px] text-[#e8c96a] font-black">J</div>
          </div>
        </header>

        {/* ── Content ── */}
        <div key={workspace} className="flex-1 flex flex-col overflow-hidden fade">
          {workspace === "photo" ? <PhotoWorkspace /> : <VideoWorkspace />}
        </div>
      </div>
    </div>
  );
}
