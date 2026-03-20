import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo
} from 'react';
import {
  FileText, Image, File, Link2, BarChart2, CheckSquare, Mic,
  Plus, Search, Settings, Download, Upload, Pin, Trash2, Copy,
  X, Check, Play, Square, Moon, Sun, Maximize2, ChevronDown,
  ChevronRight, MoreHorizontal, Smile, Tag, Volume2, ExternalLink,
  Users, Activity, Filter, SortAsc, RefreshCw, AlertCircle
} from 'lucide-react';

/* ─────────────────────────── CONSTANTS ─────────────────────────── */

const EMOJI_LIST = [
  '😀','😂','😍','🥰','😎','🤔','😮','😴','🥳','🤩',
  '👍','❤️','🔥','💡','⭐','🎉','🚀','💎','🌈','🎯',
  '🐶','🐱','🦊','🐼','🦁','🐸','🦋','🌸','🍕','🎮',
  '📝','📸','🎵','💻','📱','🏆','💪','🙌','👏','🤝',
  '🌙','☀️','⚡','🌊','🍀','🎨','🎭','🎪','🏄','🧩',
  '😅','🤣','😇','🥺','😤','🤯','🤗','😏','🙄','😜',
];

const TAG_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316',
  '#eab308','#22c55e','#06b6d4','#3b82f6','#64748b',
];

const ACCENT_COLORS = [
  { name: 'Indigo',  value: '#6366f1' },
  { name: 'Purple',  value: '#8b5cf6' },
  { name: 'Pink',    value: '#ec4899' },
  { name: 'Cyan',    value: '#06b6d4' },
  { name: 'Green',   value: '#22c55e' },
  { name: 'Orange',  value: '#f97316' },
];

const CARD_TYPES = [
  { id: 'note',      label: 'Note',      Icon: FileText  },
  { id: 'image',     label: 'Image',     Icon: Image     },
  { id: 'file',      label: 'Fichier',   Icon: File      },
  { id: 'link',      label: 'Lien',      Icon: Link2     },
  { id: 'poll',      label: 'Sondage',   Icon: BarChart2 },
  { id: 'checklist', label: 'Tâches',    Icon: CheckSquare },
  { id: 'voice',     label: 'Vocal',     Icon: Mic       },
];

const REACTIONS = ['👍', '❤️', '🔥', '💡'];

/* ─────────────────────────── HELPERS ───────────────────────────── */

const uuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const formatDate = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const getFileIcon = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase();
  const map = { pdf:'📄', doc:'📝', docx:'📝', xls:'📊', xlsx:'📊',
    ppt:'📊', pptx:'📊', zip:'🗜️', rar:'🗜️', mp4:'🎥', mp3:'🎵',
    wav:'🎵', txt:'📄', csv:'📊', json:'⚙️', js:'⚙️', ts:'⚙️' };
  return map[ext] || '📎';
};

/* Storage abstraction — uses window.storage if available, else localStorage */
const storage = {
  get(key) {
    try {
      if (window.storage?.getItem) return JSON.parse(window.storage.getItem(key));
      if (window.localStorage) return JSON.parse(window.localStorage.getItem(key));
    } catch { return null; }
    return null;
  },
  set(key, val) {
    try {
      const s = JSON.stringify(val);
      if (window.storage?.setItem) { window.storage.setItem(key, s); return; }
      if (window.localStorage) window.localStorage.setItem(key, s);
    } catch { /* ignore quota errors */ }
  },
};

