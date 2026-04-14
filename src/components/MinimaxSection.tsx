import { useState, useEffect, useCallback } from 'react'
import './Section.css'
import {
  INITIAL_GONU_BOARD,
  getValidMoves,
  applyGonuMove,
  isTerminal,
  minimax,
  evaluateBoard,
} from '../algorithms/minimax'
import { GonuBoard, GonuMove, Position, GameTreeNode } from '../types/index'

interface MinimaxSectionProps {
  onComplete: () => void
}

type GamePhase = 'rules' | 'playing' | 'ended'
type Turn = 'player' | 'ai'

// ─── 고누 보드 SVG ───────────────────────────────────────────────────────────

const CELL = 80   // 격자 간격 (px)
const PAD  = 40   // 여백
const R    = 22   // 말 반지름
const BOARD_SIZE = PAD * 2 + CELL * 3  // 320

function GonuBoardSVG({
  board,
  selected,
  validMoves,
  onCellClick,
  disabled,
}: {
  board: GonuBoard
  selected: Position | null
  validMoves: GonuMove[]
  onCellClick: (pos: Position) => void
  disabled: boolean
}) {
  const validTargets = new Set(validMoves.map(m => `${m.to.row},${m.to.col}`))

  // 대각선 연결선: 체스판 패턴 (짝수 칸에서 대각선)
  const diagonalLines: JSX.Element[] = []
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const x1 = PAD + c * CELL
      const y1 = PAD + r * CELL
      const x2 = PAD + (c + 1) * CELL
      const y2 = PAD + (r + 1) * CELL
      if ((r + c) % 2 === 0) {
        diagonalLines.push(
          <line key={`d1-${r}-${c}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bbb" strokeWidth="1.5" />,
          <line key={`d2-${r}-${c}`} x1={x2} y1={y1} x2={x1} y2={y2} stroke="#bbb" strokeWidth="1.5" />
        )
      }
    }
  }

  return (
    <svg
      width={BOARD_SIZE}
      height={BOARD_SIZE}
      style={{ display: 'block', margin: '0 auto', background: '#fdf6e3', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
    >
      {/* 격자 가로선 */}
      {[0, 1, 2, 3].map(r => (
        <line key={`h${r}`} x1={PAD} y1={PAD + r * CELL} x2={PAD + 3 * CELL} y2={PAD + r * CELL} stroke="#999" strokeWidth="2" />
      ))}
      {/* 격자 세로선 */}
      {[0, 1, 2, 3].map(c => (
        <line key={`v${c}`} x1={PAD + c * CELL} y1={PAD} x2={PAD + c * CELL} y2={PAD + 3 * CELL} stroke="#999" strokeWidth="2" />
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

          return (
            <g key={`${r}-${c}`} onClick={() => !disabled && onCellClick({ row: r, col: c })} style={{ cursor: disabled ? 'default' : 'pointer' }}>
              {/* 이동 가능 위치: 초록 점선 원 */}
              {isTarget && (
                <circle cx={cx} cy={cy} r={R + 4} fill="none" stroke="#4caf50" strokeWidth="2.5" strokeDasharray="5,3" />
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
                  <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fill="white" fontWeight="bold" style={{ pointerEvents: 'none' }}>
                    {cell === 'player' ? '나' : 'AI'}
                  </text>
                </>
              )}
              {/* 빈 칸 교차점 */}
              {cell === 'empty' && !isTarget && (
                <circle cx={cx} cy={cy} r={5} fill="#ccc" />
              )}
            </g>
          )
        })
      )}
    </svg>
  )
}

// ─── 게임 트리 시각화 ─────────────────────────────────────────────────────────

function TreeNodeView({ node, maxDepth }: { node: GameTreeNode; maxDepth: number }) {
  if (node.depth < maxDepth - 2) return null

  const label = node.isMax ? 'MAX' : 'MIN'
  const color = node.isMax ? '#d32f2f' : '#1976d2'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 4px' }}>
      <div style={{
        border: `2px solid ${color}`,
        borderRadius: 8,
        padding: '4px 10px',
        background: 'white',
        minWidth: 60,
        textAlign: 'center',
        fontSize: 13,
      }}>
        <div style={{ color, fontWeight: 'bold', fontSize: 11 }}>{label}</div>
        <div style={{ fontWeight: 'bold', fontSize: 15 }}>{node.score}</div>
        {node.move && (
          <div style={{ fontSize: 10, color: '#888' }}>
            ({node.move.from.row},{node.move.from.col})→({node.move.to.row},{node.move.to.col})
          </div>
        )}
      </div>
      {node.children.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'row', marginTop: 8, position: 'relative' }}>
          {/* 연결선 */}
          <svg
            style={{ position: 'absolute', top: -8, left: 0, width: '100%', height: 8, overflow: 'visible', pointerEvents: 'none' }}
          />
          {node.children.slice(0, 4).map((child, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 2, height: 16, background: '#ccc' }} />
              <TreeNodeView node={child} maxDepth={maxDepth} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── 규칙 안내 화면 ───────────────────────────────────────────────────────────

function RulesScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="content-card" style={{ maxWidth: 600, margin: '0 auto' }}>
      <h3>🎮 고누 게임 규칙</h3>
      <ul style={{ lineHeight: 2, paddingLeft: '1.5rem', color: '#333' }}>
        <li>4×4 격자 위에서 진행하는 전략 보드 게임입니다.</li>
        <li><strong>파란 말</strong>은 플레이어, <strong>빨간 말</strong>은 AI입니다.</li>
        <li>말은 <strong>상하좌우 및 대각선</strong>으로 1칸 이동할 수 있습니다.</li>
        <li>상대 말 너머 빈 칸이 있으면 <strong>점프하여 상대 말을 잡을 수 있습니다.</strong></li>
        <li>상대방의 말을 <strong>모두 잡거나</strong>, 상대가 <strong>이동 불가</strong> 상태가 되면 승리합니다.</li>
        <li>AI는 <strong>미니맥스 알고리즘</strong>으로 최적의 수를 계산합니다.</li>
      </ul>
      <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#e3f2fd', borderRadius: 8 }}>
        <strong>이동 방법:</strong> 자신의 말을 클릭하면 이동 가능한 위치가 초록 점선으로 표시됩니다. 해당 위치를 클릭하면 이동합니다.
      </div>
      <button className="complete-btn" style={{ marginTop: '1.5rem' }} onClick={onStart}>
        게임 시작
      </button>
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
  const [winner, setWinner] = useState<'player' | 'ai' | 'draw' | null>(null)
  const [statusMsg, setStatusMsg] = useState('당신의 차례입니다. 말을 선택하세요.')
  const [aiThinking, setAiThinking] = useState(false)

  // 게임 종료 체크
  const checkTerminal = useCallback((b: GonuBoard): 'player' | 'ai' | 'draw' | null => {
    if (!isTerminal(b)) return null
    let playerCount = 0, aiCount = 0
    for (const row of b) for (const cell of row) {
      if (cell === 'player') playerCount++
      if (cell === 'ai') aiCount++
    }
    if (playerCount === 0) return 'ai'
    if (aiCount === 0) return 'player'
    // 이동 불가 체크
    const pm = getValidMoves(b, 'player')
    const am = getValidMoves(b, 'ai')
    if (pm.length === 0 && am.length === 0) return 'draw'
    if (pm.length === 0) return 'ai'
    if (am.length === 0) return 'player'
    return null
  }, [])

  // AI 이동
  const doAiMove = useCallback((b: GonuBoard) => {
    setAiThinking(true)
    setStatusMsg('AI가 생각 중...')
    setTimeout(() => {
      const result = minimax(b, 2, true, true)
      if (result.tree) setGameTree(result.tree)

      if (!result.move) {
        const w = checkTerminal(b)
        setWinner(w ?? 'player')
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
      setStatusMsg(moves.length > 0 ? '이동할 위치를 선택하세요.' : '이 말은 이동할 수 없습니다.')
      return
    }

    // 다른 곳 클릭 → 선택 해제
    setSelected(null)
    setValidMoves([])
    setStatusMsg('당신의 차례입니다. 말을 선택하세요.')
  }, [turn, phase, aiThinking, board, validMoves, checkTerminal, doAiMove])

  // 초기화
  const handleReset = () => {
    setBoard(INITIAL_GONU_BOARD)
    setTurn('player')
    setSelected(null)
    setValidMoves([])
    setGameTree(null)
    setWinner(null)
    setPhase('playing')
    setStatusMsg('당신의 차례입니다. 말을 선택하세요.')
    setAiThinking(false)
  }

  const handleStart = () => {
    setPhase('playing')
  }

  // 말 개수 계산
  const countPieces = (b: GonuBoard) => {
    let p = 0, a = 0
    for (const row of b) for (const cell of row) {
      if (cell === 'player') p++
      if (cell === 'ai') a++
    }
    return { player: p, ai: a }
  }
  const pieces = countPieces(board)

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
          <h3>고누 보드</h3>

          {/* 상태 메시지 */}
          <div style={{
            padding: '0.6rem 1rem',
            borderRadius: 6,
            marginBottom: '1rem',
            background: phase === 'ended' ? (winner === 'player' ? '#e8f5e9' : winner === 'ai' ? '#ffebee' : '#fff3e0') : '#e3f2fd',
            color: phase === 'ended' ? (winner === 'player' ? '#2e7d32' : winner === 'ai' ? '#c62828' : '#e65100') : '#1565c0',
            fontWeight: 'bold',
            fontSize: '1rem',
          }}>
            {phase === 'ended'
              ? winner === 'player' ? '🎉 플레이어 승리!'
              : winner === 'ai' ? '🤖 AI 승리!'
              : '🤝 무승부!'
              : statusMsg}
          </div>

          {/* 말 개수 */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: 14 }}>
            <span style={{ color: '#1976d2', fontWeight: 'bold' }}>🔵 나: {pieces.player}개</span>
            <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>🔴 AI: {pieces.ai}개</span>
            <span style={{ color: '#666' }}>차례: {turn === 'player' ? '플레이어' : 'AI'}</span>
          </div>

          <GonuBoardSVG
            board={board}
            selected={selected}
            validMoves={validMoves}
            onCellClick={handleCellClick}
            disabled={turn !== 'player' || phase !== 'playing' || aiThinking}
          />

          <div className="controls" style={{ marginTop: '1rem' }}>
            <button className="control-btn" onClick={handleReset}>초기화</button>
            {phase === 'ended' && (
              <button className="complete-btn" onClick={onComplete}>학습 완료</button>
            )}
          </div>
        </div>

        {/* 우측: 게임 트리 */}
        <div className="content-card" style={{ flex: '1 1 300px', minWidth: 280 }}>
          <h3>게임 트리 (depth=2)</h3>
          {gameTree ? (
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 420 }}>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem' }}>
                <GameTreeView node={gameTree} />
              </div>
            </div>
          ) : (
            <div style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
              AI가 이동하면 게임 트리가 표시됩니다.
            </div>
          )}
          <div style={{ marginTop: '1rem', fontSize: 12, color: '#666', lineHeight: 1.6 }}>
            <strong>MAX</strong> = AI 차례 (점수 최대화)<br />
            <strong>MIN</strong> = 플레이어 차례 (점수 최소화)<br />
            숫자 = 보드 평가값 (AI말 수 − 플레이어 말 수)
          </div>
        </div>
      </div>

      {/* 하단: 미니맥스 설명 */}
      <div className="content-card" style={{ marginTop: '1.5rem' }}>
        <h3>미니맥스 알고리즘 동작 원리</h3>
        <p>
          미니맥스(Minimax)는 두 플레이어 게임에서 최적의 수를 찾는 알고리즘입니다.
          AI(MAX 플레이어)는 자신에게 유리한 수를 선택하고, 상대(MIN 플레이어)는 AI에게 불리한 수를 선택한다고 가정합니다.
        </p>
        <p>
          모든 가능한 수를 트리 형태로 탐색하여, 리프 노드에서 보드를 평가한 뒤 그 값을 루트까지 전파합니다.
          MAX 노드는 자식 중 최댓값을, MIN 노드는 최솟값을 선택합니다.
        </p>
        <div className="code-block" style={{ fontSize: 13 }}>
          <span className="code-line"><span className="keyword">function</span> <span className="function">minimax</span>(board, depth, isMaximizing) {'{'}</span>
          <span className="code-line">  <span className="keyword">if</span> (depth === 0 || isTerminal(board))</span>
          <span className="code-line">    <span className="keyword">return</span> <span className="function">evaluateBoard</span>(board);</span>
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

// ─── 게임 트리 뷰 (재귀) ──────────────────────────────────────────────────────

function GameTreeView({ node }: { node: GameTreeNode }) {
  const label = node.isMax ? 'MAX' : 'MIN'
  const color = node.isMax ? '#d32f2f' : '#1976d2'
  const score = evaluateBoard(node.board)

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
