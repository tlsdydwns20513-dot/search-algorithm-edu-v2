import { useState, useMemo } from 'react'

interface NodeInfo {
  id: string
  name: string
  hValue: number
}

interface EvaluationFunctionVizProps {
  initialNodes?: NodeInfo[]
}

const DEFAULT_NODES: NodeInfo[] = [
  { id: 'A', name: 'A', hValue: Math.floor(Math.random() * 21) },
  { id: 'B', name: 'B', hValue: Math.floor(Math.random() * 21) },
  { id: 'C', name: 'C', hValue: Math.floor(Math.random() * 21) },
  { id: 'D', name: 'D', hValue: Math.floor(Math.random() * 21) },
  { id: 'E', name: 'E', hValue: Math.floor(Math.random() * 21) },
]

const BAR_COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe']

export default function EvaluationFunctionViz({ initialNodes }: EvaluationFunctionVizProps) {
  const [nodes, setNodes] = useState<NodeInfo[]>(initialNodes ?? DEFAULT_NODES)

  const sorted = useMemo(
    () => [...nodes].sort((a, b) => a.hValue - b.hValue),
    [nodes]
  )

  const maxH = 20

  function handleChange(id: string, value: number) {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, hValue: value } : n))
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* 슬라이더 패널 */}
        <div style={{ flex: '1 1 220px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.75rem', color: '#667eea' }}>h(n) 값 조정</div>
          {nodes.map((node, i) => (
            <div key={node.id} style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 'bold', color: BAR_COLORS[i % BAR_COLORS.length] }}>
                  노드 {node.name}
                </span>
                <span>h({node.name}) = <strong>{node.hValue}</strong></span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                value={node.hValue}
                onChange={e => handleChange(node.id, Number(e.target.value))}
                style={{ width: '100%', accentColor: BAR_COLORS[i % BAR_COLORS.length] }}
              />
            </div>
          ))}
        </div>

        {/* 막대 그래프 */}
        <div style={{ flex: '1 1 220px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.75rem', color: '#667eea' }}>탐색 우선순위 (h값 낮을수록 우선)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {sorted.map((node, rank) => {
              const origIdx = nodes.findIndex(n => n.id === node.id)
              const barWidth = maxH > 0 ? (node.hValue / maxH) * 100 : 0
              return (
                <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 20, textAlign: 'right', fontSize: '0.8rem', color: '#888' }}>{rank + 1}위</span>
                  <span style={{ width: 24, fontWeight: 'bold', color: BAR_COLORS[origIdx % BAR_COLORS.length] }}>
                    {node.name}
                  </span>
                  <div style={{ flex: 1, background: '#eee', borderRadius: 4, height: 20, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${barWidth}%`,
                        height: '100%',
                        background: BAR_COLORS[origIdx % BAR_COLORS.length],
                        borderRadius: 4,
                        transition: 'width 0.3s ease',
                        minWidth: node.hValue > 0 ? 4 : 0,
                      }}
                    />
                  </div>
                  <span style={{ width: 28, fontSize: '0.8rem', color: '#555' }}>{node.hValue}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 탐색 순서 텍스트 */}
      <div style={{
        marginTop: '1rem',
        padding: '0.6rem 1rem',
        background: '#f0f4ff',
        borderRadius: 6,
        fontSize: '0.85rem',
        color: '#3949ab',
        border: '1px solid #c5cae9',
      }}>
        <strong>탐색 순서:</strong>{' '}
        {sorted.map((node, i) => (
          <span key={node.id}>
            {i + 1}위 {node.name}(h={node.hValue}){i < sorted.length - 1 ? ', ' : ''}
          </span>
        ))}
      </div>
    </div>
  )
}