/* ─────────────────────────── GLOBAL CSS ────────────────────────── */

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --accent: #6366f1;
    --bg: #0d0d14;
    --surface: #13131f;
    --surface2: #1a1a2e;
    --border: rgba(255,255,255,0.07);
    --border-hover: rgba(255,255,255,0.15);
    --text: #e8e8f0;
    --text-muted: #6b6b8a;
    --text-dim: #9999b8;
    --shadow: 0 8px 32px rgba(0,0,0,0.4);
    --shadow-lg: 0 20px 60px rgba(0,0,0,0.6);
    --glass: rgba(255,255,255,0.04);
    --glass-hover: rgba(255,255,255,0.07);
    --radius: 16px;
    --radius-sm: 10px;
  }

  body.pb-light {
    --bg: #f0f0f7;
    --surface: #ffffff;
    --surface2: #f7f7ff;
    --border: rgba(0,0,0,0.08);
    --border-hover: rgba(0,0,0,0.15);
    --text: #1a1a2e;
    --text-muted: #8888aa;
    --text-dim: #5555777;
    --shadow: 0 4px 16px rgba(0,0,0,0.1);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.15);
    --glass: rgba(0,0,0,0.02);
    --glass-hover: rgba(0,0,0,0.04);
  }

  .pb-root {
    font-family: 'Inter', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    overflow-x: hidden;
  }

  .pb-root ::-webkit-scrollbar { width: 6px; height: 6px; }
  .pb-root ::-webkit-scrollbar-track { background: transparent; }
  .pb-root ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
  .pb-root ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes slideRight {
    from { transform: translateX(-100%); opacity: 0; }
    to   { transform: translateX(0);     opacity: 1; }
  }
  @keyframes slideLeft {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes toastIn {
    from { transform: translateX(120%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes confettiFall {
    0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
  @keyframes pulse {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.4; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  @keyframes recordPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
    50%      { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
  }
  @keyframes scaleIn {
    from { transform: scale(0.85); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }

  .pb-card-enter { animation: fadeSlideIn 0.35s ease both; }
  .pb-skeleton {
    background: linear-gradient(90deg, var(--surface) 25%, var(--surface2) 50%, var(--surface) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: var(--radius);
  }
  .pb-btn {
    cursor: pointer; border: none; outline: none;
    font-family: 'Inter', sans-serif;
    transition: all 0.15s ease;
  }
  .pb-btn:active { transform: scale(0.96); }
  .pb-input {
    font-family: 'Inter', sans-serif;
    background: var(--glass);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    outline: none;
    width: 100%;
    transition: border-color 0.2s;
    font-size: 14px;
  }
  .pb-input:focus { border-color: var(--accent); }
  .pb-input::placeholder { color: var(--text-muted); }

  .card-hover {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .card-hover:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.35) !important;
  }

  .pb-tab-active { background: var(--accent) !important; color: #fff !important; }

  .masonry {
    column-gap: 16px;
  }
  .masonry > * { break-inside: avoid; margin-bottom: 16px; }

  @media (min-width: 1200px) { .masonry { column-count: 3; } }
  @media (min-width: 768px) and (max-width: 1199px) { .masonry { column-count: 2; } }
  @media (max-width: 767px)  { .masonry { column-count: 1; } }

  .compact .masonry > * { margin-bottom: 10px; }
  .compact .masonry { column-gap: 10px; }
`;

/* ─────────────────────────── THEME TOKENS ──────────────────────── */

const glassCard = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

/* ───────────────────────── SUB-COMPONENTS ──────────────────────── */

/* Toast */
const Toast = memo(({ toast, onRemove }) => {
  const colors = { success:'#22c55e', error:'#ef4444', info:'#6366f1', warning:'#f97316' };
  const icons  = { success:'✓', error:'✕', info:'ℹ', warning:'⚠' };
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10,
      background: 'var(--surface2)',
      border: `1px solid ${colors[toast.type] || colors.info}40`,
      borderLeft: `3px solid ${colors[toast.type] || colors.info}`,
      borderRadius: 'var(--radius-sm)',
      padding: '12px 16px',
      minWidth: 260, maxWidth: 340,
      boxShadow: 'var(--shadow)',
      animation: 'toastIn 0.3s ease',
      fontFamily: 'Inter, sans-serif',
      fontSize: 13,
      color: 'var(--text)',
    }}>
      <span style={{ fontSize:16 }}>{icons[toast.type] || '•'}</span>
      <span style={{ flex:1 }}>{toast.message}</span>
      <button className="pb-btn" onClick={() => onRemove(toast.id)}
        style={{ color:'var(--text-muted)', fontSize:16, lineHeight:1, background:'none', padding:'2px 4px' }}>
        ×
      </button>
    </div>
  );
});

const ToastContainer = memo(({ toasts, onRemove }) => (
  <div style={{
    position:'fixed', bottom:24, right:24,
    display:'flex', flexDirection:'column', gap:8,
    zIndex:9999, pointerEvents:'none',
  }}>
    {toasts.map(t => (
      <div key={t.id} style={{ pointerEvents:'all' }}>
        <Toast toast={t} onRemove={onRemove} />
      </div>
    ))}
  </div>
));

/* Confetti */
const Confetti = memo(({ active }) => {
  if (!active) return null;
  const pieces = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    color: ['#6366f1','#ec4899','#f97316','#22c55e','#06b6d4','#eab308'][Math.floor(Math.random()*6)],
    size: 6 + Math.random() * 8,
    shape: Math.random() > 0.5 ? '50%' : '2px',
  })), []);

  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:99999, overflow:'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute',
          left: `${p.left}%`, top: -20,
          width: p.size, height: p.size,
          background: p.color,
          borderRadius: p.shape,
          animation: `confettiFall ${p.duration}s ${p.delay}s ease-in both`,
        }} />
      ))}
    </div>
  );
});

/* Emoji Picker */
const EmojiPicker = memo(({ onSelect, onClose }) => {
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position:'absolute', zIndex:1000,
      background:'var(--surface2)', border:'1px solid var(--border)',
      borderRadius:'var(--radius-sm)', padding:12,
      boxShadow:'var(--shadow-lg)',
      display:'grid', gridTemplateColumns:'repeat(10, 1fr)', gap:4,
      width: 280,
    }}>
      {EMOJI_LIST.map(e => (
        <button key={e} className="pb-btn"
          onClick={() => { onSelect(e); onClose(); }}
          style={{
            fontSize:18, background:'none', padding:'4px 2px',
            borderRadius:6, cursor:'pointer',
            transition:'background 0.15s',
          }}
          onMouseEnter={ev => ev.currentTarget.style.background='var(--glass-hover)'}
          onMouseLeave={ev => ev.currentTarget.style.background='none'}
        >{e}</button>
      ))}
    </div>
  );
});

/* Onboarding Modal */
const OnboardingModal = memo(({ onDone }) => {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('😊');
  const [step, setStep] = useState(0);

  const submit = () => {
    if (!name.trim()) return;
    onDone({ name: name.trim(), emoji });
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:10000,
      background:'rgba(0,0,0,0.7)',
      display:'flex', alignItems:'center', justifyContent:'center',
      backdropFilter:'blur(8px)',
    }}>
      <div style={{
        ...glassCard,
        background:'var(--surface2)',
        maxWidth: 420, width:'90%',
        padding: 40,
        animation: 'scaleIn 0.3s ease',
        textAlign:'center',
      }}>
        <div style={{ fontSize:56, marginBottom:16 }}>
          {step === 0 ? '👋' : emoji}
        </div>
        {step === 0 ? (
          <>
            <h2 style={{ fontFamily:'Syne', fontSize:24, fontWeight:700, marginBottom:8 }}>
              Bienvenue sur le Board !
            </h2>
            <p style={{ color:'var(--text-muted)', fontSize:14, marginBottom:28, lineHeight:1.6 }}>
              Partagez vos idées, fichiers, images et suivez vos projets ensemble.
            </p>
            <button className="pb-btn" onClick={() => setStep(1)} style={{
              background:'var(--accent)', color:'#fff',
              borderRadius: 'var(--radius-sm)', padding:'12px 32px',
              fontWeight:600, fontSize:15,
            }}>Commencer →</button>
          </>
        ) : step === 1 ? (
          <>
            <h2 style={{ fontFamily:'Syne', fontSize:22, fontWeight:700, marginBottom:8 }}>
              Comment vous appelez-vous ?
            </h2>
            <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:20 }}>
              Ce nom apparaîtra sur vos contributions.
            </p>
            <input className="pb-input" value={name} onChange={e => setName(e.target.value)}
              placeholder="Votre prénom..." style={{ marginBottom:16 }}
              onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
              autoFocus
            />
            <button className="pb-btn" onClick={() => name.trim() && setStep(2)} style={{
              background:'var(--accent)', color:'#fff',
              borderRadius:'var(--radius-sm)', padding:'12px 32px',
              fontWeight:600, fontSize:15, width:'100%',
            }}>Suivant →</button>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily:'Syne', fontSize:22, fontWeight:700, marginBottom:8 }}>
              Choisissez votre avatar
            </h2>
            <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:20 }}>
              Cet émoji vous représentera partout.
            </p>
            <div style={{
              display:'grid', gridTemplateColumns:'repeat(10,1fr)', gap:4,
              marginBottom:24, maxHeight:160, overflowY:'auto',
            }}>
              {EMOJI_LIST.map(e => (
                <button key={e} className="pb-btn" onClick={() => setEmoji(e)} style={{
                  fontSize:20, padding:4, borderRadius:8, background:'none',
                  border: e === emoji ? '2px solid var(--accent)' : '2px solid transparent',
                  transition:'all 0.15s',
                }}>{e}</button>
              ))}
            </div>
            <button className="pb-btn" onClick={submit} style={{
              background:'var(--accent)', color:'#fff',
              borderRadius:'var(--radius-sm)', padding:'12px 32px',
              fontWeight:600, fontSize:15, width:'100%',
            }}>C'est parti 🚀</button>
          </>
        )}
      </div>
    </div>
  );
});

/* Confirm Dialog */
const ConfirmDialog = memo(({ message, onConfirm, onCancel }) => (
  <div style={{
    position:'fixed', inset:0, zIndex:9000,
    background:'rgba(0,0,0,0.6)',
    display:'flex', alignItems:'center', justifyContent:'center',
    backdropFilter:'blur(4px)',
  }}>
    <div style={{
      ...glassCard, background:'var(--surface2)',
      padding:28, maxWidth:360, width:'90%',
      animation:'scaleIn 0.2s ease',
    }}>
      <div style={{ fontSize:32, marginBottom:12, textAlign:'center' }}>🗑️</div>
      <p style={{ textAlign:'center', marginBottom:24, fontSize:14, lineHeight:1.6 }}>{message}</p>
      <div style={{ display:'flex', gap:10 }}>
        <button className="pb-btn" onClick={onCancel} style={{
          flex:1, padding:'10px', borderRadius:'var(--radius-sm)',
          background:'var(--glass)', border:'1px solid var(--border)',
          color:'var(--text)', fontWeight:500, fontSize:14,
        }}>Annuler</button>
        <button className="pb-btn" onClick={onConfirm} style={{
          flex:1, padding:'10px', borderRadius:'var(--radius-sm)',
          background:'#ef4444', color:'#fff', fontWeight:600, fontSize:14,
        }}>Supprimer</button>
      </div>
    </div>
  </div>
));

/* Context Menu */
const ContextMenu = memo(({ menu, onPin, onDelete, onCopy, onClose }) => {
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const Item = ({ icon, label, onClick, danger }) => (
    <button className="pb-btn" onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:10,
      width:'100%', padding:'9px 14px', textAlign:'left',
      background:'none', color: danger ? '#ef4444' : 'var(--text)',
      fontSize:13, borderRadius:6, transition:'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background='var(--glass-hover)'}
    onMouseLeave={e => e.currentTarget.style.background='none'}
    >{icon}<span>{label}</span></button>
  );

  return (
    <div ref={ref} style={{
      position:'fixed', left: menu.x, top: menu.y,
      zIndex: 9500,
      background:'var(--surface2)', border:'1px solid var(--border)',
      borderRadius:'var(--radius-sm)', padding:6,
      boxShadow:'var(--shadow-lg)', minWidth:170,
      animation:'scaleIn 0.15s ease',
    }}>
      <Item icon={<Pin size={14}/>} label="Épingler / Désépingler" onClick={onPin} />
      <Item icon={<Copy size={14}/>} label="Copier le lien" onClick={onCopy} />
      <div style={{ height:1, background:'var(--border)', margin:'4px 0' }}/>
      <Item icon={<Trash2 size={14}/>} label="Supprimer" onClick={onDelete} danger />
    </div>
  );
});

/* Skeleton Card */
const SkeletonCard = memo(() => (
  <div className="pb-skeleton" style={{ height: 120 + Math.random() * 80, borderRadius:'var(--radius)' }} />
));

/* ───────── CARD COMPONENT ───────── */

const CardContent = memo(({ card, compact, user, onVote, onToggleTask }) => {
  const { type, content } = card;

  if (type === 'note') return (
    <p style={{
      fontSize: compact ? 13 : 14, lineHeight:1.65,
      color:'var(--text)', whiteSpace:'pre-wrap',
      wordBreak:'break-word',
      display:'-webkit-box', WebkitLineClamp:8,
      WebkitBoxOrient:'vertical', overflow:'hidden',
    }}>{content.text}</p>
  );

  if (type === 'image') return (
    <div style={{ borderRadius:10, overflow:'hidden', marginTop:4 }}>
      <img src={content.src} alt={content.name || 'image'}
        style={{ width:'100%', height:'auto', maxHeight:220, objectFit:'cover', display:'block' }}
      />
      {content.caption && (
        <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:6, fontStyle:'italic' }}>
          {content.caption}
        </p>
      )}
    </div>
  );

  if (type === 'file') return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      background:'var(--glass)', borderRadius:'var(--radius-sm)',
      padding:'12px 14px', marginTop:4,
    }}>
      <span style={{ fontSize:28 }}>{getFileIcon(content.name)}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {content.name}
        </p>
        <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{formatSize(content.size || 0)}</p>
      </div>
      {content.src && (
        <a href={content.src} download={content.name}
          style={{ color:'var(--accent)', fontSize:12, textDecoration:'none' }}
          onClick={e => e.stopPropagation()}>
          ↓
        </a>
      )}
    </div>
  );

  if (type === 'link') return (
    <div style={{
      background:'var(--glass)', borderRadius:'var(--radius-sm)',
      overflow:'hidden', marginTop:4,
      border:'1px solid var(--border)',
    }}>
      {content.image && (
        <img src={content.image} alt="" style={{ width:'100%', height:100, objectFit:'cover' }} />
      )}
      <div style={{ padding:'10px 12px' }}>
        <p style={{ fontSize:13, fontWeight:600, marginBottom:4, color:'var(--text)' }}>{content.title}</p>
        {content.description && (
          <p style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6, lineHeight:1.5 }}>
            {content.description}
          </p>
        )}
        <a href={content.url} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ fontSize:11, color:'var(--accent)', display:'flex', alignItems:'center', gap:4 }}>
          <ExternalLink size={10}/>{new URL(content.url.startsWith('http') ? content.url : 'https://'+content.url).hostname}
        </a>
      </div>
    </div>
  );

  if (type === 'poll') {
    const total = content.options.reduce((s, o) => s + (o.votes || 0), 0);
    const voted = content.options.some(o => (o.voters || []).includes(user?.name));
    return (
      <div style={{ marginTop:4 }}>
        {content.question && (
          <p style={{ fontSize:13, fontWeight:500, marginBottom:10, lineHeight:1.5 }}>{content.question}</p>
        )}
        {content.options.map((opt, i) => {
          const pct = total > 0 ? Math.round((opt.votes || 0) / total * 100) : 0;
          const hasVoted = (opt.voters || []).includes(user?.name);
          return (
            <div key={i} style={{ marginBottom:8 }}>
              <div style={{
                display:'flex', alignItems:'center', gap:8,
                background:'var(--glass)', borderRadius:8, overflow:'hidden',
                cursor: voted ? 'default' : 'pointer',
                border: hasVoted ? '1px solid var(--accent)' : '1px solid transparent',
                position:'relative', minHeight:36,
                transition:'all 0.2s',
              }} onClick={e => { e.stopPropagation(); if (!voted) onVote(card.id, i); }}>
                <div style={{
                  position:'absolute', left:0, top:0, bottom:0,
                  width:`${pct}%`, background:`${hasVoted?'var(--accent)':'var(--border)'}`,
                  opacity:0.3, transition:'width 0.4s ease',
                }}/>
                <span style={{ position:'relative', padding:'8px 12px', flex:1, fontSize:13 }}>{opt.label}</span>
                {voted && (
                  <span style={{ position:'relative', padding:'0 12px', fontSize:12, color:'var(--text-muted)' }}>
                    {pct}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
          {total} vote{total !== 1 ? 's' : ''}
          {voted ? ' · Vous avez voté' : ' · Cliquez pour voter'}
        </p>
      </div>
    );
  }

  if (type === 'checklist') {
    const done = content.items.filter(i => i.checked).length;
    const total = content.items.length;
    const pct = total > 0 ? Math.round(done / total * 100) : 0;
    return (
      <div style={{ marginTop:4 }}>
        {content.title && (
          <p style={{ fontSize:13, fontWeight:500, marginBottom:8 }}>{content.title}</p>
        )}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <div style={{ flex:1, height:4, background:'var(--glass)', borderRadius:99, overflow:'hidden' }}>
            <div style={{
              width:`${pct}%`, height:'100%',
              background: pct===100 ? '#22c55e' : 'var(--accent)',
              borderRadius:99, transition:'width 0.3s ease',
            }}/>
          </div>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>{done}/{total}</span>
        </div>
        {content.items.slice(0, compact ? 3 : 6).map((item, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:8, padding:'4px 0',
            cursor:'pointer',
          }} onClick={e => { e.stopPropagation(); onToggleTask(card.id, i); }}>
            <div style={{
              width:16, height:16, borderRadius:4, flexShrink:0,
              border: item.checked ? 'none' : '2px solid var(--border)',
              background: item.checked ? 'var(--accent)' : 'transparent',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.15s',
            }}>
              {item.checked && <Check size={10} color="#fff" strokeWidth={3}/>}
            </div>
            <span style={{
              fontSize:13, lineHeight:1.4,
              textDecoration: item.checked ? 'line-through' : 'none',
              color: item.checked ? 'var(--text-muted)' : 'var(--text)',
            }}>{item.label}</span>
          </div>
        ))}
        {total > (compact ? 3 : 6) && (
          <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
            +{total - (compact?3:6)} autres tâches
          </p>
        )}
      </div>
    );
  }

  if (type === 'voice') return (
    <div style={{ marginTop:4 }}>
      {content.src ? (
        <audio controls src={content.src} style={{ width:'100%', height:36 }} />
      ) : (
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Enregistrement vocal</p>
      )}
      {content.duration && (
        <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
          Durée: {Math.floor(content.duration/60)}:{String(content.duration%60).padStart(2,'0')}
        </p>
      )}
    </div>
  );

  return null;
});

const CardItem = memo(({ card, index, compact, user,
  onDelete, onPin, onReact, onVote, onToggleTask,
  onExpand, onContextMenu, isDragging, isOver,
  onDragStart, onDragEnter, onDragEnd,
}) => {
  const typeInfo = CARD_TYPES.find(t => t.id === card.type);
  const TypeIcon = typeInfo?.Icon || FileText;
  const totalReactions = Object.values(card.reactions || {}).reduce((a,b)=>a+b,0);
  const longPressTimer = useRef();

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    longPressTimer.current = setTimeout(() => {
      onContextMenu(e, card.id);
    }, 600);
  }, [card.id, onContextMenu]);

  const handleMouseUp = useCallback(() => {
    clearTimeout(longPressTimer.current);
  }, []);

  return (
    <div
      className={`card-hover pb-card-enter`}
      style={{
        ...glassCard,
        padding: compact ? '14px 16px' : '18px 20px',
        cursor:'grab',
        position:'relative',
        animationDelay: `${Math.min(index * 60, 600)}ms`,
        opacity: isDragging ? 0.4 : 1,
        outline: isOver ? '2px solid var(--accent)' : 'none',
        transition:'opacity 0.2s, outline 0.15s',
        borderLeft: card.color ? `3px solid ${card.color}` : '1px solid var(--border)',
      }}
      draggable
      onDragStart={() => onDragStart(card.id)}
      onDragEnter={() => onDragEnter(card.id)}
      onDragEnd={onDragEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onContextMenu={e => { e.preventDefault(); onContextMenu(e, card.id); }}
    >
      {/* Pin badge */}
      {card.pinned && (
        <div style={{
          position:'absolute', top:-8, right:12,
          fontSize:16, filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        }}>📌</div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <div style={{
          width:28, height:28, borderRadius:8, flexShrink:0,
          background:`${card.color || 'var(--accent)'}20`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <TypeIcon size={13} color={card.color || 'var(--accent)'}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1 }}>
            {typeInfo?.label} · {formatDate(card.createdAt)}
          </p>
        </div>
        <button className="pb-btn" onClick={e => { e.stopPropagation(); onExpand(card.id); }}
          style={{ background:'none', color:'var(--text-muted)', padding:2, opacity:0.6 }}>
          <Maximize2 size={12}/>
        </button>
        <button className="pb-btn" onClick={e => { e.stopPropagation(); onContextMenu(e, card.id); }}
          style={{ background:'none', color:'var(--text-muted)', padding:2 }}>
          <MoreHorizontal size={14}/>
        </button>
      </div>

      {/* Content */}
      <div onClick={() => onExpand(card.id)} style={{ cursor:'pointer' }}>
        <CardContent card={card} compact={compact} user={user} onVote={onVote} onToggleTask={onToggleTask}/>
      </div>

      {/* Footer */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        marginTop:12, paddingTop:10,
        borderTop:'1px solid var(--border)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:18 }}>{card.author?.emoji || '👤'}</span>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>{card.author?.name || 'Anonyme'}</span>
        </div>
        <div style={{ display:'flex', gap:2 }}>
          {REACTIONS.map(r => {
            const count = (card.reactions || {})[r] || 0;
            const reacted = (card.reactedBy || []).includes(`${user?.name}_${r}`);
            return (
              <button key={r} className="pb-btn"
                onClick={e => { e.stopPropagation(); onReact(card.id, r); }}
                style={{
                  background: reacted ? `${card.color || 'var(--accent)'}25` : 'none',
                  border: reacted ? `1px solid ${card.color || 'var(--accent)'}50` : '1px solid transparent',
                  borderRadius:6, padding:'2px 5px',
                  fontSize:12, color:'var(--text)',
                  display:'flex', alignItems:'center', gap:2,
                }}>
                <span>{r}</span>
                {count > 0 && <span style={{ fontSize:10, color:'var(--text-muted)' }}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

/* ───────── CARD EXPAND MODAL ───────── */

const CardExpandModal = memo(({ card, user, onClose, onDelete, onPin, onVote, onToggleTask }) => {
  const typeInfo = CARD_TYPES.find(t => t.id === card.type);
  const TypeIcon = typeInfo?.Icon || FileText;

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:8000,
      background:'rgba(0,0,0,0.75)',
      display:'flex', alignItems:'center', justifyContent:'center',
      backdropFilter:'blur(8px)', padding:20,
    }} onClick={onClose}>
      <div style={{
        ...glassCard, background:'var(--surface2)',
        maxWidth:600, width:'100%', maxHeight:'85vh',
        overflow:'auto', padding:32,
        animation:'scaleIn 0.25s ease',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <div style={{
            width:40, height:40, borderRadius:10, flexShrink:0,
            background:`${card.color || 'var(--accent)'}20`,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <TypeIcon size={18} color={card.color || 'var(--accent)'}/>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:'Syne', fontSize:15, fontWeight:600 }}>{typeInfo?.label}</p>
            <p style={{ fontSize:12, color:'var(--text-muted)' }}>
              {card.author?.emoji} {card.author?.name} · {new Date(card.createdAt).toLocaleString('fr-FR')}
            </p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="pb-btn" onClick={() => onPin(card.id)}
              style={{ background:'var(--glass)', border:'1px solid var(--border)',
                borderRadius:8, padding:'7px 10px', fontSize:13 }}>
              {card.pinned ? '📌' : '📍'}
            </button>
            <button className="pb-btn" onClick={() => { onDelete(card.id); onClose(); }}
              style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)',
                borderRadius:8, padding:'7px 10px', color:'#ef4444' }}>
              <Trash2 size={14}/>
            </button>
            <button className="pb-btn" onClick={onClose}
              style={{ background:'var(--glass)', border:'1px solid var(--border)',
                borderRadius:8, padding:'7px 10px', color:'var(--text-muted)' }}>
              <X size={14}/>
            </button>
          </div>
        </div>

        {/* Content */}
        <CardContent card={card} compact={false} user={user} onVote={onVote} onToggleTask={onToggleTask}/>

        {/* Reactions full */}
        <div style={{
          display:'flex', gap:6, marginTop:24, paddingTop:16,
          borderTop:'1px solid var(--border)', flexWrap:'wrap',
        }}>
          {REACTIONS.map(r => {
            const count = (card.reactions || {})[r] || 0;
            return (
              <div key={r} style={{
                background:'var(--glass)', borderRadius:8, padding:'6px 12px',
                display:'flex', gap:6, alignItems:'center',
                border:'1px solid var(--border)',
              }}>
                <span style={{ fontSize:16 }}>{r}</span>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* Metadata */}
        <div style={{ marginTop:20, padding:14, background:'var(--glass)', borderRadius:'var(--radius-sm)' }}>
          <p style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.8 }}>
            <strong>ID:</strong> {card.id}<br/>
            <strong>Créé le:</strong> {new Date(card.createdAt).toLocaleString('fr-FR')}<br/>
            {card.color && <><strong>Couleur:</strong> {card.color}<br/></>}
          </p>
        </div>
      </div>
    </div>
  );
});

/* ───────── ADD PANEL ───────── */

const AddPanel = memo(({ isOpen, onClose, onAdd, user }) => {
  const [activeTab, setActiveTab] = useState('note');
  const [color, setColor] = useState(TAG_COLORS[0]);
  const [showEmoji, setShowEmoji] = useState(false);

  // Note state
  const [noteText, setNoteText] = useState('');
  const [noteEmoji, setNoteEmoji] = useState('');

  // Image state
  const [imageFiles, setImageFiles] = useState([]);
  const [imageCaption, setImageCaption] = useState('');

  // File state
  const [fileData, setFileData] = useState(null);

  // Link state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDesc, setLinkDesc] = useState('');

  // Poll state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Checklist state
  const [checkTitle, setCheckTitle] = useState('');
  const [checkItems, setCheckItems] = useState(['']);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef();
  const chunksRef = useRef([]);
  const timerRef = useRef();
  const dropZoneRef = useRef();
  const fileInputRef = useRef();
  const fileFileRef = useRef();

  const reset = useCallback(() => {
    setNoteText(''); setNoteEmoji('');
    setImageFiles([]); setImageCaption('');
    setFileData(null);
    setLinkUrl(''); setLinkTitle(''); setLinkDesc('');
    setPollQuestion(''); setPollOptions(['','']);
    setCheckTitle(''); setCheckItems(['']);
    setRecordedAudio(null); setRecordDuration(0);
    setIsRecording(false);
  }, []);

  const handleClose = () => { reset(); onClose(); };

  const readFile = (file) => new Promise((res) => {
    const reader = new FileReader();
    reader.onload = (e) => res(e.target.result);
    reader.readAsDataURL(file);
  });

  const handleImageDrop = useCallback(async (files) => {
    const results = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue;
      const src = await readFile(f);
      results.push({ src, name: f.name, size: f.size });
    }
    setImageFiles(prev => [...prev, ...results]);
  }, []);

  const startRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (e) => setRecordedAudio(e.target.result);
        reader.readAsDataURL(blob);
      };
      mr.start();
      setIsRecording(true);
      setRecordDuration(0);
      timerRef.current = setInterval(() => setRecordDuration(d => d + 1), 1000);
    } catch {
      alert('Microphone non disponible.');
    }
  };

  const stopRecord = () => {
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const handleAdd = useCallback(async () => {
    if (!user) return;
    const base = {
      id: uuid(), author: user,
      createdAt: new Date().toISOString(),
      pinned: false, color,
      reactions: { '👍':0, '❤️':0, '🔥':0, '💡':0 },
      reactedBy: [], order: Date.now(),
    };

    if (activeTab === 'note') {
      if (!noteText.trim()) return;
      onAdd({ ...base, type:'note', content:{ text: noteEmoji ? `${noteEmoji} ${noteText}` : noteText } });
    } else if (activeTab === 'image') {
      for (const img of imageFiles) {
        onAdd({ ...base, id:uuid(), type:'image', content:{ src:img.src, name:img.name, caption:imageCaption } });
      }
      if (!imageFiles.length) return;
    } else if (activeTab === 'file') {
      if (!fileData) return;
      onAdd({ ...base, type:'file', content: fileData });
    } else if (activeTab === 'link') {
      if (!linkUrl.trim()) return;
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      onAdd({ ...base, type:'link', content:{ url, title: linkTitle||url, description:linkDesc } });
    } else if (activeTab === 'poll') {
      const opts = pollOptions.filter(o => o.trim());
      if (opts.length < 2) return;
      onAdd({ ...base, type:'poll', content:{
        question: pollQuestion,
        options: opts.map(label => ({ label, votes:0, voters:[] })),
      }});
    } else if (activeTab === 'checklist') {
      const items = checkItems.filter(i => i.trim());
      if (!items.length) return;
      onAdd({ ...base, type:'checklist', content:{
        title: checkTitle,
        items: items.map(label => ({ label, checked:false })),
      }});
    } else if (activeTab === 'voice') {
      if (!recordedAudio) return;
      onAdd({ ...base, type:'voice', content:{ src:recordedAudio, duration:recordDuration } });
    }
    handleClose();
  }, [activeTab, noteText, noteEmoji, imageFiles, imageCaption, fileData, linkUrl, linkTitle, linkDesc,
      pollQuestion, pollOptions, checkTitle, checkItems, recordedAudio, recordDuration, user, color, onAdd]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen]);

  if (!isOpen) return null;

  const tabStyle = (id) => ({
    padding:'7px 14px', borderRadius:8, fontSize:13, fontWeight:500,
    cursor:'pointer', border:'none', outline:'none',
    background: activeTab===id ? 'var(--accent)' : 'var(--glass)',
    color: activeTab===id ? '#fff' : 'var(--text-muted)',
    display:'flex', alignItems:'center', gap:5,
    transition:'all 0.15s', flexShrink:0,
    fontFamily:'Inter, sans-serif',
  });

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:7000,
      display:'flex', alignItems:'flex-end',
    }} onClick={handleClose}>
      <div style={{
        width:'100%', maxWidth:680, margin:'0 auto',
        background:'var(--surface2)',
        borderRadius:'var(--radius) var(--radius) 0 0',
        border:'1px solid var(--border)', borderBottom:'none',
        padding:'20px 24px 28px',
        boxShadow:'0 -20px 60px rgba(0,0,0,0.5)',
        animation:'slideUp 0.3s ease',
        maxHeight:'88vh', overflowY:'auto',
      }} onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div style={{ width:40, height:4, borderRadius:99, background:'var(--border)', margin:'0 auto 16px' }}/>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, marginBottom:20 }}>
          {CARD_TYPES.map(({ id, label, Icon }) => (
            <button key={id} style={tabStyle(id)} onClick={() => setActiveTab(id)}>
              <Icon size={12}/>{label}
            </button>
          ))}
        </div>

        {/* Color picker */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <Tag size={12} color="var(--text-muted)"/>
          <span style={{ fontSize:12, color:'var(--text-muted)', marginRight:4 }}>Couleur</span>
          {TAG_COLORS.map(c => (
            <button key={c} className="pb-btn" onClick={() => setColor(c)} style={{
              width:20, height:20, borderRadius:'50%', background:c,
              border: color===c ? '2px solid #fff' : '2px solid transparent',
              outline: color===c ? `2px solid ${c}` : 'none', outlineOffset:1,
            }}/>
          ))}
        </div>

        {/* ── Note Form ── */}
        {activeTab === 'note' && (
          <div>
            <div style={{ position:'relative' }}>
              <textarea className="pb-input"
                value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder="Écrivez votre note..."
                rows={5}
                style={{ resize:'vertical', lineHeight:1.6 }}
              />
              <button className="pb-btn" onClick={() => setShowEmoji(v => !v)}
                style={{ position:'absolute', bottom:10, right:10,
                  background:'none', color:'var(--text-muted)', fontSize:18 }}>
                <Smile size={16}/>
              </button>
              {showEmoji && (
                <div style={{ position:'absolute', bottom:44, right:0 }}>
                  <EmojiPicker onSelect={e => setNoteText(t => t+e)} onClose={() => setShowEmoji(false)}/>
                </div>
              )}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
              <span style={{ fontSize:11, color:'var(--text-muted)' }}>{noteText.length} caractères</span>
            </div>
          </div>
        )}

        {/* ── Image Form ── */}
        {activeTab === 'image' && (
          <div>
            <div
              ref={dropZoneRef}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='var(--accent)'; }}
              onDragLeave={e => { e.currentTarget.style.borderColor='var(--border)'; }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor='var(--border)'; handleImageDrop(e.dataTransfer.files); }}
              style={{
                border:'2px dashed var(--border)', borderRadius:'var(--radius-sm)',
                padding:32, textAlign:'center', cursor:'pointer',
                transition:'border-color 0.2s',
              }}>
              <Image size={28} color="var(--text-muted)" style={{ margin:'0 auto 8px' }}/>
              <p style={{ color:'var(--text-muted)', fontSize:13 }}>Glissez des images ou cliquez pour parcourir</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display:'none' }}
              onChange={e => handleImageDrop(e.target.files)}/>
            {imageFiles.length > 0 && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:12 }}>
                {imageFiles.map((img, i) => (
                  <div key={i} style={{ position:'relative' }}>
                    <img src={img.src} alt="" style={{ width:72, height:72, objectFit:'cover', borderRadius:8 }}/>
                    <button className="pb-btn" onClick={() => setImageFiles(f => f.filter((_,j)=>j!==i))}
                      style={{
                        position:'absolute', top:-6, right:-6, width:18, height:18,
                        borderRadius:'50%', background:'#ef4444', color:'#fff',
                        fontSize:10, display:'flex', alignItems:'center', justifyContent:'center',
                      }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <input className="pb-input" placeholder="Légende (optionnel)"
              value={imageCaption} onChange={e => setImageCaption(e.target.value)}
              style={{ marginTop:10 }}/>
          </div>
        )}

        {/* ── File Form ── */}
        {activeTab === 'file' && (
          <div>
            <div
              onClick={() => fileFileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='var(--accent)'; }}
              onDragLeave={e => { e.currentTarget.style.borderColor='var(--border)'; }}
              onDrop={async e => {
                e.preventDefault(); e.currentTarget.style.borderColor='var(--border)';
                const f = e.dataTransfer.files[0];
                if (!f) return;
                const src = await readFile(f);
                setFileData({ name:f.name, size:f.size, type:f.type, src });
              }}
              style={{
                border:'2px dashed var(--border)', borderRadius:'var(--radius-sm)',
                padding:32, textAlign:'center', cursor:'pointer', transition:'border-color 0.2s',
              }}>
              <File size={28} color="var(--text-muted)" style={{ margin:'0 auto 8px' }}/>
              <p style={{ color:'var(--text-muted)', fontSize:13 }}>Glissez un fichier ou cliquez pour parcourir</p>
            </div>
            <input ref={fileFileRef} type="file" style={{ display:'none' }}
              onChange={async e => {
                const f = e.target.files[0]; if (!f) return;
                const src = await readFile(f);
                setFileData({ name:f.name, size:f.size, type:f.type, src });
              }}/>
            {fileData && (
              <div style={{
                display:'flex', alignItems:'center', gap:12, marginTop:12,
                background:'var(--glass)', borderRadius:'var(--radius-sm)', padding:'10px 14px',
              }}>
                <span style={{ fontSize:24 }}>{getFileIcon(fileData.name)}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{fileData.name}</p>
                  <p style={{ fontSize:11, color:'var(--text-muted)' }}>{formatSize(fileData.size)}</p>
                </div>
                <button className="pb-btn" onClick={() => setFileData(null)}
                  style={{ color:'var(--text-muted)', background:'none', fontSize:16 }}>×</button>
              </div>
            )}
          </div>
        )}

        {/* ── Link Form ── */}
        {activeTab === 'link' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <input className="pb-input" placeholder="URL (ex: https://notion.so)" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}/>
            <input className="pb-input" placeholder="Titre de la page" value={linkTitle} onChange={e => setLinkTitle(e.target.value)}/>
            <input className="pb-input" placeholder="Description (optionnel)" value={linkDesc} onChange={e => setLinkDesc(e.target.value)}/>
          </div>
        )}

        {/* ── Poll Form ── */}
        {activeTab === 'poll' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <input className="pb-input" placeholder="Question du sondage" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)}/>
            {pollOptions.map((opt, i) => (
              <div key={i} style={{ display:'flex', gap:6 }}>
                <input className="pb-input" placeholder={`Option ${i+1}`} value={opt}
                  onChange={e => setPollOptions(opts => opts.map((o,j) => j===i ? e.target.value : o))}/>
                {i >= 2 && (
                  <button className="pb-btn" onClick={() => setPollOptions(opts => opts.filter((_,j)=>j!==i))}
                    style={{ background:'none', color:'var(--text-muted)', padding:'0 8px', fontSize:18 }}>×</button>
                )}
              </div>
            ))}
            {pollOptions.length < 6 && (
              <button className="pb-btn" onClick={() => setPollOptions(opts => [...opts, ''])}
                style={{
                  background:'var(--glass)', border:'1px dashed var(--border)',
                  color:'var(--text-muted)', borderRadius:'var(--radius-sm)',
                  padding:'8px', fontSize:13,
                }}>+ Ajouter une option</button>
            )}
          </div>
        )}

        {/* ── Checklist Form ── */}
        {activeTab === 'checklist' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <input className="pb-input" placeholder="Titre de la liste (optionnel)" value={checkTitle} onChange={e => setCheckTitle(e.target.value)}/>
            {checkItems.map((item, i) => (
              <div key={i} style={{ display:'flex', gap:6 }}>
                <input className="pb-input" placeholder={`Tâche ${i+1}`} value={item}
                  onChange={e => setCheckItems(items => items.map((it,j) => j===i ? e.target.value : it))}
                  onKeyDown={e => { if (e.key==='Enter') { e.preventDefault(); setCheckItems(items => [...items, '']); } }}/>
                {i > 0 && (
                  <button className="pb-btn" onClick={() => setCheckItems(items => items.filter((_,j)=>j!==i))}
                    style={{ background:'none', color:'var(--text-muted)', padding:'0 8px', fontSize:18 }}>×</button>
                )}
              </div>
            ))}
            <button className="pb-btn" onClick={() => setCheckItems(items => [...items, ''])}
              style={{
                background:'var(--glass)', border:'1px dashed var(--border)',
                color:'var(--text-muted)', borderRadius:'var(--radius-sm)', padding:8, fontSize:13,
              }}>+ Ajouter une tâche</button>
          </div>
        )}

        {/* ── Voice Form ── */}
        {activeTab === 'voice' && (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            {!recordedAudio ? (
              <>
                <div style={{
                  width:80, height:80, borderRadius:'50%', margin:'0 auto 16px',
                  background: isRecording ? 'rgba(239,68,68,0.15)' : 'var(--glass)',
                  border: `2px solid ${isRecording ? '#ef4444' : 'var(--border)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer',
                  animation: isRecording ? 'recordPulse 1s infinite' : 'none',
                }} onClick={isRecording ? stopRecord : startRecord}>
                  {isRecording ? <Square size={24} color="#ef4444"/> : <Mic size={24} color="var(--text-muted)"/>}
                </div>
                <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:4 }}>
                  {isRecording ? `Enregistrement... ${Math.floor(recordDuration/60)}:${String(recordDuration%60).padStart(2,'0')}` : 'Cliquez pour enregistrer'}
                </p>
                {isRecording && (
                  <button className="pb-btn" onClick={stopRecord}
                    style={{ background:'#ef4444', color:'#fff', borderRadius:8, padding:'8px 20px', marginTop:8, fontSize:13 }}>
                    Arrêter
                  </button>
                )}
              </>
            ) : (
              <div>
                <p style={{ color:'var(--accent)', marginBottom:12, fontSize:14 }}>✓ Enregistrement prêt</p>
                <audio controls src={recordedAudio} style={{ width:'100%' }}/>
                <button className="pb-btn" onClick={() => setRecordedAudio(null)}
                  style={{ marginTop:10, background:'none', color:'var(--text-muted)', fontSize:13, textDecoration:'underline' }}>
                  Réenregistrer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button className="pb-btn" onClick={handleClose} style={{
            flex:1, padding:'11px', borderRadius:'var(--radius-sm)',
            background:'var(--glass)', border:'1px solid var(--border)',
            color:'var(--text-muted)', fontSize:14,
          }}>Annuler</button>
          <button className="pb-btn" onClick={handleAdd} style={{
            flex:2, padding:'11px', borderRadius:'var(--radius-sm)',
            background:'var(--accent)', color:'#fff', fontSize:14, fontWeight:600,
          }}>Ajouter au board</button>
        </div>
      </div>
    </div>
  );
});

/* ───────── SIDEBAR ───────── */

const Sidebar = memo(({
  isOpen, onClose, project, onUpdateProject,
  activeFilter, onFilterChange, sortBy, onSortChange,
  searchQuery, onSearchChange,
  cards, activities, contributors,
  onExport, onImport, onOpenSettings,
  searchRef,
}) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc]   = useState(false);
  const [titleVal, setTitleVal]         = useState(project.title);
  const [descVal, setDescVal]           = useState(project.description);
  const coverRef = useRef();

  const stats = useMemo(() => ({
    total:  cards.length,
    images: cards.filter(c => c.type==='image').length,
    files:  cards.filter(c => c.type==='file').length,
    notes:  cards.filter(c => c.type==='note').length,
    pinned: cards.filter(c => c.pinned).length,
  }), [cards]);

  const filters = [
    { id:'all',       label:'Tout',     count: cards.length },
    { id:'notes',     label:'Notes',    count: stats.notes },
    { id:'images',    label:'Images',   count: stats.images },
    { id:'files',     label:'Fichiers', count: stats.files },
    { id:'links',     label:'Liens',    count: cards.filter(c=>c.type==='link').length },
    { id:'polls',     label:'Sondages', count: cards.filter(c=>c.type==='poll').length },
    { id:'checklists',label:'Tâches',   count: cards.filter(c=>c.type==='checklist').length },
    { id:'pinned',    label:'📌 Épinglés', count: stats.pinned },
  ];

  const sidebarStyle = {
    position:'fixed', top:0, left:0, bottom:0,
    width:280, zIndex:5000,
    background:'var(--surface)',
    borderRight:'1px solid var(--border)',
    boxShadow:'var(--shadow-lg)',
    overflowY:'auto',
    display:'flex', flexDirection:'column',
    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition:'transform 0.3s ease',
  };

  return (
    <>
      {isOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:4999, background:'rgba(0,0,0,0.4)' }}
          onClick={onClose}/>
      )}
      <div style={sidebarStyle}>
        {/* Cover image */}
        <div style={{
          height:100, background: project.coverImage
            ? `url(${project.coverImage}) center/cover`
            : `linear-gradient(135deg, ${project.accentColor || 'var(--accent)'}, ${project.accentColor || '#8b5cf6'})`,
          flexShrink:0, position:'relative', cursor:'pointer',
        }} onClick={() => coverRef.current?.click()}>
          <div style={{
            position:'absolute', inset:0,
            background:'rgba(0,0,0,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
            opacity:0, transition:'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity=1}
          onMouseLeave={e => e.currentTarget.style.opacity=0}>
            <Upload size={20} color="#fff"/>
          </div>
          <input ref={coverRef} type="file" accept="image/*" style={{ display:'none' }}
            onChange={async e => {
              const f = e.target.files[0]; if (!f) return;
              const reader = new FileReader();
              reader.onload = ev => onUpdateProject({ coverImage: ev.target.result });
              reader.readAsDataURL(f);
            }}/>
        </div>

        <div style={{ padding:'16px 20px', flex:1 }}>
          {/* Project title */}
          {editingTitle ? (
            <input className="pb-input" value={titleVal}
              onChange={e => setTitleVal(e.target.value)}
              onBlur={() => { setEditingTitle(false); onUpdateProject({ title: titleVal }); }}
              onKeyDown={e => { if (e.key==='Enter') { setEditingTitle(false); onUpdateProject({ title: titleVal }); } }}
              autoFocus style={{ fontSize:16, fontFamily:'Syne', fontWeight:700, marginBottom:8 }}/>
          ) : (
            <h2 style={{ fontFamily:'Syne', fontSize:17, fontWeight:700, marginBottom:4, cursor:'pointer', lineHeight:1.3 }}
              onClick={() => setEditingTitle(true)}>
              {project.title || 'Mon Board'} <span style={{ fontSize:12, color:'var(--text-muted)' }}>✎</span>
            </h2>
          )}

          {editingDesc ? (
            <textarea className="pb-input" value={descVal}
              onChange={e => setDescVal(e.target.value)}
              onBlur={() => { setEditingDesc(false); onUpdateProject({ description: descVal }); }}
              rows={2} autoFocus style={{ fontSize:12, marginBottom:12, resize:'none' }}/>
          ) : (
            <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12, cursor:'pointer', lineHeight:1.5 }}
              onClick={() => setEditingDesc(true)}>
              {project.description || 'Cliquez pour ajouter une description...'} <span style={{ fontSize:10 }}>✎</span>
            </p>
          )}

          {/* Search */}
          <div style={{ position:'relative', marginBottom:16 }}>
            <Search size={13} color="var(--text-muted)" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}/>
            <input ref={searchRef} className="pb-input" placeholder="Rechercher... (⌘K)"
              value={searchQuery} onChange={e => onSearchChange(e.target.value)}
              style={{ paddingLeft:32 }}/>
          </div>

          {/* Stats */}
          <div style={{
            display:'grid', gridTemplateColumns:'1fr 1fr',
            gap:8, marginBottom:16,
          }}>
            {[
              { label:'Total', value:stats.total, icon:'📦' },
              { label:'Images', value:stats.images, icon:'🖼️' },
              { label:'Fichiers', value:stats.files, icon:'📎' },
              { label:'Épinglés', value:stats.pinned, icon:'📌' },
            ].map(s => (
              <div key={s.label} style={{
                background:'var(--glass)', borderRadius:'var(--radius-sm)',
                padding:'8px 10px', border:'1px solid var(--border)',
              }}>
                <p style={{ fontSize:18, marginBottom:2 }}>{s.icon}</p>
                <p style={{ fontSize:16, fontWeight:600, fontFamily:'Syne' }}>{s.value}</p>
                <p style={{ fontSize:10, color:'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, letterSpacing:'0.06em', marginBottom:8, textTransform:'uppercase' }}>Filtres</p>
          <div style={{ display:'flex', flexDirection:'column', gap:2, marginBottom:16 }}>
            {filters.map(f => (
              <button key={f.id} className="pb-btn" onClick={() => onFilterChange(f.id)} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'8px 10px', borderRadius:8, fontSize:13,
                background: activeFilter===f.id ? `${project.accentColor || 'var(--accent)'}20` : 'none',
                color: activeFilter===f.id ? (project.accentColor || 'var(--accent)') : 'var(--text)',
                fontWeight: activeFilter===f.id ? 600 : 400,
              }}>
                <span>{f.label}</span>
                <span style={{
                  fontSize:11, background:'var(--glass)',
                  padding:'1px 7px', borderRadius:99, color:'var(--text-muted)',
                }}>{f.count}</span>
              </button>
            ))}
          </div>

          {/* Sort */}
          <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, letterSpacing:'0.06em', marginBottom:8, textTransform:'uppercase' }}>Tri</p>
          <div style={{ display:'flex', gap:6, marginBottom:20 }}>
            {[['recent','Récent'],['oldest','Ancien'],['reactions','Réactions']].map(([id,label]) => (
              <button key={id} className="pb-btn" onClick={() => onSortChange(id)} style={{
                fontSize:11, padding:'5px 9px', borderRadius:6,
                background: sortBy===id ? (project.accentColor || 'var(--accent)') : 'var(--glass)',
                color: sortBy===id ? '#fff' : 'var(--text-muted)',
                border:'none',
              }}>{label}</button>
            ))}
          </div>

          {/* Contributors */}
          {contributors.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, letterSpacing:'0.06em', marginBottom:8, textTransform:'uppercase' }}>
                Contributeurs
              </p>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {contributors.map((c, i) => (
                  <div key={i} title={c.name} style={{
                    width:32, height:32, borderRadius:'50%',
                    background:'var(--surface2)', border:'2px solid var(--border)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
                    cursor:'default',
                  }}>{c.emoji}</div>
                ))}
              </div>
            </div>
          )}

          {/* Activity feed */}
          {activities.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, letterSpacing:'0.06em', marginBottom:8, textTransform:'uppercase' }}>
                Activité récente
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {activities.slice(0,5).map((a,i) => (
                  <div key={i} style={{
                    fontSize:11, color:'var(--text-muted)', lineHeight:1.5,
                    padding:'6px 8px', background:'var(--glass)', borderRadius:6,
                  }}>
                    <span style={{ marginRight:4 }}>{a.emoji}</span>
                    <strong style={{ color:'var(--text-dim)' }}>{a.userName}</strong>
                    {' '}{a.action} · {formatDate(a.at)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:'auto', paddingTop:8 }}>
            <button className="pb-btn" onClick={onExport} style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'9px 12px', borderRadius:'var(--radius-sm)',
              background:'var(--glass)', border:'1px solid var(--border)', color:'var(--text)',
              fontSize:13,
            }}>
              <Download size={13}/> Exporter JSON
            </button>
            <button className="pb-btn" onClick={onImport} style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'9px 12px', borderRadius:'var(--radius-sm)',
              background:'var(--glass)', border:'1px solid var(--border)', color:'var(--text)',
              fontSize:13,
            }}>
              <Upload size={13}/> Importer JSON
            </button>
            <button className="pb-btn" onClick={onOpenSettings} style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'9px 12px', borderRadius:'var(--radius-sm)',
              background:'var(--glass)', border:'1px solid var(--border)', color:'var(--text)',
              fontSize:13,
            }}>
              <Settings size={13}/> Paramètres
            </button>
          </div>
        </div>
      </div>
    </>
  );
});

