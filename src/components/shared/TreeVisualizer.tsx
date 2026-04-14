import { useMemo, useRef } from 'react'
import { SearchTreeNode } from '../../types/index'

interface TreeVisualizerProps {
  nodes: SearchTreeNode[]        // 현재까지 생성된 노드 (방문 상태 포함)
  allNodes?: SearchTreeNode[]    // 전체 트리 노드 (미리 그리기용)
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

const NODE_RADIUS = 28
const H_GAP = 80
const V_GAP = 90

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

    if (layout.length > 0) {
      const xs = layout.map(l => l.x)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const offsetX = -(minX + maxX) / 2
      for (const l of layout) l.x += offsetX
    }

    return layout
  } else {
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

    if (layout.length > 0) {
      const xs = layout.map(l => l.x)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const offsetX = -(minX + maxX) / 2
      for (const l of layout) l.x += offsetX
    }

    return layout
  }
}

export default function TreeVisualizer({ nodes, allNodes, currentNodeId, mode, width = 700, height = 400 }: TreeVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // allNodes가 있으면 전체 트리 레이아웃 기준으로 그리기
  const baseNodes = allNodes ?? nodes
  const layout = useMemo(() => buildLayout(baseNodes, mode), [baseNodes, mode])

  const posMap = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>()
    for (const l of layout) m.set(l.id, { x: l.x, y: l.y })
    return m
  }, [layout])

  // 현재까지 방문한 노드 맵 (status 정보 포함)
  const visitedNodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes])

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

  const contentWidth = maxX - minX
  const svgWidth = Math.max(contentWidth, width)
  const svgHeight = Math.max(maxY - minY, height)

  const offsetX = -minX + (svgWidth - contentWidth) / 2

  return (
    <div
      ref={containerRef}
      style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: height, border: '1px solid #eee', borderRadius: 8, background: '#fafafa' }}
    >
      <svg width={svgWidth} height={svgHeight} style={{ display: 'block' }}>
        <g transform={`translate(${offsetX}, ${-minY})`}>
          {/* 엣지 - allNodes 기준으로 그리기 */}
          {baseNodes.map(n => {
            if (!n.parentId) return null
            const from = posMap.get(n.parentId)
            const to = posMap.get(n.id)
            if (!from || !to) return null
            const isVisited = visitedNodeMap.has(n.id)
            return (
              <line
                key={`edge-${n.id}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isVisited ? '#bbb' : '#ddd'}
                strokeWidth={isVisited ? 1.5 : 1}
                strokeDasharray={isVisited ? undefined : '4,3'}
                opacity={isVisited ? 1 : 0.5}
              />
            )
          })}

          {/* 노드 - allNodes 기준으로 그리기, 방문 여부에 따라 색상 결정 */}
          {layout.map(({ id, x, y, node }) => {
            const isCurrent = id === currentNodeId
            const visitedNode = visitedNodeMap.get(id)
            // allNodes 모드: 방문한 노드는 실제 status 색상, 미방문은 회색
            const color = visitedNode
              ? (STATUS_COLORS[visitedNode.status] ?? '#e0e0e0')
              : '#e0e0e0'
            const textColor = (!visitedNode || visitedNode.status === 'unvisited') ? '#555' : '#fff'
            const opacity = visitedNode ? 1 : 0.45

            return (
              <g key={id} transform={`translate(${x}, ${y})`} opacity={opacity}>
                <circle
                  r={NODE_RADIUS}
                  fill={color}
                  stroke={isCurrent ? '#333' : '#999'}
                  strokeWidth={isCurrent ? 3 : 1}
                />
                {/* 현재 노드 강조 링 */}
                {isCurrent && (
                  <circle
                    r={NODE_RADIUS + 6}
                    fill="none"
                    stroke="#333"
                    strokeWidth={2.5}
                    strokeDasharray="5,3"
                    opacity={1}
                  />
                )}
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={13}
                  fill={textColor}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {node.depth}
                </text>
                <text
                  y={NODE_RADIUS + 12}
                  textAnchor="middle"
                  fontSize={11}
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
