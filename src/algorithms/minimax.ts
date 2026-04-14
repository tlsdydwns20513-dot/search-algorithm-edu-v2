import { GonuBoard, GonuMove, Position, GameTreeNode, CellState } from '../types/index'

export const INITIAL_GONU_BOARD: GonuBoard = [
  ['ai',     'ai',     'ai',     'ai'    ],
  ['ai',     'ai',     'ai',     'ai'    ],
  ['player', 'player', 'player', 'player'],
  ['player', 'player', 'player', 'player'],
]

/**
 * 보드 평가: AI 말 수 - 플레이어 말 수
 * 양수 = AI 유리, 음수 = 플레이어 유리
 */
export function evaluateBoard(board: GonuBoard): number {
  let score = 0
  for (const row of board) {
    for (const cell of row) {
      if (cell === 'ai') score += 1
      if (cell === 'player') score -= 1
    }
  }
  return score
}

/**
 * 보드 깊은 복사
 */
function cloneBoard(board: GonuBoard): GonuBoard {
  return board.map(row => [...row])
}

/**
 * 위치가 보드 범위 내인지 확인
 */
function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 4 && col >= 0 && col < 4
}

/**
 * 특정 플레이어의 유효한 이동 목록 반환
 * 이동 규칙:
 * - 상하좌우 + 대각선 1칸 이동 (빈 칸으로)
 * - 상대 말을 뛰어넘어 잡기 (점프): 상대 말 너머 빈 칸으로 이동
 */
export function getValidMoves(board: GonuBoard, player: 'player' | 'ai'): GonuMove[] {
  const opponent: CellState = player === 'player' ? 'ai' : 'player'
  const moves: GonuMove[] = []
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],   // 상하좌우
    [-1, -1], [-1, 1], [1, -1], [1, 1], // 대각선
  ]

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (board[row][col] !== player) continue

      const from: Position = { row, col }

      for (const [dr, dc] of directions) {
        const nr = row + dr
        const nc = col + dc

        if (!inBounds(nr, nc)) continue

        if (board[nr][nc] === 'empty') {
          // 1칸 이동
          moves.push({ from, to: { row: nr, col: nc }, player })
        } else if (board[nr][nc] === opponent) {
          // 점프: 상대 말 너머 빈 칸으로 이동
          const jr = nr + dr
          const jc = nc + dc
          if (inBounds(jr, jc) && board[jr][jc] === 'empty') {
            moves.push({
              from,
              to: { row: jr, col: jc },
              player,
              captures: { row: nr, col: nc },
            })
          }
        }
      }
    }
  }

  return moves
}

/**
 * 이동 적용 후 새 보드 반환 (원본 불변)
 */
export function applyGonuMove(board: GonuBoard, move: GonuMove): GonuBoard {
  const newBoard = cloneBoard(board)
  newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col]
  newBoard[move.from.row][move.from.col] = 'empty'
  if (move.captures) {
    newBoard[move.captures.row][move.captures.col] = 'empty'
  }
  return newBoard
}

/**
 * 게임 종료 조건: 한쪽 플레이어의 말이 0개이거나 이동 불가
 */
export function isTerminal(board: GonuBoard): boolean {
  let playerCount = 0
  let aiCount = 0
  for (const row of board) {
    for (const cell of row) {
      if (cell === 'player') playerCount++
      if (cell === 'ai') aiCount++
    }
  }
  if (playerCount === 0 || aiCount === 0) return true

  // 이동 가능한 수가 없는 경우도 종료
  const playerMoves = getValidMoves(board, 'player')
  const aiMoves = getValidMoves(board, 'ai')
  return playerMoves.length === 0 || aiMoves.length === 0
}

/**
 * 미니맥스 알고리즘
 * @param board 현재 보드 상태
 * @param depth 탐색 깊이
 * @param isMaximizing true=AI 차례(최대화), false=플레이어 차례(최소화)
 * @param buildTree 게임 트리 구성 여부
 */
export function minimax(
  board: GonuBoard,
  depth: number,
  isMaximizing: boolean,
  buildTree: boolean = false
): { score: number; move: GonuMove | null; tree?: GameTreeNode } {
  if (depth === 0 || isTerminal(board)) {
    const score = evaluateBoard(board)
    const node: GameTreeNode | undefined = buildTree
      ? { board: cloneBoard(board), move: null, score, isMax: isMaximizing, children: [], depth }
      : undefined
    return { score, move: null, tree: node }
  }

  const player = isMaximizing ? 'ai' : 'player'
  const moves = getValidMoves(board, player)

  if (moves.length === 0) {
    const score = evaluateBoard(board)
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
    const result = minimax(newBoard, depth - 1, !isMaximizing, buildTree)

    if (isMaximizing ? result.score > bestScore : result.score < bestScore) {
      bestScore = result.score
      bestMove = move
    }

    if (buildTree && result.tree) {
      children.push({
        ...result.tree,
        move,
        score: result.score,
        isMax: !isMaximizing,
        depth: depth - 1,
      })
    }
  }

  const tree: GameTreeNode | undefined = buildTree
    ? {
        board: cloneBoard(board),
        move: null,
        score: bestScore,
        isMax: isMaximizing,
        children,
        depth,
      }
    : undefined

  return { score: bestScore, move: bestMove, tree }
}