/* ───────── SETTINGS PANEL ───────── */

const SettingsPanel = memo(({ isOpen, onClose, settings, project, onUpdateSettings, onUpdateProject }) => (
  <>
    {isOpen && <div style={{ position:'fixed', inset:0, zIndex:6999 }} onClick={onClose}/>}
    <div style={{
      position:'fixed', top:0, right:0, bottom:0, width:300, zIndex:7000,
      background:'var(--surface2)', borderLeft:'1px solid var(--border)',
      boxShadow:'var(--shadow-lg)', padding:'24px 20px',
      overflowY:'auto',
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      transition:'transform 0.3s ease',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <h3 style={{ fontFamily:'Syne', fontSize:17, fontWeight:700 }}>Paramètres</h3>
        <button className="pb-btn" onClick={onClose} style={{ background:'none', color:'var(--text-muted)' }}><X size={18}/></button>
      </div>

      <div style={{ marginBottom:24 }}>
        <p style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)', marginBottom:10, fontWeight:600 }}>Thème</p>
        <button className="pb-btn" onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })} style={{
          display:'flex', alignItems:'center', gap:10,
          width:'100%', padding:'10px 12px', borderRadius:'var(--radius-sm)',
          background:'var(--glass)', border:'1px solid var(--border)', color:'var(--text)',
          fontSize:13,
        }}>
          {settings.darkMode ? <Moon size={14}/> : <Sun size={14}/>}
          {settings.darkMode ? 'Mode sombre (actif)' : 'Mode clair (actif)'}
        </button>
      </div>

      <div style={{ marginBottom:24 }}>
        <p style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)', marginBottom:10, fontWeight:600 }}>Couleur d'accentuation</p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {ACCENT_COLORS.map(c => (
            <button key={c.value} className="pb-btn" onClick={() => onUpdateProject({ accentColor: c.value })} style={{
              width:36, height:36, borderRadius:10, background:c.value,
              border: project.accentColor===c.value ? '3px solid #fff' : '3px solid transparent',
              outline: project.accentColor===c.value ? `3px solid ${c.value}` : 'none',
              outlineOffset:2,
            }} title={c.name}/>
          ))}
        </div>
        <input type="color" value={project.accentColor || '#6366f1'}
          onChange={e => onUpdateProject({ accentColor: e.target.value })}
          style={{ marginTop:10, width:'100%', height:36, borderRadius:8, border:'1px solid var(--border)', cursor:'pointer', background:'none' }}/>
      </div>

      <div style={{ marginBottom:24 }}>
        <p style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)', marginBottom:10, fontWeight:600 }}>Densité</p>
        <div style={{ display:'flex', gap:6 }}>
          {[['comfortable','Confortable'],['compact','Compact']].map(([id,label]) => (
            <button key={id} className="pb-btn" onClick={() => onUpdateSettings({ density: id })} style={{
              flex:1, padding:'9px', borderRadius:'var(--radius-sm)', fontSize:13,
              background: settings.density===id ? 'var(--accent)' : 'var(--glass)',
              color: settings.density===id ? '#fff' : 'var(--text-muted)',
              border:'none',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{
        background:'var(--glass)', borderRadius:'var(--radius-sm)',
        padding:14, border:'1px solid var(--border)',
      }}>
        <p style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, marginBottom:6 }}>Raccourcis clavier</p>
        {[['N','Nouvelle note'],['I','Nouvelle image'],['F','Nouveau fichier'],['Esc','Fermer'],['⌘K','Rechercher']].map(([key,desc]) => (
          <div key={key} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', fontSize:12 }}>
            <span style={{ color:'var(--text-muted)' }}>{desc}</span>
            <kbd style={{
              background:'var(--surface)', border:'1px solid var(--border)',
              borderRadius:4, padding:'1px 6px', fontSize:11, color:'var(--text)',
            }}>{key}</kbd>
          </div>
        ))}
      </div>
    </div>
  </>
));

