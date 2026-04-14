import { useState, useEffect, useRef } from 'react'
import './Section.css'
import { computeDFSSteps } from '../algorithms/riverCrossing'
import { SearchStep } from '../types/index'
import StatePanel from './shared/StatePanel'
import TreeVisualizer from './shared/TreeVisualizer'
import SimulatorControls from './shared/SimulatorControls'

interface DFSSectionProps {
  onComplete: () => void
}

export default function DFSSection({ onComplete }: DFSSectionProps) {
  const [steps, setSteps] = useState<SearchStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const computed = computeDFSSteps()
    setSteps(computed)
    setCurrentStep(0)
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handlePrev = () => setCurrentStep(prev => Math.max(0, prev - 1))
  const handleNext = () => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))

  const handleTogglePlay = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 700)
    }
  }

  const step = steps[currentStep]
  // 전체 트리: 마지막 단계의 allNodes
  const allNodes = steps.length > 0 ? steps[steps.length - 1].allNodes : []

  return (
    <div className="section">
      <h2 className="section-title">깊이 우선 탐색 (DFS)</h2>

      <div className="content-card">
        <h3>DFS란?</h3>
        <p>
          깊이 우선 탐색(Depth-First Search)은 <strong>앞으로 계속 전진</strong>하는 탐색 방법입니다.
        </p>
        <p>
          막다른 길에 도달하면 <strong>되돌아가서(백트래킹)</strong> 다른 경로를 탐색합니다.
          스택(Stack) 자료구조 또는 재귀 호출로 구현합니다.
        </p>
      </div>

      {/* DFS 시뮬레이터 */}
      <div className="content-card">
        <h3>강 건너기 DFS 시뮬레이터</h3>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
          강 건너기 문제를 DFS로 탐색하는 과정을 단계별로 확인하세요.
          트리에서 <span style={{ color: '#f44336', fontWeight: 'bold' }}>빨간색</span>은 백트래킹,
          <span style={{ color: '#b71c1c', fontWeight: 'bold' }}> 진한 빨간색</span>은 막다른 상태입니다.
        </p>

        {/* DFS 특성 강조 배너 */}
        <div style={{
          background: 'linear-gradient(135deg, #e3f2fd, #f3e5f5)',
          border: '1px solid #90caf9',
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          color: '#1a237e',
          fontWeight: 500,
        }}>
          🔍 <strong>DFS 특성:</strong> 한 방향으로 끝까지 탐색합니다 → 막히면 백트래킹
          {step && (
            <span style={{ marginLeft: '1.5rem', color: '#6a1b9a' }}>
              현재 깊이: <strong>{step.depth}</strong>
            </span>
          )}
        </div>

        {steps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>계산 중...</div>
        ) : (
          <>
            {/* 상단: 전체 탐색 트리 (항상 전체 표시) */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: '#667eea', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                전체 탐색 트리 (회색=미방문, 강조 테두리=현재 노드)
              </div>
              <TreeVisualizer
                nodes={step.allNodes}
                allNodes={allNodes}
                currentNodeId={step.nodeId}
                mode="dfs"
                width={700}
                height={340}
              />
            </div>

            {/* 하단: StatePanel + 설명 */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 38%', minWidth: 220 }}>
                <div style={{ fontWeight: 700, color: '#667eea', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  현재 상태 (깊이 {step.depth})
                </div>
                <StatePanel state={step.state} />
              </div>
              <div style={{
                flex: '1 1 55%',
                padding: '0.6rem 0.9rem',
                background: '#f5f5f5',
                borderRadius: 8,
                fontSize: '0.85rem',
                color: '#444',
                alignSelf: 'flex-start',
              }}>
                <div><strong>노드 상태:</strong> {step.status}</div>
                <div><strong>깊이:</strong> {step.depth}</div>
                <div><strong>탐색된 노드:</strong> {step.allNodes.length}개 / 전체 {allNodes.length}개</div>
                <div style={{ marginTop: '0.5rem', color: '#667eea', fontStyle: 'italic' }}>
                  {step.status === 'backtrack' && '↩ 백트래킹: 이전 분기점으로 돌아갑니다'}
                  {step.status === 'dead-end' && '🚫 막다른 길: 더 이상 진행 불가'}
                  {step.status === 'goal' && '🎯 목표 상태 도달!'}
                  {step.status === 'visiting' && '→ 탐색 중: 한 방향으로 계속 전진'}
                  {step.status === 'visited' && '✓ 방문 완료'}
                </div>
              </div>
            </div>

            {/* 컨트롤 */}
            <div style={{ marginTop: '1.25rem' }}>
              <SimulatorControls
                onPrev={handlePrev}
                onNext={handleNext}
                onTogglePlay={handleTogglePlay}
                isPlaying={isPlaying}
                currentStep={currentStep}
                totalSteps={steps.length}
                message={step.message}
              />
            </div>
          </>
        )}
      </div>

      {/* 코드 예시 */}
      <div className="content-card">
        <h3>DFS 코드 예시 (TypeScript)</h3>
        <div className="code-block">
          <code>
            <span className="keyword">function</span> <span className="function">dfs</span>(node: Node, visited: Set&lt;string&gt;) {'{\n'}
            {'  '}<span className="comment">// 현재 노드 방문 처리</span>{'\n'}
            {'  '}visited.add(node.id){'\n'}
            {'  '}console.log(<span className="string">`방문: ${'{'}node.id{'}'}`</span>){'\n'}
            {'\n'}
            {'  '}<span className="keyword">if</span> (isGoal(node)) <span className="keyword">return true</span>{'\n'}
            {'\n'}
            {'  '}<span className="comment">// 자식 노드들을 깊이 우선으로 탐색</span>{'\n'}
            {'  '}<span className="keyword">for</span> (<span className="keyword">const</span> child <span className="keyword">of</span> node.children) {'{\n'}
            {'    '}<span className="keyword">if</span> (!visited.has(child.id)) {'{\n'}
            {'      '}<span className="keyword">if</span> (dfs(child, visited)) <span className="keyword">return true</span>{'\n'}
            {'    }'}{'\n'}
            {'  }'}{'\n'}
            {'  '}<span className="comment">// 막다른 길 → 백트래킹</span>{'\n'}
            {'  '}<span className="keyword">return false</span>{'\n'}
            {'}'}
          </code>
        </div>
      </div>

      <div className="content-card">
        <h3>DFS의 특징</h3>
        <ul className="feature-list">
          <li>
            <strong>탐색 방식</strong>
            <p>스택(Stack) 또는 재귀 호출로 구현하며, 한 방향으로 끝까지 탐색합니다</p>
          </li>
          <li>
            <strong>장점</strong>
            <p>메모리 사용량이 적고 구현이 간단합니다</p>
          </li>
          <li>
            <strong>단점</strong>
            <p>최단 경로를 보장하지 않으며, 무한 루프에 빠질 수 있습니다</p>
          </li>
          <li>
            <strong>백트래킹</strong>
            <p>막다른 상태에서 이전 상태로 돌아가 다른 경로를 탐색합니다</p>
          </li>
        </ul>
      </div>

      <button className="complete-btn" onClick={onComplete}>
        다음 단계로
      </button>
    </div>
  )
}
