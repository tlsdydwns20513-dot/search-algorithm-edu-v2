import { GonuBoard, GonuMove, Position, GameTreeNode } from '../types/index'

export type GonuVariant = 'jul' | 'sabang' | 'umul' | 'hobak' | 'neomgi'

export interface GonuBoardDef {
  variant: GonuVariant
  name: string
  description: string
  // 교차점 목록: {id, row, col} — 실제 판 위의 점들
  points: { id: string; row: number; col: number }[]
  // 연결 목록: [pointId1, pointId2]
  edges: [string, string][]
  // 초기 배치: pointId → 'player' | 'ai' | 'empty'
  initialPieces: Record<string, 'player' | 'ai' | 'empty'>
  // SVG 렌더링용 크기
  svgWidth: number
  svgHeight: number
}

// ─── 1. 줄고누 (3×3 격자, 중앙 대각선만) ─────────────────────────────────────
// 실제 줄고누: 3×3 격자, 가로/세로 + 중앙 대각선 2개만
const julPoints = [
  {id:'00',row:0,col:0},{id:'01',row:0,col:1},{id:'02',row:0,col:2},
  {id:'10',row:1,col:0},{id:'11',row:1,col:1},{id:'12',row:1,col:2},
  {id:'20',row:2,col:0},{id:'21',row:2,col:1},{id:'22',row:2,col:2},
]
const julEdges: [string,string][] = [
  ['00','01'],['01','02'],['10','11'],['11','12'],['20','21'],['21','22'],
  ['00','10'],['10','20'],['01','11'],['11','21'],['02','12'],['12','22'],
  ['00','11'],['11','22'],['02','11'],['11','20'],
]

// ─── 2. 사방고누 (3×3, 모든 교차점에서 대각선) ───────────────────────────────
// 실제 사방고누: 3×3 격자 + 모든 칸에서 대각선 (X자 패턴)
const sabangPoints = julPoints
const sabangEdges: [string,string][] = [
  ...julEdges,
  ['00','11'],['01','10'],['01','12'],['02','11'],
  ['10','21'],['11','20'],['11','22'],['12','21'],
]

// ─── 3. 우물고누 (원+십자 구조) ──────────────────────────────────────────────
// 실제 우물고누: 원 위에 4개 점 + 중앙 + 십자로 연결
// 점: 상(top), 우(right), 하(bottom), 좌(left), 중앙(center)
// + 원 위의 4개 점 사이 원호 연결
const umul = {
  variant: 'umul' as GonuVariant,
  name: '우물고누',
  description: '원형 판 위에서 하는 고누. 중앙 우물을 차지하면 유리!',
  points: [
    {id:'top',   row:0, col:1},
    {id:'right', row:1, col:2},
    {id:'bottom',row:2, col:1},
    {id:'left',  row:1, col:0},
    {id:'center',row:1, col:1},
    // 원 위 4개 추가 점 (대각선 방향)
    {id:'tl', row:0, col:0},
    {id:'tr', row:0, col:2},
    {id:'br', row:2, col:2},
    {id:'bl', row:2, col:0},
  ],
  edges: [
    // 십자 연결
    ['top','center'],['right','center'],['bottom','center'],['left','center'],
    // 원 위 점들끼리 연결 (원호)
    ['tl','top'],['top','tr'],['tr','right'],['right','br'],
    ['br','bottom'],['bottom','bl'],['bl','left'],['left','tl'],
    // 원 위 점 → 중앙
    ['tl','center'],['tr','center'],['br','center'],['bl','center'],
  ] as [string,string][],
  initialPieces: {
    'tl':'ai','top':'ai','tr':'ai',
    'left':'empty','center':'empty','right':'empty',
    'bl':'player','bottom':'player','br':'player',
  } as Record<string,'player'|'ai'|'empty'>,
  svgWidth: 300, svgHeight: 300,
}

