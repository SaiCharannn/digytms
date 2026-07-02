import AppShell from '../components/AppShell';

export default function StudentsPage() {
  return (
    <AppShell title="Students">
      <div className="card" style={{textAlign:'center',padding:48}}>
        <div style={{fontSize:'3rem',marginBottom:16}}>🎓</div>
        <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.3rem',color:'var(--primary)',marginBottom:8}}>Student Directory</h3>
        <p style={{color:'var(--text-secondary)',marginBottom:20}}>
          Students self-register via the public registration page.
        </p>
        <a href="/register" target="_blank" rel="noopener noreferrer"
          className="btn btn-primary" style={{display:'inline-flex',justifyContent:'center'}}>
          🔗 Open Student Registration
        </a>
      </div>
    </AppShell>
  );
}
