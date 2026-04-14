import { GonuBoard, GonuMove, Position, GameTreeNode, CellState } from '../types/index'

/**
 * 초기 보드 (3×3):
 * 0행: AI, AI, AI
 * 1행: 빈, 빈, 빈
 * 2행: 플레이어, 플레이어, 플레이어
 */
export const INITIAL_GONU_BOARD: GonuBoard = [
  ['ai',     'ai',     'ai'    ],
  ['empty',  'empty',  'empty' ],
  ['player', 'player', 'player'],
]

/**
 * 랜덤 고누 보드 생성
 * 여러 가지 초기 배치 중 랜덤 선택 (양쪽 모두 이동 가능한 상태)
 */
export function generateRandomGonuBoard(): GonuBoard {
  const validLayouts: GonuBoard[] = [
    // 기본 배치
    [['ai','ai','ai'],['empty','empty','empty'],['player','player','player']],
    // 엇갈린 배치 1
    [['empty','ai','empty'],['ai','empty','ai'],['player','player','player']],
    // 엇갈린 배치 2
    [['ai','ai','ai'],['player','empty','player'],['empty','player','empty']],
  ]
  return validLayouts[Math.floor(Math.random() * validLayouts.length)]
}

/**
 * 보드 평가: 플레이어 이동 가능 수 - AI 이동 가능 수
 * 양수 = 플레이어 유리, 음수 = AI 유리
 * (AI가 MAX이므로 AI 이동 가능 수 - 플레이어 이동 가능 수)
 */
export function evaluateBoard(board: GonuBoard): number {
  const aiMoves = getValidMoves(board, 'ai').length
  const playerMoves = getValidMoves(board, 'player').length
  return aiMoves - playerMoves
}

/**
 * 보드 깊은 복사
 */
function cloneBoard(board: GonuBoard): GonuBoard {
  return board.map(row => [...row])
}

/**
 * 위치가 보드 범위 내인지 확인 (3×3)
 */
function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 3 && col >= 0 && col < 3
}

/**
 * 특정 플레이어의 유효한 이동 목록 반환
 * 이동 규칙:
 * - 상하좌우 + 대각선 1칸 이동 (빈 칸으로만, 점프 없음)
 */
export function getValidMoves(board: GonuBoard, player: 'player' | 'ai'): GonuMove[] {
  const moves: GonuMove[] = []
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],   // 상하좌우
    [-1, -1], [-1, 1], [1, -1], [1, 1], // 대각선
  ]

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (board[row][col] !== player) continue

      const from: Position = { row, col }

      for (const [dr, dc] of directions) {
        const nr = row + dr
        const nc = col + dc

        if (!inBounds(nr, nc)) continue

        if (board[nr][nc] === 'empty') {
          moves.push({ from, to: { row: nr, col: nc }, player })
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
  return newBoard
}

/**
 * 게임 종료 조건: 한쪽 플레이어가 이동 불가 상태
 */
export function isTerminal(board: GonuBoard): boolean {
  const playerMoves = getValidMoves(board, 'player')
  const aiMoves = getValidMoves(board, 'ai')
  return playerMoves.length === 0 || aiMoves.length === 0
}

/**
 * 미니맥스 알고리즘 (depth=3)
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
