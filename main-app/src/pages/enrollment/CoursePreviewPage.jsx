import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { getCoursePreview, getCourse } from '../../api/client';

const TYPE_ICON = { pdf: '📄', mp4: '🎬', mp3: '🎵', png: '🖼️', jpeg: '🖼️' };

export default function CoursePreviewPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCourse(courseId), getCoursePreview(courseId)])
      .then(([cr, pr]) => {
        setCourse(cr.data.course);
        setUnits(pr.data.preview_units || []);
      })
      .catch(() => navigate('/courses'))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return (
    <AppShell title="Course Preview">
      <div className="loading-screen" style={{ minHeight: 300 }}>
        <div className="loading-spinner-lg" /><p className="loading-text">Loading preview…</p>
      </div>
    </AppShell>
  );

  const isFree = course && parseFloat(course.course_fee) === 0;

  return (
    <AppShell title="Course Preview">
      {course && (
        <>
          <div className="preview-hero">
            <div className="preview-hero-content">
              <span className="course-cat-badge" style={{ marginBottom: 12, display: 'inline-block' }}>
                {course.course_category || 'General'}
              </span>
              <h2 className="preview-hero-title">{course.course_name}</h2>
              <p className="preview-hero-inst">🏛️ {course.institution_name}</p>
              <div className="preview-hero-meta">
                {course.course_duration && (
                  <span>⏱ {course.course_duration} {course.duration_unit}</span>
                )}
                <span>
                  {isFree
                    ? <span className="fee-free">FREE</span>
                    : <span className="fee-paid">{course.currency_code} {parseFloat(course.course_fee).toLocaleString('en-IN')}</span>
                  }
                </span>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/courses/${courseId}/enroll`, { state: { course } })}
            >
              🎓 Enroll Now
            </button>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header">
              <div>
                <div className="card-title">Free Preview Content</div>
                <div className="card-sub">{units.length} unit{units.length !== 1 ? 's' : ''} available for preview</div>
              </div>
            </div>
            {units.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔒</div>
                <h3>No preview content</h3>
                <p>Enroll to access full course material</p>
              </div>
            ) : (
              <div className="preview-units-list">
                {units.map((u, i) => (
                  <div className="preview-unit-row" key={u.learning_unit_id}>
                    <div className="preview-unit-num">{i + 1}</div>
                    <div className="preview-unit-icon">{TYPE_ICON[u.lu_type] || '📁'}</div>
                    <div className="preview-unit-info">
                      <div className="preview-unit-caption">{u.lu_caption}</div>
                      <div className="preview-unit-meta">
                        {u.lu_type?.toUpperCase()} · {u.lu_mediatype}
                        {u.lu_duration && ` · ${u.lu_duration}`}
                      </div>
                    </div>
                    {u.lu_file_location && (
                      <a href={u.lu_file_location} target="_blank" rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm">
                        View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
