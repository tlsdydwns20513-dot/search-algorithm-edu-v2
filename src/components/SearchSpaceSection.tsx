import { useState } from 'react'
import './Section.css'
import GraphVisualization from './GraphVisualization'
import { Node, Edge } from '../types'

interface SearchSpaceSectionProps {
  onComplete: () => void;
}

export default function SearchSpaceSection({ onComplete }: SearchSpaceSectionProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const treeNodes: Node[] = [
    { id: 'A', label: 'A', x: 400, y: 50 },
    { id: 'B', label: 'B', x: 250, y: 150 },
    { id: 'C', label: 'C', x: 550, y: 150 },
    { id: 'D', label: 'D', x: 150, y: 250 },
    { id: 'E', label: 'E', x: 350, y: 250 },
    { id: 'F', label: 'F', x: 650, y: 250 },
  ]

  const treeEdges: Edge[] = [
    { from: 'A', to: 'B' },
    { from: 'A', to: 'C' },
    { from: 'B', to: 'D' },
    { from: 'B', to: 'E' },
    { from: 'C', to: 'F' },
  ]

  const graphNodes: Node[] = [
    { id: '1', label: '1', x: 200, y: 100 },
    { id: '2', label: '2', x: 400, y: 100 },
    { id: '3', label: '3', x: 600, y: 100 },
    { id: '4', label: '4', x: 300, y: 250 },
    { id: '5', label: '5', x: 500, y: 250 },
  ]

  const graphEdges: Edge[] = [
    { from: '1', to: '2' },
    { from: '2', to: '3' },
    { from: '1', to: '4' },
    { from: '2', to: '4' },
    { from: '2', to: '5' },
    { from: '3', to: '5' },
    { from: '4', to: '5' },
  ]

  return (
    <div className="section">
      <h2 className="section-title">탐색 공간 표현</h2>

      <div className="content-card">
        <h3>탐색 공간이란?</h3>
        <p>
          인공지능에서 모든 문제는 <strong>경우의 수</strong>로 표현됩니다. 
          이러한 경우의 수를 시각적으로 나타낸 것이 <strong>탐색 공간</strong>입니다.
        </p>
        <p>
          탐색 공간은 <strong>노드(Node)</strong>와 <strong>링크(Edge)</strong>로 구성됩니다.
        </p>
      </div>

      <div className="content-card">
        <h3>트리 구조</h3>
        <p>
          트리는 <strong>방향성</strong>이 있고 <strong>순환이 없는</strong> 구조입니다. 
          부모-자식 관계가 명확합니다.
        </p>
        <div className="visualization-container">
          <GraphVisualization
            nodes={treeNodes}
            edges={treeEdges}
            selectedNode={selectedNode}
            onNodeClick={setSelectedNode}
          />
        </div>
        {selectedNode && (
          <p style={{ color: '#667eea', fontWeight: 'bold' }}>
            선택된 노드: {selectedNode}
          </p>
        )}
      </div>

      <div className="content-card">
        <h3>그래프 구조</h3>
        <p>
          그래프는 <strong>순환 구조</strong>를 가질 수 있으며, 
          노드 간의 관계가 더 복잡합니다.
        </p>
        <div className="visualization-container">
          <GraphVisualization
            nodes={graphNodes}
            edges={graphEdges}
            selectedNode={selectedNode}
            onNodeClick={setSelectedNode}
          />
        </div>
      </div>

      <button className="complete-btn" onClick={onComplete}>
        다음 단계로
      </button>
    </div>
  )
}