/* ─────────────────────────── EMPTY STATE ───────────────────────── */

const EmptyState = memo(({ onAdd }) => (
  <div style={{ textAlign:'center', padding:'60px 20px', maxWidth:400, margin:'0 auto' }}>
    <svg viewBox="0 0 200 180" style={{ width:180, height:180, margin:'0 auto 24px', display:'block' }}>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3"/>
        </linearGradient>
      </defs>
      <rect x="20" y="40" width="70" height="90" rx="12" fill="url(#g1)" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.4"/>
      <rect x="110" y="25" width="70" height="60" rx="12" fill="url(#g1)" stroke="#8b5cf6" strokeWidth="1.5" strokeOpacity="0.4"/>
      <rect x="110" y="100" width="70" height="50" rx="12" fill="url(#g1)" stroke="#ec4899" strokeWidth="1.5" strokeOpacity="0.4"/>
      <circle cx="55" cy="75" r="14" fill="#6366f1" fillOpacity="0.15" stroke="#6366f1" strokeWidth="1.5"/>
      <line x1="47" y1="75" x2="63" y2="75" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
      <line x1="55" y1="67" x2="55" y2="83" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
      <rect x="30" y="96" width="50" height="5" rx="3" fill="#6366f1" fillOpacity="0.2"/>
      <rect x="30" y="106" width="35" height="5" rx="3" fill="#6366f1" fillOpacity="0.15"/>
      <rect x="118" y="38" width="54" height="5" rx="3" fill="#8b5cf6" fillOpacity="0.3"/>
      <rect x="118" y="48" width="40" height="5" rx="3" fill="#8b5cf6" fillOpacity="0.2"/>
      <rect x="118" y="60" width="45" height="5" rx="3" fill="#8b5cf6" fillOpacity="0.15"/>
    </svg>
    <h3 style={{ fontFamily:'Syne', fontSize:20, fontWeight:700, marginBottom:8 }}>
      Board vide pour l'instant
    </h3>
    <p style={{ color:'var(--text-muted)', fontSize:14, lineHeight:1.7, marginBottom:24 }}>
      Commencez à partager vos idées, images et fichiers avec votre équipe.
    </p>
    <button className="pb-btn" onClick={onAdd} style={{
      background:'var(--accent)', color:'#fff',
      borderRadius:'var(--radius-sm)', padding:'12px 28px',
      fontSize:15, fontWeight:600,
    }}>+ Ajouter du contenu</button>
  </div>
));

