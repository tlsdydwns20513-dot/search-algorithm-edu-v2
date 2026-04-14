import { PuzzleBoard, GOAL_STATE } from '../types/index'

/**
 * 목표 상태와 위치가 다른 타일 수 계산 (0=빈칸 제외)
 */
export function computeMisplaced(board: PuzzleBoard): number {
  return board.reduce((count, tile, idx) => {
    if (tile === 0) return count
    return tile === GOAL_STATE[idx] ? count : count + 1
  }, 0)
}

/**
 * 빈칸(0) 인덱스에서 이동 가능한 인접 타일 인덱스 목록 반환
 * 3×3 격자 기준 상하좌우
 */
export function getAdjacentIndices(blankIdx: number): number[] {
  const row = Math.floor(blankIdx / 3)
  const col = blankIdx % 3
  const adjacent: number[] = []
  if (row > 0) adjacent.push(blankIdx - 3)  // 위
  if (row < 2) adjacent.push(blankIdx + 3)  // 아래
  if (col > 0) adjacent.push(blankIdx - 1)  // 왼쪽
  if (col < 2) adjacent.push(blankIdx + 1)  // 오른쪽
  return adjacent
}

/**
 * 각 이동 가능한 타일을 이동했을 때의 예상 misplaced 값 계산
 * key: 타일 인덱스, value: 이동 후 misplaced 수
 */
export function computePreviewValues(board: PuzzleBoard): Record<number, number> {
  const blankIdx = board.indexOf(0)
  const adjacent = getAdjacentIndices(blankIdx)
  const result: Record<number, number> = {}
  for (const idx of adjacent) {
    const newBoard = [...board]
    ;[newBoard[blankIdx], newBoard[idx]] = [newBoard[idx], newBoard[blankIdx]]
    result[idx] = computeMisplaced(newBoard)
  }
  return result
}

/**
 * 현재 보드가 극소(local minimum)인지 판정
 * 모든 이동 후 misplaced >= 현재 misplaced이면 극소
 */
export function isLocalMinimum(board: PuzzleBoard): boolean {
  const current = computeMisplaced(board)
  if (current === 0) return false  // 목표 상태는 극소가 아님
  const previews = computePreviewValues(board)
  return Object.values(previews).every(v => v >= current)
}

/**
 * 반전 수(inversion count) 계산
 * 풀이 가능한 3×3 퍼즐은 반전 수가 짝수
 */
function countInversions(board: PuzzleBoard): number {
  const tiles = board.filter(t => t !== 0)
  let inversions = 0
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i] > tiles[j]) inversions++
    }
  }
  return inversions
}

/**
 * 풀이 가능한 8-퍼즐 초기 상태 생성
 * 반전 수가 짝수인 상태만 반환
 */
export function generateSolvablePuzzle(): PuzzleBoard {
  const tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0]
  let board: PuzzleBoard

  do {
    // Fisher-Yates 셔플
    board = [...tiles]
    for (let i = board.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[board[i], board[j]] = [board[j], board[i]]
    }
  } while (countInversions(board) % 2 !== 0)

  return board
}

/**
 * 타일 인덱스의 타일을 빈칸과 교환하여 새 보드 반환
 * tileIdx는 반드시 빈칸에 인접한 타일이어야 함
 */
export function applyMove(board: PuzzleBoard, tileIdx: number): PuzzleBoard {
  const blankIdx = board.indexOf(0)
  const newBoard = [...board]
  ;[newBoard[blankIdx], newBoard[tileIdx]] = [newBoard[tileIdx], newBoard[blankIdx]]
  return newBoard
}

/**
 * 쉬운 8-퍼즐 생성: 목표 상태에서 4~6번만 이동한 상태
 * misplaced가 2~4 정도인 쉬운 퍼즐
 */
export function generateEasyPuzzle(): PuzzleBoard {
  const goal: PuzzleBoard = [1, 2, 3, 4, 5, 6, 7, 8, 0]
  let board = [...goal]
  const moves = 4 + Math.floor(Math.random() * 3)  // 4~6번 랜덤 이동

  for (let i = 0; i < moves; i++) {
    const blankIdx = board.indexOf(0)
    const adjacent = getAdjacentIndices(blankIdx)
    const randomIdx = adjacent[Math.floor(Math.random() * adjacent.length)]
    ;[board[blankIdx], board[randomIdx]] = [board[randomIdx], board[blankIdx]]
  }
  return board
}
