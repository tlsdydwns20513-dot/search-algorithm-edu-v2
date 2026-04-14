import { useState, useCallback } from 'react'
import './Section.css'
import {
  INITIAL_GONU_BOARD,
  getValidMoves,
  applyGonuMove,
  isTerminal,
  minimax,
  evaluateBoard,
  generateRandomGonuBoard,
} from '../algorithms/minimax'
import { GonuBoard, GonuMove, Position, GameTreeNode } from '../types/index'

interface MinimaxSectionProps {
  onComplete: () => void
}

type GamePhase = 'rules' | 'playing' | 'ended'
type Turn = 'player' | 'ai'

// ─── 고누 보드 SVG (3×3) ──────────────────────────────────────────────────────

const CELL = 100  // 격자 간격 (px)
const PAD  = 50   // 여백
const R    = 26   // 말 반지름
const BOARD_SIZE = PAD * 2 + CELL * 2  // 300

function GonuBoardSVG({
  board,
  selected,
  validMoves,
  onCellClick,
  disabled,
  moveScores,
  bestMove,
}: {
  board: GonuBoard
  selected: Position | null
  validMoves: GonuMove[]
  onCellClick: (pos: Position) => void
  disabled: boolean
  moveScores?: Map<string, number>
  bestMove?: GonuMove | null
}) {
  const validTargets = new Set(validMoves.map(m => `${m.to.row},${m.to.col}`))

  // 모든 교차점에서 대각선 연결선 그리기
  const diagonalLines: JSX.Element[] = []
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const x1 = PAD + c * CELL
      const y1 = PAD + r * CELL
      const x2 = PAD + (c + 1) * CELL
      const y2 = PAD + (r + 1) * CELL
      diagonalLines.push(
        <line key={`d1-${r}-${c}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bbb" strokeWidth="1.5" />,
        <line key={`d2-${r}-${c}`} x1={x2} y1={y1} x2={x1} y2={y2} stroke="#bbb" strokeWidth="1.5" />
      )
    }
  }

  return (
    <svg
      width={BOARD_SIZE}
      height={BOARD_SIZE}
      style={{ display: 'block', margin: '0 auto', background: '#fdf6e3', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
    >
      {/* 격자 가로선 */}
      {[0, 1, 2].map(r => (
        <line key={`h${r}`} x1={PAD} y1={PAD + r * CELL} x2={PAD + 2 * CELL} y2={PAD + r * CELL} stroke="#999" strokeWidth="2" />
      ))}
      {/* 격자 세로선 */}
      {[0, 1, 2].map(c => (
        <line key={`v${c}`} x1={PAD + c * CELL} y1={PAD} x2={PAD + c * CELL} y2={PAD + 2 * CELL} stroke="#999" strokeWidth="2" />
      ))}
      {/* 대각선 */}
      {diagonalLines}

      {/* 교차점 말 / 이동 가능 표시 */}
      {board.map((row, r) =>
        row.map((cell, c) => {
          const cx = PAD + c * CELL
          const cy = PAD + r * CELL
          const isSelected = selected?.row === r && selected?.col === c
          const isTarget = validTargets.has(`${r},${c}`)
          const scoreKey = `${r},${c}`
          const score = moveScores?.get(scoreKey)
          const isBestTarget = bestMove?.to.row === r && bestMove?.to.col === c
          // 승률 계산
          const winRate = score !== undefined
            ? Math.max(0, Math.min(100, Math.round(((-score + 9) / 18) * 100)))
            : undefined
          const badgeColor = isBestTarget ? '#4caf50' : (winRate !== undefined && winRate > 50) ? '#1976d2' : '#f44336'
          const targetColor = isBestTarget ? '#4caf50' : '#1976d2'

          return (
            <g key={`${r}-${c}`} onClick={() => !disabled && onCellClick({ row: r, col: c })} style={{ cursor: disabled ? 'default' : 'pointer' }}>
              {/* 이동 가능 위치 클릭 영역 (투명 큰 원) */}
              {isTarget && (
                <>
                  <circle cx={cx} cy={cy} r={R + 14} fill="transparent" />
                  <circle cx={cx} cy={cy} r={R + 6} fill={isBestTarget ? 'rgba(76,175,80,0.15)' : 'none'} stroke={targetColor} strokeWidth="2.5" strokeDasharray="5,3" />
                  {/* 승률 배지 */}
                  {winRate !== undefined && (
                    <g>
                      <circle cx={cx + R + 2} cy={cy - R - 2} r={14} fill={badgeColor} />
                      <text x={cx + R + 2} y={cy - R + 3} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold" style={{ pointerEvents: 'none' }}>
                        {winRate}%
                      </text>
                    </g>
                  )}
                </>
              )}
              {/* 말 */}
              {cell !== 'empty' && (
                <>
                  <circle
                    cx={cx} cy={cy} r={R}
                    fill={cell === 'player' ? '#1976d2' : '#d32f2f'}
                    stroke={isSelected ? '#ffeb3b' : 'white'}
                    strokeWidth={isSelected ? 4 : 2}
                  />
                  <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fill="white" fontWeight="bold" style={{ pointerEvents: 'none' }}>
                    {cell === 'player' ? '나' : 'AI'}
                  </text>
                </>
              )}
              {/* 빈 칸 교차점 - 클릭 영역 포함 */}
              {cell === 'empty' && !isTarget && (
                <>
                  <circle cx={cx} cy={cy} r={R} fill="transparent" />
                  <circle cx={cx} cy={cy} r={6} fill="#ccc" />
                </>
              )}
            </g>
          )
        })
      )}
    </svg>
  )
}

// ─── 규칙 안내 화면 ───────────────────────────────────────────────────────────

function RulesScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="content-card" style={{ maxWidth: 620, margin: '0 auto' }}>
      <h3>🎮 고누 게임 규칙 (줄고누 방식)</h3>
      <ul style={{ lineHeight: 2, paddingLeft: '1.5rem', color: '#333' }}>
        <li><strong>3×3 격자</strong> 위에서 진행하는 전략 보드 게임입니다.</li>
        <li><strong>파란 말(나)</strong>은 하단 행, <strong>빨간 말(AI)</strong>은 상단 행에서 시작합니다.</li>
        <li>말은 <strong>상하좌우 및 대각선</strong>으로 1칸 이동할 수 있습니다.</li>
        <li>이동은 <strong>빈 칸으로만</strong> 가능합니다 (점프 없음).</li>
        <li><strong>상대방이 이동할 수 없게 만들면 승리</strong>합니다.</li>
        <li>AI는 <strong>미니맥스 알고리즘(depth=3)</strong>으로 최적의 수를 계산합니다.</li>
      </ul>
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#e3f2fd', borderRadius: 8 }}>
        <strong>초기 배치:</strong>
        <div style={{ fontFamily: 'monospace', marginTop: '0.5rem', lineHeight: 1.8, color: '#333' }}>
          [ AI,  AI,  AI  ] ← 0행 (상단)<br />
          [ 빈,  빈,  빈  ] ← 1행 (중간)<br />
          [ 나,  나,  나  ] ← 2행 (하단)
        </div>
      </div>
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff3e0', borderRadius: 8 }}>
        <strong>미니맥스 전략:</strong> 상대가 이동 못하게 막는 것이 목표 → 미니맥스로 최적 수 계산
      </div>
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f3e5f5', borderRadius: 8 }}>
        <strong>이동 방법:</strong> 자신의 말을 클릭하면 이동 가능한 위치가 초록 점선으로 표시됩니다. 해당 위치를 클릭하면 이동합니다.
      </div>
      <button className="complete-btn" style={{ marginTop: '1.5rem' }} onClick={onStart}>
        게임 시작
      </button>
    </div>
  )
}

// ─── 게임 트리 뷰 (재귀) ──────────────────────────────────────────────────────

function GameTreeView({ node }: { node: GameTreeNode }) {
  const label = node.isMax ? 'MAX' : 'MIN'
  const color = node.isMax ? '#d32f2f' : '#1976d2'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        border: `2px solid ${color}`,
        borderRadius: 8,
        padding: '4px 10px',
        background: 'white',
        minWidth: 64,
        textAlign: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      }}>
        <div style={{ color, fontWeight: 'bold', fontSize: 11 }}>{label}</div>
        <div style={{ fontWeight: 'bold', fontSize: 16 }}>{node.score}</div>
        {node.move && (
          <div style={{ fontSize: 10, color: '#888' }}>
            ({node.move.from.row},{node.move.from.col})→({node.move.to.row},{node.move.to.col})
          </div>
        )}
      </div>

      {node.children.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'row', gap: 4, marginTop: 4, alignItems: 'flex-start' }}>
          {node.children.slice(0, 5).map((child, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 2, height: 14, background: '#ccc' }} />
              <GameTreeView node={child} />
            </div>
          ))}
          {node.children.length > 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 2, height: 14, background: '#ccc' }} />
              <div style={{ fontSize: 11, color: '#999', padding: '4px 6px' }}>+{node.children.length - 5}개</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function MinimaxSection({ onComplete }: MinimaxSectionProps) {
  const [phase, setPhase] = useState<GamePhase>('rules')
  const [board, setBoard] = useState<GonuBoard>(INITIAL_GONU_BOARD)
  const [turn, setTurn] = useState<Turn>('player')
  const [selected, setSelected] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<GonuMove[]>([])
  const [gameTree, setGameTree] = useState<GameTreeNode | null>(null)
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null)
  const [statusMsg, setStatusMsg] = useState('당신의 차례입니다. 말을 선택하세요.')
  const [aiThinking, setAiThinking] = useState(false)
  const [moveScores, setMoveScores] = useState<Map<string, number>>(new Map())
  const [bestMove, setBestMove] = useState<GonuMove | null>(null)
  const [selectedPiecePos, setSelectedPiecePos] = useState<Position | null>(null)

  // 게임 종료 체크
  const checkTerminal = useCallback((b: GonuBoard): 'player' | 'ai' | null => {
    const pm = getValidMoves(b, 'player')
    const am = getValidMoves(b, 'ai')
    if (pm.length === 0) return 'ai'   // 플레이어 이동 불가 → AI 승
    if (am.length === 0) return 'player' // AI 이동 불가 → 플레이어 승
    return null
  }, [])

  // AI 이동
  const doAiMove = useCallback((b: GonuBoard) => {
    setAiThinking(true)
    setStatusMsg('AI가 생각 중...')
    setTimeout(() => {
      const result = minimax(b, 3, true, true)
      if (result.tree) setGameTree(result.tree)

      if (!result.move) {
        setWinner('player')
        setPhase('ended')
        setStatusMsg('플레이어가 이겼습니다!')
        setAiThinking(false)
        return
      }

      const newBoard = applyGonuMove(b, result.move)
      setBoard(newBoard)

      const w = checkTerminal(newBoard)
      if (w) {
        setWinner(w)
        setPhase('ended')
        setStatusMsg(w === 'ai' ? 'AI가 이겼습니다!' : '플레이어가 이겼습니다!')
      } else {
        setTurn('player')
        setStatusMsg('당신의 차례입니다. 말을 선택하세요.')
      }
      setAiThinking(false)
    }, 500)
  }, [checkTerminal])

  // 셀 클릭 핸들러
  const handleCellClick = useCallback((pos: Position) => {
    if (turn !== 'player' || phase !== 'playing' || aiThinking) return

    const cell = board[pos.row][pos.col]

    // 이동 가능 위치 클릭
    const targetMove = validMoves.find(m => m.to.row === pos.row && m.to.col === pos.col)
    if (targetMove) {
      const newBoard = applyGonuMove(board, targetMove)
      setBoard(newBoard)
      setSelected(null)
      setValidMoves([])
      setMoveScores(new Map())
      setBestMove(null)
      setSelectedPiecePos(null)

      const w = checkTerminal(newBoard)
      if (w) {
        setWinner(w)
        setPhase('ended')
        setStatusMsg(w === 'player' ? '플레이어가 이겼습니다!' : 'AI가 이겼습니다!')
        return
      }

      setTurn('ai')
      doAiMove(newBoard)
      return
    }

    // 자신의 말 선택
    if (cell === 'player') {
      setSelected(pos)
      const moves = getValidMoves(board, 'player').filter(m => m.from.row === pos.row && m.from.col === pos.col)
      setValidMoves(moves)
      setSelectedPiecePos(pos)

      // 각 이동에 대해 미니맥스 점수 계산 (depth=2, AI 차례로 평가)
      const scores = new Map<string, number>()
      let bestScore = Infinity
      let best: GonuMove | null = null
      for (const move of moves) {
        const newBoard = applyGonuMove(board, move)
        const result = minimax(newBoard, 2, true)
        const key = `${move.to.row},${move.to.col}`
        scores.set(key, result.score)
        if (result.score < bestScore) {
          bestScore = result.score
          best = move
        }
      }
      setMoveScores(scores)
      setBestMove(best)
      setStatusMsg(moves.length > 0 ? '이동할 위치를 선택하세요.' : '이 말은 이동할 수 없습니다.')
      return
    }

    // 다른 곳 클릭 → 선택 해제
    setSelected(null)
    setValidMoves([])
    setMoveScores(new Map())
    setBestMove(null)
    setSelectedPiecePos(null)
    setStatusMsg('당신의 차례입니다. 말을 선택하세요.')
  }, [turn, phase, aiThinking, board, validMoves, checkTerminal, doAiMove])

  // 초기화
  const handleReset = () => {
    setBoard(generateRandomGonuBoard())
    setTurn('player')
    setSelected(null)
    setValidMoves([])
    setGameTree(null)
    setWinner(null)
    setPhase('playing')
    setStatusMsg('당신의 차례입니다. 말을 선택하세요.')
    setAiThinking(false)
    setMoveScores(new Map())
    setBestMove(null)
    setSelectedPiecePos(null)
  }

  const handleStart = () => {
    setBoard(generateRandomGonuBoard())
    setPhase('playing')
  }

  if (phase === 'rules') {
    return (
      <div className="section">
        <h2 className="section-title">미니맥스 알고리즘</h2>
        <RulesScreen onStart={handleStart} />
      </div>
    )
  }

  return (
    <div className="section">
      <h2 className="section-title">미니맥스 알고리즘 — 고누 게임</h2>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* 좌측: 게임 보드 */}
        <div className="content-card" style={{ flex: '0 0 auto' }}>
          <h3>고누 보드 (3×3)</h3>

          {/* 상태 메시지 */}
          <div style={{
            padding: '0.6rem 1rem',
            borderRadius: 6,
            marginBottom: '1rem',
            background: phase === 'ended' ? (winner === 'player' ? '#e8f5e9' : '#ffebee') : '#e3f2fd',
            color: phase === 'ended' ? (winner === 'player' ? '#2e7d32' : '#c62828') : '#1565c0',
            fontWeight: 'bold',
            fontSize: '1rem',
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
              <button className="complete-btn" onClick={onComplete}>학습 완료</button>
            )}
          </div>
        </div>

        {/* 우측: 미니맥스 분석 패널 */}
        <div className="content-card" style={{ flex: '1 1 300px', minWidth: 280 }}>
          <h3>🧠 미니맥스 분석</h3>

          {aiThinking ? (
            <div style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤖</div>
              AI가 계산 중...
            </div>
          ) : selectedPiecePos === null ? (
            <div style={{ color: '#666', padding: '1rem', background: '#f5f5f5', borderRadius: 8, lineHeight: 1.7 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#1976d2' }}>사용 방법</div>
              파란 말을 클릭하세요.<br />
              각 이동의 미니맥스 점수를 분석해드립니다.
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#555' }}>
                선택한 말: <strong>({selectedPiecePos.row},{selectedPiecePos.col})</strong>
              </div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem' }}>
                이동 가능한 위치와 승률:
              </div>
              {validMoves.length === 0 ? (
                <div style={{ color: '#f44336', fontSize: '0.85rem' }}>이동 가능한 위치가 없습니다.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {validMoves.map(move => {
                    const key = `${move.to.row},${move.to.col}`
                    const score = moveScores.get(key) ?? 0
                    const isBest = bestMove?.to.row === move.to.row && bestMove?.to.col === move.to.col
                    // 점수가 낮을수록(플레이어 유리) 승률 높음
                    const winRate = Math.max(0, Math.min(100, Math.round(((-score + 9) / 18) * 100)))
                    return (
                      <div
                        key={key}
                        style={{
                          padding: '0.6rem 0.75rem',
                          borderRadius: 8,
                          background: isBest ? '#e8f5e9' : '#f5f5f5',
                          border: isBest ? '2px solid #4caf50' : '1px solid #e0e0e0',
                          marginBottom: '0.4rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: isBest ? 'bold' : 'normal' }}>
                            → ({move.to.row},{move.to.col}) {isBest ? '⭐ 추천' : ''}
                          </span>
                          <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: isBest ? '#2e7d32' : '#555' }}>
                            {winRate}%
                          </span>
                        </div>
                        {/* 승률 막대 */}
                        <div style={{ background: '#e0e0e0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                          <div style={{
                            width: `${winRate}%`,
                            height: '100%',
                            background: isBest ? '#4caf50' : winRate > 50 ? '#1976d2' : '#f44336',
                            borderRadius: 4,
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' }}>
                          미니맥스 점수: {score}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {bestMove && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  background: '#e8f5e9',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  color: '#2e7d32',
                  fontWeight: 'bold',
                }}>
                  ✅ 최선: ({bestMove.to.row},{bestMove.to.col})으로 이동하세요!
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#e3f2fd', borderRadius: 8, fontSize: '0.82rem', color: '#1565c0', lineHeight: 1.7 }}>
            <strong>승률 해석</strong><br />
            승률이 높을수록 플레이어에게 유리한 이동입니다.<br />
            초록 막대: 추천 이동 / 파란 막대: 유리 / 빨간 막대: 불리
          </div>
        </div>
      </div>

      {/* 하단: 미니맥스 설명 */}
      <div className="content-card" style={{ marginTop: '1.5rem' }}>
        <h3>미니맥스 알고리즘 동작 원리</h3>
        <p>
          미니맥스(Minimax)는 두 플레이어 게임에서 최적의 수를 찾는 알고리즘입니다.
          고누에서는 <strong>상대가 이동 못하게 막는 것이 목표</strong>입니다.
          AI(MAX)는 자신의 이동 가능 수를 최대화하고, 플레이어(MIN)는 AI의 이동 가능 수를 최소화한다고 가정합니다.
        </p>
        <p>
          모든 가능한 수를 트리 형태로 탐색하여, 리프 노드에서 보드를 평가한 뒤 그 값을 루트까지 전파합니다.
          MAX 노드는 자식 중 최댓값을, MIN 노드는 최솟값을 선택합니다.
        </p>
        <div className="code-block" style={{ fontSize: 13 }}>
          <span className="code-line"><span className="keyword">function</span> <span className="function">minimax</span>(board, depth, isMaximizing) {'{'}</span>
          <span className="code-line">  <span className="keyword">if</span> (depth === 0 || isTerminal(board))</span>
          <span className="code-line">    <span className="keyword">return</span> <span className="function">evaluateBoard</span>(board); <span className="comment">// AI이동수 - 플레이어이동수</span></span>
          <span className="code-line"></span>
          <span className="code-line">  <span className="keyword">if</span> (isMaximizing) {'{'}</span>
          <span className="code-line">    <span className="keyword">let</span> best = -Infinity;</span>
          <span className="code-line">    <span className="keyword">for</span> (<span className="keyword">const</span> move <span className="keyword">of</span> <span className="function">getMoves</span>(board, <span className="string">'ai'</span>))</span>
          <span className="code-line">      best = Math.<span className="function">max</span>(best, <span className="function">minimax</span>(apply(board, move), depth-1, false));</span>
          <span className="code-line">    <span className="keyword">return</span> best;</span>
          <span className="code-line">  {'}'} <span className="keyword">else</span> {'{'}</span>
          <span className="code-line">    <span className="keyword">let</span> best = +Infinity;</span>
          <span className="code-line">    <span className="keyword">for</span> (<span className="keyword">const</span> move <span className="keyword">of</span> <span className="function">getMoves</span>(board, <span className="string">'player'</span>))</span>
          <span className="code-line">      best = Math.<span className="function">min</span>(best, <span className="function">minimax</span>(apply(board, move), depth-1, true));</span>
          <span className="code-line">    <span className="keyword">return</span> best;</span>
          <span className="code-line">  {'}'}</span>
          <span className="code-line">{'}'}</span>
        </div>
      </div>
    </div>
  )
}
