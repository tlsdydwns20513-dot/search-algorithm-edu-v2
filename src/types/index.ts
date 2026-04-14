// 기존 타입들 (types.ts에서 re-export)
export type { Node, Edge, RiverState as OldRiverState, AlgorithmType as OldAlgorithmType, AlgorithmStep } from '../types'

// 새 AlgorithmType (minimax 추가)
export type AlgorithmType =
  | 'intro' | 'search-space' | 'river-crossing'
  | 'dfs' | 'bfs' | 'informed-intro'
  | 'hill-climbing' | 'best-first' | 'astar' | 'minimax'

export type Entity = 'farmer' | 'fox' | 'chicken' | 'grain'
export type Side = 'left' | 'right'

export interface RiverCrossingState {
  leftBank: Entity[]
  rightBank: Entity[]
  farmerSide: Side
}

export type NodeStatus = 'unvisited' | 'visiting' | 'visited' | 'backtrack' | 'dead-end' | 'goal'

export interface SearchTreeNode {
  id: string
  state: RiverCrossingState
  parentId: string | null
  children: string[]
  status: NodeStatus
  depth: number
  action: string  // 어떤 이동으로 이 상태에 도달했는지
}

export interface SearchStep {
  stepIndex: number
  state: RiverCrossingState
  nodeId: string
  parentNodeId: string | null
  status: NodeStatus
  depth: number
  allNodes: SearchTreeNode[]  // 현재까지 생성된 모든 트리 노드
  queue?: RiverCrossingState[]  // BFS용 큐 상태
  message: string
}

// 8-퍼즐
export type PuzzleBoard = number[]  // 길이 9, 0=빈칸
export const GOAL_STATE: PuzzleBoard = [1, 2, 3, 4, 5, 6, 7, 8, 0]

// 한반도 도시
export type CityId = 'busan' | 'daegu' | 'daejeon' | 'seoul' | 'pyongyang' | 'sinuiju' | 'wonsan' | 'hamheung'

export interface City {
  id: CityId
  name: string
  x: number  // SVG 좌표 (0~100 비율)
  y: number
  heuristic: number  // 신의주까지 직선 거리 (km)
}

export interface CityEdge {
  from: CityId
  to: CityId
  distance: number
}

// 고누 게임
export type CellState = 'empty' | 'player' | 'ai'
export type GonuBoard = CellState[][]  // 4×4

export interface Position {
  row: number
  col: number
}

export interface GonuMove {
  from: Position
  to: Position
  player: 'player' | 'ai'
  captures?: Position  // 잡은 상대 말 위치
}

export interface GameTreeNode {
  board: GonuBoard
  move: GonuMove | null
  score: number
  isMax: boolean
  children: GameTreeNode[]
  depth: number
}