// ─── 4. 호박고누 (원+십자, 단순) ─────────────────────────────────────────────
// 실제 호박고누: 원 + 십자선 (5개 점)
// 상/하/좌/우/중앙, 원호로 상하좌우 연결
const hobak = {
  variant: 'hobak' as GonuVariant,
  name: '호박고누',
  description: '원형 판 5개 점. 단순하지만 전략적!',
  points: [
    {id:'top',   row:0, col:1},
    {id:'right', row:1, col:2},
    {id:'bottom',row:2, col:1},
    {id:'left',  row:1, col:0},
    {id:'center',row:1, col:1},
  ],
  edges: [
    ['top','center'],['right','center'],['bottom','center'],['left','center'],
    ['top','right'],['right','bottom'],['bottom','left'],['left','top'],
  ] as [string,string][],
  initialPieces: {
    'top':'ai','right':'ai','left':'empty',
    'center':'empty',
    'bottom':'player','left':'player',
  } as Record<string,'player'|'ai'|'empty'>,
  svgWidth: 300, svgHeight: 300,
}

// ─── 5. 넘기고누 (2×4 격자, 대각선 없음) ─────────────────────────────────────
const neomgiPoints = [
  {id:'00',row:0,col:0},{id:'01',row:0,col:1},{id:'02',row:0,col:2},{id:'03',row:0,col:3},
  {id:'10',row:1,col:0},{id:'11',row:1,col:1},{id:'12',row:1,col:2},{id:'13',row:1,col:3},
]
const neomgiEdges: [string,string][] = [
  ['00','01'],['01','02'],['02','03'],
  ['10','11'],['11','12'],['12','13'],
  ['00','10'],['01','11'],['02','12'],['03','13'],
]

export const GONU_VARIANTS: GonuBoardDef[] = [
  {
    variant: 'jul',
    name: '줄고누',
    description: '3×3 격자. 가로/세로 + 중앙 대각선 이동 가능',
    points: julPoints,
    edges: julEdges,
    initialPieces: {
      '00':'ai','01':'ai','02':'ai',
      '10':'empty','11':'empty','12':'empty',
      '20':'player','21':'player','22':'player',
    },
    svgWidth: 300, svgHeight: 300,
  },
  {
    variant: 'sabang',
    name: '사방고누',
    description: '3×3 격자. 모든 교차점에서 대각선 이동 가능!',
    points: sabangPoints,
    edges: sabangEdges,
    initialPieces: {
      '00':'ai','01':'ai','02':'ai',
      '10':'empty','11':'empty','12':'empty',
      '20':'player','21':'player','22':'player',
    },
    svgWidth: 300, svgHeight: 300,
  },
  umul,
  {
    variant: 'hobak',
    name: '호박고누',
    description: '원형 판 5개 점. 중앙을 차지하면 유리!',
    points: hobak.points,
    edges: hobak.edges,
    initialPieces: {
      'top':'ai','right':'ai','left':'ai',
      'center':'empty',
      'bottom':'player','tl':'player','tr':'player',
    } as Record<string,'player'|'ai'|'empty'>,
    svgWidth: 300, svgHeight: 300,
  },
  {
    variant: 'neomgi',
    name: '넘기고누',
    description: '2×4 판. 대각선 없이 상하좌우만 이동!',
    points: neomgiPoints,
    edges: neomgiEdges,
    initialPieces: {
      '00':'ai','01':'ai','02':'ai','03':'ai',
      '10':'player','11':'player','12':'player','13':'player',
    },
    svgWidth: 400, svgHeight: 200,
  },
]

// ─── 게임 로직 ────────────────────────────────────────────────────────────────

export function generateRandomGonuVariant(): GonuBoardDef {
  return GONU_VARIANTS[Math.floor(Math.random() * GONU_VARIANTS.length)]
}

/** GonuBoardDef의 initialPieces를 깊은 복사 */
export function clonePieces(pieces: Record<string, 'player'|'ai'|'empty'>): Record<string,'player'|'ai'|'empty'> {
  return { ...pieces }
}

