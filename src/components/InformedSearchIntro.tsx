import { useState } from 'react'
import './Section.css'
import EvaluationFunctionViz from './shared/EvaluationFunctionViz'

interface InformedSearchIntroProps {
  onComplete: () => void
}

export default function InformedSearchIntro({ onComplete }: InformedSearchIntroProps) {
  const [videoError, setVideoError] = useState(false)

  return (
    <div className="section">
      <h2 className="section-title">정보 이용 탐색 (휴리스틱 탐색)</h2>

      {/* 비정보이용 vs 정보이용 비교 */}
      <div className="content-card">
        <h3>비정보이용 탐색 vs 정보이용 탐색</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ background: '#fce4ec', borderRadius: 8, padding: '1rem', borderLeft: '4px solid #e91e63' }}>
            <div style={{ fontWeight: 'bold', color: '#c2185b', marginBottom: '0.5rem' }}>🔍 비정보이용 탐색 (맹목적 탐색)</div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#555', lineHeight: 1.7 }}>
              <li>목표까지의 거리 정보 없음</li>
              <li>모든 경로를 동등하게 탐색</li>
              <li>BFS, DFS 등</li>
              <li>완전성 보장, 비효율적</li>
            </ul>
          </div>
          <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '1rem', borderLeft: '4px solid #4caf50' }}>
            <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '0.5rem' }}>🧭 정보이용 탐색 (휴리스틱 탐색)</div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#555', lineHeight: 1.7 }}>
              <li>목표까지의 추정 거리 활용</li>
              <li>유망한 경로 우선 탐색</li>
              <li>언덕 등반, A* 등</li>
              <li>효율적, 최적 보장 안 될 수 있음</li>
            </ul>
          </div>
        </div>

        {/* 다이어그램 */}
        <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '1.5rem', textAlign: 'center' }}>
          <svg viewBox="0 0 700 260" style={{ width: '100%', maxWidth: 700 }}>
            {/* 비정보이용 - 레벨별 모든 노드 탐색 트리 */}
            <text x="175" y="18" textAnchor="middle" fontSize="13" fill="#c2185b" fontWeight="bold">비정보이용 탐색</text>
            {/* 루트 */}
            <circle cx="175" cy="50" r="14" fill="#e91e63" />
            <text x="175" y="55" textAnchor="middle" fontSize="11" fill="white">S</text>
            {/* 레벨 1: 4개 노드 */}
            {[100, 145, 205, 250].map((x, i) => (
              <g key={i}>
                <line x1="175" y1="64" x2={x} y2="106" stroke="#e91e63" strokeWidth="1.5" strokeDasharray="4,2" />
                <circle cx={x} cy="118" r="11" fill="#f48fb1" />
                <text x={x} y="122" textAnchor="middle" fontSize="9" fill="white">{i + 1}</text>
              </g>
            ))}
            {/* 레벨 2: 일부 노드 */}
            {[80, 120, 160, 195, 230, 265].map((x, i) => (
              <g key={i}>
                <line x1={[100, 100, 145, 205, 250, 250][i]} y1="129" x2={x} y2="161" stroke="#e91e63" strokeWidth="1" strokeDasharray="3,2" opacity="0.7" />
                <circle cx={x} cy="170" r="9" fill="#f8bbd0" />
              </g>
            ))}
            <circle cx="175" cy="230" r="12" fill="#880e4f" />
            <text x="175" y="235" textAnchor="middle" fontSize="10" fill="white">G</text>
            <text x="175" y="252" textAnchor="middle" fontSize="10" fill="#888">레벨별 모든 노드 탐색</text>

            {/* 구분선 */}
            <line x1="350" y1="20" x2="350" y2="245" stroke="#ccc" strokeWidth="1" strokeDasharray="4,4" />

            {/* 정보이용 - 목표 방향 집중 트리 */}
            <text x="525" y="18" textAnchor="middle" fontSize="13" fill="#2e7d32" fontWeight="bold">정보이용 탐색</text>
            {/* 루트 */}
            <circle cx="525" cy="50" r="14" fill="#4caf50" />
            <text x="525" y="55" textAnchor="middle" fontSize="11" fill="white">S</text>
            {/* h값 낮은 방향 우선 - 좁게 집중 */}
            <line x1="525" y1="64" x2="490" y2="106" stroke="#4caf50" strokeWidth="2" />
            <circle cx="490" cy="118" r="11" fill="#81c784" />
            <text x="490" y="122" textAnchor="middle" fontSize="9" fill="white">h=2</text>
            {/* 비선택 노드 (흐리게) */}
            <line x1="525" y1="64" x2="560" y2="106" stroke="#a5d6a7" strokeWidth="1" strokeDasharray="3,2" opacity="0.5" />
            <circle cx="560" cy="118" r="11" fill="#c8e6c9" opacity="0.6" />
            <text x="560" y="122" textAnchor="middle" fontSize="9" fill="#888">h=8</text>
            {/* 다음 레벨 */}
            <line x1="490" y1="129" x2="490" y2="161" stroke="#4caf50" strokeWidth="2" />
            <circle cx="490" cy="170" r="11" fill="#388e3c" />
            <text x="490" y="174" textAnchor="middle" fontSize="9" fill="white">h=1</text>
            {/* 목표 */}
            <line x1="490" y1="181" x2="525" y2="213" stroke="#4caf50" strokeWidth="2.5" markerEnd="url(#arrow2)" />
            <circle cx="525" cy="225" r="12" fill="#1b5e20" />
            <text x="525" y="230" textAnchor="middle" fontSize="10" fill="white">G</text>
            <text x="525" y="252" textAnchor="middle" fontSize="10" fill="#888">h(n) 낮은 방향 우선</text>
            <defs>
              <marker id="arrow2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#4caf50" />
              </marker>
            </defs>
          </svg>
        </div>
      </div>

      {/* 수식 정의 섹션 */}
      <div className="content-card">
        <h3>평가 함수 수식 정의</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#e3f2fd', borderRadius: 8, padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1565c0', minWidth: 60, textAlign: 'center' }}>f(n)</div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: '0.3rem' }}>총 평가 함수 (Evaluation Function)</div>
              <div style={{ color: '#555', fontSize: '0.95rem' }}>
                노드 n의 전체 비용 추정값. A* 알고리즘에서 <code style={{ background: '#ddd', padding: '0 4px', borderRadius: 3 }}>f(n) = g(n) + h(n)</code>
              </div>
            </div>
          </div>
          <div style={{ background: '#fff3e0', borderRadius: 8, padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#e65100', minWidth: 60, textAlign: 'center' }}>g(n)</div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#e65100', marginBottom: '0.3rem' }}>실제 비용 (Actual Cost)</div>
              <div style={{ color: '#555', fontSize: '0.95rem' }}>
                시작 노드에서 현재 노드 n까지 이동하는 데 실제로 든 비용 (이미 알고 있는 값)
              </div>
            </div>
          </div>
          <div style={{ background: '#f3e5f5', borderRadius: 8, padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#6a1b9a', minWidth: 60, textAlign: 'center' }}>h(n)</div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#6a1b9a', marginBottom: '0.3rem' }}>휴리스틱 함수 (Heuristic Function)</div>
              <div style={{ color: '#555', fontSize: '0.95rem' }}>
                현재 노드 n에서 목표 노드까지의 <strong>추정</strong> 비용. 경험이나 도메인 지식으로 계산 (예: 직선 거리)
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: '1rem', background: '#fffde7', borderRadius: 8, padding: '1rem', border: '1px solid #f9a825' }}>
          <strong>⚠️ 주의:</strong> 정보이용 탐색은 <strong>최적의 정답을 보장하지 않습니다</strong>.
          h(n)은 추정값이므로 실제 비용과 다를 수 있습니다.
        </div>
      </div>

      {/* EvaluationFunctionViz 통합 */}
      <div className="content-card">
        <h3>h(n) 값 조정 시뮬레이터</h3>
        <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '1rem', marginBottom: '1rem', borderLeft: '4px solid #4caf50' }}>
          <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '0.5rem' }}>💡 이 시뮬레이터는 무엇인가요?</div>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#555', lineHeight: 1.8 }}>
            <li>각 노드(A~E)는 탐색해야 할 <strong>상태</strong>를 나타냅니다.</li>
            <li><strong>h(n)</strong>은 목표까지의 예상 거리입니다. 값이 낮을수록 목표에 가깝다고 판단합니다.</li>
            <li>슬라이더로 h(n) 값을 바꾸면 탐색 순서(우선순위)가 실시간으로 바뀝니다.</li>
            <li style={{ color: '#1b5e20', fontWeight: 'bold' }}>→ 정보이용 탐색은 h(n)이 낮은 노드를 먼저 탐색합니다!</li>
          </ul>
        </div>
        <p>슬라이더를 움직여 각 노드의 휴리스틱 값을 조정하고, 탐색 우선순위가 어떻게 바뀌는지 확인하세요.</p>
        <EvaluationFunctionViz />
      </div>

      {/* 실생활 예시 */}
      <div className="content-card">
        <h3>실생활 예시: 내비게이션</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '1rem' }}>
            <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '0.5rem' }}>🗺️ g(n) — 실제 이동 거리</div>
            <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>
              현재까지 실제로 이동한 거리 (km). GPS가 정확히 측정한 값.
            </p>
          </div>
          <div style={{ background: '#f3e5f5', borderRadius: 8, padding: '1rem' }}>
            <div style={{ fontWeight: 'bold', color: '#6a1b9a', marginBottom: '0.5rem' }}>📍 h(n) — 직선 거리 추정</div>
            <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>
              목적지까지의 직선 거리. 실제 도로 거리보다 항상 짧거나 같음 (낙관적 추정).
            </p>
          </div>
          <div style={{ background: '#e3f2fd', borderRadius: 8, padding: '1rem', gridColumn: '1 / -1' }}>
            <div style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: '0.5rem' }}>🚗 f(n) = g(n) + h(n) — 총 예상 비용</div>
            <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>
              내비게이션은 여러 경로 중 f(n)이 가장 작은 경로를 우선 탐색합니다.
              이미 지나온 거리(g)와 앞으로 남은 추정 거리(h)를 합산하여 최적 경로를 찾습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 유튜브 영상 */}
      <div className="content-card">
        <h3>휴리스틱 탐색 강의 영상</h3>
        {videoError ? (
          <div style={{
            background: '#f5f5f5', borderRadius: 8, padding: '2rem',
            textAlign: 'center', color: '#888', border: '2px dashed #ccc'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📹</div>
            <div>영상을 불러올 수 없습니다.</div>
            <a
              href="https://www.youtube.com/watch?v=dRMvK76xQJI"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#667eea', marginTop: '0.5rem', display: 'inline-block' }}
            >
              YouTube에서 보기 →
            </a>
          </div>
        ) : (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8 }}>
            <iframe
              src="https://www.youtube.com/embed/dRMvK76xQJI"
              title="휴리스틱 탐색 설명 영상"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onError={() => setVideoError(true)}
            />
          </div>
        )}
      </div>

      {/* 정보이용 탐색 종류 */}
      <div className="content-card">
        <h3>정보이용 탐색의 종류</h3>
        <ul className="feature-list">
          <li>
            <strong>언덕 등반 탐색 (Hill Climbing)</strong>
            <p>현재 위치에서 h(n)이 가장 낮은 이웃을 선택하는 그리디 방법. Open List 없음.</p>
          </li>
          <li>
            <strong>최상 우선 탐색 (Best-First Search)</strong>
            <p>Open/Closed 리스트를 사용하여 h(n) 기준으로 체계적으로 탐색.</p>
          </li>
          <li>
            <strong>A* 알고리즘</strong>
            <p>f(n) = g(n) + h(n)을 사용하여 실제 비용과 휴리스틱을 결합한 최적 탐색.</p>
          </li>
        </ul>
      </div>

      <button className="complete-btn" onClick={onComplete}>
        다음 단계로
      </button>
    </div>
  )
}
