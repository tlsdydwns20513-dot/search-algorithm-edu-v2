import { CityId, City, CityEdge } from '../types/index'

export const CITIES: City[] = [
  { id: 'busan',     name: '부산',   x: 78, y: 88, heuristic: 1100 },
  { id: 'daegu',     name: '대구',   x: 70, y: 78, heuristic: 950  },
  { id: 'daejeon',   name: '대전',   x: 52, y: 65, heuristic: 750  },
  { id: 'seoul',     name: '서울',   x: 45, y: 50, heuristic: 500  },
  { id: 'wonsan',    name: '원산',   x: 72, y: 38, heuristic: 380  },
  { id: 'pyongyang', name: '평양',   x: 40, y: 28, heuristic: 200  },
  { id: 'hamheung',  name: '함흥',   x: 68, y: 22, heuristic: 280  },
  { id: 'sinuiju',   name: '신의주', x: 22, y: 15, heuristic: 0    },
]

export const EDGES: CityEdge[] = [
  { from: 'busan',     to: 'daegu',     distance: 120 },
  { from: 'daegu',     to: 'daejeon',   distance: 160 },
  { from: 'daejeon',   to: 'seoul',     distance: 140 },
  { from: 'seoul',     to: 'pyongyang', distance: 195 },
  { from: 'pyongyang', to: 'sinuiju',   distance: 210 },
  { from: 'seoul',     to: 'wonsan',    distance: 220 },
  { from: 'wonsan',    to: 'hamheung',  distance: 110 },
  { from: 'hamheung',  to: 'sinuiju',   distance: 300 },
  { from: 'pyongyang', to: 'wonsan',    distance: 180 },
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
 * openList가 비어있으면 null 반환
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
 * 즉, 해당 도시가 openList에서 heuristic이 가장 낮은 도시인지 확인
 */
export function isCorrectChoice(cityId: CityId, openList: CityId[]): boolean {
  const best = getBestNextNode(openList)
  return best === cityId
}
