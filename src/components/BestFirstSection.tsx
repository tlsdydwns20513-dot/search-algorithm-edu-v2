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
  const startNeighbors = getNeighbors(START)  // 부산의 인접 도시들
  return {
    current: START,
    openList: startNeighbors,  // 인접 도시들이 처음부터 open
    closedList: [START],       // 부산은 이미 방문
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
    // 클릭 가능한 노드: openList에 있는 것
    if (!game.openList.includes(cityId)) return

    const correct = isCorrectChoice(cityId, game.openList)

    // 올바른 선택: cityId로 이동, 인접 노드를 openList에 추가
    const neighbors = getNeighbors(cityId)
    const newClosed = [...game.closedList, game.current]
    const newOpen = game.openList
      .filter(id => id !== cityId)
      .concat(
        neighbors.filter(n => !newClosed.includes(n) && !game.openList.includes(n) && n !== cityId)
      )

    const done = cityId === GOAL

    if (!correct) {
      const best = getBestNextNode(game.openList)
      const bestCity = best ? getCityById(best) : null
      // 잘못된 선택도 이동은 허용하되 힌트 표시
      setGame({
        current: cityId,
        openList: done ? [] : [cityId, ...newOpen.filter(id => id !== cityId)],
        closedList: newClosed,
        path: [...game.path, cityId],
        done,
        hint: done ? '' : `💡 힌트: 최상 우선 탐색은 h(n)이 가장 낮은 노드를 선택해야 합니다. 현재 Open List에서 최선은 "${bestCity?.name}"(h=${bestCity?.heuristic})입니다.`,
      })
      return
    }

    setGame({
      current: cityId,
      openList: done ? [] : [cityId, ...newOpen.filter(id => id !== cityId)],
      closedList: newClosed,
      path: [...game.path, cityId],
      done,
      hint: '',
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
        <h3>최상 우선 탐색이란?</h3>
        <p>
          여러 선택지 중에서 "목표에 가장 가까워 보이는" 것을 먼저 탐색하는 방법입니다.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          <div style={{ background: '#e3f2fd', borderRadius: 8, padding: '0.75rem 1rem', borderLeft: '4px solid #1976d2' }}>
            <div style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: '0.3rem' }}>핵심 개념</div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#555', lineHeight: 1.8 }}>
              <li><strong>h(n):</strong> 현재 노드에서 목표까지의 예상 거리 (휴리스틱 값)</li>
              <li><strong>Open List:</strong> 아직 탐색하지 않은 후보 노드들의 목록</li>
              <li><strong>Closed List:</strong> 이미 탐색 완료된 노드들의 목록</li>
              <li>매 단계마다 Open List에서 <strong>h(n)이 가장 낮은 노드</strong>를 선택</li>
            </ul>
          </div>
          <div style={{ background: '#fff3e0', borderRadius: 8, padding: '0.75rem 1rem', borderLeft: '4px solid #ff9800' }}>
            <div style={{ fontWeight: 'bold', color: '#e65100', marginBottom: '0.3rem' }}>언덕 등반과의 차이</div>
            <p style={{ margin: 0, color: '#555', lineHeight: 1.7 }}>
              언덕 등반은 현재 위치의 이웃만 보지만,
              최상 우선 탐색은 Open List에 저장된 <strong>모든 후보 중 최선을 선택</strong>합니다.
              한 번 지나친 경로도 나중에 다시 고려할 수 있습니다.
            </p>
          </div>
          <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '0.75rem 1rem', borderLeft: '4px solid #4caf50' }}>
            <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '0.3rem' }}>이 게임에서</div>
            <p style={{ margin: 0, color: '#555', lineHeight: 1.7 }}>
              부산(h=1100)에서 신의주(h=0)까지 이동합니다.
              각 도시의 h값은 신의주까지의 직선 거리(km)입니다.
              Open List에서 h값이 가장 낮은 도시를 클릭하세요!
            </p>
          </div>
        </div>
      </div>

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
              viewBox="0 0 110 100"
              style={{ width: '100%', maxWidth: 520, border: '1px solid #e0e0e0', borderRadius: 10, background: '#f0f7ff' }}
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
                    <text x={mx} y={my - 1} textAnchor="middle" fontSize="2.2" fill="#607d8b">{edge.distance}</text>
                  </g>
                )
              })}

              {/* 도시 노드 */}
              {CITIES.map(city => {
                const status = getNodeStatus(city.id)
                const color = nodeColors[status]
                const isClickable = game.openList.includes(city.id) && !game.done
                // 도시별 라벨 오프셋 (겹침 방지)
                const labelOffsets: Record<string, { dx: number; dy: number; hdy: number }> = {
                  busan:     { dx: 0,   dy: -6.5, hdy: 7  },
                  ulsan:     { dx: 6,   dy: 0,    hdy: 0  },
                  pohang:    { dx: 6,   dy: 0,    hdy: 0  },
                  daegu:     { dx: -6,  dy: 0,    hdy: 0  },
                  gwangju:   { dx: -6,  dy: 0,    hdy: 0  },
                  jeonju:    { dx: -6,  dy: 0,    hdy: 0  },
                  daejeon:   { dx: 6,   dy: 0,    hdy: 0  },
                  incheon:   { dx: -6,  dy: 0,    hdy: 0  },
                  seoul:     { dx: 0,   dy: -6.5, hdy: 7  },
                  chuncheon: { dx: 6,   dy: 0,    hdy: 0  },
                  pyongyang: { dx: -7,  dy: 0,    hdy: 0  },
                  sinuiju:   { dx: 0,   dy: -6.5, hdy: 7  },
                }
                const off = labelOffsets[city.id] ?? { dx: 0, dy: -6.5, hdy: 7 }
                const nameAnchor = off.dx > 0 ? 'start' : off.dx < 0 ? 'end' : 'middle'
                const nameX = city.x + off.dx
                const nameY = off.dy !== 0 ? city.y + off.dy : city.y
                const hX = city.x + (off.dx > 0 ? off.dx : off.dx < 0 ? off.dx : 0)
                const hY = off.hdy !== 0 ? city.y + off.hdy : city.y + (off.dy < 0 ? 7 : -5)

                return (
                  <g
                    key={city.id}
                    onClick={() => handleCityClick(city.id)}
                    style={{ cursor: isClickable ? 'pointer' : 'default' }}
                  >
                    <circle
                      cx={city.x} cy={city.y} r={5}
                      fill={color}
                      stroke={isClickable ? '#333' : '#fff'}
                      strokeWidth={isClickable ? 0.8 : 0.5}
                    />
                    {/* 도시 이름 */}
                    <text x={nameX} y={nameY} textAnchor={nameAnchor} fontSize="3" fill="#333" fontWeight="bold">
                      {city.name}
                    </text>
                    {/* heuristic 값 */}
                    <text x={hX} y={hY} textAnchor={nameAnchor} fontSize="2.5" fill="#555">
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
                          cursor: 'pointer',
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
