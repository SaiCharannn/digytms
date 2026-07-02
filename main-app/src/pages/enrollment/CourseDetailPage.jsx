import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';

import { getCourse, getCourseCurriculum, myEnrollments } from '../../api/client';

/*Unit type config*/
const UNIT_TYPE = {
  mp4: { icon: '🎬', label: 'Video', color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
  mp3: { icon: '🎵', label: 'Audio', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  pdf: { icon: '📄', label: 'PDF', color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
  png: { icon: '🖼️', label: 'Image', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  jpeg: { icon: '🖼️', label: 'Image', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
};

function getUnitMeta(caption = '', type) {
  const cap = caption.toLowerCase();
  if (cap.includes('flash card')) return { icon: '🃏', label: 'Flash Cards', color: '#d97706', bg: 'rgba(217,119,6,0.08)' };
  if (cap.includes('mcq') || cap.includes('test')) return { icon: '📝', label: 'MCQ Test', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' };
  return UNIT_TYPE[type] || { icon: '📁', label: type?.toUpperCase() || 'File', color: '#64748b', bg: 'rgba(100,116,139,0.08)' };
}

function formatDuration(dur) {
  if (!dur) return null;
  const [h, m, s] = dur.split(':').map(Number);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m${s > 0 ? ` ${s}s` : ''}`;
  return `${s}s`;
}

function sumDuration(units = []) {
  const total = units.reduce((acc, u) => {
    if (!u.lu_duration) return acc;
    const [h, m, s] = u.lu_duration.split(':').map(Number);
    return acc + h * 3600 + m * 60 + s;
  }, 0);
  if (!total) return null;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/* Pill badge */
function Pill({ children, color, bg, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 100,
      fontSize: '0.69rem', fontWeight: 700, letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: color || 'var(--primary-mid)',
      background: bg || 'var(--primary-xlight)',
      ...style,
    }}>{children}</span>
  );
}

/* Progress ring */
function ProgressRing({ pct = 0, size = 44, stroke = 3, color = 'var(--primary-light)'  }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} />
    </svg>
  );
}

/* 
  PREVIEW MODAL  (Udemy-style: list on left, player on right / full)
 */
function PreviewModal({ previewUnits = [], initialUnit = null, onClose }) {
  const [activeUnit, setActiveUnit] = useState(initialUnit || previewUnits[0] || null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerRef = useRef(null);
  const modalRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
        else onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isFullscreen, onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleFullscreen = () => {
    if (!isFullscreen) {
      playerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
    setIsFullscreen(f => !f);
  };


  // Sync fullscreen state with browser native events
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []); 



  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.22s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .preview-list-item:hover { background: rgba(255,255,255,0.07) !important; }
        .preview-list-item.active { background: rgba(37,99,235,0.25) !important; border-left: 3px solid #3b82f6 !important; }
      `}</style>

      <div
        ref={modalRef}
        style={{
          width: '100%', maxWidth: 1000,
          maxHeight: '90vh',
          background: '#111827',
          borderRadius: 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 80px rgba(0,0,0,0.7)',
          animation: 'slideUp 0.28s ease',
        }}
      >
        {/* ── Modal header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 22px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color:         '#60a5fa', marginBottom: 3 }}>
              Course Preview
            </div>
            <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>
              {activeUnit?.lu_caption || 'Select a preview'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.08)', color: '#9ca3af',
              fontSize: '1.1rem', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#9ca3af'; }}
          >✕</button>
        </div>

        {/* ── Body: player + list ── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* ── VIDEO / PLAYER AREA ── */}
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#000' }}>
  <div
    ref={playerRef}
    style={{
      flex: 1, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#000',
      minHeight: 300,
    }}
  >
    {activeUnit ? (() => {
      const loc = activeUnit.lu_file_location || '';
      const ytMatch = loc.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})/);
      const ytId = ytMatch?.[1];

      if (ytId) return (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, width: '100%' }}>
          <iframe
            key={activeUnit.learning_unit_id}
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
            title={activeUnit.lu_caption}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      );

      if (activeUnit.lu_type === 'mp4') return (
        <video
          key={activeUnit.learning_unit_id}
          src={loc}
          controls autoPlay
          style={{ width: '100%', height: '100%', maxHeight: '55vh', objectFit: 'contain', display: 'block' }}
        />
      );

      if (activeUnit.lu_type === 'mp3') return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 40 }}>
          <div style={{ fontSize: '4rem' }}>🎵</div>
          <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '1.05rem', textAlign: 'center' }}>{activeUnit.lu_caption}</div>
          <audio key={activeUnit.learning_unit_id} src={loc} controls autoPlay style={{ width: '100%', maxWidth: 400 }} />
        </div>
      );

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40, color: '#9ca3af' }}>
          <span style={{ fontSize: '3.5rem' }}>📄</span>
          <span style={{ fontSize: '0.9rem' }}>This file type can't be previewed inline.</span>
          {loc && (
            <a href={loc} target="_blank" rel="noopener noreferrer"
              style={{ padding: '10px 22px', background: '#2563eb', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}>
              Open File ↗
            </a>
          )}
        </div>
      );
    })() : (
      <div style={{ color: '#6b7280', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>▶</div>
        <div>Select a preview from the list</div>
      </div>
    )}


    {/* Fullscreen button — only for direct video files, not YouTube (YouTube has its own) */}
    {activeUnit && activeUnit.lu_type === 'mp4' && !activeUnit.lu_file_location?.match(/youtube|youtu\.be/) && (
      <button
        onClick={handleFullscreen}
        style={{
          position: 'absolute', bottom: 12, right: 12,
          background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', borderRadius: 6, padding: '5px 10px',
          fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        {isFullscreen ? '⊡ Exit Fullscreen' : '⛶ Fullscreen'}
      </button>
    )}
  </div>

            {/* Now playing bar */}
            {activeUnit && (
              <div style={{
                padding: '12px 18px', background: 'rgba(255,255,255,0.03)',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
              }}>
                <span style={{ fontSize: '1.2rem' }}>{getUnitMeta(activeUnit.lu_caption, activeUnit.lu_type).icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeUnit.lu_caption}</div>
                  <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: 2 }}>
                    Free Preview · {formatDuration(activeUnit.lu_duration) || 'N/A'}
                  </div>
                </div>
                {/* Prev/Next navigation */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {(() => {
                    const idx = previewUnits.findIndex(u => u.learning_unit_id === activeUnit.learning_unit_id);
                    return (
                      <>
                        <button
                          disabled={idx <= 0}
                          onClick={() => setActiveUnit(previewUnits[idx - 1])}
                          style={{ padding: '6px 12px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, background: 'transparent', color: idx <= 0 ? '#374151' : '#9ca3af', cursor: idx <= 0 ? 'default' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                        >‹ Prev</button>
                        <button
                          disabled={idx >= previewUnits.length - 1}
                          onClick={() => setActiveUnit(previewUnits[idx + 1])}
                          style={{ padding: '6px 12px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, background: 'transparent', color: idx >= previewUnits.length - 1 ? '#374151' : '#9ca3af', cursor: idx >= previewUnits.length - 1 ? 'default' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                        >Next ›</button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/*  PREVIEW LIST SIDEBAR */}
          <div style={{
            width: 300, flexShrink: 0,
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            overflowY: 'auto',
            background: '#0f172a  ',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              padding: '14px 18px 10px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              position: 'sticky', top: 0,
              background: '#0f172a', zIndex: 1, flexShrink: 0,
            }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#60a5fa', marginBottom: 4 }}>
                Free Sample Videos
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                {previewUnits.length} preview{previewUnits.length !== 1 ? 's' : ''} available
              </div>
            </div>

            <div style={{ flex: 1 }}>
              {previewUnits.map((unit, i) => {
                const meta = getUnitMeta(unit.lu_caption, unit.lu_type);
                const dur = formatDuration(unit.lu_duration);
                const isActive = activeUnit?.learning_unit_id === unit.learning_unit_id;
                return (
                  <div
                    key={unit.learning_unit_id}
                    className={`preview-list-item${isActive ? ' active' : ''}`}
                    onClick={() => setActiveUnit(unit)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 18px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(37,99,235,0.2)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Thumbnail placeholder / play icon */}
                    <div style={{
                      width: 54, height: 38, borderRadius: 6, flexShrink: 0,
                      background: isActive ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${isActive ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: isActive ? '1.1rem' : '0.9rem',
                      color: isActive ? '#60a5fa' : '#4b5563',
                      transition: 'all 0.15s',
                    }}>
                      {isActive ? '▶' : meta.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.8rem', fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#93c5fd' : '#d1d5db',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        marginBottom: 3,
                      }}>{unit.lu_caption}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: '0.62rem', fontWeight: 700,
                          color: meta.color, background: meta.bg,
                          padding: '1px 6px', borderRadius: 4,
                        }}>{meta.label}</span>
                        {dur && <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>{dur}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {previewUnits.length === 0 && (
              <div style={{ padding: 28, textAlign: 'center', color: '#4b5563' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔒</div>
                <div style={{ fontSize: '0.82rem' }}>No free previews available</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Unit Row  */
function UnitRow({ unit, index, isEnrolled, onPreviewClick }) {
  const meta = getUnitMeta(unit.lu_caption, unit.lu_type);
  const isPreview = unit.lu_preview_flag === 'YES';
  const locked = !isEnrolled && !isPreview;
  const dur = formatDuration(unit.lu_duration);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 20px',
        borderTop: '1px solid var(--border)',
        background: locked ? 'transparent' : 'var(--surface)',
        opacity: locked ? 0.72 : 1,
        transition: 'background 0.18s',
        cursor: locked ? 'default' : 'pointer',
      }}
      onMouseEnter={e => { if (!locked) e.currentTarget.style.background = 'var(--primary-xlight)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = locked ? 'transparent' : 'var(--surface)'; }}
    >
      <span style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.7rem', fontWeight: 700,
        background: locked ? 'var(--border)' : 'var(--primary-xlight)',
        color: locked ? 'var(--text-muted)' : 'var(--primary)',
      }}>{index}</span>

      <span style={{
        width: 32, height: 32, flexShrink: 0, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: locked ? 'var(--border)' : meta.bg,
        fontSize: '1rem',
      }}>{meta.icon}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: '0.86rem', fontWeight: 500,
          color: locked ? 'var(--text-muted)' : 'var(--text-primary)',
          display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{unit.lu_caption}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <Pill color={meta.color} bg={meta.bg}>{meta.label}</Pill>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {dur && <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{dur}</span>}


        {/* ── Udemy-style Preview button ── */}
        {isPreview && !isEnrolled && (
          <button
            onClick={(e) => { e.stopPropagation(); onPreviewClick(unit); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 12px', border: '1.5px solid #2563eb',
              borderRadius: 100, background: 'transparent',
              color: '#2563eb', fontSize: '0.72rem', fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.04em',
              transition: 'all 0.18s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2563eb'; }}
          >
            ▶ Preview
          </button>
        )}

        {locked
          ? <span style={{ fontSize: '0.85rem', opacity: 0.5 }}>🔒</span>
          : !isPreview && (
            <span style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: meta.bg, color: meta.color, fontSize: '0.7rem', fontWeight: 700,
            }}>▶</span>
          )
        }
      </div>
    </div>
  );
}

/*  Chapter Accordion  */
function ChapterBlock({ chapter, chapterNum, isEnrolled, defaultOpen, onPreviewClick }) {
  const [open, setOpen] = useState(defaultOpen);
  const units = chapter.units || [];
  const vidCount = units.filter(u => u.lu_type === 'mp4' || u.lu_type === 'mp3').length;
  const docCount = units.filter(u => u.lu_type === 'pdf').length;
  const durStr = sumDuration(units);

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 10,
      marginTop: 12, overflow: 'hidden',
      boxShadow: open ? 'var(--shadow-sm)' : 'none',
      transition: 'box-shadow 0.2s',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', border: 'none',
        background: open ? 'var(--surface)' : 'var(--surface-2)',
        padding: '14px 18px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', gap: 14, cursor: 'pointer',
        transition: 'background 0.18s', fontFamily: 'var(--font-body)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: '0.68rem', fontWeight: 700,
            background: 'var(--primary-xlight)', color: 'var(--primary)',
            padding: '4px 10px', borderRadius: 100,
          }}>Ch {chapterNum}</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>
            {chapter.chapter_name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {units.length} unit{units.length !== 1 ? 's' : ''}
            {vidCount > 0 && ` · ${vidCount} video${vidCount !== 1 ? 's' : ''}`}
            {docCount > 0 && ` · ${docCount} doc${docCount !== 1 ? 's' : ''}`}
            {durStr && ` · ${durStr}`}
          </span>
          <span style={{
            fontSize: '1.1rem', color: 'var(--text-muted)',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.22s', display: 'inline-block',
          }}>›</span>
        </div>
      </button>

      {open && (
        <div style={{ background: 'var(--surface)' }}>
          {units.map((u, i) => (
            <UnitRow
              key={u.learning_unit_id}
              unit={u}
              index={i + 1}
              isEnrolled={isEnrolled}
              onPreviewClick={onPreviewClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* Section Accordion */
function SectionBlock({ section, sectionNum, isEnrolled, defaultOpen, isLast, onPreviewClick }) {
  const [open, setOpen] = useState(defaultOpen);
  const chapters = section.chapters || [];
  const totalUnits = section.total_units || 0;

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', border: 'none',
        background: open ? 'var(--surface)' : 'var(--surface-2)',
        padding: '22px 28px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', gap: 16, cursor: 'pointer',
        transition: 'background 0.18s', fontFamily: 'var(--font-body)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, textAlign: 'left' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-light)' }}>
            Section {sectionNum}
          </span>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {section.subject_name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} · {totalUnits} unit{totalUnits !== 1 ? 's' : ''}
          </span>
          <span style={{
            width: 28, height: 28, borderRadius: '50%',
            background: open ? 'var(--primary-xlight)' : 'var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', color: open ? 'var(--primary)' : 'var(--text-muted)',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.22s, background 0.18s, color 0.18s',
          }}>›</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 24px 24px' }}>
          {chapters.map((ch, i) => (
            <ChapterBlock
              key={ch.chapter_id}
              chapter={ch}
              chapterNum={i + 1}
              isEnrolled={isEnrolled}
              defaultOpen={i === 0 && sectionNum === 1}
              onPreviewClick={onPreviewClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/*  Stat Tile */
function StatTile({ emoji, label, value }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)',
      borderRadius: 12, padding: '12px 16px', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', gap: 4, minWidth: 110,
    }}>
      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {emoji} {label}
      </span>
      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</span>
    </div>
  );
}

/*  Info Row  */
function InfoRow({ label, children, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 18px',
      borderBottom: last ? 'none' : '1px solid var(--border)',
      background: 'var(--surface)',
    }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right' }}>{children}</span>
    </div>
  );
}

/* ── Helper: collect all preview units across sections/chapters  */
function collectPreviewUnits(sections = []) {
  const units = [];
  sections.forEach(sec => {
    (sec.chapters || []).forEach(ch => {
      (ch.units || []).forEach(u => {
        if (u.lu_preview_flag === 'YES') units.push(u);
      });
    });
  });
  return units;
}

/* 
   MAIN PAGE
 */
export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandAll, setExpandAll] = useState(false);
  const [activeTab, setActiveTab] = useState('curriculum');

  // Preview modal state
  const [previewModal, setPreviewModal] = useState({ open: false, startUnit: null });

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState(null);

  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  useEffect(() => {
    if (!courseId) {
      navigateRef.current('/courses', { replace: true });
      return;
    }
    let cancelled = false;
    setLoading(true);

    // Fetch course + curriculum first — these are critical
    // Enrollment check is secondary — never block the page if it fails
    Promise.all([
      getCourse(courseId),
      getCourseCurriculum(courseId),
    ])
      .then(([courseRes, currRes]) => {
        if (cancelled) return;
        setCourse(courseRes.data.course);
        setCurriculum(currRes.data);

        // Now separately check enrollment — failure here must NOT crash the page
        return myEnrollments()
          .then(enrollRes => {
            if (cancelled) return;
            const match = (enrollRes.data.enrollments || []).find(
              e => e.course_id === courseId && e.status === 'active'
            );
            if (match) {
              setIsEnrolled(true);
              setEnrollment(match);
            }
          })
          .catch(() => {
          });
      })
      .catch(() => {
        // Only redirect if course/curriculum fetch fails — these are truly critical
        if (!cancelled) navigateRef.current('/courses', { replace: true });
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [courseId]);

  const openPreviewModal = useCallback((startUnit = null) => {
    setPreviewModal({ open: true, startUnit });
  }, []);

  const closePreviewModal = useCallback(() => {
    setPreviewModal({ open: false, startUnit: null });
  }, []);

  if (loading) return (
    <AppShell title="Course">
      <div className="loading-screen" style={{ minHeight: 360 }}>
        <div className="loading-spinner-lg" />
        <p className="loading-text">Loading course…</p>
      </div>
    </AppShell>
  );

  if (!course) return null;

  const isFree = !course.course_fee || parseFloat(course.course_fee) === 0;
  const stats = curriculum?.stats || {};
  const sections = curriculum?.sections || [];
  const previewPct = stats.units ? Math.round((stats.previews / stats.units) * 100) : 0;
  const allPreviewUnits = collectPreviewUnits(sections);

  return (
    <AppShell title="Course Detail">

      {/* ── Preview Modal ── */}
      {previewModal.open && (
        <PreviewModal
          previewUnits={allPreviewUnits}
          initialUnit={previewModal.startUnit}
          onClose={closePreviewModal}
        />
      )}

      {/* HERO*/}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #1d4ed8 60%, var(--primary-light) 100%)',
        borderRadius: 20, padding: '40px 40px 36px',
        display: 'flex', justifyContent: 'space-between', gap: 32,
        color: '#fff', boxShadow: 'var(--shadow-lg)',
        position: 'relative', overflow: 'hidden',
        animation: 'fadeUp 0.35s ease', flexWrap: 'wrap',
      }}>
        <div style={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)', top: -140, right: -100, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', bottom: -60, left: 40, pointerEvents: 'none' }} />

        <div style={{ flex: 1, position: 'relative', zIndex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 12px', borderRadius: 100,
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
              background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>📚 {course.course_category || 'General'}</span>
            {course.has_preview && (
              <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(245,158,11,0.25)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                👁 Preview Available
              </span>
            )}
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, lineHeight: 1.25, marginBottom: 10, letterSpacing: '-0.02em' }}>
            {course.course_name}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.72)', marginBottom: 28 }}>
            🏛️ {course.institution_name}
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatTile emoji="📂" label="Sections" value={stats.sections || 0} />
            <StatTile emoji="📖" label="Chapters" value={stats.chapters || 0} />
            <StatTile emoji="🎬" label="Units" value={stats.units || 0} />
            {course.course_duration && <StatTile emoji="⏱" label="Duration" value={`${course.course_duration} ${course.duration_unit}`} />}
            {stats.previews > 0 && <StatTile emoji="👁" label="Free Previews" value={stats.previews} />}
          </div>
        </div>

        {/* CTA card */}
      <div style={{
          width: 290, flexShrink: 0,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 16, padding: 24, backdropFilter: 'blur(12px)',
          position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 0,
        }}>
  {isEnrolled ? (
    /* ── ENROLLED STATE ── */
    <>
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)',
          borderRadius: 100, padding: '6px 14px', marginBottom: 12,
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            ✅ Enrolled
          </span>
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>
          You have full access
        </div>
        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
          All {stats.units || 0} units unlocked · Lifetime access
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{
          width: '100%', justifyContent: 'center', padding: '14px',
          fontSize: '0.95rem', borderRadius: 10,
          background: 'linear-gradient(135deg,#059669,#10b981)',
          color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        }}
                 onClick={() => {
                  setActiveTab('curriculum');
                  setTimeout(() => {
                    window.scrollTo({ top: 500, behavior: 'smooth' });
                  }, 100);
                }}
      >
        📖 Continue Learning
      </button>
    </>
  ) : (
    /* ── NOT ENROLLED STATE ── */
    <>
      <div style={{ marginBottom: 20 }}>
        {isFree ? (
          <>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1 }}>FREE</div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>No payment required</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>
              {course.currency_code} {parseFloat(course.course_fee).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>One-time payment · Lifetime access</div>
          </>
        )}
      </div>

      {stats.previews > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 14px', background: 'rgba(255,255,255,0.08)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)' }}>
          <ProgressRing pct={previewPct} size={40} stroke={3} color="#fbbf24" />
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>{stats.previews} free previews</div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)' }}>{previewPct}% of content unlocked</div>
          </div>
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.95rem', borderRadius: 10, background: isFree ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#fff,#e0eaff)', color: isFree ? '#fff' : 'var(--primary)', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}
        onClick={() => navigate(`/courses/${courseId}/enroll`, { state: { course } })}
      >{isFree ? '🚀 Enroll for Free' : '💳 Enroll Now'}</button>

      {allPreviewUnits.length > 0 && (
        <button
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 10, borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.2)' }}
          onClick={() => openPreviewModal(null)}
        >👁 Watch Free Preview</button>
      )}
    </>
  )}
</div>
      </div>

     {/*  TABS ════════════ */}
      <div style={{ display: 'flex', gap: 0, marginTop: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 5, boxShadow: 'var(--shadow-sm)' }}>
        {[['curriculum', '📋 Curriculum'], ['overview', 'ℹ️ Overview']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            flex: 1, padding: '10px 18px', border: 'none', borderRadius: 9,
            fontFamily: 'var(--font-body)', fontSize: '0.88rem', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
            background: activeTab === key ? 'var(--primary)' : 'transparent',
            color: activeTab === key ? '#fff' : 'var(--text-muted)',
            boxShadow: activeTab === key ? '0 2px 8px rgba(10,36,99,0.25)' : 'none',
          }}>{label}</button>
        ))}
      </div>

      {/* ════════════ CURRICULUM TAB ════════════ */}
      {activeTab === 'curriculum' && (
        <div style={{ marginTop: 20 }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '14px 22px', marginBottom: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                <strong>{stats.sections}</strong> sections &nbsp;·&nbsp;
                <strong>{stats.chapters}</strong> chapters &nbsp;·&nbsp;
                <strong>{stats.units}</strong> learning units
              </span>
              {!isEnrolled && allPreviewUnits.length > 0 && (
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--success)', padding: '3px 10px', background: 'var(--success-bg)', borderRadius: 100, border: '1px solid var(--success-border)' }}>
                  ✓ {allPreviewUnits.length} free preview{allPreviewUnits.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {allPreviewUnits.length > 0 && !isEnrolled && (
                <button
                  onClick={() => openPreviewModal(null)}
                  style={{
                    padding: '8px 16px', border: '1.5px solid #2563eb', borderRadius: 8,
                    background: 'transparent', fontFamily: 'var(--font-body)',
                    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    color: '#2563eb', transition: 'all 0.18s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2563eb'; }}
                >▶ Watch All Previews</button>
              )}
              <button
                onClick={() => setExpandAll(e => !e)}
                style={{ padding: '8px 16px', border: '1.5px solid var(--border)', borderRadius: 8, background: 'var(--surface)', fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >{expandAll ? '⊖ Collapse All' : '⊕ Expand All'}</button>
            </div>
          </div>

          {sections.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No curriculum data yet</h3>
              <p>Run <code>python manage.py seed_enrollment</code> in the backend</p>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
              {sections.map((sec, i) => (
                <SectionBlock
                  key={sec.subject_id}
                  section={sec}
                  sectionNum={i + 1}
                  isEnrolled={isEnrolled}
                  defaultOpen={expandAll || i === 0}
                  isLast={i === sections.length - 1}
                  onPreviewClick={openPreviewModal}
                />
              ))}
            </div>
          )}

          {!isEnrolled && (
            <div style={{
              marginTop: 24,
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
              borderRadius: 16, padding: '26px 32px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20,
              color: '#fff', boxShadow: 'var(--shadow-md)', flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <strong style={{ fontSize: '1rem' }}>Unlock all {stats.units} learning units</strong>
                <span style={{ fontSize: '0.84rem', opacity: 0.78 }}>Full access · All chapters · Flash cards · MCQ tests</span>
              </div>
              <button
                className="btn btn-primary"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', boxShadow: 'none', color: '#fff', borderRadius: 10 }}
                onClick={() => navigate(`/courses/${courseId}/enroll`, { state: { course } })}
              >
                {isFree ? '🚀 Enroll Free' : `💳 Enroll — ${course.currency_code} ${parseFloat(course.course_fee || 0).toLocaleString('en-IN')}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* OVERVIEW TAB */} 
      {activeTab === 'overview' && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { icon: '📂', label: 'Sections', value: stats.sections },
              { icon: '📖', label: 'Chapters', value: stats.chapters },
              { icon: '🎬', label: 'Units', value: stats.units },
              { icon: '👁', label: 'Previews', value: stats.previews },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '18px 20px',
                boxShadow: 'var(--shadow-sm)', animation: 'fadeUp 0.3s ease',
              }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{value || 0}</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              </div>
            ))}
          </div>
               
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-light)' }}>Course Details</div>
            </div>
            <InfoRow label="Course ID"><code style={{ fontSize: '0.82rem', background: 'var(--surface-2)', padding: '2px 7px', borderRadius: 4 }}>{courseId}</code></InfoRow>
            <InfoRow label="Category">{course.course_category || '—'}</InfoRow>
            <InfoRow label="Institution">{course.institution_name}</InfoRow>
            <InfoRow label="Duration">{course.course_duration ? `${course.course_duration} ${course.duration_unit}` : '—'}</InfoRow>
            <InfoRow label="Fee">
              {isFree
                ? <span style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '2px 10px', borderRadius: 100, fontWeight: 700, fontSize: '0.78rem' }}>FREE</span>
                : `${course.currency_code} ${parseFloat(course.course_fee).toLocaleString('en-IN')}`}
            </InfoRow>
            <InfoRow label="Free Previews" last>
              <span style={{ color: 'var(--success)', fontWeight: 700 }}>{stats.previews} units</span>
            </InfoRow>
          </div>
        </div>
      )}

    </AppShell>
  );
} 