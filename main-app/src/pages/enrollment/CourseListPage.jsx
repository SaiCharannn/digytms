/*
   DROP-IN REPLACEMENT  CourseCard + CourseListPage
   Matches the Udemy card layout (thumbnail, rating, price,
   hover-popup with bullet points) — NO Premium/Bestseller tags.
   */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { getCourses } from '../../api/client';

/* ── Helpers  */
const CATEGORY_ICONS = {
  Technology: '💻', Business: '📊', Science: '🔬',
  Arts: '🎨', Mathematics: '📐', Language: '🌐', General: '📚',
};

const CATEGORY_COLORS = {
  Technology: '#e0f2fe', Business: '#fef9c3', Science: '#f0fdf4',
  Arts: '#fdf4ff', Mathematics: '#eff6ff', Language: '#fff7ed',
  General: '#f8faff',
};

/* deterministic "thumbnail" colour from course id */
function thumbColor(id = '') {
  const hues = [210, 170, 330, 30, 260, 10, 200];
  let h = 0;
  for (let i = 0; i < String(id).length; i++) h += String(id).charCodeAt(i);
  return `hsl(${hues[h % hues.length]}, 55%, 42%)`;
}

function StarRating({ rating = 4.5, count }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="ud-stars">
      <span className="ud-star-val">{rating.toFixed(1)}</span>
      {[...Array(full)].map((_, i) => <span key={`f${i}`} className="ud-star filled">★</span>)}
      {half && <span className="ud-star half">★</span>}
      {[...Array(empty)].map((_, i) => <span key={`e${i}`} className="ud-star">★</span>)}
      {count !== undefined && <span className="ud-star-count">({count.toLocaleString('en-IN')})</span>}
    </span>
  );
}

