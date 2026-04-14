import { useState, useMemo } from 'react'

interface NodeInfo {
  id: string
  label: string
  hValue: number
}

const INITIAL_NODES: NodeInfo[] = [
  { id: 'A', label: 'A', hValue: 8 },
  { id: 'B', label: 'B', hValue: 3 },
  { id: 'C', label: 'C', hValue: 12 },
  { id: 'D', label: 'D', hValue: 6 },
  { id: 'E', label: 'E', hValue: 1 },
]

// 자식 노드 SVG 배치 (S 루트 아래 5개 자식)
const CHILD_POSITIONS = [
  { x: 60,  y: 130 },
  { x: 130, y: 130 },
  { x: 200, y: 130 },
  { x: 270, y: 130 },
  { x: 340, y: 130 },
]
const ROOT_POS = { x: 200, y: 40 }
const NODE_R = 24

const RANK_COLORS = ['#2e7d32', '#558b2f', '#9e9d24', '#f57f17', '#bf360c']

export default function HeuristicTreeViz() {
  const [nodes, setNodes] = useState<NodeInfo[]>(INITIAL_NODES)

  const sorted = useMemo(
    () => [...nodes].map((n, i) => ({ ...n, origIdx: i })).sort((a, b) => a.hValue - b.hValue),
    [nodes]
  )

  // rank 맵: id → rank (0-based)
  const rankMap = useMemo(() => {
    const m = new Map<string, number>()
    sorted.forEach((n, rank) => m.set(n.id, rank))
    return m
  }, [sorted])

  function handleChange(id: string, value: number) {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, hValue: value } : n))
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* 슬라이더 패널 */}
        <div style={{ flex: '0 0 200px', minWidth: 180 }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.75rem', color: '#6a1b9a' }}>h(n) 값 조정</div>
          {nodes.map((node, i) => {
            const rank = rankMap.get(node.id) ?? i
            const color = RANK_COLORS[rank] ?? '#888'
            return (
              <div key={node.id} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: 'bold', color }}>노드 {node.label}</span>
                  <span>h = <strong>{node.hValue}</strong></span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={node.hValue}
                  onChange={e => handleChange(node.id, Number(e.target.value))}
                  style={{ width: '100%', accentColor: color }}
                />
              </div>
            )
          })}
        </div>

        {/* SVG 트리 */}
        <div style={{ flex: '1 1 360px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#6a1b9a', fontSize: '0.9rem' }}>
            탐색 순서 (h값 낮을수록 먼저 탐색)
          </div>
          <svg viewBox="0 0 400 210" style={{ width: '100%', maxWidth: 420, background: '#fafafa', borderRadius: 8, border: '1px solid #e0e0e0' }}>
            {/* 루트 → 자식 간선 */}
            {nodes.map((node, i) => {
              const cp = CHILD_POSITIONS[i]
              return (
                <line
                  key={`edge-${node.id}`}
                  x1={ROOT_POS.x} y1={ROOT_POS.y + NODE_R}
                  x2={cp.x} y2={cp.y - NODE_R}
                  stroke="#bbb"
                  strokeWidth={1.5}
                />
              )
            })}

            {/* 루트 노드 S */}
            <circle cx={ROOT_POS.x} cy={ROOT_POS.y} r={NODE_R} fill="#5c6bc0" stroke="#3949ab" strokeWidth={2} />
            <text x={ROOT_POS.x} y={ROOT_POS.y + 5} textAnchor="middle" fontSize={14} fill="white" fontWeight="bold">S</text>

            {/* 자식 노드들 */}
            {nodes.map((node, i) => {
              const cp = CHILD_POSITIONS[i]
              const rank = rankMap.get(node.id) ?? i
              const color = RANK_COLORS[rank] ?? '#888'
              const isFirst = rank === 0

              return (
                <g key={node.id}>
                  {/* 노드 원 */}
                  <circle
                    cx={cp.x} cy={cp.y} r={NODE_R}
                    fill={color}
                    stroke={isFirst ? '#1b5e20' : '#666'}
                    strokeWidth={isFirst ? 3 : 1.5}
                  />
                  {/* 노드 라벨 */}
                  <text x={cp.x} y={cp.y - 4} textAnchor="middle" fontSize={13} fill="white" fontWeight="bold">
                    {node.label}
                  </text>
                  {/* h값 */}
                  <text x={cp.x} y={cp.y + 10} textAnchor="middle" fontSize={10} fill="white">
                    h={node.hValue}
                  </text>
                  {/* 탐색 순서 배지 */}
                  <circle cx={cp.x + NODE_R - 2} cy={cp.y - NODE_R + 2} r={10} fill={isFirst ? '#ffd600' : '#eeeeee'} stroke={isFirst ? '#f9a825' : '#bbb'} strokeWidth={1} />
                  <text x={cp.x + NODE_R - 2} y={cp.y - NODE_R + 6} textAnchor="middle" fontSize={9} fill={isFirst ? '#333' : '#666'} fontWeight="bold">
                    {rank + 1}
                  </text>
                </g>
              )
            })}

            {/* 탐색 순서 화살표 (1위 노드 강조) */}
            {(() => {
              const firstNode = sorted[0]
              const idx = nodes.findIndex(n => n.id === firstNode.id)
              const cp = CHILD_POSITIONS[idx]
              return (
                <text x={cp.x} y={cp.y + NODE_R + 16} textAnchor="middle" fontSize={10} fill="#2e7d32" fontWeight="bold">
                  ← 먼저 탐색
                </text>
              )
            })()}
          </svg>
        </div>
      </div>

      {/* 탐색 순서 텍스트 */}
      <div style={{
        marginTop: '1rem',
        padding: '0.6rem 1rem',
        background: '#f3e5f5',
        borderRadius: 6,
        fontSize: '0.85rem',
        color: '#4a148c',
        border: '1px solid #ce93d8',
      }}>
        <strong>탐색 순서:</strong>{' '}
        {sorted.map((node, i) => (
          <span key={node.id}>
            <span style={{ color: RANK_COLORS[i], fontWeight: i === 0 ? 'bold' : 'normal' }}>
              {i + 1}위 {node.label}(h={node.hValue})
            </span>
            {i < sorted.length - 1 ? ' → ' : ''}
          </span>
        ))}
      </div>
    </div>
  )
}
