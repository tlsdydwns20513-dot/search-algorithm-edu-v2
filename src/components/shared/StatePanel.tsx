import { RiverCrossingState } from '../../types/index'

interface StatePanelProps {
  state: RiverCrossingState
  title?: string
}

const EMOJI: Record<string, string> = {
  farmer: '🧑‍🌾',
  fox: '🦊',
  chicken: '🐔',
  grain: '🌾',
}

const ENTITY_NAMES: Record<string, string> = {
  farmer: '농부',
  fox: '여우',
  chicken: '닭',
  grain: '곡식',
}

export default function StatePanel({ state, title }: StatePanelProps) {
  const { leftBank, rightBank, farmerSide } = state

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {title && (
        <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '0.5rem', color: '#667eea' }}>
          {title}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', background: '#f8f9fa' }}>
        {/* 좌안 */}
        <div style={{ flex: 1, background: '#e8f5e9', padding: '0.75rem', minHeight: 80 }}>
          <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: '0.4rem', fontWeight: 'bold' }}>
            좌안 {farmerSide === 'left' && '🚣'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {leftBank.map((entity, i) => (
              <span key={i} title={ENTITY_NAMES[entity]} style={{ fontSize: '1.5rem', lineHeight: 1 }}>
                {EMOJI[entity]}
              </span>
            ))}
            {leftBank.length === 0 && (
              <span style={{ color: '#aaa', fontSize: '0.8rem' }}>비어있음</span>
            )}
          </div>
        </div>

        {/* 강 */}
        <div style={{
          width: 40,
          background: 'linear-gradient(180deg, #90caf9 0%, #42a5f5 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '0.7rem',
          letterSpacing: 1,
          userSelect: 'none',
        }}>
          {'~\n~\n~'.split('\n').map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>

        {/* 우안 */}
        <div style={{ flex: 1, background: '#fff3e0', padding: '0.75rem', minHeight: 80 }}>
          <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: '0.4rem', fontWeight: 'bold' }}>
            우안 {farmerSide === 'right' && '🚣'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {rightBank.map((entity, i) => (
              <span key={i} title={ENTITY_NAMES[entity]} style={{ fontSize: '1.5rem', lineHeight: 1 }}>
                {EMOJI[entity]}
              </span>
            ))}
            {rightBank.length === 0 && (
              <span style={{ color: '#aaa', fontSize: '0.8rem' }}>비어있음</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
