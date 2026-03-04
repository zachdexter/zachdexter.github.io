import Resume from '../sections/Resume'

const PANEL_STYLE = {
  resume: {
    backgroundColor: '#070b12',
    backgroundImage: [
      'linear-gradient(rgba(90,140,230,0.06) 1px, transparent 1px)',
      'linear-gradient(90deg, rgba(90,140,230,0.06) 1px, transparent 1px)',
    ].join(', '),
    backgroundSize: '28px 28px',
    border: '1px solid rgba(100, 155, 240, 0.20)',
    boxShadow: '0 0 60px rgba(80, 130, 220, 0.08), 0 20px 80px rgba(0,0,0,0.88)',
  },
}

export default function SectionScreen({ section }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 5,
        width: 'min(660px, 78vw)',
        maxHeight: '76vh',
        borderRadius: '14px',
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        ...PANEL_STYLE[section],
      }}
    >
      <div style={{ padding: '24px 28px 20px', flex: 1 }}>
        <Resume />
      </div>
    </div>
  )
}
