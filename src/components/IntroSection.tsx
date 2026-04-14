import './Section.css'

interface IntroSectionProps {
  onComplete: () => void;
}

export default function IntroSection({ onComplete }: IntroSectionProps) {
  return (
    <div className="section">
      <h2 className="section-title">탐색 알고리즘 교육 프로그램</h2>
      
      <div className="content-card">
        <h3>프로그램 소개</h3>
        <p>
          이 프로그램은 인공지능의 핵심 개념인 <strong>탐색 알고리즘</strong>을 
          인터랙티브하게 학습할 수 있도록 설계되었습니다.
        </p>
      </div>

      <div className="content-card">
        <h3>학습 내용</h3>
        <ul className="feature-list">
          <li>
            <strong>탐색 공간 표현</strong>
            <p>그래프와 트리 구조로 AI 문제를 표현하는 방법</p>
          </li>
          <li>
            <strong>맹목적 탐색</strong>
            <p>깊이 우선 탐색(DFS)과 너비 우선 탐색(BFS)</p>
          </li>
          <li>
            <strong>정보 이용 탐색</strong>
            <p>언덕 등반, 최상 우선 탐색, A* 알고리즘</p>
          </li>
          <li>
            <strong>실전 문제</strong>
            <p>강 건너기 문제를 통한 실습</p>
          </li>
        </ul>
      </div>

      <div className="content-card">
        <h3>학습 방법</h3>
        <p>
          왼쪽 메뉴에서 각 주제를 선택하여 순서대로 학습하세요. 
          각 섹션에서는 이론 설명, 시각화, 그리고 라이브 코딩 예제를 제공합니다.
        </p>
      </div>

      <button className="complete-btn" onClick={onComplete}>
        학습 시작하기
      </button>
    </div>
  )
}
