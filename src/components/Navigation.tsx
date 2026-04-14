import { AlgorithmType } from '../types/index'
import './Navigation.css'

interface NavigationProps {
  currentSection: AlgorithmType;
  onSectionChange: (section: AlgorithmType) => void;
  completedSections: Set<AlgorithmType>;
}

const sections: { id: AlgorithmType; label: string }[] = [
  { id: 'intro', label: '소개' },
  { id: 'search-space', label: '탐색 공간' },
  { id: 'river-crossing', label: '강 건너기 문제' },
  { id: 'dfs', label: '깊이 우선 탐색' },
  { id: 'bfs', label: '너비 우선 탐색' },
  { id: 'informed-intro', label: '정보 이용 탐색' },
  { id: 'hill-climbing', label: '언덕 등반 탐색' },
  { id: 'best-first', label: '최상 우선 탐색' },
  { id: 'astar', label: 'A* 알고리즘' },
  { id: 'minimax', label: '미니맥스 알고리즘' },
]

export default function Navigation({ currentSection, onSectionChange, completedSections }: NavigationProps) {
  return (
    <nav className="navigation">
      <h1 className="nav-title">탐색 알고리즘</h1>
      <ul className="nav-list">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              className={`nav-item ${currentSection === section.id ? 'active' : ''} ${
                completedSections.has(section.id) ? 'completed' : ''
              }`}
              onClick={() => onSectionChange(section.id)}
            >
              {completedSections.has(section.id) && <span className="check">✓</span>}
              {section.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
