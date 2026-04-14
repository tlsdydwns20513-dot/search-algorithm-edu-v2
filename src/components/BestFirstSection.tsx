import { useState } from 'react'
import './Section.css'
import { CITIES, EDGES, getNeighbors, getBestNextNode, isCorrectChoice, getCityById } from '../algorithms/bestFirst'
import { CityId } from '../types/index'

interface BestFirstSectionProps {
  onComplete: () => void
}

type NodeStatus = 'unvisited' | 'open' | 'closed' | 'current'

interface GameState {
  current: CityId
  openList: CityId[]
  closedList: CityId[]
  path: CityId[]
  done: boolean
  hint: string
}

const GOAL: CityId = 'sinuiju'
const START: CityId = 'busan'

function initGame(): GameState {
  return {
    current: START,
    openList: [START],
    closedList: [],
    path: [START],
    done: false,
    hint: '',
  }
}

export default function BestFirstSection({ onComplete }: BestFirstSectionProps) {
  const [game, setGame] = useState<GameState>(initGame)

  function getNodeStatus(cityId: CityId): NodeStatus {
    if (cityId === game.current) return 'current'
    if (game.closedList.includes(cityId)) return 'closed'
    if (game.openList.includes(cityId)) return 'open'
    return 'unvisited'
  }

  const nodeColors: Record<NodeStatus, string> = {
    unvisited: '#9e9e9e',
    open: '#ffc107',
    closed: '#4caf50',
    current: '#ff9800',
  }

  function handleCityClick(cityId: CityId) {
    if (game.done) return
    // 클릭 가능한 노드: openList에 있고 현재 노드가 아닌 것
    if (!game.openList.includes(cityId) || cityId === game.current) return

    const correct = isCorrectChoice(cityId, game.openList)

    if (!correct) {
      const best = getBestNextNode(game.openList)
      const bestCity = best ? getCityById(best) : null
      setGame(prev => ({
        ...prev,
        hint: `❌ 잘못된 선택입니다. 최상 우선 탐색은 h(n)이 가장 낮은 노드를 선택해야 합니다. 현재 Open List에서 최선은 "${bestCity?.name}"(h=${bestCity?.heuristic})입니다.`,
      }))
      return
    }

    // 올바른 선택: cityId를 closedList로, 인접 노드를 openList에 추가
    const neighbors = getNeighbors(cityId)
    const newClosed = [...game.closedList, game.current]
    const newOpen = game.openList
      .filter(id => id !== cityId)
      .concat(
        neighbors.filter(n => !newClosed.includes(n) && !game.openList.includes(n) && n !== cityId)
      )

    const done = cityId === GOAL

    setGame({
      current: cityId,
      openList: done ? [] : [cityId, ...newOpen.filter(id => id !== cityId)],
      closedList: newClosed,
      path: [...game.path, cityId],
      done,
      hint: done ? '' : '',
    })
  }

  function handleReset() {
    setGame(initGame())
  }

  // 경로 강조용 엣지 집합
  const pathSet = new Set<string>()
  for (let i = 0; i < game.path.length - 1; i++) {
    const a = game.path[i], b = game.path[i + 1]
    pathSet.add(`${a}-${b}`)
    pathSet.add(`${b}-${a}`)
  }

  return (
    <div className="section">
      <h2 className="section-title">최상 우선 탐색 게임 (Best-First Search)</h2>

      <div className="content-card">
        <h3>게임 방법</h3>
        <p>
          부산에서 신의주까지 최상 우선 탐색으로 이동하세요.
          <strong style={{ color: '#ffc107' }}> 노란색(Open)</strong> 노드 중
          h(n)이 가장 낮은 노드를 클릭하면 됩니다.
          잘못 선택하면 힌트가 표시됩니다.
        </p>
      </div>

      <div className="content-card">
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* SVG 지도 */}
          <div style={{ flex: '1 1 320px' }}>
            <svg
              viewBox="0 0 100 100"
              style={{ width: '100%', maxWidth: 480, border: '1px solid #e0e0e0', borderRadius: 10, background: '#f0f7ff' }}
            >
              {/* 간선 */}
              {EDGES.map((edge, i) => {
                const from = getCityById(edge.from)
                const to = getCityById(edge.to)
                const isPath = pathSet.has(`${edge.from}-${edge.to}`)
                const mx = (from.x + to.x) / 2
                const my = (from.y + to.y) / 2
                return (
                  <g key={i}>
                    <line
                      x1={from.x} y1={from.y}
                      x2={to.x} y2={to.y}
                      stroke={isPath ? '#ff9800' : '#b0bec5'}
                      strokeWidth={isPath ? 1.5 : 0.8}
                    />
                    <text x={mx} y={my - 1} textAnchor="middle" fontSize="2.5" fill="#607d8b">{edge.distance}</text>
                  </g>
                )
              })}

              {/* 도시 노드 */}
              {CITIES.map(city => {
                const status = getNodeStatus(city.id)
                const color = nodeColors[status]
                const isClickable = game.openList.includes(city.id) && city.id !== game.current && !game.done
                return (
                  <g
                    key={city.id}
                    onClick={() => handleCityClick(city.id)}
                    style={{ cursor: isClickable ? 'pointer' : 'default' }}
                  >
                    <circle
                      cx={city.x} cy={city.y} r={4}
                      fill={color}
                      stroke={isClickable ? '#333' : '#fff'}
                      strokeWidth={isClickable ? 0.8 : 0.5}
                    />
                    {/* 도시 이름 */}
                    <text x={city.x} y={city.y - 5.5} textAnchor="middle" fontSize="3" fill="#333" fontWeight="bold">
                      {city.name}
                    </text>
                    {/* heuristic 값 */}
                    <text x={city.x} y={city.y + 8} textAnchor="middle" fontSize="2.5" fill="#555">
                      h={city.heuristic}
                    </text>
                  </g>
                )
              })}
            </svg>

            {/* 범례 */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem', fontSize: '0.8rem' }}>
              {(Object.entries(nodeColors) as [NodeStatus, string][]).map(([status, color]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, border: '1px solid #ccc' }} />
                  <span>{{
                    unvisited: '미방문',
                    open: '대기중(Open)',
                    closed: '탐색완료(Closed)',
                    current: '현재',
                  }[status]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 우측 패널 */}
          <div style={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#fff3cd', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontWeight: 'bold', color: '#856404', marginBottom: '0.5rem' }}>📋 Open List</div>
              {game.openList.length === 0
                ? <div style={{ color: '#888', fontSize: '0.85rem' }}>(비어있음)</div>
                : game.openList.map(id => {
                    const city = getCityById(id)
                    const isBest = getBestNextNode(game.openList) === id
                    return (
                      <div
                        key={id}
                        onClick={() => handleCityClick(id)}
                        style={{
                          padding: '0.3rem 0.5rem',
                          marginBottom: 4,
                          borderRadius: 6,
                          background: isBest ? '#fff9c4' : '#fffde7',
                          border: isBest ? '2px solid #fbc02d' : '1px solid #ffe082',
                          cursor: id !== game.current ? 'pointer' : 'default',
                          fontSize: '0.85rem',
                          fontWeight: isBest ? 'bold' : 'normal',
                        }}
                      >
                        {city.name} (h={city.heuristic}){isBest ? ' ⭐' : ''}
                      </div>
                    )
                  })
              }
            </div>

            <div style={{ background: '#d1fae5', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontWeight: 'bold', color: '#065f46', marginBottom: '0.5rem' }}>✅ Closed List</div>
              {game.closedList.length === 0
                ? <div style={{ color: '#888', fontSize: '0.85rem' }}>(비어있음)</div>
                : game.closedList.map(id => {
                    const city = getCityById(id)
                    return (
                      <div key={id} style={{ padding: '0.3rem 0.5rem', marginBottom: 4, borderRadius: 6, background: '#ecfdf5', border: '1px solid #6ee7b7', fontSize: '0.85rem' }}>
                        {city.name}
                      </div>
                    )
                  })
              }
            </div>

            <div style={{ background: '#e3f2fd', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: '0.5rem' }}>🗺️ 현재 경로</div>
              <div style={{ fontSize: '0.85rem', color: '#333' }}>
                {game.path.map(id => getCityById(id).name).join(' → ')}
              </div>
            </div>
          </div>
        </div>

        {/* 힌트 / 완료 메시지 */}
        {game.hint && (
          <div style={{ marginTop: '1rem', background: '#fff3e0', border: '1px solid #ffb74d', borderRadius: 8, padding: '0.75rem', color: '#e65100', fontSize: '0.9rem' }}>
            {game.hint}
          </div>
        )}
        {game.done && (
          <div style={{ marginTop: '1rem', background: '#e8f5e9', border: '2px solid #4caf50', borderRadius: 10, padding: '1rem', color: '#2e7d32', fontWeight: 'bold', textAlign: 'center', fontSize: '1.1rem' }}>
            🎉 탐색 완료! 부산 → 신의주 경로: {game.path.map(id => getCityById(id).name).join(' → ')}
          </div>
        )}

        <div className="controls" style={{ justifyContent: 'center', marginTop: '1rem' }}>
          <button className="control-btn" onClick={handleReset}>🔄 초기화</button>
        </div>
      </div>

      {/* 알고리즘 설명 */}
      <div className="content-card">
        <h3>최상 우선 탐색 vs 언덕 등반</h3>
        <div style={{ background: '#e3f2fd', padding: '1rem', borderRadius: 8 }}>
          <strong>핵심 차이:</strong> 최상 우선 탐색은 <strong>선택되지 못한 노드도 Open List에 보관</strong>하여
          나중에 다시 고려합니다. 언덕 등반은 한 번 지나친 노드를 다시 보지 않습니다.
        </div>
      </div>

      <button className="complete-btn" onClick={onComplete}>
        다음 단계로
      </button>
    </div>
  )
}
