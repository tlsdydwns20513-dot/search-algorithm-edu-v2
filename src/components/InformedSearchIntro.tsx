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
          <svg viewBox="0 0 500 160" style={{ width: '100%', maxWidth: 500 }}>
            {/* 비정보이용 - 방사형 탐색 */}
            <text x="125" y="18" textAnchor="middle" fontSize="11" fill="#c2185b" fontWeight="bold">비정보이용 탐색</text>
            <circle cx="125" cy="50" r="12" fill="#e91e63" />
            <text x="125" y="55" textAnchor="middle" fontSize="10" fill="white">S</text>
            {[60, 90, 120, 150, 180, 210].map((angle, i) => {
              const rad = (angle * Math.PI) / 180
              const x2 = 125 + 45 * Math.cos(rad)
              const y2 = 50 + 45 * Math.sin(rad)
              return (
                <g key={i}>
                  <line x1="125" y1="50" x2={x2} y2={y2} stroke="#e91e63" strokeWidth="1.5" strokeDasharray="4,2" />
                  <circle cx={x2} cy={y2} r="8" fill="#f48fb1" />
                </g>
              )
            })}
            <circle cx="125" cy="140" r="10" fill="#880e4f" />
            <text x="125" y="145" textAnchor="middle" fontSize="9" fill="white">G</text>
            <text x="125" y="158" textAnchor="middle" fontSize="9" fill="#888">모든 방향 탐색</text>

            {/* 화살표 구분선 */}
            <line x1="250" y1="20" x2="250" y2="150" stroke="#ccc" strokeWidth="1" strokeDasharray="4,4" />

            {/* 정보이용 - 목표 방향 탐색 */}
            <text x="375" y="18" textAnchor="middle" fontSize="11" fill="#2e7d32" fontWeight="bold">정보이용 탐색</text>
            <circle cx="375" cy="50" r="12" fill="#4caf50" />
            <text x="375" y="55" textAnchor="middle" fontSize="10" fill="white">S</text>
            <line x1="375" y1="62" x2="375" y2="118" stroke="#4caf50" strokeWidth="2.5" markerEnd="url(#arrow)" />
            <circle cx="375" cy="130" r="10" fill="#1b5e20" />
            <text x="375" y="135" textAnchor="middle" fontSize="9" fill="white">G</text>
            <text x="375" y="158" textAnchor="middle" fontSize="9" fill="#888">목표 방향 우선</text>
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
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
