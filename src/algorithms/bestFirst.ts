import { CityId, City, CityEdge } from '../types/index'

export const CITIES: City[] = [
  { id: 'busan',     name: '부산',   x: 82, y: 85, heuristic: 1100 },
  { id: 'ulsan',     name: '울산',   x: 78, y: 78, heuristic: 1020 },
  { id: 'pohang',    name: '포항',   x: 85, y: 70, heuristic: 960  },
  { id: 'daegu',     name: '대구',   x: 70, y: 72, heuristic: 900  },
  { id: 'gwangju',   name: '광주',   x: 38, y: 78, heuristic: 820  },
  { id: 'jeonju',    name: '전주',   x: 42, y: 68, heuristic: 720  },
  { id: 'daejeon',   name: '대전',   x: 52, y: 60, heuristic: 680  },
  { id: 'incheon',   name: '인천',   x: 32, y: 48, heuristic: 520  },
  { id: 'seoul',     name: '서울',   x: 45, y: 45, heuristic: 480  },
  { id: 'chuncheon', name: '춘천',   x: 60, y: 40, heuristic: 420  },
  { id: 'pyongyang', name: '평양',   x: 40, y: 25, heuristic: 200  },
  { id: 'sinuiju',   name: '신의주', x: 22, y: 12, heuristic: 0    },
]

export const EDGES: CityEdge[] = [
  { from: 'busan',     to: 'ulsan',     distance: 70  },
  { from: 'busan',     to: 'daegu',     distance: 120 },
  { from: 'ulsan',     to: 'pohang',    distance: 60  },
  { from: 'ulsan',     to: 'daegu',     distance: 100 },
  { from: 'pohang',    to: 'daegu',     distance: 90  },
  { from: 'daegu',     to: 'daejeon',   distance: 160 },
  { from: 'gwangju',   to: 'jeonju',    distance: 80  },
  { from: 'gwangju',   to: 'daejeon',   distance: 150 },
  { from: 'jeonju',    to: 'daejeon',   distance: 100 },
  { from: 'daejeon',   to: 'seoul',     distance: 140 },
  { from: 'daejeon',   to: 'incheon',   distance: 160 },
  { from: 'incheon',   to: 'seoul',     distance: 40  },
  { from: 'seoul',     to: 'chuncheon', distance: 80  },
  { from: 'seoul',     to: 'pyongyang', distance: 195 },
  { from: 'chuncheon', to: 'pyongyang', distance: 220 },
  { from: 'pyongyang', to: 'sinuiju',   distance: 210 },
]

/**
 * 도시 ID로 City 객체 반환
 */
export function getCityById(cityId: CityId): City {
  const city = CITIES.find(c => c.id === cityId)
  if (!city) throw new Error(`City not found: ${cityId}`)
  return city
}

/**
 * 특정 도시의 인접 도시 목록 반환 (양방향 엣지 고려)
 */
export function getNeighbors(cityId: CityId): CityId[] {
  const neighbors: CityId[] = []
  for (const edge of EDGES) {
    if (edge.from === cityId) neighbors.push(edge.to)
    else if (edge.to === cityId) neighbors.push(edge.from)
  }
  return neighbors
}

/**
 * openList에서 heuristic 값이 가장 낮은 도시 반환
 */
export function getBestNextNode(openList: CityId[]): CityId | null {
  if (openList.length === 0) return null
  return openList.reduce((best, cityId) => {
    const bestCity = getCityById(best)
    const currentCity = getCityById(cityId)
    return currentCity.heuristic < bestCity.heuristic ? cityId : best
  })
}

/**
 * 선택한 도시가 openList에서 최상 우선 탐색 기준으로 올바른 선택인지 판정
 */
export function isCorrectChoice(cityId: CityId, openList: CityId[]): boolean {
  const best = getBestNextNode(openList)
  return best === cityId
}