/* ─────────────────────────── MAIN COMPONENT ────────────────────── */

export default function ProjectBoard() {
  const [cards, setCards]             = useState([]);
  const [user, setUser]               = useState(null);
  const [project, setProject]         = useState({ title:'Mon Board', description:'', coverImage:null, accentColor:'#6366f1' });
  const [settings, setSettings]       = useState({ darkMode:true, density:'comfortable' });
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy]           = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [activities, setActivities]   = useState([]);
  const [isAddOpen, setIsAddOpen]     = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [toasts, setToasts]           = useState([]);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isLoading, setIsLoading]     = useState(true);
  const [confetti, setConfetti]       = useState(false);
  const [dragState, setDragState]     = useState({ dragging:null, over:null });

  const saveTimer   = useRef();
  const searchRef   = useRef();
  const importRef   = useRef();

  /* ── CSS injection ── */
  useEffect(() => {
    let el = document.getElementById('pb-global-css');
    if (!el) { el = document.createElement('style'); el.id='pb-global-css'; document.head.appendChild(el); }
    el.textContent = GLOBAL_CSS;
  }, []);

  /* ── Theme ── */
  useEffect(() => {
    document.body.classList.toggle('pb-light', !settings.darkMode);
  }, [settings.darkMode]);

  /* ── CSS variable for accent ── */
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', project.accentColor || '#6366f1');
  }, [project.accentColor]);

  /* ── Load from storage ── */
  useEffect(() => {
    const minDelay = new Promise(r => setTimeout(r, 500));
    Promise.all([minDelay]).then(() => {
      try {
        const savedCards    = storage.get('pb_cards');
        const savedUser     = storage.get('pb_user');
        const savedProject  = storage.get('pb_project');
        const savedActivities = storage.get('pb_activities');
        const savedSettings = storage.get('pb_settings');

        if (savedCards)    setCards(savedCards);
        if (savedProject)  setProject(p => ({ ...p, ...savedProject }));
        if (savedActivities) setActivities(savedActivities);
        if (savedSettings) setSettings(s => ({ ...s, ...savedSettings }));

        if (savedUser) setUser(savedUser);
        else setIsOnboarding(true);
      } catch { /* fallback: start fresh */ }
      setIsLoading(false);
    });
  }, []);

  /* ── Debounced save ── */
  const scheduleSave = useCallback((key, val) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { storage.set(key, val); } catch { /* ignore */ }
    }, 300);
  }, []);

  useEffect(() => { scheduleSave('pb_cards', cards); }, [cards, scheduleSave]);
  useEffect(() => { storage.set('pb_project', project); }, [project]);
  useEffect(() => { storage.set('pb_settings', settings); }, [settings]);
  useEffect(() => { storage.set('pb_activities', activities); }, [activities]);

  /* ── Activity log ── */
  const logActivity = useCallback((userObj, action) => {
    const entry = { emoji: userObj?.emoji||'👤', userName: userObj?.name||'Anonyme', action, at: new Date().toISOString() };
    setActivities(prev => [entry, ...prev].slice(0, 20));
  }, []);

  /* ── Toast ── */
  const addToast = useCallback((message, type='info') => {
    const id = uuid();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id!==id)), 3500);
  }, []);

  const removeToast = useCallback((id) => setToasts(t => t.filter(x => x.id!==id)), []);

  /* ── Confetti trigger ── */
  const triggerConfetti = useCallback(() => {
    setConfetti(true);
    setTimeout(() => setConfetti(false), 3000);
  }, []);

  /* ── Onboarding done ── */
  const handleOnboardingDone = useCallback((u) => {
    setUser(u);
    storage.set('pb_user', u);
    setIsOnboarding(false);
    addToast(`Bienvenue ${u.emoji} ${u.name} !`, 'success');
  }, [addToast]);

  /* ── Add card ── */
  const handleAddCard = useCallback((card) => {
    setCards(prev => [card, ...prev]);
    logActivity(user, `a ajouté un(e) ${CARD_TYPES.find(t=>t.id===card.type)?.label||'élément'}`);
    addToast('Ajouté au board !', 'success');
  }, [user, logActivity, addToast]);

  /* ── Delete card ── */
  const handleDeleteCard = useCallback((id) => {
    setCards(prev => prev.filter(c => c.id!==id));
    logActivity(user, 'a supprimé un élément');
    addToast('Supprimé', 'info');
    setConfirmDeleteId(null);
    setContextMenu(null);
    if (expandedCardId === id) setExpandedCardId(null);
  }, [user, logActivity, addToast, expandedCardId]);

  /* ── Pin card ── */
  const handlePinCard = useCallback((id) => {
    setCards(prev => prev.map(c => c.id===id ? {...c, pinned:!c.pinned} : c));
    const card = cards.find(c => c.id===id);
    addToast(card?.pinned ? 'Épingle retiré' : 'Épinglé ! 📌', 'info');
    setContextMenu(null);
  }, [cards, addToast]);

  /* ── React to card ── */
  const handleReact = useCallback((cardId, emoji) => {
    if (!user) return;
    const key = `${user.name}_${emoji}`;
    setCards(prev => prev.map(c => {
      if (c.id !== cardId) return c;
      const reacted = (c.reactedBy||[]).includes(key);
      return {
        ...c,
        reactions: { ...c.reactions, [emoji]: Math.max(0, (c.reactions?.[emoji]||0) + (reacted?-1:1)) },
        reactedBy: reacted ? (c.reactedBy||[]).filter(k=>k!==key) : [...(c.reactedBy||[]), key],
      };
    }));
  }, [user]);

  /* ── Vote poll ── */
  const handleVote = useCallback((cardId, optionIndex) => {
    if (!user) return;
    setCards(prev => prev.map(c => {
      if (c.id !== cardId) return c;
      const options = c.content.options.map((o, i) =>
        i === optionIndex
          ? { ...o, votes:(o.votes||0)+1, voters:[...(o.voters||[]), user.name] }
          : o
      );
      const total = options.reduce((s,o)=>s+(o.votes||0),0);
      if (total >= 5) triggerConfetti();
      return { ...c, content: { ...c.content, options } };
    }));
    logActivity(user, 'a voté dans un sondage');
  }, [user, logActivity, triggerConfetti]);

  /* ── Toggle checklist task ── */
  const handleToggleTask = useCallback((cardId, itemIndex) => {
    setCards(prev => prev.map(c => {
      if (c.id !== cardId) return c;
      const items = c.content.items.map((item, i) =>
        i === itemIndex ? { ...item, checked: !item.checked } : item
      );
      const done = items.filter(i=>i.checked).length;
      if (done === items.length && items.length > 0) {
        triggerConfetti();
        addToast('🎉 Toutes les tâches sont terminées !', 'success');
      }
      return { ...c, content: { ...c.content, items } };
    }));
  }, [triggerConfetti, addToast]);

  /* ── Context menu ── */
  const handleContextMenu = useCallback((e, cardId) => {
    e.preventDefault();
    setContextMenu({ cardId, x: e.clientX, y: e.clientY });
  }, []);

  /* ── Drag & drop ── */
  const handleDragStart = useCallback((id) => setDragState(s => ({ ...s, dragging:id })), []);
  const handleDragEnter = useCallback((id) => setDragState(s => ({ ...s, over:id })), []);
  const handleDragEnd   = useCallback(() => {
    const { dragging, over } = dragState;
    if (dragging && over && dragging !== over) {
      setCards(prev => {
        const arr = [...prev];
        const fromIdx = arr.findIndex(c => c.id===dragging);
        const toIdx   = arr.findIndex(c => c.id===over);
        const [removed] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, removed);
        return arr.map((c,i) => ({ ...c, order:i }));
      });
    }
    setDragState({ dragging:null, over:null });
  }, [dragState]);

  /* ── Export / Import ── */
  const handleExport = useCallback(() => {
    const data = JSON.stringify({ cards, project, activities }, null, 2);
    const blob = new Blob([data], { type:'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `board-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
    addToast('Board exporté !', 'success');
  }, [cards, project, activities, addToast]);

  const handleImport = useCallback(() => importRef.current?.click(), []);

  const handleImportFile = useCallback((e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.cards) setCards(data.cards);
        if (data.project) setProject(p => ({ ...p, ...data.project }));
        if (data.activities) setActivities(data.activities);
        addToast('Board importé avec succès !', 'success');
      } catch {
        addToast('Fichier invalide', 'error');
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  }, [addToast]);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        setIsAddOpen(false); setIsSidebarOpen(false);
        setIsSettingsOpen(false); setExpandedCardId(null);
        setContextMenu(null);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        setIsSidebarOpen(true);
        return;
      }
      if (e.key === 'n' || e.key === 'N') { setIsAddOpen(true); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  /* ── Filtered & sorted cards ── */
  const visibleCards = useMemo(() => {
    let list = [...cards];

    // Filter
    const filterMap = {
      images:'image', files:'file', notes:'note',
      links:'link', polls:'poll', checklists:'checklist',
    };
    if (activeFilter !== 'all') {
      if (activeFilter === 'pinned') list = list.filter(c => c.pinned);
      else if (filterMap[activeFilter]) list = list.filter(c => c.type === filterMap[activeFilter]);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => {
        const { content } = c;
        return (
          content.text?.toLowerCase().includes(q) ||
          content.name?.toLowerCase().includes(q) ||
          content.title?.toLowerCase().includes(q) ||
          content.description?.toLowerCase().includes(q) ||
          content.url?.toLowerCase().includes(q) ||
          content.question?.toLowerCase().includes(q) ||
          content.options?.some(o => o.label?.toLowerCase().includes(q)) ||
          content.items?.some(i => i.label?.toLowerCase().includes(q)) ||
          c.author?.name?.toLowerCase().includes(q)
        );
      });
    }

    // Sort
    list = list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sortBy === 'recent')    return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest')    return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'reactions') {
        const ra = Object.values(a.reactions||{}).reduce((s,n)=>s+n,0);
        const rb = Object.values(b.reactions||{}).reduce((s,n)=>s+n,0);
        return rb - ra;
      }
      return (a.order||0) - (b.order||0);
    });

    return list;
  }, [cards, activeFilter, searchQuery, sortBy]);

  /* ── Contributors ── */
  const contributors = useMemo(() => {
    const map = {};
    cards.forEach(c => {
      if (c.author?.name && !map[c.author.name]) map[c.author.name] = c.author;
    });
    return Object.values(map).slice(0, 8);
  }, [cards]);

  /* ── Expanded card ── */
  const expandedCard = useMemo(() => cards.find(c => c.id === expandedCardId), [cards, expandedCardId]);

  /* ── Render ── */
  return (
    <div className={`pb-root ${settings.density === 'compact' ? 'compact' : ''}`}
      style={{ minHeight:'100vh' }}>

      {/* Global styles already injected */}

      {/* Onboarding */}
      {isOnboarding && <OnboardingModal onDone={handleOnboardingDone}/>}

      {/* Confetti */}
      <Confetti active={confetti}/>

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        project={project}
        onUpdateProject={(patch) => setProject(p => ({ ...p, ...patch }))}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cards={cards}
        activities={activities}
        contributors={contributors}
        onExport={handleExport}
        onImport={handleImport}
        onOpenSettings={() => { setIsSettingsOpen(true); setIsSidebarOpen(false); }}
        searchRef={searchRef}
      />

      {/* Settings */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        project={project}
        onUpdateSettings={(patch) => setSettings(s => ({ ...s, ...patch }))}
        onUpdateProject={(patch) => setProject(p => ({ ...p, ...patch }))}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          menu={contextMenu}
          onPin={() => handlePinCard(contextMenu.cardId)}
          onDelete={() => { setConfirmDeleteId(contextMenu.cardId); setContextMenu(null); }}
          onCopy={() => { navigator.clipboard?.writeText(`${window.location.href}#${contextMenu.cardId}`); addToast('Lien copié !', 'info'); setContextMenu(null); }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDeleteId && (
        <ConfirmDialog
          message="Supprimer cet élément ? Cette action est irréversible."
          onConfirm={() => handleDeleteCard(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* Expanded Card */}
      {expandedCard && (
        <CardExpandModal
          card={expandedCard}
          user={user}
          onClose={() => setExpandedCardId(null)}
          onDelete={(id) => { setConfirmDeleteId(id); setExpandedCardId(null); }}
          onPin={handlePinCard}
          onVote={handleVote}
          onToggleTask={handleToggleTask}
        />
      )}

      {/* Add Panel */}
      <AddPanel isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onAdd={handleAddCard} user={user}/>

      {/* Import input */}
      <input ref={importRef} type="file" accept=".json" style={{ display:'none' }} onChange={handleImportFile}/>

      {/* ──── TOP BAR ──── */}
      <div style={{
        position:'sticky', top:0, zIndex:500,
        background:'var(--surface)', borderBottom:'1px solid var(--border)',
        padding:'0 20px', height:56,
        display:'flex', alignItems:'center', gap:12,
        backdropFilter:'blur(12px)',
      }}>
        <button className="pb-btn" onClick={() => setIsSidebarOpen(v => !v)}
          style={{ background:'var(--glass)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--text)' }}>
          ☰
        </button>

        <h1 style={{ fontFamily:'Syne', fontSize:17, fontWeight:700, flex:1, cursor:'pointer' }}
          onClick={() => setIsSidebarOpen(true)}>
          {project.title || 'Mon Board'}
        </h1>

        {/* Quick search */}
        <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
          <Search size={13} color="var(--text-muted)" style={{ position:'absolute', left:10 }}/>
          <input className="pb-input" placeholder="Rechercher..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft:30, height:34, width:180, fontSize:13 }}/>
        </div>

        {/* User avatar */}
        {user && (
          <div style={{
            width:34, height:34, borderRadius:'50%',
            background:'var(--surface2)', border:'2px solid var(--border)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18, cursor:'default', flexShrink:0,
          }} title={user.name}>{user.emoji}</div>
        )}

        <button className="pb-btn" onClick={() => setIsSettingsOpen(v => !v)}
          style={{ background:'var(--glass)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 8px', color:'var(--text-muted)' }}>
          <Settings size={15}/>
        </button>

        <button className="pb-btn" onClick={() => setIsAddOpen(true)}
          style={{
            background:'var(--accent)', color:'#fff',
            borderRadius:8, padding:'7px 14px', fontWeight:600, fontSize:13,
            display:'flex', alignItems:'center', gap:6, flexShrink:0,
          }}>
          <Plus size={14}/><span style={{ whiteSpace:'nowrap' }}>Ajouter</span>
        </button>
      </div>

      {/* ──── MAIN CONTENT ──── */}
      <div style={{ padding:'20px 20px 100px' }}>

        {/* Active filter / search indicator */}
        {(activeFilter !== 'all' || searchQuery) && (
          <div style={{
            display:'flex', alignItems:'center', gap:8, marginBottom:16,
            padding:'8px 14px', background:'var(--glass)',
            borderRadius:'var(--radius-sm)', border:'1px solid var(--border)',
            fontSize:13, color:'var(--text-muted)',
          }}>
            <Filter size={13}/>
            {activeFilter !== 'all' && <span style={{ color:'var(--accent)', fontWeight:500 }}>{activeFilter}</span>}
            {searchQuery && <span>"{searchQuery}"</span>}
            <span>· {visibleCards.length} résultat{visibleCards.length!==1?'s':''}</span>
            <button className="pb-btn" onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
              style={{ background:'none', color:'var(--text-muted)', marginLeft:'auto', padding:'2px 4px' }}>
              <X size={12}/>
            </button>
          </div>
        )}

        {/* Skeleton loading */}
        {isLoading && (
          <div className="masonry">
            {Array.from({ length:6 }).map((_,i) => <SkeletonCard key={i}/>)}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && visibleCards.length === 0 && (
          <EmptyState onAdd={() => setIsAddOpen(true)}/>
        )}

        {/* Card grid */}
        {!isLoading && visibleCards.length > 0 && (
          <div className="masonry">
            {visibleCards.map((card, index) => (
              <CardItem
                key={card.id}
                card={card}
                index={index}
                compact={settings.density === 'compact'}
                user={user}
                onDelete={(id) => setConfirmDeleteId(id)}
                onPin={handlePinCard}
                onReact={handleReact}
                onVote={handleVote}
                onToggleTask={handleToggleTask}
                onExpand={setExpandedCardId}
                onContextMenu={handleContextMenu}
                isDragging={dragState.dragging === card.id}
                isOver={dragState.over === card.id && dragState.dragging !== card.id}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        )}
      </div>

      {/* ──── FAB ──── */}
      <button className="pb-btn" onClick={() => setIsAddOpen(true)} style={{
        position:'fixed', bottom:28, right:24, zIndex:600,
        width:52, height:52, borderRadius:'50%',
        background:'var(--accent)', color:'#fff',
        boxShadow:'0 8px 24px rgba(99,102,241,0.45)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:24, transition:'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform='scale(1.08)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(99,102,241,0.55)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(99,102,241,0.45)'; }}>
        <Plus size={22}/>
      </button>

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast}/>
    </div>
  );
}
