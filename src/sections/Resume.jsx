// Resume — Mission Brief / Blueprint aesthetic

const BLUE     = 'rgba(100, 155, 240, 0.90)'
const BLUE_DIM = 'rgba(100, 155, 240, 0.55)'
const BLUE_BD  = 'rgba(100, 155, 240, 0.20)'

export default function Resume() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0', padding: '8px 0' }}>

      {/* Blueprint header */}
      <div style={{
        width: '100%', marginBottom: '60px',
        borderBottom: `1px solid ${BLUE_BD}`, paddingBottom: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '8px',
            letterSpacing: '3px', color: BLUE_DIM,
            textTransform: 'uppercase', marginBottom: '4px',
          }}>
            ◈ MISSION DOSSIER
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '13px',
            fontWeight: 700, color: 'var(--star-white)', letterSpacing: '1.5px',
          }}>
            DEXTER, ZACHARY
          </h2>
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '8px',
          letterSpacing: '1.5px', color: 'rgba(100,155,240,0.70)',
          textAlign: 'right',
        }}>
          <p>GWU CS · CLASS OF '27</p>
        </div>
      </div>

      {/* CTA */}
      <a
        href="/assets/Zachary-Dexter-resume.pdf"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '12px',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: '#070b12',
          background: 'rgba(100,155,240,0.90)',
          padding: '13px 36px',
          borderRadius: '6px',
          textDecoration: 'none',
          fontWeight: 700,
          display: 'block',
          textAlign: 'center',
          transition: 'background 0.2s, box-shadow 0.2s',
          boxShadow: '0 0 20px rgba(100,155,240,0.20)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(100,155,240,1.0)'
          e.currentTarget.style.boxShadow = '0 0 30px rgba(100,155,240,0.40)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(100,155,240,0.90)'
          e.currentTarget.style.boxShadow = '0 0 20px rgba(100,155,240,0.20)'
        }}
      >
        VIEW RESUME
      </a>
      <p style={{
        marginTop: '10px',
        fontFamily: 'var(--font-display)',
        fontSize: '8px',
        letterSpacing: '1.5px',
        color: 'rgba(100,155,240,0.65)',
      }}>
        (opens resume in new tab)
      </p>

    </div>
  )
}