/* ── Course Card (Udemy-style) ────────────────────────────── */
function CourseCard({ course, onEnroll, onPreview, onOpen }) {
  const isFree = !course.course_fee || parseFloat(course.course_fee) === 0;
  const catIcon = CATEGORY_ICONS[course.course_category] || '📚';
  const catColor = CATEGORY_COLORS[course.course_category] || '#f8faff';
  const bgColor = thumbColor(course.course_id);
  const cardRef = useRef(null);
  const [popupSide, setPopupSide] = useState('right');

  /* decide whether popup should open left or right */
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPopupSide(rect.right + 300 > window.innerWidth ? 'left' : 'right');
  }, []);

  /* fake rating derived from id (replace with real data if available) */
  const rating = 4.3 + ((String(course.course_id || '').charCodeAt(0) || 0) % 4) * 0.1;
  const reviews = 120 + ((String(course.course_id || '').charCodeAt(1) || 0) % 800) * 17;

  return (
    <div
      className="ud-card"
      ref={cardRef}
      onClick={() => onOpen(course.course_id)}
      style={{ cursor: 'pointer' }}
    >
      {/* Thumbnail */}
      <div className="ud-thumb" style={{ background: bgColor }}>
        <span className="ud-thumb-icon">{catIcon}</span>
        <span className="ud-thumb-label" style={{ background: catColor, color: '#374151' }}>
          {course.course_category || 'General'}
        </span>
      </div>

      {/* Card body */}
      <div className="ud-body">
        <h3 className="ud-title">{course.course_name}</h3>
        {course.course_short_name && (
          <p className="ud-short">{course.course_short_name}</p>
        )}
        <p className="ud-inst">🏛️ {course.institution_name}</p>
        <StarRating rating={parseFloat(rating.toFixed(1))} count={reviews} />
        <div className="ud-price-row">
          {isFree ? (
            <span className="ud-price-free">Free</span>
          ) : (
            <>
              <span className="ud-price-current">
                {course.currency_code} {parseFloat(course.course_fee).toLocaleString('en-IN')}
              </span>
              <span className="ud-price-original">
                {course.currency_code} {(parseFloat(course.course_fee) * 8).toLocaleString('en-IN')}
              </span>
            </>
          )}
          {course.course_duration && (
            <span className="ud-duration">⏱ {course.course_duration} {course.duration_unit}</span>
          )}
        </div>
      </div>

      {/* Hover Popup */}
      <div className={`ud-popup ud-popup-${popupSide}`}>
        <div className="ud-popup-cat" style={{ background: catColor }}>
          {catIcon} {course.course_category || 'General'}
        </div>
        <h4 className="ud-popup-title">{course.course_name}</h4>
        <p className="ud-popup-inst">🏛️ {course.institution_name}</p>

        {course.course_duration && (
          <p className="ud-popup-meta">
            ⏱ {course.course_duration} {course.duration_unit} &nbsp;·&nbsp; All Levels
          </p>
        )}

        <ul className="ud-popup-bullets">
          <li>✓ Structured curriculum with expert content</li>
          <li>✓ Hands-on exercises and assessments</li>
          <li>✓ Certificate upon completion</li>
          {isFree && <li>✓ Completely free — no card required</li>}
        </ul>

        <div className="ud-popup-actions">
          <button
            className="ud-btn-enroll"
            onClick={(e) => {
              e.stopPropagation();
              onEnroll(course);
            }}
          >
            {isFree ? '🚀 Enroll Free' : '🛒 Add to cart'}
          </button>
          {course.has_preview && (
            <button
              className="ud-btn-preview"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(course.course_id);
              }}
            >
              👁 Preview
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Course List Page ─────────────────────────────────────── */
export default function CourseListPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterInst, setFilterInst] = useState('');
  const [filterFee, setFilterFee] = useState('all');
  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    setLoading(true);
    getCourses()
      .then(r => {
        const data = r.data.courses || [];
        setCourses(data);
        const unique = [...new Map(
          data.map(c => [c.institution_id, { id: c.institution_id, name: c.institution_name }])
        ).values()];
        setInstitutions(unique);
      })
      .catch(() => setError('Failed to load courses. Is the Django server running?'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c => {
    const matchSearch = !search ||
      c.course_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.course_category || '').toLowerCase().includes(search.toLowerCase());
    const matchInst = !filterInst || c.institution_id === filterInst;
    const isFree = !c.course_fee || parseFloat(c.course_fee) === 0;
    const matchFee =
      filterFee === 'all' ||
      (filterFee === 'free' && isFree) ||
      (filterFee === 'paid' && !isFree);
    return matchSearch && matchInst && matchFee;
  });

  return (
    <AppShell title="Browse Courses" badge={`${filtered.length} Available`}>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-search-wrap">
          <span className="filter-search-icon">🔍</span>
          <input
            type="text"
            className="filter-search"
            placeholder="Search by name or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="filter-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <select className="filter-select" value={filterInst} onChange={e => setFilterInst(e.target.value)}>
          <option value="">All Institutions</option>
          {institutions.map(i => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>

        <div className="fee-toggle">
          {['all', 'free', 'paid'].map(f => (
            <button
              key={f}
              className={`fee-toggle-btn ${filterFee === f ? 'active' : ''}`}
              onClick={() => setFilterFee(f)}
            >
              {f === 'all' ? 'All' : f === 'free' ? '🆓 Free' : '💳 Paid'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <span>⚠️</span><span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 320 }}>
          <div className="loading-spinner-lg" />
          <p className="loading-text">Loading courses…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-state-icon">📭</div>
          <h3>{courses.length === 0 ? 'No courses available yet' : 'No courses match your filters'}</h3>
          <p>
            {courses.length === 0
              ? 'An admin needs to add courses first via Django admin panel'
              : 'Try clearing your search or filters'}
          </p>
          {(search || filterInst || filterFee !== 'all') && (
            <button
              className="btn btn-secondary"
              style={{ marginTop: 16 }}
              onClick={() => { setSearch(''); setFilterInst(''); setFilterFee('all'); }}
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="ud-grid">
          {filtered.map(course => (
            <CourseCard
              key={course.course_id}
              course={course}
              onOpen={id => navigate(`/courses/${id}`)}
              onPreview={id => navigate(`/courses/${id}/preview`)}
              onEnroll={course =>
                navigate(`/courses/${course.course_id}/enroll`, {
                  state: { course }
                })
              }
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}