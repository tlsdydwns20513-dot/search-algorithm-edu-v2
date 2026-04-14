import { GonuBoard, GonuMove, Position, GameTreeNode } from '../types/index'

export type GonuVariant = 'jul' | 'sabang' | 'neomgi'

export interface GonuBoardDef {
  variant: GonuVariant
  name: string
  description: string
  points: { id: string; row: number; col: number }[]
  edges: [string, string][]
  initialPieces: Record<string, 'player' | 'ai' | 'empty'>
  svgWidth: number
  svgHeight: number
}

// ─── 1. 줄고누 (3×3, 중앙 대각선) ───────────────────────────────────────────
// AI: 상단 행 3개, 플레이어: 하단 행 3개, 중간 행 빈칸 3개
// 이동: 가로/세로 + 중앙 대각선 2개
const julDef: GonuBoardDef = {
  variant: 'jul',
  name: '줄고누',
  description: '3×3 격자. 가로/세로 + 중앙 대각선 이동. 상대를 이동 불가로 만들면 승리!',
  points: [
    {id:'00',row:0,col:0},{id:'01',row:0,col:1},{id:'02',row:0,col:2},
    {id:'10',row:1,col:0},{id:'11',row:1,col:1},{id:'12',row:1,col:2},
    {id:'20',row:2,col:0},{id:'21',row:2,col:1},{id:'22',row:2,col:2},
  ],
  edges: [
    ['00','01'],['01','02'],
    ['10','11'],['11','12'],
    ['20','21'],['21','22'],
    ['00','10'],['10','20'],
    ['01','11'],['11','21'],
    ['02','12'],['12','22'],
    ['00','11'],['11','22'],
    ['02','11'],['11','20'],
  ],
  initialPieces: {
    '00':'ai','01':'ai','02':'ai',
    '10':'empty','11':'empty','12':'empty',
    '20':'player','21':'player','22':'player',
  },
  svgWidth: 300, svgHeight: 300,
}

// ─── 2. 사방고누 (3×3, 모든 대각선) ─────────────────────────────────────────
// 줄고누와 동일 배치이지만 모든 교차점에서 대각선 이동 가능
const sabangDef: GonuBoardDef = {
  variant: 'sabang',
  name: '사방고누',
  description: '3×3 격자. 모든 교차점에서 대각선 이동 가능! 이동 범위가 넓어 전략적.',
  points: julDef.points,
  edges: [
    ['00','01'],['01','02'],
    ['10','11'],['11','12'],
    ['20','21'],['21','22'],
    ['00','10'],['10','20'],
    ['01','11'],['11','21'],
    ['02','12'],['12','22'],
    // 모든 대각선
    ['00','11'],['11','22'],
    ['02','11'],['11','20'],
    ['01','10'],['01','12'],
    ['10','21'],['12','21'],
  ],
  initialPieces: {
    '00':'ai','01':'ai','02':'ai',
    '10':'empty','11':'empty','12':'empty',
    '20':'player','21':'player','22':'player',
  },
  svgWidth: 300, svgHeight: 300,
}

// ─── 3. 넘기고누 (3×3, 대각선 없음, 엇갈린 배치) ─────────────────────────────
// 핵심: 서로 마주보면 교착 → 엇갈린 배치로 해결
// AI: 상단 좌우 + 중간 중앙, 플레이어: 하단 좌우 + 중간 좌우
// 실제로는 3×3에서 대각선 없이 상하좌우만
const neomgiDef: GonuBoardDef = {
  variant: 'neomgi',
  name: '넘기고누',
  description: '3×3 격자. 대각선 없이 상하좌우만 이동! 단순하지만 치열한 전략 게임.',
  points: julDef.points,
  edges: [
    ['00','01'],['01','02'],
    ['10','11'],['11','12'],
    ['20','21'],['21','22'],
    ['00','10'],['10','20'],
    ['01','11'],['11','21'],
    ['02','12'],['12','22'],
  ],
  // 엇갈린 배치: AI 3개 vs 플레이어 3개, 빈칸 3개 → 즉시 이동 가능
  initialPieces: {
    '00':'ai','01':'empty','02':'ai',
    '10':'player','11':'empty','12':'ai',
    '20':'empty','21':'player','22':'player',
  },
  svgWidth: 300, svgHeight: 300,
}

export const GONU_VARIANTS: GonuBoardDef[] = [julDef, sabangDef, neomgiDef]

export function generateRandomGonuVariant(): GonuBoardDef {
  return GONU_VARIANTS[Math.floor(Math.random() * GONU_VARIANTS.length)]
}

export function clonePieces(
  pieces: Record<string, 'player'|'ai'|'empty'>
): Record<string,'player'|'ai'|'empty'> {
  return { ...pieces }
}

export function getValidMovesForDef(
  pieces: Record<string,'player'|'ai'|'empty'>,
  player: 'player'|'ai',
  def: GonuBoardDef
): GonuMove[] {
  const moves: GonuMove[] = []
  for (const pt of def.points) {
    if (pieces[pt.id] !== player) continue
    for (const [a, b] of def.edges) {
      const neighborId = a === pt.id ? b : b === pt.id ? a : null
      if (!neighborId) continue
      if (pieces[neighborId] === 'empty') {
        const fromPt = pt
        const toPt = def.points.find(p => p.id === neighborId)!
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

export function isTerminalForDef(
  pieces: Record<string,'player'|'ai'|'empty'>,
  def: GonuBoardDef
): boolean {
  return (
    getValidMovesForDef(pieces, 'player', def).length === 0 ||
    getValidMovesForDef(pieces, 'ai', def).length === 0
  )
}

export function evaluatePieces(
  pieces: Record<string,'player'|'ai'|'empty'>,
  def: GonuBoardDef
): number {
  return (
    getValidMovesForDef(pieces, 'ai', def).length -
    getValidMovesForDef(pieces, 'player', def).length
  )
}

// depth=1: AI가 약해서 사람이 이기기 쉬움
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

// 기존 호환성 유지
export const INITIAL_GONU_BOARD: GonuBoard = [
  ['ai','ai','ai'],['empty','empty','empty'],['player','player','player']
]
export function getValidMoves(b: GonuBoard, p: 'player'|'ai'): GonuMove[] { return [] }
export function applyGonuMove(b: GonuBoard, m: GonuMove): GonuBoard { return b }
export function isTerminal(b: GonuBoard): boolean { return false }
export function minimax(b: GonuBoard, d: number, max: boolean): { score: number; move: GonuMove | null } { return { score: 0, move: null } }
export function evaluateBoard(b: GonuBoard): number { return 0 }
export function generateRandomGonuBoard(): GonuBoard { return INITIAL_GONU_BOARD }
