import { useMemo, useRef } from 'react'
import { SearchTreeNode } from '../../types/index'

interface TreeVisualizerProps {
  nodes: SearchTreeNode[]
  currentNodeId: string
  mode: 'dfs' | 'bfs'
  width?: number
  height?: number
}

const STATUS_COLORS: Record<string, string> = {
  unvisited: '#e0e0e0',
  visiting: '#ff9800',
  visited: '#4caf50',
  backtrack: '#f44336',
  'dead-end': '#b71c1c',
  goal: '#ffd700',
}

const NODE_RADIUS = 22
const H_GAP = 60
const V_GAP = 70

interface LayoutNode {
  id: string
  x: number
  y: number
  node: SearchTreeNode
}

function buildLayout(nodes: SearchTreeNode[], mode: 'dfs' | 'bfs'): LayoutNode[] {
  if (nodes.length === 0) return []

  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  if (mode === 'bfs') {
    // 깊이별 레벨 레이아웃
    const byDepth = new Map<number, SearchTreeNode[]>()
    for (const n of nodes) {
      const arr = byDepth.get(n.depth) ?? []
      arr.push(n)
      byDepth.set(n.depth, arr)
    }
    const maxDepth = Math.max(...byDepth.keys())
    const layout: LayoutNode[] = []

    for (let d = 0; d <= maxDepth; d++) {
      const levelNodes = byDepth.get(d) ?? []
      const totalWidth = (levelNodes.length - 1) * H_GAP
      levelNodes.forEach((n, i) => {
        layout.push({
          id: n.id,
          x: i * H_GAP - totalWidth / 2,
          y: d * V_GAP,
          node: n,
        })
      })
    }
    return layout
  } else {
    // DFS: 방문 순서 기반 레이아웃 (트리 구조 유지)
    const layout: LayoutNode[] = []
    let xCounter = 0

    function dfsLayout(nodeId: string, depth: number): number {
      const n = nodeMap.get(nodeId)
      if (!n) return xCounter
      if (n.children.length === 0) {
        const x = xCounter * H_GAP
        layout.push({ id: nodeId, x, y: depth * V_GAP, node: n })
        xCounter++
        return x
      }
      const childXs: number[] = []
      for (const childId of n.children) {
        childXs.push(dfsLayout(childId, depth + 1))
      }
      const x = (childXs[0] + childXs[childXs.length - 1]) / 2
      layout.push({ id: nodeId, x, y: depth * V_GAP, node: n })
      return x
    }

    const root = nodes.find(n => n.parentId === null)
    if (root) dfsLayout(root.id, 0)
    return layout
  }
}

export default function TreeVisualizer({ nodes, currentNodeId, mode, width = 700, height = 400 }: TreeVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const layout = useMemo(() => buildLayout(nodes, mode), [nodes, mode])

  const posMap = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>()
    for (const l of layout) m.set(l.id, { x: l.x, y: l.y })
    return m
  }, [layout])

  if (layout.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: '#aaa' }}>
        탐색 트리가 없습니다
      </div>
    )
  }

  const xs = layout.map(l => l.x)
  const ys = layout.map(l => l.y)
  const minX = Math.min(...xs) - NODE_RADIUS - 30
  const maxX = Math.max(...xs) + NODE_RADIUS + 30
  const minY = Math.min(...ys) - NODE_RADIUS - 20
  const maxY = Math.max(...ys) + NODE_RADIUS + 30

  const svgWidth = Math.max(maxX - minX, width)
  const svgHeight = Math.max(maxY - minY, height)

  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  return (
    <div
      ref={containerRef}
      style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: height, border: '1px solid #eee', borderRadius: 8, background: '#fafafa' }}
    >
      <svg width={svgWidth} height={svgHeight} style={{ display: 'block' }}>
        <g transform={`translate(${-minX}, ${-minY})`}>
          {/* 엣지 */}
          {nodes.map(n => {
            if (!n.parentId) return null
            const from = posMap.get(n.parentId)
            const to = posMap.get(n.id)
            if (!from || !to) return null
            return (
              <line
                key={`edge-${n.id}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#bbb"
                strokeWidth={1.5}
              />
            )
          })}

          {/* 노드 */}
          {layout.map(({ id, x, y, node }) => {
            const isCurrent = id === currentNodeId
            const color = STATUS_COLORS[node.status] ?? '#e0e0e0'
            const textColor = node.status === 'unvisited' ? '#555' : '#fff'

            return (
              <g key={id} transform={`translate(${x}, ${y})`}>
                <circle
                  r={NODE_RADIUS}
                  fill={color}
                  stroke={isCurrent ? '#333' : '#999'}
                  strokeWidth={isCurrent ? 3 : 1}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={9}
                  fill={textColor}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {node.depth}
                </text>
                {/* action 텍스트 */}
                <text
                  y={NODE_RADIUS + 12}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#555"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {node.action.length > 10 ? node.action.slice(0, 10) + '…' : node.action}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {/* 범례 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem 0.75rem', borderTop: '1px solid #eee', background: '#fff', fontSize: '0.72rem' }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, display: 'inline-block', border: '1px solid #ccc' }} />
            {status}
          </span>
        ))}
      </div>
    </div>
  )
}
