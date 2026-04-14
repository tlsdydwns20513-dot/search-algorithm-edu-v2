import { useState, useCallback } from 'react'
import './Section.css'
import {
  computeMisplaced,
  getAdjacentIndices,
  computePreviewValues,
  isLocalMinimum,
  generateSolvablePuzzle,
  applyMove,
} from '../algorithms/puzzle8'
import { PuzzleBoard, GOAL_STATE } from '../types/index'

interface HillClimbingSectionProps {
  onComplete: () => void
}

interface MoveRecord {
  moveNum: number
  tileValue: number
  misplacedBefore: number
  misplacedAfter: number
}

export default function HillClimbingSection({ onComplete }: HillClimbingSectionProps) {
  const [board, setBoard] = useState<PuzzleBoard>(() => generateSolvablePuzzle())
  const [moveCount, setMoveCount] = useState(0)
  const [history, setHistory] = useState<MoveRecord[]>([])

  const misplaced = computeMisplaced(board)
  const previews = computePreviewValues(board)
  const blankIdx = board.indexOf(0)
  const adjacentIndices = getAdjacentIndices(blankIdx)
  const localMin = isLocalMinimum(board)
  const solved = misplaced === 0

  // 최적 이동 타일 인덱스 (preview 값이 가장 낮은 것)
  const bestMoveIdx = adjacentIndices.reduce<number | null>((best, idx) => {
    if (best === null) return idx
    return previews[idx] < previews[best] ? idx : best
  }, null)

  const handleTileClick = useCallback((tileIdx: number) => {
    if (solved || localMin) return
    if (!adjacentIndices.includes(tileIdx)) return

    const before = computeMisplaced(board)
    const newBoard = applyMove(board, tileIdx)
    const after = computeMisplaced(newBoard)

    setHistory(prev => [...prev, {
      moveNum: moveCount + 1,
      tileValue: board[tileIdx],
      misplacedBefore: before,
      misplacedAfter: after,
    }])
    setBoard(newBoard)
    setMoveCount(c => c + 1)
  }, [board, adjacentIndices, solved, localMin, moveCount])

  const handleReset = () => {
    setBoard(generateSolvablePuzzle())
    setMoveCount(0)
    setHistory([])
  }

  return (
    <div className="section">
      <h2 className="section-title">언덕 등반 탐색 게임 (Hill Climbing)</h2>

      <div className="content-card">
        <h3>게임 방법</h3>
        <p>
          빈 칸에 인접한 타일을 클릭하여 이동하세요. 목표 상태(1~8 순서)를 만들면 성공입니다.
          각 타일 우상단의 숫자는 이동 후 예상 <strong>misplaced(잘못 놓인 타일 수)</strong>입니다.
          <strong style={{ color: '#4caf50' }}> 초록 테두리</strong> 타일이 현재 최적 이동입니다.
        </p>
      </div>

      <div className="content-card">
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* 현재 상태 보드 */}
          <div>
            <h4 style={{ textAlign: 'center', marginBottom: '0.75rem', color: '#667eea' }}>
              현재 상태 — misplaced: <strong>{misplaced}</strong>
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 80px)',
              gap: 5,
              background: '#e0e0e0',
              padding: 8,
              borderRadius: 10,
            }}>
              {board.map((tile, idx) => {
                const isBlank = tile === 0
                const isAdjacent = adjacentIndices.includes(idx)
                const isBest = idx === bestMoveIdx && !solved && !localMin
                const previewVal = previews[idx]
                const canMove = isAdjacent && !solved && !localMin

                return (
                  <div
                    key={idx}
                    onClick={() => canMove && handleTileClick(idx)}
                    style={{
                      position: 'relative',
                      width: 80,
                      height: 80,
                      background: isBlank
                        ? '#bdbdbd'
                        : isBest
                          ? '#e8f5e9'
                          : isAdjacent
                            ? '#e3f2fd'
                            : '#667eea',
                      color: isBlank ? 'transparent' : isBest || isAdjacent ? '#333' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      borderRadius: 8,
                      cursor: canMove ? 'pointer' : 'default',
                      border: isBest ? '3px solid #4caf50' : isAdjacent ? '2px solid #90caf9' : '2px solid transparent',
                      boxShadow: isBlank ? 'none' : '0 2px 6px rgba(0,0,0,0.15)',
                      transition: 'all 0.15s ease',
                      userSelect: 'none',
                    }}
                  >
                    {isBlank ? '' : tile}
                    {/* 예상 misplaced 배지 */}
                    {isAdjacent && !isBlank && (
                      <div style={{
                        position: 'absolute',
                        top: 3,
                        right: 3,
                        background: isBest ? '#4caf50' : '#1976d2',
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}>
                        {previewVal}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 목표 상태 보드 */}
          <div>
            <h4 style={{ textAlign: 'center', marginBottom: '0.75rem', color: '#4caf50' }}>목표 상태</h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 80px)',
              gap: 5,
              background: '#e0e0e0',
              padding: 8,
              borderRadius: 10,
            }}>
              {GOAL_STATE.map((tile, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 80,
                    height: 80,
                    background: tile === 0 ? '#bdbdbd' : '#4caf50',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    borderRadius: 8,
                    boxShadow: tile === 0 ? 'none' : '0 2px 6px rgba(0,0,0,0.15)',
                  }}
                >
                  {tile === 0 ? '' : tile}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 상태 메시지 */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          {solved && (
            <div style={{
              background: '#e8f5e9', border: '2px solid #4caf50', borderRadius: 10,
              padding: '1rem', color: '#2e7d32', fontWeight: 'bold', fontSize: '1.1rem'
            }}>
              🎉 성공! 총 {moveCount}번 이동으로 목표 상태에 도달했습니다!
            </div>
          )}
          {localMin && !solved && (
            <div style={{
              background: '#fff3e0', border: '2px solid #ff9800', borderRadius: 10,
              padding: '1rem', color: '#e65100', fontWeight: 'bold', fontSize: '1rem'
            }}>
              ⚠️ 극소(Local Minimum) 도달 — 어떤 이동도 misplaced를 줄이지 못합니다. 초기화 후 다시 시도하세요.
            </div>
          )}
          {!solved && !localMin && (
            <div style={{ color: '#667eea', fontWeight: 'bold' }}>
              이동 횟수: {moveCount} | 현재 misplaced: {misplaced}
            </div>
          )}
        </div>

        <div className="controls" style={{ justifyContent: 'center', marginTop: '1rem' }}>
          <button className="control-btn" onClick={handleReset}>
            🔄 초기화
          </button>
        </div>
      </div>

      {/* 이동 이력 */}
      {history.length > 0 && (
        <div className="content-card">
          <h3>이동 이력</h3>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f0f4ff' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '2px solid #c5cae9' }}>이동 #</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '2px solid #c5cae9' }}>이동 타일</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '2px solid #c5cae9' }}>이전 misplaced</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '2px solid #c5cae9' }}>이후 misplaced</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '2px solid #c5cae9' }}>변화</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((rec) => (
                  <tr key={rec.moveNum} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.4rem', textAlign: 'center' }}>{rec.moveNum}</td>
                    <td style={{ padding: '0.4rem', textAlign: 'center', fontWeight: 'bold' }}>{rec.tileValue}</td>
                    <td style={{ padding: '0.4rem', textAlign: 'center' }}>{rec.misplacedBefore}</td>
                    <td style={{ padding: '0.4rem', textAlign: 'center' }}>{rec.misplacedAfter}</td>
                    <td style={{ padding: '0.4rem', textAlign: 'center', color: rec.misplacedAfter < rec.misplacedBefore ? '#4caf50' : rec.misplacedAfter > rec.misplacedBefore ? '#f44336' : '#888', fontWeight: 'bold' }}>
                      {rec.misplacedAfter < rec.misplacedBefore ? '▼ 개선' : rec.misplacedAfter > rec.misplacedBefore ? '▲ 악화' : '— 동일'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 언덕 등반 한계 설명 */}
      <div className="content-card">
        <h3>언덕 등반 탐색의 한계</h3>
        <ul className="feature-list">
          <li>
            <strong>극소 (Local Minimum)</strong>
            <p>주변보다 misplaced가 낮지만 목표가 아닌 지점에 갇힐 수 있습니다.</p>
          </li>
          <li>
            <strong>고원 (Plateau)</strong>
            <p>모든 이동의 misplaced가 동일하여 방향을 결정하기 어렵습니다.</p>
          </li>
          <li>
            <strong>Open List 없음</strong>
            <p>한 번 지나친 상태로 돌아갈 수 없어 최적해를 보장하지 않습니다.</p>
          </li>
        </ul>
      </div>

      <button className="complete-btn" onClick={onComplete}>
        다음 단계로
      </button>
    </div>
  )
}
