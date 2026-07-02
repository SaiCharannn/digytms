import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { enroll, uploadPayment, getCourse } from '../../api/client';

/* ── Step indicator ── */
function Steps({ current, steps }) {
  return (
    <div className="enroll-steps">
      {steps.map((label, i) => {
        const num = i + 1;
        const done = current > num;
        const active = current === num;
        return (
          <div className="enroll-step" key={label}>
            <div className={`enroll-step-num ${active ? 'active' : done ? 'done' : ''}`}>
              {done ? '✓' : num}
            </div>
            <div className={`enroll-step-label ${active ? 'active' : done ? 'done' : ''}`}>
              {label}
            </div>
            {i < steps.length - 1 && (
              <div className={`enroll-step-line ${done ? 'done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const STEPS = ['Course Info', 'Confirm', 'Payment', 'Complete'];

export default function EnrollPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [course, setCourse] = useState(location.state?.course || null);
  const [courseLoading, setCL] = useState(!location.state?.course);
  const [step, setStep] = useState(1);
  const [enrollmentId, setEid] = useState(null);
  const [enrollResult, setEres] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollErr, setEnrollErr] = useState('');

  // Payment form
  const [payRef, setPayRef] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payFile, setPayFile] = useState(null);
  const [payErrs, setPayErrs] = useState({});
  const [uploading, setUploading] = useState(false);

  // Load course if not passed via state
  useEffect(() => {
    if (!course) {
      getCourse(courseId)
        .then(r => setCourse(r.data.course))
        .catch(() => navigate('/courses'))
        .finally(() => setCL(false));
    }
  }, [courseId]);

  if (courseLoading) return (
    <AppShell title="Enroll">
      <div className="loading-screen" style={{ minHeight: 320 }}>
        <div className="loading-spinner-lg" /><p className="loading-text">Loading…</p>
      </div>
    </AppShell>
  );

  if (!course) return null;

  const isFree = !course.course_fee || parseFloat(course.course_fee) === 0;

  /* ── Step 2: Confirm & Enroll ── */
  async function handleEnroll() {
    setEnrolling(true); setEnrollErr('');
    try {
      const res = await enroll({ course_id: courseId });
      const d = res.data;
      setEid(d.enrollment_id);
      setEres(d);
      // Free → skip payment, straight to complete
      setStep(d.status === 'active' ? 4 : 3);
    } catch (err) {
      const msg = err.response?.data?.message;
      if (err.response?.status === 409) {
        setEnrollErr('You are already enrolled in this course.');
      } else {
        setEnrollErr(msg || 'Enrollment failed. Please try again.');
      }
    } finally {
      setEnrolling(false);
    }
  }

  /* ── Step 3: Upload payment ── */
  function validatePayment() {
    const e = {};
    if (!payRef.trim()) e.payRef = 'Payment reference is required';
    if (!payDate) e.payDate = 'Payment date is required';
    if (!payFile) e.payFile = 'Please upload your transaction screenshot';
    return e;
  }

  async function handlePaymentUpload() {
    const errs = validatePayment();
    if (Object.keys(errs).length) { setPayErrs(errs); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('payment_reference_number', payRef);
    fd.append('payment_date', payDate);
    fd.append('transaction_image', payFile);
    try {
      await uploadPayment(enrollmentId, fd);
      setStep(4);
    } catch (err) {
      setPayErrs({ general: err.response?.data?.message || 'Upload failed. Try again.' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <AppShell title="Course Enrollment">
      <Steps current={step} steps={STEPS} />

      <div className="enroll-card">

        {/* ── Step 1: Course Info ── */}
        {step === 1 && (
          <>
            <h3 className="enroll-card-title">📋 Course Details</h3>
            <div className="course-info-grid">
              <InfoRow label="Course" value={course.course_name} />
              <InfoRow label="Institution" value={course.institution_name} />
              {course.course_category && <InfoRow label="Category" value={course.course_category} />}
              {course.course_duration && (
                <InfoRow label="Duration" value={`${course.course_duration} ${course.duration_unit}`} />
              )}
              <InfoRow
                label="Course Fee"
                value={
                  isFree
                    ? <span className="fee-free">FREE</span>
                    : <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>
                      {course.currency_code} {parseFloat(course.course_fee).toLocaleString('en-IN')}
                    </strong>
                }
              />
            </div>

            {!isFree && (
              <div className="alert alert-info">
                <span>💳</span>
                <span>
                  This is a <strong>paid course</strong>. After confirming enrollment, you'll need to
                  upload your payment proof. An operator will then verify and activate your access.
                </span>
              </div>
            )}

            {isFree && (
              <div className="alert alert-success">
                <span>🎉</span>
                <span>This is a <strong>free course</strong>. You'll get instant access upon enrolling!</span>
              </div>
            )}

            <div className="enroll-btn-row">
              <button className="btn btn-secondary" onClick={() => navigate('/courses')}>← Back</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(2)}>
                Continue →
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Confirm ── */}
        {step === 2 && (
          <>
            <h3 className="enroll-card-title">✅ Confirm Enrollment</h3>
            <div className="confirm-box">
              <div className="confirm-course-name">{course.course_name}</div>
              <div className="confirm-inst">{course.institution_name}</div>
              <div className="confirm-fee">
                {isFree
                  ? <span className="fee-free" style={{ fontSize: '1rem' }}>FREE — Instant Access</span>
                  : <span className="fee-paid" style={{ fontSize: '1.1rem' }}>
                    {course.currency_code} {parseFloat(course.course_fee).toLocaleString('en-IN')}
                  </span>
                }
              </div>
            </div>

            <p className="confirm-desc">
              {isFree
                ? 'Clicking confirm will immediately activate your enrollment in this course.'
                : 'Clicking confirm will create your enrollment. You will then need to submit payment proof for operator approval.'}
            </p>

            {enrollErr && (
              <div className="alert alert-error">
                <span>⚠️</span><span>{enrollErr}</span>
              </div>
            )}

            <div className="enroll-btn-row">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleEnroll}
                disabled={enrolling}
              >
                {enrolling ? <><div className="spinner" />Enrolling…</> : '🎓 Confirm Enrollment'}
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Payment Upload ── */}
        {step === 3 && (
          <>
            <h3 className="enroll-card-title">💳 Upload Payment Proof</h3>

            <div className="payment-instruction">
              <div className="payment-instruction-icon">🏦</div>
              <div>
                <div className="payment-instruction-title">Transfer Payment</div>
                <div className="payment-instruction-desc">
                  Transfer <strong>{course.currency_code} {parseFloat(course.course_fee).toLocaleString('en-IN')}</strong> via
                  UPI / NEFT / IMPS to the institution's account, then upload the screenshot below.
                </div>
              </div>
            </div>

            {payErrs.general && (
              <div className="alert alert-error"><span>⚠️</span><span>{payErrs.general}</span></div>
            )}

            <div className="field">
              <label>Payment Reference Number *</label>
              <div className="field-wrap">
                <input
                  type="text"
                  value={payRef}
                  onChange={e => { setPayRef(e.target.value); setPayErrs(p => ({ ...p, payRef: '' })); }}
                  placeholder="UPI Ref / UTR / Transaction ID"
                  className={payErrs.payRef ? 'error' : ''}
                />
              </div>
              {payErrs.payRef && <span className="field-error">{payErrs.payRef}</span>}
            </div>

            <div className="field">
              <label>Payment Date *</label>
              <div className="field-wrap">
                <input
                  type="date"
                  value={payDate}
                  onChange={e => { setPayDate(e.target.value); setPayErrs(p => ({ ...p, payDate: '' })); }}
                  className={payErrs.payDate ? 'error' : ''}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              {payErrs.payDate && <span className="field-error">{payErrs.payDate}</span>}
            </div>

            <div className="field">
              <label>Transaction Screenshot *</label>
              <div
                className={`file-upload-zone ${payFile ? 'has-file' : ''} ${payErrs.payFile ? 'error' : ''}`}
                onClick={() => document.getElementById('pay-input').click()}
              >
                {payFile ? (
                  <div className="file-upload-preview">
                    <span style={{ fontSize: '1.5rem' }}>🖼️</span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--success)' }}>{payFile.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {(payFile.size / 1024).toFixed(0)} KB · Click to change
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="file-upload-icon">📤</div>
                    <div className="file-upload-text">Click to upload screenshot</div>
                    <div className="file-upload-hint">PNG, JPG, JPEG · Max 5MB</div>
                  </>
                )}
                <input
                  id="pay-input" type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { setPayFile(e.target.files[0]); setPayErrs(p => ({ ...p, payFile: '' })); }}
                />
              </div>
              {payErrs.payFile && <span className="field-error">{payErrs.payFile}</span>}
            </div>

            <div className="enroll-btn-row">
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/my-enrollments')}
              >
                Skip for now
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={handlePaymentUpload}
                disabled={uploading}
              >
                {uploading ? <><div className="spinner" />Uploading…</> : '📤 Submit Payment Proof'}
              </button>
            </div>
          </>
        )}

        {/* ── Step 4: Complete ── */}
        {step === 4 && (
          <div className="enroll-success">
            <div className="enroll-success-icon">
              {enrollResult?.status === 'active' ? '🎉' : '⏳'}
            </div>
            <h3 className="enroll-success-title">
              {enrollResult?.status === 'active' ? "You're Enrolled!" : 'Application Submitted!'}
            </h3>
            <p className="enroll-success-desc">
              {enrollResult?.status === 'active'
                ? 'Great news! You now have full access to this course. Start learning right away.'
                : 'Your payment proof has been submitted. An operator will review and approve your enrollment — usually within 24 hours.'}
            </p>
            <div className="enroll-success-actions">
              <button className="btn btn-secondary" onClick={() => navigate('/courses')}>
                Browse More Courses
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/my-enrollments')}>
                My Enrollments →
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-val">{value}</span>
    </div>
  );
}