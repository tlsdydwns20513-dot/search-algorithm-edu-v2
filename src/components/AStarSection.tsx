import { useState } from 'react'
import './Section.css'
import GraphVisualization from './GraphVisualization'
import { Node, Edge } from '../types'

interface AStarSectionProps {
  onComplete: () => void;
}

export default function AStarSection({ onComplete }: AStarSectionProps) {
  const [step, setStep] = useState(0)

  const nodes: Node[] = [
    { id: 'S', label: 'S', x: 100, y: 150, heuristic: 7, cost: 0 },
    { id: 'A', label: 'A', x: 250, y: 100, heuristic: 5, cost: 1 },
    { id: 'B', label: 'B', x: 250, y: 200, heuristic: 6, cost: 1 },
    { id: 'C', label: 'C', x: 400, y: 50, heuristic: 4, cost: 3 },
    { id: 'D', label: 'D', x: 400, y: 150, heuristic: 2, cost: 2 },
    { id: 'E', label: 'E', x: 400, y: 250, heuristic: 5, cost: 2 },
    { id: 'G', label: 'G', x: 550, y: 150, heuristic: 0, cost: 3 },
  ]

  const edges: Edge[] = [
    { from: 'S', to: 'A' },
    { from: 'S', to: 'B' },
    { from: 'A', to: 'C' },
    { from: 'A', to: 'D' },
    { from: 'B', to: 'E' },
    { from: 'D', to: 'G' },
    { from: 'C', to: 'G' },
  ]

  const steps = [
    {
      openList: [{ id: 'S', f: 7 }],
      closedList: [],
      current: 'S',
      message: '시작: S의 f(n) = g(n) + h(n) = 0 + 7 = 7'
    },
    {
      openList: [{ id: 'A', f: 6 }, { id: 'B', f: 7 }],
      closedList: ['S'],
      current: 'A',
      message: 'A: f(n) = 1 + 5 = 6, B: f(n) = 1 + 6 = 7. A 선택'
    },
    {
      openList: [{ id: 'D', f: 4 }, { id: 'B', f: 7 }, { id: 'C', f: 7 }],
      closedList: ['S', 'A'],
      current: 'D',
      message: 'D: f(n) = 2 + 2 = 4가 최소. D 선택'
    },
    {
      openList: [{ id: 'G', f: 3 }, { id: 'B', f: 7 }, { id: 'C', f: 7 }],
      closedList: ['S', 'A', 'D'],
      current: 'G',
      message: 'G: f(n) = 3 + 0 = 3. 목표 도달! 최적 경로: S→A→D→G'
    }
  ]

  const currentStep = steps[step]
  const visualNodes = nodes.map(node => ({
    ...node,
    visited: currentStep.closedList.includes(node.id),
    current: currentStep.current === node.id,
    inPath: step === steps.length - 1 && ['S', 'A', 'D', 'G'].includes(node.id),
  }))

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const reset = () => {
    setStep(0)
  }

  return (
    <div className="section">
      <h2 className="section-title">A* 알고리즘</h2>

      <div className="content-card">
        <h3>A* 알고리즘이란?</h3>
        <p>
          A* 알고리즘은 <strong>실제 비용</strong>과 <strong>휴리스틱 추정값</strong>을 
          결합한 최적화된 탐색 알고리즘입니다.
        </p>
        <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '6px', margin: '1rem 0' }}>
          <strong>평가 함수:</strong> f(n) = g(n) + h(n)
          <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
            <li><strong>g(n)</strong>: 시작 노드부터 현재 노드까지의 실제 비용</li>
            <li><strong>h(n)</strong>: 현재 노드부터 목표까지의 추정 비용 (휴리스틱)</li>
            <li><strong>f(n)</strong>: 총 예상 비용</li>
          </ul>
        </div>
      </div>

      <div className="content-card">
        <h3>시각화</h3>
        <p>
          각 노드에 g(실제 비용)와 h(휴리스틱) 값이 표시됩니다. 
          A*는 f(n) = g(n) + h(n)이 가장 작은 노드를 선택합니다.
        </p>

        <div className="visualization-container">
          <GraphVisualization
            nodes={visualNodes}
            edges={edges}
            width={700}
            height={350}
          />
        </div>

        <div style={{ background: '#fff3cd', padding: '1rem', borderRadius: '6px', margin: '1rem 0' }}>
          <strong>Open List (f값 포함):</strong>
          <div style={{ marginTop: '0.5rem' }}>
            {currentStep.openList.map(item => `${item.id}(f=${item.f})`).join(', ')}
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '1rem 0', color: '#667eea', fontWeight: 'bold' }}>
          {currentStep.message}
        </div>

        <div className="controls">
          <button className="control-btn" onClick={prevStep} disabled={step === 0}>
            이전
          </button>
          <button className="control-btn" onClick={nextStep} disabled={step === steps.length - 1}>
            다음
          </button>
          <button className="control-btn" onClick={reset}>
            처음으로
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          단계: {step + 1} / {steps.length}
        </div>
      </div>

      <div className="content-card">
        <h3>A* 알고리즘의 특징</h3>
        <ul className="feature-list">
          <li>
            <strong>최적성 보장</strong>
            <p>휴리스틱이 admissible하면 (실제 비용을 과대평가하지 않으면) 최적 경로를 보장합니다</p>
          </li>
          <li>
            <strong>효율성</strong>
            <p>좋은 휴리스틱을 사용하면 불필요한 노드 탐색을 크게 줄일 수 있습니다</p>
          </li>
          <li>
            <strong>완전성</strong>
            <p>해가 존재하면 반드시 찾아냅니다</p>
          </li>
        </ul>
      </div>

      <div className="content-card">
        <h3>A* 코드 예시 (TypeScript)</h3>
        <div className="code-block">
          <code>
            <span className="keyword">function</span> <span className="function">aStar</span>(start: Node, goal: Node) {'{\n'}
            {'  '}<span className="keyword">const</span> openList = [start]{'\n'}
            {'  '}<span className="keyword">const</span> closedList = <span className="keyword">new</span> Set&lt;Node&gt;(){'\n'}
            {'  '}<span className="keyword">const</span> gScore = <span className="keyword">new</span> Map&lt;Node, number&gt;(){'\n'}
            {'  '}gScore.set(start, 0){'\n'}
            {'\n'}
            {'  '}<span className="keyword">while</span> (openList.length &gt; 0) {'{\n'}
            {'    '}<span className="comment">// f(n) = g(n) + h(n)이 최소인 노드 선택</span>{'\n'}
            {'    '}<span className="keyword">const</span> current = openList.reduce((best, node) =&gt; {'{\n'}
            {'      '}<span className="keyword">const</span> fBest = gScore.get(best)! + heuristic(best, goal){'\n'}
            {'      '}<span className="keyword">const</span> fNode = gScore.get(node)! + heuristic(node, goal){'\n'}
            {'      '}<span className="keyword">return</span> fNode &lt; fBest ? node : best{'\n'}
            {'    }'}){'\n'}
            {'\n'}
            {'    '}<span className="keyword">if</span> (current === goal) {'{\n'}
            {'      '}<span className="keyword">return</span> reconstructPath(current){'\n'}
            {'    }'}{'\n'}
            {'\n'}
            {'    '}openList.remove(current){'\n'}
            {'    '}closedList.add(current){'\n'}
            {'\n'}
            {'    '}<span className="keyword">for</span> (<span className="keyword">const</span> neighbor <span className="keyword">of</span> current.neighbors) {'{\n'}
            {'      '}<span className="keyword">if</span> (closedList.has(neighbor)) <span className="keyword">continue</span>{'\n'}
            {'\n'}
            {'      '}<span className="keyword">const</span> tentativeG = gScore.get(current)! + cost(current, neighbor){'\n'}
            {'\n'}
            {'      '}<span className="keyword">if</span> (!openList.includes(neighbor)) {'{\n'}
            {'        '}openList.push(neighbor){'\n'}
            {'      }'} <span className="keyword">else if</span> (tentativeG &gt;= gScore.get(neighbor)!) {'{\n'}
            {'        '}<span className="keyword">continue</span>{'\n'}
            {'      }'}{'\n'}
            {'\n'}
            {'      '}gScore.set(neighbor, tentativeG){'\n'}
            {'    }'}{'\n'}
            {'  }'}{'\n'}
            {'  '}<span className="keyword">return</span> <span className="keyword">null</span> <span className="comment">// 경로 없음</span>{'\n'}
            {'}'}
          </code>
        </div>
      </div>

      <div className="content-card">
        <h3>실제 응용 사례</h3>
        <ul className="feature-list">
          <li>
            <strong>게임 AI</strong>
            <p>캐릭터의 경로 찾기 (Pathfinding)</p>
          </li>
          <li>
            <strong>내비게이션</strong>
            <p>최단 경로 안내 시스템</p>
          </li>
          <li>
            <strong>로봇 공학</strong>
            <p>로봇의 이동 경로 계획</p>
          </li>
        </ul>
      </div>

      <button className="complete-btn" onClick={onComplete}>
        학습 완료!
      </button>
    </div>
  )
}
