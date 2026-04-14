import { GonuBoard, GonuMove, Position, GameTreeNode, CellState } from '../types/index'

// ─── 고누 판 종류 정의 ────────────────────────────────────────────────────────

export type GonuVariant = 'jul' | 'sabang' | 'umul' | 'hobak' | 'neomgi'

export interface GonuBoardDef {
  variant: GonuVariant
  name: string
  description: string
  rows: number
  cols: number
  board: GonuBoard
  // [r1,c1,r2,c2] 형태의 연결 목록 (양방향)
  connections: [number, number, number, number][]
}

/** 두 위치가 연결되어 있는지 확인 */
function isConnected(
  r1: number, c1: number,
  r2: number, c2: number,
  connections: [number, number, number, number][]
): boolean {
  return connections.some(
    ([a, b, c, d]) =>
      (a === r1 && b === c1 && c === r2 && d === c2) ||
      (a === r2 && b === c2 && c === r1 && d === c1)
  )
}

// ─── 5가지 고누 판 정의 ───────────────────────────────────────────────────────

export const GONU_VARIANTS: GonuBoardDef[] = [
  {
    variant: 'jul',
    name: '줄고누',
    description: '3×3 격자. 상대를 이동 불가로 만들면 승리!',
    rows: 3, cols: 3,
    board: [
      ['ai',     'ai',     'ai'    ],
      ['empty',  'empty',  'empty' ],
      ['player', 'player', 'player'],
    ],
    connections: [
      // 가로
      [0,0,0,1],[0,1,0,2],
      [1,0,1,1],[1,1,1,2],
      [2,0,2,1],[2,1,2,2],
      // 세로
      [0,0,1,0],[1,0,2,0],
      [0,1,1,1],[1,1,2,1],
      [0,2,1,2],[1,2,2,2],
      // 대각선
      [0,0,1,1],[1,1,2,2],
      [0,2,1,1],[1,1,2,0],
    ],
  },
  {
    variant: 'sabang',
    name: '사방고누',
    description: '모든 방향 대각선이 연결된 3×3 고누. 중앙이 핵심!',
    rows: 3, cols: 3,
    board: [
      ['ai',     'empty',  'ai'    ],
      ['empty',  'ai',     'empty' ],
      ['player', 'empty',  'player'],
    ],
    connections: [
      // 가로
      [0,0,0,1],[0,1,0,2],
      [1,0,1,1],[1,1,1,2],
      [2,0,2,1],[2,1,2,2],
      // 세로
      [0,0,1,0],[1,0,2,0],
      [0,1,1,1],[1,1,2,1],
      [0,2,1,2],[1,2,2,2],
      // 모든 대각선 (사방 = 4방향 대각선 전부)
      [0,0,1,1],[1,1,2,2],
      [0,2,1,1],[1,1,2,0],
      [0,0,1,1],[0,1,1,0],
      [0,1,1,2],[0,2,1,1],
      [1,0,2,1],[1,2,2,1],
    ],
  },
  {
    variant: 'umul',
    name: '우물고누',
    description: '중앙이 "우물"인 3×3 고누. 우물을 차지하면 유리!',
    rows: 3, cols: 3,
    board: [
      ['ai',     'empty',  'ai'    ],
      ['empty',  'empty',  'empty' ],
      ['player', 'empty',  'player'],
    ],
    connections: [
      // 가로
      [0,0,0,1],[0,1,0,2],
      [1,0,1,1],[1,1,1,2],
      [2,0,2,1],[2,1,2,2],
      // 세로
      [0,0,1,0],[1,0,2,0],
      [0,1,1,1],[1,1,2,1],
      [0,2,1,2],[1,2,2,2],
      // 대각선 (중앙 연결만)
      [0,0,1,1],[1,1,2,2],
      [0,2,1,1],[1,1,2,0],
    ],
  },
  {
    variant: 'hobak',
    name: '호박고누',
    description: '원형 테두리가 있는 3×3 고누. 모서리 연결이 특징!',
    rows: 3, cols: 3,
    board: [
      ['ai',     'ai',     'ai'    ],
      ['empty',  'empty',  'empty' ],
      ['player', 'player', 'player'],
    ],
    connections: [
      // 가로
      [0,0,0,1],[0,1,0,2],
      [1,0,1,1],[1,1,1,2],
      [2,0,2,1],[2,1,2,2],
      // 세로
      [0,0,1,0],[1,0,2,0],
      [0,1,1,1],[1,1,2,1],
      [0,2,1,2],[1,2,2,2],
      // 대각선
      [0,0,1,1],[1,1,2,2],
      [0,2,1,1],[1,1,2,0],
      // 호박 특유: 모서리끼리 원형 연결
      [0,0,0,2],[0,2,2,2],[2,2,2,0],[2,0,0,0],
    ],
  },
  {
    variant: 'neomgi',
    name: '넘기고누',
    description: '2×3 직사각형 판. 대각선 없이 상하좌우만 이동!',
    rows: 2, cols: 3,
    board: [
      ['ai',     'ai',     'ai'    ],
      ['player', 'player', 'player'],
    ],
    connections: [
      // 가로
      [0,0,0,1],[0,1,0,2],
      [1,0,1,1],[1,1,1,2],
      // 세로만 (대각선 없음)
      [0,0,1,0],[0,1,1,1],[0,2,1,2],
    ],
  },
]

