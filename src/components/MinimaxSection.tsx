import { useState, useCallback, useMemo } from "react"
import "./Section.css"
import {
  GONU_VARIANTS,
  GonuBoardDef,
  generateRandomGonuVariant,
  getValidMovesForDef,
  applyPiecesMove,
  isTerminalForDef,
  minimaxForDef,
  clonePieces,
} from "../algorithms/minimax"
import { GonuMove, Position } from "../types/index"

interface MinimaxSectionProps {
  onComplete: () => void
}

type GamePhase = "select" | "playing" | "ended"
type Turn = "player" | "ai"

// ─── 고누판 SVG 렌더러 ────────────────────────────────────────────────────────

function GonuBoardSVG({
  def, pieces, selectedId, validMoves, onPointClick, disabled, moveScores, bestMoveId,
}: {
  def: GonuBoardDef
  pieces: Record<string, "player"|"ai"|"empty">
  selectedId: string | null
  validMoves: GonuMove[]
  onPointClick: (ptId: string) => void
  disabled: boolean
  moveScores: Map<string, number>
  bestMoveId: string | null
}) {
  const PAD = 50
  const CELL = 90
  const R = 22

  // 각 점의 SVG 좌표 계산
  const ptCoords = useMemo(() => {
    const map = new Map<string, {x:number,y:number}>()
    for (const pt of def.points) {
      if (def.variant === "hobak" || def.variant === "umul") {
        // 원형 판: 특수 좌표
        const cx = def.svgWidth / 2
        const cy = def.svgHeight / 2
        const r = Math.min(def.svgWidth, def.svgHeight) / 2 - PAD
        if (pt.id === "center") { map.set(pt.id, {x:cx, y:cy}); continue }
        if (pt.id === "top")    { map.set(pt.id, {x:cx, y:cy-r}); continue }
        if (pt.id === "right")  { map.set(pt.id, {x:cx+r, y:cy}); continue }
        if (pt.id === "bottom") { map.set(pt.id, {x:cx, y:cy+r}); continue }
        if (pt.id === "left")   { map.set(pt.id, {x:cx-r, y:cy}); continue }
        // 우물고누 대각선 점
        const dr = r * 0.707
        if (pt.id === "tl") { map.set(pt.id, {x:cx-dr, y:cy-dr}); continue }
        if (pt.id === "tr") { map.set(pt.id, {x:cx+dr, y:cy-dr}); continue }
        if (pt.id === "br") { map.set(pt.id, {x:cx+dr, y:cy+dr}); continue }
        if (pt.id === "bl") { map.set(pt.id, {x:cx-dr, y:cy+dr}); continue }
      }
      map.set(pt.id, {x: PAD + pt.col * CELL, y: PAD + pt.row * CELL})
    }
    return map
  }, [def])

  const validTargetIds = new Set(validMoves.map(m => {
    const toPt = def.points.find(p => p.row === m.to.row && p.col === m.to.col)
    return toPt?.id ?? ""
  }))

  const W = def.svgWidth
  const H = def.svgHeight

  return (
    <svg width={W} height={H}
      style={{display:"block",margin:"0 auto",background:"#fdf6e3",borderRadius:12,boxShadow:"0 2px 12px rgba(0,0,0,0.15)"}}
    >
      {/* 호박고누/우물고누 원 */}
      {(def.variant === "hobak" || def.variant === "umul") && (
        <circle cx={W/2} cy={H/2} r={Math.min(W,H)/2-PAD}
          fill="none" stroke="#ccc" strokeWidth="2"
        />
      )}

      {/* 연결선 */}
      {def.edges.map(([a,b],i) => {
        const pa = ptCoords.get(a), pb = ptCoords.get(b)
        if (!pa || !pb) return null
        return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="#bbb" strokeWidth="2" />
      })}

      {/* 점 + 말 */}
      {def.points.map(pt => {
        const coord = ptCoords.get(pt.id)
        if (!coord) return null
        const {x, y} = coord
        const cell = pieces[pt.id] ?? "empty"
        const isSelected = pt.id === selectedId
        const isTarget = validTargetIds.has(pt.id)
        const score = moveScores.get(pt.id)
        const isBest = pt.id === bestMoveId
        const winRate = score !== undefined
          ? Math.max(0, Math.min(100, Math.round(((-score + 6) / 12) * 100)))
          : undefined
        const badgeColor = isBest ? "#4caf50" : (winRate !== undefined && winRate > 50) ? "#1976d2" : "#f44336"

        return (
          <g key={pt.id}
            onClick={() => !disabled && onPointClick(pt.id)}
            style={{cursor: disabled ? "default" : "pointer"}}
          >
            {isTarget && (
              <>
                <circle cx={x} cy={y} r={R+14} fill="transparent" />
                <circle cx={x} cy={y} r={R+7}
                  fill={isBest ? "rgba(76,175,80,0.15)" : "none"}
                  stroke={isBest ? "#4caf50" : "#1976d2"}
                  strokeWidth="2.5" strokeDasharray="5,3"
                />
                {winRate !== undefined && (
                  <g>
                    <circle cx={x+R+4} cy={y-R-4} r={14} fill={badgeColor} />
                    <text x={x+R+4} y={y-R+1} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold"
                      style={{pointerEvents:"none"}}>{winRate}%</text>
                  </g>
                )}
              </>
            )}
            {cell !== "empty" ? (
              <>
                <circle cx={x} cy={y} r={R}
                  fill={cell === "player" ? "#1976d2" : "#d32f2f"}
                  stroke={isSelected ? "#ffeb3b" : "white"}
                  strokeWidth={isSelected ? 4 : 2}
                />
                <text x={x} y={y+5} textAnchor="middle" fontSize="13" fill="white" fontWeight="bold"
                  style={{pointerEvents:"none"}}>
                  {cell === "player" ? "나" : "AI"}
                </text>
              </>
            ) : (
              <>
                <circle cx={x} cy={y} r={R} fill="transparent" />
                {!isTarget && <circle cx={x} cy={y} r={5} fill="#ccc" />}
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── 미리보기 SVG ─────────────────────────────────────────────────────────────

function PreviewSVG({ def }: { def: GonuBoardDef }) {
  const SIZE = 80
  const PAD = 12
  const maxR = Math.max(...def.points.map(p => p.row), 1)
  const maxC = Math.max(...def.points.map(p => p.col), 1)
  const cellW = (SIZE - PAD*2) / maxC
  const cellH = (SIZE - PAD*2) / maxR

  const ptCoords = new Map<string, {x:number,y:number}>()
  for (const pt of def.points) {
    if (def.variant === "hobak" || def.variant === "umul") {
      const cx = SIZE/2, cy = SIZE/2, r = SIZE/2 - PAD
      if (pt.id === "center") { ptCoords.set(pt.id, {x:cx,y:cy}); continue }
      if (pt.id === "top")    { ptCoords.set(pt.id, {x:cx,y:cy-r}); continue }
      if (pt.id === "right")  { ptCoords.set(pt.id, {x:cx+r,y:cy}); continue }
      if (pt.id === "bottom") { ptCoords.set(pt.id, {x:cx,y:cy+r}); continue }
      if (pt.id === "left")   { ptCoords.set(pt.id, {x:cx-r,y:cy}); continue }
      const dr = r * 0.707
      if (pt.id === "tl") { ptCoords.set(pt.id, {x:cx-dr,y:cy-dr}); continue }
      if (pt.id === "tr") { ptCoords.set(pt.id, {x:cx+dr,y:cy-dr}); continue }
      if (pt.id === "br") { ptCoords.set(pt.id, {x:cx+dr,y:cy+dr}); continue }
      if (pt.id === "bl") { ptCoords.set(pt.id, {x:cx-dr,y:cy+dr}); continue }
    }
    ptCoords.set(pt.id, {x: PAD + pt.col * cellW, y: PAD + pt.row * cellH})
  }

  return (
    <svg width={SIZE} height={SIZE} style={{display:"block",margin:"0 auto"}}>
      {(def.variant === "hobak" || def.variant === "umul") && (
        <circle cx={SIZE/2} cy={SIZE/2} r={SIZE/2-PAD} fill="none" stroke="#aaa" strokeWidth="1" />
      )}
      {def.edges.map(([a,b],i) => {
        const pa = ptCoords.get(a), pb = ptCoords.get(b)
        if (!pa||!pb) return null
        return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="#999" strokeWidth="1" />
      })}
      {def.points.map(pt => {
        const c = ptCoords.get(pt.id)
        if (!c) return null
        const cell = def.initialPieces[pt.id]
        return cell !== "empty" ? (
          <circle key={pt.id} cx={c.x} cy={c.y} r={6}
            fill={cell === "ai" ? "#d32f2f" : "#1976d2"} stroke="white" strokeWidth="1" />
        ) : (
          <circle key={pt.id} cx={c.x} cy={c.y} r={3} fill="#ccc" />
        )
      })}
    </svg>
  )
}

// ─── 선택 화면 ────────────────────────────────────────────────────────────────

function SelectScreen({ onSelect }: { onSelect: (def: GonuBoardDef) => void }) {
  return (
    <div className="content-card" style={{maxWidth:700,margin:"0 auto"}}>
      <h3>🎮 고누 판 선택</h3>
      <p style={{color:"#555",marginBottom:"1rem"}}>
        플레이할 고누 판을 선택하거나 랜덤으로 시작하세요!
      </p>
      <button
        onClick={() => onSelect(GONU_VARIANTS[Math.floor(Math.random()*GONU_VARIANTS.length)])}
        style={{
          width:"100%",padding:"0.9rem",marginBottom:"1.25rem",
          background:"linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
          color:"white",border:"none",borderRadius:10,fontSize:"1rem",
          fontWeight:"bold",cursor:"pointer",
        }}
      >🎲 랜덤으로 시작하기</button>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:"1rem"}}>
        {GONU_VARIANTS.map(def => (
          <button key={def.variant} onClick={() => onSelect(def)}
            style={{
              border:"2px solid #e0e0e0",borderRadius:12,padding:"1rem 0.5rem",
              background:"white",cursor:"pointer",transition:"all 0.2s",
              display:"flex",flexDirection:"column",alignItems:"center",gap:"0.5rem",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor="#667eea")}
            onMouseLeave={e => (e.currentTarget.style.borderColor="#e0e0e0")}
          >
            <PreviewSVG def={def} />
            <div style={{fontWeight:"bold",fontSize:"0.85rem",color:"#333"}}>{def.name}</div>
            <div style={{fontSize:"0.72rem",color:"#888",textAlign:"center",lineHeight:1.4}}>
              {def.description}
            </div>
          </button>
        ))}
      </div>
      <div style={{marginTop:"1.5rem",padding:"1rem",background:"#e3f2fd",borderRadius:8,fontSize:"0.85rem",color:"#1565c0"}}>
        <strong>공통 규칙:</strong> 연결된 빈 칸으로 1칸 이동. 상대방이 이동할 수 없게 만들면 승리!
      </div>
    </div>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function MinimaxSection({ onComplete }: MinimaxSectionProps) {
  const [phase, setPhase] = useState<GamePhase>("select")
  const [currentDef, setCurrentDef] = useState<GonuBoardDef>(GONU_VARIANTS[0])
  const [pieces, setPieces] = useState<Record<string,"player"|"ai"|"empty">>(clonePieces(GONU_VARIANTS[0].initialPieces))
  const [turn, setTurn] = useState<Turn>("player")
  const [selectedId, setSelectedId] = useState<string|null>(null)
  const [validMoves, setValidMoves] = useState<GonuMove[]>([])
  const [winner, setWinner] = useState<"player"|"ai"|null>(null)
  const [statusMsg, setStatusMsg] = useState("당신의 차례입니다. 말을 선택하세요.")
  const [aiThinking, setAiThinking] = useState(false)
  const [moveScores, setMoveScores] = useState<Map<string,number>>(new Map())
  const [bestMoveId, setBestMoveId] = useState<string|null>(null)
  const [selectedPieceId, setSelectedPieceId] = useState<string|null>(null)

  const checkTerminal = useCallback((p: Record<string,"player"|"ai"|"empty">): "player"|"ai"|null => {
    if (getValidMovesForDef(p,"player",currentDef).length === 0) return "ai"
    if (getValidMovesForDef(p,"ai",currentDef).length === 0) return "player"
    return null
  }, [currentDef])

  const doAiMove = useCallback((p: Record<string,"player"|"ai"|"empty">) => {
    setAiThinking(true)
    setStatusMsg("AI가 생각 중...")
    setTimeout(() => {
      // depth=1로 낮춰서 사람이 이기기 쉽게
      const result = minimaxForDef(p, 1, true, currentDef)
      if (!result.move) {
        setWinner("player"); setPhase("ended"); setAiThinking(false); return
      }
      const next = applyPiecesMove(p, result.move, currentDef)
      setPieces(next)
      const w = checkTerminal(next)
      if (w) { setWinner(w); setPhase("ended") }
      else { setTurn("player"); setStatusMsg("당신의 차례입니다. 말을 선택하세요.") }
      setAiThinking(false)
    }, 400)
  }, [currentDef, checkTerminal])

  const handlePointClick = useCallback((ptId: string) => {
    if (turn !== "player" || phase !== "playing" || aiThinking) return
    const cell = pieces[ptId]

    // 이동 가능 위치 클릭
    const targetMove = validMoves.find(m => {
      const toPt = currentDef.points.find(p => p.row === m.to.row && p.col === m.to.col)
      return toPt?.id === ptId
    })
    if (targetMove) {
      const next = applyPiecesMove(pieces, targetMove, currentDef)
      setPieces(next)
      setSelectedId(null); setValidMoves([]); setMoveScores(new Map()); setBestMoveId(null); setSelectedPieceId(null)
      const w = checkTerminal(next)
      if (w) { setWinner(w); setPhase("ended"); return }
      setTurn("ai"); doAiMove(next); return
    }

    // 자신의 말 선택
    if (cell === "player") {
      setSelectedId(ptId); setSelectedPieceId(ptId)
      const moves = getValidMovesForDef(pieces,"player",currentDef).filter(m => {
        const fromPt = currentDef.points.find(p => p.row === m.from.row && p.col === m.from.col)
        return fromPt?.id === ptId
      })
      setValidMoves(moves)
      // 각 이동 점수 계산
      const scores = new Map<string,number>()
      let bestScore = Infinity, bestId: string|null = null
      for (const move of moves) {
        const next = applyPiecesMove(pieces, move, currentDef)
        const r = minimaxForDef(next, 1, true, currentDef)
        const toPt = currentDef.points.find(p => p.row === move.to.row && p.col === move.to.col)
        if (toPt) {
          scores.set(toPt.id, r.score)
          if (r.score < bestScore) { bestScore = r.score; bestId = toPt.id }
        }
      }
      setMoveScores(scores); setBestMoveId(bestId)
      setStatusMsg(moves.length > 0 ? "이동할 위치를 선택하세요." : "이 말은 이동할 수 없습니다.")
      return
    }

    setSelectedId(null); setValidMoves([]); setMoveScores(new Map()); setBestMoveId(null); setSelectedPieceId(null)
    setStatusMsg("당신의 차례입니다. 말을 선택하세요.")
  }, [turn, phase, aiThinking, pieces, validMoves, currentDef, checkTerminal, doAiMove])

  const startGame = (def: GonuBoardDef) => {
    setCurrentDef(def)
    setPieces(clonePieces(def.initialPieces))
    setPhase("playing"); setTurn("player")
    setSelectedId(null); setValidMoves([]); setMoveScores(new Map()); setBestMoveId(null)
    setSelectedPieceId(null); setWinner(null)
    setStatusMsg("당신의 차례입니다. 말을 선택하세요.")
    setAiThinking(false)
  }

  const handleReset = () => {
    const newDef = generateRandomGonuVariant()
    startGame(newDef)
  }

  if (phase === "select") {
    return (
      <div className="section">
        <h2 className="section-title">미니맥스 알고리즘 — 고누 게임</h2>
        <SelectScreen onSelect={startGame} />
      </div>
    )
  }

  const aiCount = Object.values(pieces).filter(v => v === "ai").length
  const playerCount = Object.values(pieces).filter(v => v === "player").length

  return (
    <div className="section">
      <h2 className="section-title">미니맥스 알고리즘 — {currentDef.name}</h2>

      <div style={{display:"flex",gap:"1.5rem",flexWrap:"wrap",alignItems:"flex-start"}}>
        {/* 좌측: 게임 보드 */}
        <div className="content-card" style={{flex:"0 0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
            <h3 style={{margin:0}}>{currentDef.name}</h3>
            <button onClick={() => setPhase("select")}
              style={{fontSize:"0.8rem",padding:"0.3rem 0.75rem",borderRadius:6,border:"1px solid #ccc",background:"#f5f5f5",cursor:"pointer"}}>
              🔄 다른 고누 선택
            </button>
          </div>

          <div style={{
            padding:"0.6rem 1rem",borderRadius:6,marginBottom:"1rem",
            background: phase==="ended" ? (winner==="player"?"#e8f5e9":"#ffebee") : "#e3f2fd",
            color: phase==="ended" ? (winner==="player"?"#2e7d32":"#c62828") : "#1565c0",
            fontWeight:"bold",fontSize:"1rem",
          }}>
            {phase==="ended"
              ? winner==="player" ? "🎉 플레이어 승리! (AI가 이동 불가)"
              : "🤖 AI 승리! (플레이어가 이동 불가)"
              : statusMsg}
          </div>

          <div style={{marginBottom:"0.75rem",fontSize:13,color:"#666",display:"flex",gap:"1rem"}}>
            <span>차례: <strong>{turn==="player"?"플레이어 (파란 말)":"AI (빨간 말)"}</strong></span>
            <span style={{color:"#1976d2"}}>🔵 나: {playerCount}개</span>
            <span style={{color:"#d32f2f"}}>🔴 AI: {aiCount}개</span>
          </div>

          <GonuBoardSVG
            def={currentDef}
            pieces={pieces}
            selectedId={selectedId}
            validMoves={validMoves}
            onPointClick={handlePointClick}
            disabled={turn!=="player"||phase!=="playing"||aiThinking}
            moveScores={moveScores}
            bestMoveId={bestMoveId}
          />

          <div className="controls" style={{marginTop:"1rem"}}>
            <button className="control-btn" onClick={handleReset}>🎲 새 판 (랜덤)</button>
            {phase==="ended" && (
              <>
                <button className="control-btn" onClick={() => setPhase("select")}>판 선택</button>
                <button className="complete-btn" onClick={onComplete}>학습 완료</button>
              </>
            )}
          </div>
        </div>

        {/* 우측: 분석 패널 */}
        <div className="content-card" style={{flex:"1 1 260px",minWidth:240}}>
          <h3>🧠 미니맥스 분석</h3>

          {aiThinking ? (
            <div style={{textAlign:"center",padding:"2rem",color:"#999"}}>
              <div style={{fontSize:"2rem"}}>🤖</div>AI가 계산 중...
            </div>
          ) : selectedPieceId === null ? (
            <div style={{padding:"1rem",background:"#f5f5f5",borderRadius:8,color:"#666",lineHeight:1.7}}>
              <div style={{fontWeight:"bold",color:"#1976d2",marginBottom:"0.5rem"}}>사용 방법</div>
              파란 말을 클릭하면 각 이동의 승률을 분석해드립니다.
            </div>
          ) : (
            <div>
              <div style={{marginBottom:"0.5rem",fontSize:"0.9rem",color:"#555"}}>
                선택한 말: <strong>{selectedPieceId}</strong>
              </div>
              {validMoves.length === 0 ? (
                <div style={{color:"#f44336",fontSize:"0.85rem"}}>이동 가능한 위치가 없습니다.</div>
              ) : (
                validMoves.map(move => {
                  const toPt = currentDef.points.find(p => p.row===move.to.row && p.col===move.to.col)
                  if (!toPt) return null
                  const score = moveScores.get(toPt.id) ?? 0
                  const isBest = toPt.id === bestMoveId
                  const winRate = Math.max(0, Math.min(100, Math.round(((-score+6)/12)*100)))
                  return (
                    <div key={toPt.id} style={{
                      padding:"0.6rem 0.75rem",borderRadius:8,marginBottom:"0.4rem",
                      background:isBest?"#e8f5e9":"#f5f5f5",
                      border:isBest?"2px solid #4caf50":"1px solid #e0e0e0",
                    }}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.3rem"}}>
                        <span style={{fontSize:"0.88rem",fontWeight:isBest?"bold":"normal"}}>
                          → {toPt.id} {isBest?"⭐ 추천":""}
                        </span>
                        <span style={{fontSize:"0.88rem",fontWeight:"bold",color:isBest?"#2e7d32":"#555"}}>
                          {winRate}%
                        </span>
                      </div>
                      <div style={{background:"#e0e0e0",borderRadius:4,height:8,overflow:"hidden"}}>
                        <div style={{
                          width:`${winRate}%`,height:"100%",borderRadius:4,
                          background:isBest?"#4caf50":winRate>50?"#1976d2":"#f44336",
                          transition:"width 0.3s",
                        }} />
                      </div>
                    </div>
                  )
                })
              )}
              {bestMoveId && (
                <div style={{marginTop:"0.5rem",padding:"0.6rem",background:"#e8f5e9",borderRadius:8,fontSize:"0.85rem",color:"#2e7d32",fontWeight:"bold"}}>
                  ✅ {bestMoveId} 위치로 이동하세요!
                </div>
              )}
            </div>
          )}

          <div style={{marginTop:"1rem",padding:"0.75rem",background:"#e3f2fd",borderRadius:8,fontSize:"0.8rem",color:"#1565c0",lineHeight:1.7}}>
            <strong>승률 해석</strong><br />
            높을수록 플레이어에게 유리한 이동입니다.
          </div>

          <div style={{marginTop:"1rem"}}>
            <div style={{fontWeight:"bold",fontSize:"0.85rem",color:"#555",marginBottom:"0.5rem"}}>다른 고누 판:</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem"}}>
              {GONU_VARIANTS.map(def => (
                <button key={def.variant} onClick={() => startGame(def)}
                  style={{
                    padding:"0.3rem 0.6rem",borderRadius:6,fontSize:"0.78rem",
                    border:def.variant===currentDef.variant?"2px solid #667eea":"1px solid #ddd",
                    background:def.variant===currentDef.variant?"#eef0ff":"white",
                    cursor:"pointer",fontWeight:def.variant===currentDef.variant?"bold":"normal",
                    color:def.variant===currentDef.variant?"#667eea":"#555",
                  }}
                >{def.name}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="content-card" style={{marginTop:"1.5rem"}}>
        <h3>미니맥스 알고리즘 동작 원리</h3>
        <p>
          미니맥스(Minimax)는 두 플레이어 게임에서 최적의 수를 찾는 알고리즘입니다.
          고누에서는 <strong>상대가 이동 못하게 막는 것이 목표</strong>입니다.
          각 고누판마다 연결 구조가 달라 전략이 달라집니다.
        </p>
      </div>
    </div>
  )
}
