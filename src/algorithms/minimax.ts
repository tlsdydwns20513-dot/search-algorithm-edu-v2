import { GonuBoard, GonuMove, Position, GameTreeNode } from '../types/index'

export type GonuVariant = 'simple' | 'cross' | 'line'

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

// ─── 게임 트리 노드 (미니맥스 시각화용) ──────────────────────────────────────
export interface MiniTreeNode {
  label: string        // 이동 설명
  score: number
  isMax: boolean
  children: MiniTreeNode[]
  isChosen?: boolean   // 실제 선택된 경로
}

// ─── 1. 단순고누 (2×3, 각 2개씩, 대각선 없음) ───────────────────────────────
// 6칸, 이동 경우의 수 최소화
const simpleDef: GonuBoardDef = {
  variant: 'simple',
  name: '단순고누',
  description: '2×3 판. 각 2개씩. 대각선 없이 상하좌우만 이동. 가장 쉬운 고누!',
  points: [
    {id:'00',row:0,col:0},{id:'01',row:0,col:1},{id:'02',row:0,col:2},
    {id:'10',row:1,col:0},{id:'11',row:1,col:1},{id:'12',row:1,col:2},
  ],
  edges: [
    ['00','01'],['01','02'],
    ['10','11'],['11','12'],
    ['00','10'],['01','11'],['02','12'],
  ],
  initialPieces: {
    '00':'ai','01':'empty','02':'ai',
    '10':'player','11':'empty','12':'player',
  },
  svgWidth: 360, svgHeight: 220,
}

// ─── 2. 십자고누 (십자 모양 5칸) ─────────────────────────────────────────────
// 중앙 + 상하좌우, 각 2개씩
const crossDef: GonuBoardDef = {
  variant: 'cross',
  name: '십자고누',
  description: '십자 모양 5칸. 중앙을 차지하면 유리! 각 2개씩.',
  points: [
    {id:'top',   row:0, col:1},
    {id:'left',  row:1, col:0},
    {id:'center',row:1, col:1},
    {id:'right', row:1, col:2},
    {id:'bottom',row:2, col:1},
  ],
  edges: [
    ['top','center'],
    ['left','center'],
    ['right','center'],
    ['bottom','center'],
    ['top','left'],['top','right'],
    ['bottom','left'],['bottom','right'],
  ],
  initialPieces: {
    'top':'ai','right':'ai',
    'center':'empty',
    'left':'player','bottom':'player',
  },
  svgWidth: 280, svgHeight: 280,
}

// ─── 3. 줄고누 (3×3, 중앙 대각선, 각 3개씩) ─────────────────────────────────
const lineDef: GonuBoardDef = {
  variant: 'line',
  name: '줄고누',
  description: '3×3 격자. 가로/세로 + 중앙 대각선. 각 3개씩.',
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

export const GONU_VARIANTS: GonuBoardDef[] = [simpleDef, crossDef, lineDef]

export function generateRandomGonuVariant(): GonuBoardDef {
  return GONU_VARIANTS[Math.floor(Math.random() * GONU_VARIANTS.length)]
}

export function clonePieces(
  pieces: Record<string, 'player'|'ai'|'empty'>
): Record<string,'player'|'ai'|'empty'> {
  return { ...pieces }
}

function serializePieces(pieces: Record<string,'player'|'ai'|'empty'>): string {
  return Object.entries(pieces).sort().map(([k,v]) => `${k}:${v}`).join(',')
}

export function getValidMovesForDef(
  pieces: Record<string,'player'|'ai'|'empty'>,
  player: 'player'|'ai',
  def: GonuBoardDef,
  visitedStates?: Set<string>
): GonuMove[] {
  const moves: GonuMove[] = []
  for (const pt of def.points) {
    if (pieces[pt.id] !== player) continue
    for (const [a, b] of def.edges) {
      const neighborId = a === pt.id ? b : b === pt.id ? a : null
      if (!neighborId) continue
      if (pieces[neighborId] === 'empty') {
        // 방문한 상태로 돌아가는 이동 제외
        if (visitedStates) {
          const next = clonePieces(pieces)
          const toPt = def.points.find(p => p.id === neighborId)!
          const fromPt = pt
          next[toPt.id] = next[fromPt.id]
          next[fromPt.id] = 'empty'
          if (visitedStates.has(serializePieces(next))) continue
        }
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

/** 미니맥스 + 트리 구성 (depth=2, 반복 방지) */
export function minimaxWithTree(
  pieces: Record<string,'player'|'ai'|'empty'>,
  depth: number,
  isMaximizing: boolean,
  def: GonuBoardDef,
  visitedStates: Set<string>,
  moveLabel: string = '시작'
): MiniTreeNode {
  const score = evaluatePieces(pieces, def)

  if (depth === 0 || isTerminalForDef(pieces, def)) {
    return { label: moveLabel, score, isMax: isMaximizing, children: [] }
  }

  const player = isMaximizing ? 'ai' : 'player'
  const moves = getValidMovesForDef(pieces, player, def, visitedStates)

  if (moves.length === 0) {
    return { label: moveLabel, score, isMax: isMaximizing, children: [] }
  }

  let bestScore = isMaximizing ? -Infinity : Infinity
  let bestIdx = 0
  const children: MiniTreeNode[] = []

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]
    const next = applyPiecesMove(pieces, move, def)
    const fromPt = def.points.find(p => p.row === move.from.row && p.col === move.from.col)!
    const toPt = def.points.find(p => p.row === move.to.row && p.col === move.to.col)!
    const label = `${fromPt.id}→${toPt.id}`

    const newVisited = new Set(visitedStates)
    newVisited.add(serializePieces(next))

    const child = minimaxWithTree(next, depth - 1, !isMaximizing, def, newVisited, label)
    children.push(child)

    if (isMaximizing ? child.score > bestScore : child.score < bestScore) {
      bestScore = child.score
      bestIdx = i
    }
  }

  if (children[bestIdx]) children[bestIdx].isChosen = true

  return { label: moveLabel, score: bestScore, isMax: isMaximizing, children }
}

export function minimaxForDef(
  pieces: Record<string,'player'|'ai'|'empty'>,
  depth: number,
  isMaximizing: boolean,
  def: GonuBoardDef,
  visitedStates?: Set<string>
): { score: number; move: GonuMove | null } {
  const visited = visitedStates ?? new Set<string>()

  if (depth === 0 || isTerminalForDef(pieces, def)) {
    return { score: evaluatePieces(pieces, def), move: null }
  }
  const player = isMaximizing ? 'ai' : 'player'
  const moves = getValidMovesForDef(pieces, player, def, visited)
  if (moves.length === 0) return { score: evaluatePieces(pieces, def), move: null }

  let bestScore = isMaximizing ? -Infinity : Infinity
  let bestMove: GonuMove | null = null

  for (const move of moves) {
    const next = applyPiecesMove(pieces, move, def)
    const newVisited = new Set(visited)
    newVisited.add(serializePieces(next))
    const result = minimaxForDef(next, depth - 1, !isMaximizing, def, newVisited)
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
