import { useState } from 'react'
import './Section.css'
import './RiverCrossing.css'
import { isViolation } from '../algorithms/riverCrossing'
import { Entity, RiverCrossingState } from '../types/index'

interface RiverCrossingSectionProps {
  onComplete: () => void
}

const INITIAL_STATE: RiverCrossingState = {
  leftBank: ['farmer', 'fox', 'chicken', 'grain'],
  rightBank: [],
  farmerSide: 'left',
}

const EMOJI: Record<Entity, string> = {
  farmer: '🧑‍🌾',
  fox: '🦊',
  chicken: '🐔',
  grain: '🌾',
}

const NAMES: Record<Entity, string> = {
  farmer: '농부',
  fox: '여우',
  chicken: '닭',
  grain: '곡식',
}

const ALL_ENTITIES: Entity[] = ['farmer', 'fox', 'chicken', 'grain']

export default function RiverCrossingSection({ onComplete }: RiverCrossingSectionProps) {
  const [state, setState] = useState<RiverCrossingState>(INITIAL_STATE)
  const [selected, setSelected] = useState<Entity | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'win' } | null>(null)
  const [moves, setMoves] = useState(0)
  const [won, setWon] = useState(false)

  const farmerBank = state.farmerSide === 'left' ? state.leftBank : state.rightBank

  const handleSelect = (entity: Entity) => {
    if (won) return
    if (entity === 'farmer') return
    // 선택 가능한 엔티티는 농부와 같은 쪽에 있어야 함
    if (!farmerBank.includes(entity)) return
    setSelected(prev => (prev === entity ? null : entity))
  }

  const handleMove = () => {
    if (won) return
    const toSide = state.farmerSide === 'left' ? 'right' : 'left'

    let newLeft: Entity[]
    let newRight: Entity[]

    if (selected) {
      // 농부 + 선택된 엔티티 이동
      if (state.farmerSide === 'left') {
        newLeft = state.leftBank.filter(e => e !== 'farmer' && e !== selected)
        newRight = [...state.rightBank, 'farmer', selected]
      } else {
        newRight = state.rightBank.filter(e => e !== 'farmer' && e !== selected)
        newLeft = [...state.leftBank, 'farmer', selected]
      }
    } else {
      // 농부 혼자 이동
      if (state.farmerSide === 'left') {
        newLeft = state.leftBank.filter(e => e !== 'farmer')
        newRight = [...state.rightBank, 'farmer']
      } else {
        newRight = state.rightBank.filter(e => e !== 'farmer')
        newLeft = [...state.leftBank, 'farmer']
      }
    }

    const nextState: RiverCrossingState = {
      leftBank: newLeft,
      rightBank: newRight,
      farmerSide: toSide,
    }

    if (isViolation(nextState)) {
      setMessage({ text: '❌ 규칙 위반! 농부 없이 여우와 닭, 또는 닭과 곡식을 함께 둘 수 없습니다.', type: 'error' })
      return
    }

    setState(nextState)
    setSelected(null)
    const newMoves = moves + 1
    setMoves(newMoves)

    if (nextState.rightBank.length === 4) {
      setWon(true)
      setMessage({ text: `🎉 축하합니다! ${newMoves}번의 이동으로 모두 건넜습니다!`, type: 'win' })
    } else {
      const who = selected ? `농부 + ${NAMES[selected]}` : '농부 혼자'
      setMessage({ text: `✅ ${who} 이동 완료!`, type: 'success' })
    }
  }

  const handleReset = () => {
    setState(INITIAL_STATE)
    setSelected(null)
    setMessage(null)
    setMoves(0)
    setWon(false)
  }

  const renderBank = (side: 'left' | 'right') => {
    const bank = side === 'left' ? state.leftBank : state.rightBank
    const isFarmerHere = state.farmerSide === side
    const label = side === 'left' ? '좌안 (출발)' : '우안 (목표)'
    const bankClass = side === 'left' ? 'left-bank' : 'right-bank'

    return (
      <div className={`rc-bank ${bankClass}`}>
        <div className="rc-bank-title">
          {label}
          {isFarmerHere && <span>🚣</span>}
        </div>
        <div className="rc-entities">
          {ALL_ENTITIES.filter(e => bank.includes(e)).map(entity => {
            const isFarmer = entity === 'farmer'
            const isSelectable = !isFarmer && isFarmerHere && !won
            const isSelected = selected === entity
            return (
              <div
                key={entity}
                className={`rc-entity-card${isFarmer ? ' farmer-card' : ''}${isSelected ? ' selected' : ''}`}
                onClick={() => isSelectable && handleSelect(entity)}
                title={isSelectable ? `${NAMES[entity]} 선택` : NAMES[entity]}
                style={{ cursor: isSelectable ? 'pointer' : 'default' }}
              >
                <span className="rc-entity-emoji">{EMOJI[entity]}</span>
                <span className="rc-entity-name">{NAMES[entity]}</span>
              </div>
            )
          })}
          {bank.length === 0 && (
            <span style={{ color: '#aaa', fontSize: '0.85rem', marginTop: '1rem' }}>비어있음</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="section">
      <h2 className="section-title">강 건너기 문제</h2>

      <div className="content-card">
        <h3>문제 설명</h3>
        <p>
          농부🧑‍🌾가 여우🦊, 닭🐔, 곡식🌾을 데리고 강을 건너려 합니다.
          배는 농부와 한 가지만 태울 수 있습니다.
        </p>
        <ul style={{ paddingLeft: '1.2rem', color: '#555', lineHeight: 1.8 }}>
          <li>농부가 없을 때 <strong>여우🦊 + 닭🐔</strong>을 함께 두면 여우가 닭을 먹습니다</li>
          <li>농부가 없을 때 <strong>닭🐔 + 곡식🌾</strong>을 함께 두면 닭이 곡식을 먹습니다</li>
        </ul>
      </div>

      <div className="content-card">
        <h3>직접 해결해보기</h3>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          💡 같은 쪽에 있는 엔티티 카드를 클릭해 선택한 뒤 <strong>이동</strong> 버튼을 누르세요.
          농부만 이동하려면 아무것도 선택하지 않고 이동 버튼을 누르세요.
        </p>

        <div className="rc-game-container">
          {renderBank('left')}

          <div className="rc-river">
            <span className="rc-river-label">강</span>
            <span className={`rc-boat ${state.farmerSide === 'left' ? 'boat-left' : 'boat-right'}`}>🚣</span>
          </div>

          {renderBank('right')}
        </div>

        {message && (
          <div className={`rc-message ${message.type}`}>{message.text}</div>
        )}

        <div className="rc-controls">
          <span className="rc-move-counter">이동 횟수: {moves}</span>

          <button
            className="rc-move-btn"
            onClick={handleMove}
            disabled={won}
          >
            {selected ? `${NAMES[selected]}와 함께 이동 →` : '농부만 이동 →'}
          </button>

          <button className="rc-reset-btn" onClick={handleReset}>
            🔄 초기화
          </button>
        </div>
      </div>

      <button className="complete-btn" onClick={onComplete}>
        다음 단계로
      </button>
    </div>
  )
}
