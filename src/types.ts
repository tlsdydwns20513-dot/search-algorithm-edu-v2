export interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  visited?: boolean;
  current?: boolean;
  inPath?: boolean;
  heuristic?: number;
  cost?: number;
}

export interface Edge {
  from: string;
  to: string;
}

export interface RiverState {
  left: string[];
  right: string[];
  boatOnLeft: boolean;
}

export type AlgorithmType = 
  | 'intro'
  | 'search-space'
  | 'river-crossing'
  | 'dfs'
  | 'bfs'
  | 'informed-intro'
  | 'hill-climbing'
  | 'best-first'
  | 'astar';

export interface AlgorithmStep {
  nodes: Node[];
  currentNode?: string;
  openList?: string[];
  closedList?: string[];
  message: string;
}