// ─── 알고리즘 함수 ────────────────────────────────────────────────────────────

export const INITIAL_GONU_BOARD: GonuBoard = GONU_VARIANTS[0].board

export function generateRandomGonuBoard(): GonuBoard {
  return GONU_VARIANTS[Math.floor(Math.random() * GONU_VARIANTS.length)].board
}

export function evaluateBoard(board: GonuBoard, connections?: [number,number,number,number][]): number {
  const aiMoves = getValidMoves(board, 'ai', connections).length
  const playerMoves = getValidMoves(board, 'player', connections).length
  return aiMoves - playerMoves
}

function cloneBoard(board: GonuBoard): GonuBoard {
  return board.map(row => [...row])
}

function inBounds(row: number, col: number, rows: number, cols: number): boolean {
  return row >= 0 && row < rows && col >= 0 && col < cols
}

export function getValidMoves(
  board: GonuBoard,
  player: 'player' | 'ai',
  connections?: [number, number, number, number][]
): GonuMove[] {
  const moves: GonuMove[] = []
  const rows = board.length
  const cols = board[0].length

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board[row][col] !== player) continue
      const from: Position = { row, col }

      if (connections) {
        // connections 기반 이동
        for (const [r1, c1, r2, c2] of connections) {
          let nr = -1, nc = -1
          if (r1 === row && c1 === col) { nr = r2; nc = c2 }
          else if (r2 === row && c2 === col) { nr = r1; nc = c1 }
          if (nr >= 0 && inBounds(nr, nc, rows, cols) && board[nr][nc] === 'empty') {
            moves.push({ from, to: { row: nr, col: nc }, player })
          }
        }
      } else {
        // 기본 3×3 전방향
        const directions = [
          [-1,0],[1,0],[0,-1],[0,1],
          [-1,-1],[-1,1],[1,-1],[1,1],
        ]
        for (const [dr, dc] of directions) {
          const nr = row + dr, nc = col + dc
          if (inBounds(nr, nc, rows, cols) && board[nr][nc] === 'empty') {
            moves.push({ from, to: { row: nr, col: nc }, player })
          }
        }
      }
    }
  }
  return moves
}

export function applyGonuMove(board: GonuBoard, move: GonuMove): GonuBoard {
  const newBoard = cloneBoard(board)
  newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col]
  newBoard[move.from.row][move.from.col] = 'empty'
  return newBoard
}

export function isTerminal(board: GonuBoard, connections?: [number,number,number,number][]): boolean {
  return (
    getValidMoves(board, 'player', connections).length === 0 ||
    getValidMoves(board, 'ai', connections).length === 0
  )
}

export function minimax(
  board: GonuBoard,
  depth: number,
  isMaximizing: boolean,
  buildTree: boolean = false,
  connections?: [number, number, number, number][]
): { score: number; move: GonuMove | null; tree?: GameTreeNode } {
  if (depth === 0 || isTerminal(board, connections)) {
    const score = evaluateBoard(board, connections)
    const node: GameTreeNode | undefined = buildTree
      ? { board: cloneBoard(board), move: null, score, isMax: isMaximizing, children: [], depth }
      : undefined
    return { score, move: null, tree: node }
  }

  const player = isMaximizing ? 'ai' : 'player'
  const moves = getValidMoves(board, player, connections)

  if (moves.length === 0) {
    const score = evaluateBoard(board, connections)
    const node: GameTreeNode | undefined = buildTree
      ? { board: cloneBoard(board), move: null, score, isMax: isMaximizing, children: [], depth }
      : undefined
    return { score, move: null, tree: node }
  }

  let bestScore = isMaximizing ? -Infinity : Infinity
  let bestMove: GonuMove | null = null
  const children: GameTreeNode[] = []

  for (const move of moves) {
    const newBoard = applyGonuMove(board, move)
    const result = minimax(newBoard, depth - 1, !isMaximizing, buildTree, connections)

    if (isMaximizing ? result.score > bestScore : result.score < bestScore) {
      bestScore = result.score
      bestMove = move
    }

    if (buildTree && result.tree) {
      children.push({ ...result.tree, move, score: result.score, isMax: !isMaximizing, depth: depth - 1 })
    }
  }

  const tree: GameTreeNode | undefined = buildTree
    ? { board: cloneBoard(board), move: null, score: bestScore, isMax: isMaximizing, children, depth }
    : undefined

  return { score: bestScore, move: bestMove, tree }
}
