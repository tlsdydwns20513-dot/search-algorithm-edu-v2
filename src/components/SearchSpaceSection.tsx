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
        {/* 트리 구조 현실 예시 */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontWeight: 'bold', color: '#555', marginBottom: '0.5rem' }}>트리 구조 현실 예시:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ background: '#e3f2fd', borderRadius: 8, padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🗂️</span>
              <span><strong>파일 시스템:</strong> C드라이브 → 폴더 → 하위폴더 → 파일 (부모-자식 관계, 순환 없음)</span>
            </div>
            <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🏢</span>
              <span><strong>조직도:</strong> 대표 → 부서장 → 팀장 → 팀원</span>
            </div>
            <div style={{ background: '#f3e5f5', borderRadius: 8, padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🎮</span>
              <span><strong>게임 결정 트리:</strong> 현재 상태 → 가능한 수 → 다음 상태</span>
            </div>
          </div>
        </div>
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
        {/* 그래프 구조 현실 예시 */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontWeight: 'bold', color: '#555', marginBottom: '0.5rem' }}>그래프 구조 현실 예시:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ background: '#fff3e0', borderRadius: 8, padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🗺️</span>
              <span><strong>도로 지도:</strong> 도시(노드) ↔ 도로(간선), 순환 가능</span>
            </div>
            <div style={{ background: '#e3f2fd', borderRadius: 8, padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🌐</span>
              <span><strong>인터넷:</strong> 웹페이지(노드) ↔ 링크(간선)</span>
            </div>
            <div style={{ background: '#fce4ec', borderRadius: 8, padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>👥</span>
              <span><strong>소셜 네트워크:</strong> 사람(노드) ↔ 친구 관계(간선)</span>
            </div>
          </div>
        </div>
      </div>

      <button className="complete-btn" onClick={onComplete}>
        다음 단계로
      </button>
    </div>
  )
}
