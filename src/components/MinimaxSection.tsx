import { useState, useCallback } from 'react'
import './Section.css'
import {
  GONU_VARIANTS,
  GonuBoardDef,
  getValidMoves,
  applyGonuMove,
  isTerminal,
  minimax,
  generateRandomGonuVariant,
} from '../algorithms/minimax'
import { GonuBoard, GonuMove, Position } from '../types/index'

interface MinimaxSectionProps {
  onComplete: () => void
}

type GamePhase = 'select' | 'playing' | 'ended'
type Turn = 'player' | 'ai'

// ─── 고누 판 미니 미리보기 SVG ────────────────────────────────────────────────

function GonuPreviewSVG({ def }: { def: GonuBoardDef }) {
  const SIZE = 80
  const PAD = 10
  const cellW = (SIZE - PAD * 2) / (def.cols - 1)
  const cellH = (SIZE - PAD * 2) / Math.max(def.rows - 1, 1)

  const cx = (c: number) => PAD + c * cellW
  const cy = (r: number) => PAD + r * cellH

  return (
    <svg width={SIZE} height={SIZE} style={{ display: 'block', margin: '0 auto' }}>
      {/* 연결선 */}
      {def.connections.map(([r1,c1,r2,c2], i) => (
        <line key={i}
          x1={cx(c1)} y1={cy(r1)} x2={cx(c2)} y2={cy(r2)}
          stroke="#999" strokeWidth="1"
        />
      ))}
      {/* 호박고누 원형 테두리 */}
      {def.variant === 'hobak' && (
        <ellipse cx={SIZE/2} cy={SIZE/2} rx={SIZE/2-4} ry={SIZE/2-4}
          fill="none" stroke="#aaa" strokeWidth="1" strokeDasharray="3,2" />
      )}
      {/* 우물고누 중앙 원 */}
      {def.variant === 'umul' && (
        <circle cx={cx(1)} cy={cy(1)} r={8} fill="none" stroke="#aaa" strokeWidth="1" />
      )}
      {/* 말 */}
      {def.board.map((row, r) =>
        row.map((cell, c) => cell !== 'empty' ? (
          <circle key={`${r}-${c}`}
            cx={cx(c)} cy={cy(r)} r={6}
            fill={cell === 'ai' ? '#d32f2f' : '#1976d2'}
            stroke="white" strokeWidth="1"
          />
        ) : null)
      )}
    </svg>
  )
}

// ─── 고누 판 선택 화면 ────────────────────────────────────────────────────────

