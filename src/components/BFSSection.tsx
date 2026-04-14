import { useState, useEffect, useRef } from 'react'
import './Section.css'
import { computeBFSSteps } from '../algorithms/riverCrossing'
import { SearchStep, RiverCrossingState } from '../types/index'
import StatePanel from './shared/StatePanel'
import TreeVisualizer from './shared/TreeVisualizer'
import SimulatorControls from './shared/SimulatorControls'

interface BFSSectionProps {
  onComplete: () => void
}

const ENTITY_EMOJI: Record<string, string> = {
  farmer: '🧑‍🌾',
  fox: '🦊',
  chicken: '🐔',
  grain: '🌾',
}

function QueuePreview({ states }: { states: RiverCrossingState[] }) {
  if (states.length === 0) {
    return (
      <div style={{ color: '#aaa', fontSize: '0.85rem', padding: '0.5rem' }}>
        큐가 비어있습니다
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {states.slice(0, 6).map((s, i) => {
        const leftEmojis = s.leftBank.map(e => ENTITY_EMOJI[e] ?? e).join('')
        const rightEmojis = s.rightBank.map(e => ENTITY_EMOJI[e] ?? e).join('')
        const boat = s.farmerSide === 'left' ? '🚣←' : '→🚣'
        return (
          <div
            key={i}
            style={{
              background: '#e3f2fd',
              border: '1px solid #90caf9',
              borderRadius: 8,
              padding: '0.35rem 0.6rem',
              fontSize: '0.8rem',
              color: '#1565c0',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
            }}
          >
            [{leftEmojis || '∅'}] {boat} [{rightEmojis || '∅'}]
          </div>
        )
      })}
      {states.length > 6 && (
        <div style={{ color: '#888', fontSize: '0.8rem', alignSelf: 'center' }}>
          +{states.length - 6}개 더...
        </div>
      )}
    </div>
  )
}

export default function BFSSection({ onComplete }: BFSSectionProps) {
  const [steps, setSteps] = useState<SearchStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const computed = computeBFSSteps()
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
  const isGoalReached = step?.status === 'goal'
  // 전체 트리: 마지막 단계의 allNodes
  const allNodes = steps.length > 0 ? steps[steps.length - 1].allNodes : []

  return (
    <div className="section">
      <h2 className="section-title">너비 우선 탐색 (BFS)</h2>

      <div className="content-card">
        <h3>BFS란?</h3>
        <p>
          너비 우선 탐색(Breadth-First Search)은 <strong>동일한 깊이의 모든 노드</strong>를
          먼저 탐색한 후 다음 레벨로 이동하는 방법입니다.
        </p>
        <p>
          큐(Queue) 자료구조를 사용하며, 레벨별로 탐색하기 때문에 <strong>최단 경로</strong>를 보장합니다.
        </p>
      </div>

      {/* BFS 시뮬레이터 */}
      <div className="content-card">
        <h3>강 건너기 BFS 시뮬레이터</h3>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
          강 건너기 문제를 BFS로 탐색하는 과정을 단계별로 확인하세요.
          BFS는 최단 이동 횟수로 목표에 도달하는 경로를 찾습니다.
        </p>

        {/* BFS 특성 강조 배너 */}
        <div style={{
          background: 'linear-gradient(135deg, #e8f5e9, #e3f2fd)',
          border: '1px solid #a5d6a7',
          borderRadius: 8,
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          color: '#1b5e20',
          fontWeight: 500,
        }}>
          🌊 <strong>BFS 특성:</strong> 같은 깊이(레벨)의 노드를 모두 탐색 후 다음 레벨로 이동합니다
          {step && (
            <span style={{ marginLeft: '1.5rem', color: '#1565c0' }}>
              현재 레벨(깊이): <strong>{step.depth}</strong>
            </span>
          )}
        </div>

        {isGoalReached && (
          <div style={{
            background: 'linear-gradient(135deg, #fff9c4, #fff176)',
            border: '2px solid #ffd54f',
            borderRadius: 10,
            padding: '0.9rem 1.2rem',
            marginBottom: '1rem',
            color: '#f57f17',
            fontWeight: 700,
            fontSize: '1rem',
            textAlign: 'center',
          }}>
            🎉 탐색 완료! 최단 경로(깊이 {step.depth})로 목표 상태에 도달했습니다!
          </div>
        )}

        {steps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>계산 중...</div>
        ) : (
          <>
            {/* 상단: 전체 탐색 트리 (항상 전체 표시, 레벨별 가로 배치) */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: '#667eea', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                전체 탐색 트리 — 레벨별 가로 배치 (회색=미방문, 강조 테두리=현재 노드)
              </div>
              <TreeVisualizer
                nodes={step.allNodes}
                allNodes={allNodes}
                currentNodeId={step.nodeId}
                mode="bfs"
                width={1200}
                height={500}
              />
            </div>

            {/* 하단: StatePanel + 큐 */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 38%', minWidth: 220 }}>
                <div style={{ fontWeight: 700, color: '#667eea', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  현재 상태 (깊이 {step.depth})
                </div>
                <StatePanel state={step.state} />
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.6rem 0.9rem',
                  background: '#f5f5f5',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  color: '#444',
                }}>
                  <div><strong>노드 상태:</strong> {step.status}</div>
                  <div><strong>깊이:</strong> {step.depth}</div>
                  <div><strong>탐색된 노드:</strong> {step.allNodes.length}개 / 전체 {allNodes.length}개</div>
                </div>
              </div>

              {/* 큐 대기 목록 */}
              <div style={{ flex: '1 1 55%', minWidth: 220 }}>
                <div style={{
                  padding: '0.75rem',
                  background: '#e3f2fd',
                  borderRadius: 8,
                  border: '1px solid #90caf9',
                }}>
                  <div style={{ fontWeight: 700, color: '#1565c0', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    📋 큐 대기 목록 ({step.queue?.length ?? 0}개)
                  </div>
                  <QueuePreview states={step.queue ?? []} />
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
        <h3>BFS 코드 예시 (TypeScript)</h3>
        <div className="code-block">
          <code>
            <span className="keyword">function</span> <span className="function">bfs</span>(start: Node, goal: string) {'{\n'}
            {'  '}<span className="keyword">const</span> queue: Node[] = [start]{'\n'}
            {'  '}<span className="keyword">const</span> visited = <span className="keyword">new</span> Set&lt;string&gt;(){'\n'}
            {'  '}visited.add(start.id){'\n'}
            {'\n'}
            {'  '}<span className="keyword">while</span> (queue.length &gt; 0) {'{\n'}
            {'    '}<span className="keyword">const</span> current = queue.<span className="function">shift</span>()!{'\n'}
            {'    '}<span className="keyword">if</span> (current.id === goal) <span className="keyword">return true</span>{'\n'}
            {'\n'}
            {'    '}<span className="comment">// 같은 레벨의 모든 자식을 큐에 추가</span>{'\n'}
            {'    '}<span className="keyword">for</span> (<span className="keyword">const</span> child <span className="keyword">of</span> current.children) {'{\n'}
            {'      '}<span className="keyword">if</span> (!visited.has(child.id)) {'{\n'}
            {'        '}visited.add(child.id){'\n'}
            {'        '}queue.push(child){'\n'}
            {'      }'}{'\n'}
            {'    }'}{'\n'}
            {'  }'}{'\n'}
            {'  '}<span className="keyword">return false</span>{'\n'}
            {'}'}
          </code>
        </div>
      </div>

      <div className="content-card">
        <h3>DFS vs BFS 비교</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>특징</th>
              <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>DFS</th>
              <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>BFS</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['탐색 방식', '깊이 우선', '너비 우선'],
              ['자료구조', '스택 (재귀)', '큐'],
              ['최단 경로', '보장 안 함', '보장함'],
              ['메모리', '적음', '많음'],
            ].map(([feat, dfs, bfs]) => (
              <tr key={feat}>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{feat}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{dfs}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{bfs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="complete-btn" onClick={onComplete}>
        다음 단계로
      </button>
    </div>
  )
}
