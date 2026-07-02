import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const fields = [
    { label: 'User ID',       value: user?.userId },
    { label: 'Full Name',     value: user?.userName },
    { label: 'Designation',   value: user?.designation },
    { label: 'Institution ID',value: user?.institutionId },
    { label: 'Role Type',     value: user?.isSuperAdmin ? 'Super Admin' : 'Standard User' },
  ];

  return (
    <AppShell title="My Profile">
      <div className="card" style={{maxWidth:600}}>
        <div style={{textAlign:'center',paddingBottom:28,borderBottom:'1px solid var(--border)',marginBottom:24}}>
          <div style={{
            width:72,height:72,borderRadius:'50%',
            background:'linear-gradient(135deg,var(--primary),var(--primary-light))',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:'1.8rem',fontWeight:700,color:'#fff',
            margin:'0 auto 12px',boxShadow:'var(--shadow-md)'
          }}>
            {user?.userName?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div style={{fontFamily:'var(--font-display)',fontSize:'1.3rem',color:'var(--primary)',fontWeight:700}}>{user?.userName}</div>
          <span className="badge badge-role" style={{marginTop:6}}>{user?.designation}</span>
        </div>

        {fields.map(f => (
          <div key={f.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
            <span style={{fontSize:'0.8rem',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{f.label}</span>
            <span style={{fontWeight:500,color:'var(--text-primary)'}}>{f.value || '—'}</span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