function SelectScreen({ onSelect }: { onSelect: (def: GonuBoardDef) => void }) {
  return (
    <div className="content-card" style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3>🎮 고누 판 선택</h3>
      <p style={{ color: '#555', marginBottom: '1rem' }}>
        플레이할 고누 판을 선택하거나, 랜덤으로 시작하세요!
      </p>
      {/* 랜덤 시작 버튼 */}
      <button
        onClick={() => onSelect(GONU_VARIANTS[Math.floor(Math.random() * GONU_VARIANTS.length)])}
        style={{
          width: '100%', padding: '0.9rem', marginBottom: '1.25rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white', border: 'none', borderRadius: 10, fontSize: '1rem',
          fontWeight: 'bold', cursor: 'pointer',
        }}
      >
        🎲 랜덤으로 시작하기
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
        {GONU_VARIANTS.map(def => (
          <button
            key={def.variant}
            onClick={() => onSelect(def)}
            style={{
              border: '2px solid #e0e0e0',
              borderRadius: 12,
              padding: '1rem 0.5rem',
              background: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#667eea')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
          >
            <GonuPreviewSVG def={def} />
            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#333' }}>{def.name}</div>
            <div style={{ fontSize: '0.72rem', color: '#888', textAlign: 'center', lineHeight: 1.4 }}>
              {def.description}
            </div>
          </button>
        ))}
      </div>
      <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#e3f2fd', borderRadius: 8, fontSize: '0.85rem', color: '#1565c0' }}>
        <strong>공통 규칙:</strong> 연결된 빈 칸으로 1칸 이동. 상대방이 이동할 수 없게 만들면 승리!
        AI는 미니맥스 알고리즘으로 최적의 수를 계산합니다.
      </div>
    </div>
  )
}

// ─── 고누 보드 SVG ────────────────────────────────────────────────────────────

function GonuBoardSVG({
  def, board, selected, validMoves, onCellClick, disabled, moveScores, bestMove,
}: {
  def: GonuBoardDef
  board: GonuBoard
  selected: Position | null
  validMoves: GonuMove[]
  onCellClick: (pos: Position) => void
  disabled: boolean
  moveScores: Map<string, number>
  bestMove: GonuMove | null
}) {
  const CELL = 100
  const PAD = 60
  const R = 26
  const W = PAD * 2 + CELL * (def.cols - 1)
  const H = PAD * 2 + CELL * (def.rows - 1)

  const cx = (c: number) => PAD + c * CELL
  const cy = (r: number) => PAD + r * CELL

  const validTargets = new Set(validMoves.map(m => `${m.to.row},${m.to.col}`))

  return (
    <svg width={W} height={H}
      style={{ display: 'block', margin: '0 auto', background: '#fdf6e3', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
    >
      {/* 연결선 */}
      {def.connections.map(([r1,c1,r2,c2], i) => (
        <line key={i}
          x1={cx(c1)} y1={cy(r1)} x2={cx(c2)} y2={cy(r2)}
          stroke="#bbb" strokeWidth="2"
        />
      ))}

      {/* 호박고누 원형 테두리 */}
      {def.variant === 'hobak' && (
        <ellipse
          cx={W/2} cy={H/2}
          rx={W/2 - PAD/2} ry={H/2 - PAD/2}
          fill="none" stroke="#ccc" strokeWidth="2" strokeDasharray="6,4"
        />
      )}

      {/* 우물고누 중앙 원 */}
      {def.variant === 'umul' && def.rows === 3 && def.cols === 3 && (
        <circle cx={cx(1)} cy={cy(1)} r={30}
          fill="rgba(144,202,249,0.2)" stroke="#90caf9" strokeWidth="2"
        />
      )}

      {/* 교차점 + 말 */}
      {board.map((row, r) =>
        row.map((cell, c) => {
          const x = cx(c), y = cy(r)
          const isSelected = selected?.row === r && selected?.col === c
          const isTarget = validTargets.has(`${r},${c}`)
          const scoreKey = `${r},${c}`
          const score = moveScores.get(scoreKey)
          const isBest = bestMove?.to.row === r && bestMove?.to.col === c
          const winRate = score !== undefined
            ? Math.max(0, Math.min(100, Math.round(((-score + 9) / 18) * 100)))
            : undefined
          const badgeColor = isBest ? '#4caf50' : (winRate !== undefined && winRate > 50) ? '#1976d2' : '#f44336'

          return (
            <g key={`${r}-${c}`}
              onClick={() => !disabled && onCellClick({ row: r, col: c })}
              style={{ cursor: disabled ? 'default' : 'pointer' }}
            >
              {/* 이동 가능 위치 */}
              {isTarget && (
                <>
                  <circle cx={x} cy={y} r={R + 14} fill="transparent" />
                  <circle cx={x} cy={y} r={R + 7}
                    fill={isBest ? 'rgba(76,175,80,0.15)' : 'none'}
                    stroke={isBest ? '#4caf50' : '#1976d2'}
                    strokeWidth="2.5" strokeDasharray="5,3"
                  />
                  {winRate !== undefined && (
                    <g>
                      <circle cx={x + R + 4} cy={y - R - 4} r={15} fill={badgeColor} />
                      <text x={x + R + 4} y={y - R + 1}
                        textAnchor="middle" fontSize="10" fill="white" fontWeight="bold"
                        style={{ pointerEvents: 'none' }}
                      >{winRate}%</text>
                    </g>
                  )}
                </>
              )}

              {/* 말 */}
              {cell !== 'empty' ? (
                <>
                  <circle cx={x} cy={y} r={R}
                    fill={cell === 'player' ? '#1976d2' : '#d32f2f'}
                    stroke={isSelected ? '#ffeb3b' : 'white'}
                    strokeWidth={isSelected ? 4 : 2}
                  />
                  <text x={x} y={y + 5} textAnchor="middle" fontSize="13" fill="white" fontWeight="bold"
                    style={{ pointerEvents: 'none' }}>
                    {cell === 'player' ? '나' : 'AI'}
                  </text>
                </>
              ) : (
                <>
                  <circle cx={x} cy={y} r={R} fill="transparent" />
                  {!isTarget && <circle cx={x} cy={y} r={5} fill="#ccc" />}
                </>
              )}
            </g>
          )
        })
      )}
    </svg>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function MinimaxSection({ onComplete }: MinimaxSectionProps) {
  const [phase, setPhase] = useState<GamePhase>('select')
  const [currentDef, setCurrentDef] = useState<GonuBoardDef>(() => generateRandomGonuVariant())
  const [board, setBoard] = useState<GonuBoard>(() => {
    const def = generateRandomGonuVariant()
    return def.board.map(row => [...row])
  })
  const [turn, setTurn] = useState<Turn>('player')
  const [selected, setSelected] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<GonuMove[]>([])
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null)
  const [statusMsg, setStatusMsg] = useState('당신의 차례입니다. 말을 선택하세요.')
  const [aiThinking, setAiThinking] = useState(false)
  const [moveScores, setMoveScores] = useState<Map<string, number>>(new Map())
  const [bestMove, setBestMove] = useState<GonuMove | null>(null)
  const [selectedPiecePos, setSelectedPiecePos] = useState<Position | null>(null)

  const conns = currentDef.connections

  const checkTerminal = useCallback((b: GonuBoard): 'player' | 'ai' | null => {
    if (getValidMoves(b, 'player', conns).length === 0) return 'ai'
    if (getValidMoves(b, 'ai', conns).length === 0) return 'player'
    return null
  }, [conns])

  const doAiMove = useCallback((b: GonuBoard) => {
    setAiThinking(true)
    setStatusMsg('AI가 생각 중...')
    setTimeout(() => {
      const result = minimax(b, 3, true, false, conns)
      if (!result.move) {
        setWinner('player')
        setPhase('ended')
        setAiThinking(false)
        return
      }
      const newBoard = applyGonuMove(b, result.move)
      setBoard(newBoard)
      const w = checkTerminal(newBoard)
      if (w) {
        setWinner(w)
        setPhase('ended')
      } else {
        setTurn('player')
        setStatusMsg('당신의 차례입니다. 말을 선택하세요.')
      }
      setAiThinking(false)
    }, 400)
  }, [conns, checkTerminal])

  const handleCellClick = useCallback((pos: Position) => {
    if (turn !== 'player' || phase !== 'playing' || aiThinking) return
    const cell = board[pos.row][pos.col]

    const targetMove = validMoves.find(m => m.to.row === pos.row && m.to.col === pos.col)
    if (targetMove) {
      const newBoard = applyGonuMove(board, targetMove)
      setBoard(newBoard)
      setSelected(null); setValidMoves([]); setMoveScores(new Map()); setBestMove(null); setSelectedPiecePos(null)
      const w = checkTerminal(newBoard)
      if (w) { setWinner(w); setPhase('ended'); return }
      setTurn('ai')
      doAiMove(newBoard)
      return
    }

    if (cell === 'player') {
      setSelected(pos)
      const moves = getValidMoves(board, 'player', conns).filter(m => m.from.row === pos.row && m.from.col === pos.col)
      setValidMoves(moves)
      setSelectedPiecePos(pos)
      const scores = new Map<string, number>()
      let bestScore = Infinity, best: GonuMove | null = null
      for (const move of moves) {
        const nb = applyGonuMove(board, move)
        const r = minimax(nb, 2, true, false, conns)
        scores.set(`${move.to.row},${move.to.col}`, r.score)
        if (r.score < bestScore) { bestScore = r.score; best = move }
      }
      setMoveScores(scores); setBestMove(best)
      setStatusMsg(moves.length > 0 ? '이동할 위치를 선택하세요.' : '이 말은 이동할 수 없습니다.')
      return
    }

    setSelected(null); setValidMoves([]); setMoveScores(new Map()); setBestMove(null); setSelectedPiecePos(null)
    setStatusMsg('당신의 차례입니다. 말을 선택하세요.')
  }, [turn, phase, aiThinking, board, validMoves, conns, checkTerminal, doAiMove])

  const handleSelectVariant = (def: GonuBoardDef) => {
    setCurrentDef(def)
    setBoard(def.board.map(row => [...row]))
    setPhase('playing')
    setTurn('player')
    setSelected(null); setValidMoves([]); setMoveScores(new Map()); setBestMove(null)
    setSelectedPiecePos(null); setWinner(null)
    setStatusMsg('당신의 차례입니다. 말을 선택하세요.')
    setAiThinking(false)
  }

  const handleReset = () => {
    // 초기화 시 랜덤으로 다른 고누 판 선택
    const newDef = generateRandomGonuVariant()
    setCurrentDef(newDef)
    setBoard(newDef.board.map(row => [...row]))
    setTurn('player'); setSelected(null); setValidMoves([])
    setMoveScores(new Map()); setBestMove(null); setSelectedPiecePos(null)
    setWinner(null); setPhase('playing')
    setStatusMsg('당신의 차례입니다. 말을 선택하세요.')
    setAiThinking(false)
  }

  if (phase === 'select') {
    return (
      <div className="section">
        <h2 className="section-title">미니맥스 알고리즘 — 고누 게임</h2>
        <SelectScreen onSelect={handleSelectVariant} />
      </div>
    )
  }

  return (
    <div className="section">
      <h2 className="section-title">미니맥스 알고리즘 — {currentDef.name}</h2>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* 좌측: 게임 보드 */}
        <div className="content-card" style={{ flex: '0 0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>{currentDef.name}</h3>
            <button
              onClick={() => setPhase('select')}
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: 6, border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer' }}
            >
              🔄 다른 고누 선택
            </button>
          </div>

          <div style={{
            padding: '0.6rem 1rem', borderRadius: 6, marginBottom: '1rem',
            background: phase === 'ended' ? (winner === 'player' ? '#e8f5e9' : '#ffebee') : '#e3f2fd',
            color: phase === 'ended' ? (winner === 'player' ? '#2e7d32' : '#c62828') : '#1565c0',
            fontWeight: 'bold', fontSize: '1rem',
          }}>
            {phase === 'ended'
              ? winner === 'player' ? '🎉 플레이어 승리! (AI가 이동 불가)'
              : '🤖 AI 승리! (플레이어가 이동 불가)'
              : statusMsg}
          </div>

          <div style={{ marginBottom: '0.75rem', fontSize: 13, color: '#666' }}>
            차례: <strong>{turn === 'player' ? '플레이어 (파란 말)' : 'AI (빨간 말)'}</strong>
          </div>

          <GonuBoardSVG
            def={currentDef}
            board={board}
            selected={selected}
            validMoves={validMoves}
            onCellClick={handleCellClick}
            disabled={turn !== 'player' || phase !== 'playing' || aiThinking}
            moveScores={moveScores}
            bestMove={bestMove}
          />

          <div className="controls" style={{ marginTop: '1rem' }}>
            <button className="control-btn" onClick={handleReset}>초기화</button>
            {phase === 'ended' && (
              <>
                <button className="control-btn" onClick={() => setPhase('select')}>다른 고누 선택</button>
                <button className="complete-btn" onClick={onComplete}>학습 완료</button>
              </>
            )}
          </div>
        </div>

        {/* 우측: 미니맥스 분석 */}
        <div className="content-card" style={{ flex: '1 1 280px', minWidth: 260 }}>
          <h3>🧠 미니맥스 분석</h3>

          {aiThinking ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
              <div style={{ fontSize: '2rem' }}>🤖</div>AI가 계산 중...
            </div>
          ) : selectedPiecePos === null ? (
            <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: 8, color: '#666', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: '0.5rem' }}>사용 방법</div>
              파란 말을 클릭하면 각 이동의 승률을 분석해드립니다.
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#555' }}>
                선택한 말: <strong>({selectedPiecePos.row},{selectedPiecePos.col})</strong>
              </div>
              {validMoves.length === 0 ? (
                <div style={{ color: '#f44336', fontSize: '0.85rem' }}>이동 가능한 위치가 없습니다.</div>
              ) : (
                validMoves.map(move => {
                  const key = `${move.to.row},${move.to.col}`
                  const score = moveScores.get(key) ?? 0
                  const isBest = bestMove?.to.row === move.to.row && bestMove?.to.col === move.to.col
                  const winRate = Math.max(0, Math.min(100, Math.round(((-score + 9) / 18) * 100)))
                  return (
                    <div key={key} style={{
                      padding: '0.6rem 0.75rem', borderRadius: 8, marginBottom: '0.4rem',
                      background: isBest ? '#e8f5e9' : '#f5f5f5',
                      border: isBest ? '2px solid #4caf50' : '1px solid #e0e0e0',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: isBest ? 'bold' : 'normal' }}>
                          → ({move.to.row},{move.to.col}) {isBest ? '⭐ 추천' : ''}
                        </span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: isBest ? '#2e7d32' : '#555' }}>
                          {winRate}%
                        </span>
                      </div>
                      <div style={{ background: '#e0e0e0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                        <div style={{
                          width: `${winRate}%`, height: '100%', borderRadius: 4,
                          background: isBest ? '#4caf50' : winRate > 50 ? '#1976d2' : '#f44336',
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '0.2rem' }}>점수: {score}</div>
                    </div>
                  )
                })
              )}
              {bestMove && (
                <div style={{ marginTop: '0.5rem', padding: '0.6rem', background: '#e8f5e9', borderRadius: 8, fontSize: '0.85rem', color: '#2e7d32', fontWeight: 'bold' }}>
                  ✅ ({bestMove.to.row},{bestMove.to.col})으로 이동하세요!
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#e3f2fd', borderRadius: 8, fontSize: '0.8rem', color: '#1565c0', lineHeight: 1.7 }}>
            <strong>승률 해석</strong><br />
            높을수록 플레이어에게 유리한 이동입니다.
          </div>

          {/* 현재 고누 판 목록 */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#555', marginBottom: '0.5rem' }}>다른 고누 판:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {GONU_VARIANTS.map(def => (
                <button key={def.variant}
                  onClick={() => handleSelectVariant(def)}
                  style={{
                    padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: '0.78rem',
                    border: def.variant === currentDef.variant ? '2px solid #667eea' : '1px solid #ddd',
                    background: def.variant === currentDef.variant ? '#eef0ff' : 'white',
                    cursor: 'pointer', fontWeight: def.variant === currentDef.variant ? 'bold' : 'normal',
                    color: def.variant === currentDef.variant ? '#667eea' : '#555',
                  }}
                >
                  {def.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 설명 */}
      <div className="content-card" style={{ marginTop: '1.5rem' }}>
        <h3>미니맥스 알고리즘 동작 원리</h3>
        <p>
          미니맥스(Minimax)는 두 플레이어 게임에서 최적의 수를 찾는 알고리즘입니다.
          고누에서는 <strong>상대가 이동 못하게 막는 것이 목표</strong>입니다.
          AI(MAX)는 자신의 이동 가능 수를 최대화하고, 플레이어(MIN)는 AI의 이동 가능 수를 최소화한다고 가정합니다.
        </p>
        <p>
          각 고누 판마다 연결 구조가 달라 전략이 달라집니다.
          <strong> 줄고누</strong>는 대각선 이동이 핵심이고,
          <strong> 넘기고누</strong>는 상하좌우만 이동 가능합니다.
        </p>
      </div>
    </div>
  )
}