/** 특정 플레이어의 유효한 이동 목록 */
export function getValidMovesForDef(
  pieces: Record<string,'player'|'ai'|'empty'>,
  player: 'player'|'ai',
  def: GonuBoardDef
): GonuMove[] {
  const moves: GonuMove[] = []
  for (const pt of def.points) {
    if (pieces[pt.id] !== player) continue
    for (const [a, b] of def.edges) {
      const neighbor = a === pt.id ? b : b === pt.id ? a : null
      if (neighbor && pieces[neighbor] === 'empty') {
        const fromPt = def.points.find(p => p.id === pt.id)!
        const toPt = def.points.find(p => p.id === neighbor)!
        moves.push({
          from: { row: fromPt.row, col: fromPt.col },
          to: { row: toPt.row, col: toPt.col },
          player,
        })
      }
    }
  }
  return moves
}

/** pieces 기반 이동 적용 */
export function applyPiecesMove(
  pieces: Record<string,'player'|'ai'|'empty'>,
  move: GonuMove,
  def: GonuBoardDef
): Record<string,'player'|'ai'|'empty'> {
  const fromPt = def.points.find(p => p.row === move.from.row && p.col === move.from.col)!
  const toPt = def.points.find(p => p.row === move.to.row && p.col === move.to.col)!
  const next = clonePieces(pieces)
  next[toPt.id] = next[fromPt.id]
  next[fromPt.id] = 'empty'
  return next
}

/** 게임 종료 여부 */
export function isTerminalForDef(
  pieces: Record<string,'player'|'ai'|'empty'>,
  def: GonuBoardDef
): boolean {
  return (
    getValidMovesForDef(pieces, 'player', def).length === 0 ||
    getValidMovesForDef(pieces, 'ai', def).length === 0
  )
}

/** 보드 평가: AI 이동 수 - 플레이어 이동 수 */
export function evaluatePieces(
  pieces: Record<string,'player'|'ai'|'empty'>,
  def: GonuBoardDef
): number {
  return (
    getValidMovesForDef(pieces, 'ai', def).length -
    getValidMovesForDef(pieces, 'player', def).length
  )
}

/** 미니맥스 (depth=1로 낮춰서 사람이 이기기 쉽게) */
export function minimaxForDef(
  pieces: Record<string,'player'|'ai'|'empty'>,
  depth: number,
  isMaximizing: boolean,
  def: GonuBoardDef
): { score: number; move: GonuMove | null } {
  if (depth === 0 || isTerminalForDef(pieces, def)) {
    return { score: evaluatePieces(pieces, def), move: null }
  }
  const player = isMaximizing ? 'ai' : 'player'
  const moves = getValidMovesForDef(pieces, player, def)
  if (moves.length === 0) return { score: evaluatePieces(pieces, def), move: null }

  let bestScore = isMaximizing ? -Infinity : Infinity
  let bestMove: GonuMove | null = null

  for (const move of moves) {
    const next = applyPiecesMove(pieces, move, def)
    const result = minimaxForDef(next, depth - 1, !isMaximizing, def)
    if (isMaximizing ? result.score > bestScore : result.score < bestScore) {
      bestScore = result.score
      bestMove = move
    }
  }
  return { score: bestScore, move: bestMove }
}

// 기존 호환성 유지용 (사용 안 함)
export const INITIAL_GONU_BOARD: import('../types/index').GonuBoard = [
  ['ai','ai','ai'],['empty','empty','empty'],['player','player','player']
]
export function getValidMoves(b: import('../types/index').GonuBoard, p: 'player'|'ai'): GonuMove[] { return [] }
export function applyGonuMove(b: import('../types/index').GonuBoard, m: GonuMove): import('../types/index').GonuBoard { return b }
export function isTerminal(b: import('../types/index').GonuBoard): boolean { return false }
export function minimax(b: import('../types/index').GonuBoard, d: number, max: boolean): { score: number; move: GonuMove | null } { return { score: 0, move: null } }
export function evaluateBoard(b: import('../types/index').GonuBoard): number { return 0 }
export function generateRandomGonuBoard(): import('../types/index').GonuBoard { return INITIAL_GONU_BOARD }
