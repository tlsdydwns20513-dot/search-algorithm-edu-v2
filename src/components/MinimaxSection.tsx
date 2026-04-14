import { useState, useCallback, useMemo } from 'react'
import './Section.css'
import {
  GONU_VARIANTS, GonuBoardDef, MiniTreeNode,
  generateRandomGonuVariant, getValidMovesForDef,
  applyPiecesMove, isTerminalForDef,
  minimaxForDef, minimaxWithTree, clonePieces,
} from '../algorithms/minimax'
import { GonuMove } from '../types/index'

interface MinimaxSectionProps { onComplete: () => void }
type GamePhase = 'select' | 'playing' | 'ended'
type Turn = 'player' | 'ai'

// Tree view
function MiniTreeView({ node }: { node: MiniTreeNode }) {
  const color = node.isMax ? '#d32f2f' : '#1976d2'
  const bg = node.isChosen ? (node.isMax ? '#ffebee' : '#e3f2fd') : 'white'
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',margin:'0 2px'}}>
      <div style={{border:`2px solid ${color}`,borderRadius:6,padding:'3px 7px',background:bg,minWidth:50,textAlign:'center',position:'relative'}}>
        <div style={{color,fontWeight:'bold',fontSize:9}}>{node.isMax?'MAX':'MIN'}</div>
        <div style={{fontWeight:'bold',fontSize:14}}>{node.score}</div>
        <div style={{fontSize:8,color:'#888'}}>{node.label}</div>
        {node.isChosen && <div style={{position:'absolute',top:-7,right:-7,background:'#ff9800',color:'white',borderRadius:'50%',width:14,height:14,fontSize:9,display:'flex',alignItems:'center',justifyContent:'center'}}>*</div>}
      </div>
      {node.children.length > 0 && (
        <div style={{display:'flex',flexDirection:'row',gap:2,marginTop:3}}>
          {node.children.slice(0,4).map((c,i) => (
            <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
              <div style={{width:1,height:10,background:c.isChosen?color:'#ccc'}} />
              <MiniTreeView node={c} />
            </div>
          ))}
          {node.children.length > 4 && <div style={{fontSize:9,color:'#aaa',alignSelf:'center'}}>+{node.children.length-4}</div>}
        </div>
      )}
    </div>
  )
}

// Board SVG
function BoardSVG({ def, pieces, selId, validMoves, onClick, disabled, scores, bestId }: {
  def: GonuBoardDef, pieces: Record<string,'player'|'ai'|'empty'>,
  selId: string|null, validMoves: GonuMove[], onClick: (id:string)=>void,
  disabled: boolean, scores: Map<string,number>, bestId: string|null
}) {
  const PAD = 55, CELL = 95, R = 24
  const coords = useMemo(() => {
    const m = new Map<string,{x:number,y:number}>()
    for (const pt of def.points) {
      if (def.variant === 'cross') {
        const cx = def.svgWidth/2, cy = def.svgHeight/2, r = Math.min(def.svgWidth,def.svgHeight)/2-PAD
        if (pt.id==='center') { m.set(pt.id,{x:cx,y:cy}); continue }
        if (pt.id==='top')    { m.set(pt.id,{x:cx,y:cy-r}); continue }
        if (pt.id==='right')  { m.set(pt.id,{x:cx+r,y:cy}); continue }
        if (pt.id==='bottom') { m.set(pt.id,{x:cx,y:cy+r}); continue }
        if (pt.id==='left')   { m.set(pt.id,{x:cx-r,y:cy}); continue }
      }
      m.set(pt.id,{x:PAD+pt.col*CELL,y:PAD+pt.row*CELL})
    }
    return m
  }, [def])
  const targets = new Set(validMoves.map(m => { const p=def.points.find(x=>x.row===m.to.row&&x.col===m.to.col); return p?.id??'' }))
  return (
    <svg width={def.svgWidth} height={def.svgHeight} style={{display:'block',margin:'0 auto',background:'#fdf6e3',borderRadius:12,boxShadow:'0 2px 12px rgba(0,0,0,0.15)'}}>
      {def.variant==='cross' && <circle cx={def.svgWidth/2} cy={def.svgHeight/2} r={Math.min(def.svgWidth,def.svgHeight)/2-PAD} fill='none' stroke='#ccc' strokeWidth='2' />}
      {def.edges.map(([a,b],i) => { const pa=coords.get(a),pb=coords.get(b); if(!pa||!pb) return null; return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke='#bbb' strokeWidth='2' /> })}
      {def.points.map(pt => {
        const c=coords.get(pt.id); if(!c) return null
        const {x,y}=c, cell=pieces[pt.id]??'empty'
        const isSel=pt.id===selId, isTgt=targets.has(pt.id)
        const sc=scores.get(pt.id), isBest=pt.id===bestId
        const wr=sc!==undefined?Math.max(0,Math.min(100,Math.round(((-sc+6)/12)*100))):undefined
        const bc=isBest?'#4caf50':(wr!==undefined&&wr>50)?'#1976d2':'#f44336'
        return (
          <g key={pt.id} onClick={()=>!disabled&&onClick(pt.id)} style={{cursor:disabled?'default':'pointer'}}>
            {isTgt && <>
              <circle cx={x} cy={y} r={R+14} fill='transparent' />
              <circle cx={x} cy={y} r={R+7} fill={isBest?'rgba(76,175,80,0.15)':'none'} stroke={isBest?'#4caf50':'#1976d2'} strokeWidth='2.5' strokeDasharray='5,3' />
              {wr!==undefined && <g><circle cx={x+R+4} cy={y-R-4} r={13} fill={bc} /><text x={x+R+4} y={y-R+1} textAnchor='middle' fontSize='9' fill='white' fontWeight='bold' style={{pointerEvents:'none'}}>{wr}%</text></g>}
            </>}
            {cell!=='empty' ? <>
              <circle cx={x} cy={y} r={R} fill={cell==='player'?'#1976d2':'#d32f2f'} stroke={isSel?'#ffeb3b':'white'} strokeWidth={isSel?4:2} />
              <text x={x} y={y+5} textAnchor='middle' fontSize='13' fill='white' fontWeight='bold' style={{pointerEvents:'none'}}>{cell==='player'?'나':'AI'}</text>
            </> : <>
              <circle cx={x} cy={y} r={R} fill='transparent' />
              {!isTgt && <circle cx={x} cy={y} r={5} fill='#ccc' />}
            </>}
          </g>
        )
      })}
    </svg>
  )
}

// Preview
function Preview({ def }: { def: GonuBoardDef }) {
  const S=80,P=12
  const mR=Math.max(...def.points.map(p=>p.row),1), mC=Math.max(...def.points.map(p=>p.col),1)
  const cW=(S-P*2)/mC, cH=(S-P*2)/mR
  const coords = new Map<string,{x:number,y:number}>()
  for (const pt of def.points) {
    if (def.variant==='cross') {
      const cx=S/2,cy=S/2,r=S/2-P
      if(pt.id==='center'){coords.set(pt.id,{x:cx,y:cy});continue}
      if(pt.id==='top'){coords.set(pt.id,{x:cx,y:cy-r});continue}
      if(pt.id==='right'){coords.set(pt.id,{x:cx+r,y:cy});continue}
      if(pt.id==='bottom'){coords.set(pt.id,{x:cx,y:cy+r});continue}
      if(pt.id==='left'){coords.set(pt.id,{x:cx-r,y:cy});continue}
    }
    coords.set(pt.id,{x:P+pt.col*cW,y:P+pt.row*cH})
  }
  return (
    <svg width={S} height={S} style={{display:'block',margin:'0 auto'}}>
      {def.variant==='cross' && <circle cx={S/2} cy={S/2} r={S/2-P} fill='none' stroke='#aaa' strokeWidth='1' />}
      {def.edges.map(([a,b],i)=>{ const pa=coords.get(a),pb=coords.get(b); if(!pa||!pb) return null; return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke='#999' strokeWidth='1' /> })}
      {def.points.map(pt=>{ const c=coords.get(pt.id); if(!c) return null; const cell=def.initialPieces[pt.id]; return cell!=='empty'?<circle key={pt.id} cx={c.x} cy={c.y} r={6} fill={cell==='ai'?'#d32f2f':'#1976d2'} stroke='white' strokeWidth='1' />:<circle key={pt.id} cx={c.x} cy={c.y} r={3} fill='#ccc' /> })}
    </svg>
  )
}

// Select screen
function SelectScreen({ onSelect }: { onSelect: (d:GonuBoardDef)=>void }) {
  return (
    <div className='content-card' style={{maxWidth:700,margin:'0 auto'}}>
      <h3>고누 판 선택</h3>
      <button onClick={()=>onSelect(GONU_VARIANTS[Math.floor(Math.random()*GONU_VARIANTS.length)])} style={{width:'100%',padding:'0.9rem',marginBottom:'1rem',background:'linear-gradient(135deg,#667eea,#764ba2)',color:'white',border:'none',borderRadius:10,fontSize:'1rem',fontWeight:'bold',cursor:'pointer'}}>
        랜덤으로 시작하기
      </button>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:'1rem'}}>
        {GONU_VARIANTS.map(d=>(
          <button key={d.variant} onClick={()=>onSelect(d)} style={{border:'2px solid #e0e0e0',borderRadius:12,padding:'1rem 0.5rem',background:'white',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.5rem'}}>
            <Preview def={d} />
            <div style={{fontWeight:'bold',fontSize:'0.85rem'}}>{d.name}</div>
            <div style={{fontSize:'0.72rem',color:'#888',textAlign:'center',lineHeight:1.4}}>{d.description}</div>
          </button>
        ))}
      </div>
      <div style={{marginTop:'1rem',padding:'1rem',background:'#e3f2fd',borderRadius:8,fontSize:'0.85rem',color:'#1565c0'}}>
        연결된 빈 칸으로 1칸 이동. 상대방이 이동할 수 없게 만들면 승리!
      </div>
    </div>
  )
}

// Main
export default function MinimaxSection({ onComplete }: MinimaxSectionProps) {
  const [phase, setPhase] = useState<GamePhase>('select')
  const [def, setDef] = useState<GonuBoardDef>(GONU_VARIANTS[0])
  const [pieces, setPieces] = useState<Record<string,'player'|'ai'|'empty'>>(clonePieces(GONU_VARIANTS[0].initialPieces))
  const [turn, setTurn] = useState<Turn>('player')
  const [selId, setSelId] = useState<string|null>(null)
  const [validMoves, setValidMoves] = useState<GonuMove[]>([])
  const [winner, setWinner] = useState<'player'|'ai'|null>(null)
  const [msg, setMsg] = useState('파란 말을 클릭하세요.')
  const [aiThinking, setAiThinking] = useState(false)
  const [scores, setScores] = useState<Map<string,number>>(new Map())
  const [bestId, setBestId] = useState<string|null>(null)
  const [selPieceId, setSelPieceId] = useState<string|null>(null)
  const [tree, setTree] = useState<MiniTreeNode|null>(null)
  const [visited, setVisited] = useState<Set<string>>(new Set())

  const serial = (p: Record<string,'player'|'ai'|'empty'>) => Object.entries(p).sort().map(([k,v])=>`${k}:${v}`).join(',')

  const checkEnd = useCallback((p: Record<string,'player'|'ai'|'empty'>): 'player'|'ai'|null => {
    if (getValidMovesForDef(p,'player',def).length===0) return 'ai'
    if (getValidMovesForDef(p,'ai',def).length===0) return 'player'
    return null
  }, [def])

  const doAI = useCallback((p: Record<string,'player'|'ai'|'empty'>, vis: Set<string>) => {
    setAiThinking(true); setMsg('AI가 생각 중...')
    setTimeout(() => {
      const t = minimaxWithTree(p, 2, true, def, new Set(vis))
      setTree(t)
      const r = minimaxForDef(p, 1, true, def, new Set(vis))
      if (!r.move) { setWinner('player'); setPhase('ended'); setAiThinking(false); return }
      const next = applyPiecesMove(p, r.move, def)
      setPieces(next)
      const nv = new Set(vis); nv.add(serial(next)); setVisited(nv)
      const w = checkEnd(next)
      if (w) { setWinner(w); setPhase('ended') }
      else { setTurn('player'); setMsg('파란 말을 클릭하세요.') }
      setAiThinking(false)
    }, 400)
  }, [def, checkEnd])

  const handleClick = useCallback((ptId: string) => {
    if (turn!=='player'||phase!=='playing'||aiThinking) return
    const cell = pieces[ptId]
    const tgtMove = validMoves.find(m => { const p=def.points.find(x=>x.row===m.to.row&&x.col===m.to.col); return p?.id===ptId })
    if (tgtMove) {
      const next = applyPiecesMove(pieces, tgtMove, def)
      setPieces(next)
      const nv = new Set(visited); nv.add(serial(next)); setVisited(nv)
      setSelId(null); setValidMoves([]); setScores(new Map()); setBestId(null); setSelPieceId(null)
      const w = checkEnd(next)
      if (w) { setWinner(w); setPhase('ended'); return }
      setTurn('ai'); doAI(next, nv); return
    }
    if (cell==='player') {
      setSelId(ptId); setSelPieceId(ptId)
      const moves = getValidMovesForDef(pieces,'player',def,visited).filter(m => { const p=def.points.find(x=>x.row===m.from.row&&x.col===m.from.col); return p?.id===ptId })
      setValidMoves(moves)
      const sc = new Map<string,number>(); let bs=Infinity, bi:string|null=null
      for (const mv of moves) {
        const nx = applyPiecesMove(pieces,mv,def)
        const r = minimaxForDef(nx,1,true,def,new Set(visited))
        const tp = def.points.find(p=>p.row===mv.to.row&&p.col===mv.to.col)
        if (tp) { sc.set(tp.id,r.score); if(r.score<bs){bs=r.score;bi=tp.id} }
      }
      setScores(sc); setBestId(bi)
      setMsg(moves.length>0?'이동할 위치를 선택하세요.':'이 말은 이동할 수 없습니다.')
      return
    }
    setSelId(null); setValidMoves([]); setScores(new Map()); setBestId(null); setSelPieceId(null)
    setMsg('파란 말을 클릭하세요.')
  }, [turn,phase,aiThinking,pieces,validMoves,def,visited,checkEnd,doAI])

  const startGame = (d: GonuBoardDef) => {
    setDef(d); setPieces(clonePieces(d.initialPieces))
    setPhase('playing'); setTurn('player')
    setSelId(null); setValidMoves([]); setScores(new Map()); setBestId(null)
    setSelPieceId(null); setWinner(null); setTree(null); setVisited(new Set())
    setMsg('파란 말을 클릭하세요.'); setAiThinking(false)
  }

  if (phase==='select') return (
    <div className='section'>
      <h2 className='section-title'>미니맥스 알고리즘 - 고누 게임</h2>
      <SelectScreen onSelect={startGame} />
    </div>
  )

  const aiCnt = Object.values(pieces).filter(v=>v==='ai').length
  const plCnt = Object.values(pieces).filter(v=>v==='player').length

  return (
    <div className='section'>
      <h2 className='section-title'>미니맥스 알고리즘 - {def.name}</h2>
      <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap',alignItems:'flex-start'}}>
        <div className='content-card' style={{flex:'0 0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
            <h3 style={{margin:0}}>{def.name}</h3>
            <button onClick={()=>setPhase('select')} style={{fontSize:'0.8rem',padding:'0.3rem 0.75rem',borderRadius:6,border:'1px solid #ccc',background:'#f5f5f5',cursor:'pointer'}}>다른 고누 선택</button>
          </div>
          <div style={{padding:'0.6rem 1rem',borderRadius:6,marginBottom:'1rem',background:phase==='ended'?(winner==='player'?'#e8f5e9':'#ffebee'):'#e3f2fd',color:phase==='ended'?(winner==='player'?'#2e7d32':'#c62828'):'#1565c0',fontWeight:'bold',fontSize:'1rem'}}>
            {phase==='ended'?(winner==='player'?'플레이어 승리! (AI 이동 불가)':'AI 승리! (플레이어 이동 불가)'):msg}
          </div>
          <div style={{marginBottom:'0.75rem',fontSize:13,color:'#666',display:'flex',gap:'1rem'}}>
            <span>차례: <strong>{turn==='player'?'플레이어':'AI'}</strong></span>
            <span style={{color:'#1976d2'}}>나: {plCnt}개</span>
            <span style={{color:'#d32f2f'}}>AI: {aiCnt}개</span>
          </div>
          <BoardSVG def={def} pieces={pieces} selId={selId} validMoves={validMoves} onClick={handleClick} disabled={turn!=='player'||phase!=='playing'||aiThinking} scores={scores} bestId={bestId} />
          <div className='controls' style={{marginTop:'1rem'}}>
            <button className='control-btn' onClick={()=>startGame(generateRandomGonuVariant())}>새 판 (랜덤)</button>
            {phase==='ended' && <>
              <button className='control-btn' onClick={()=>setPhase('select')}>판 선택</button>
              <button className='complete-btn' onClick={onComplete}>학습 완료</button>
            </>}
          </div>
        </div>
        <div className='content-card' style={{flex:'1 1 260px',minWidth:240}}>
          <h3>미니맥스 분석</h3>
          {aiThinking ? (
            <div style={{textAlign:'center',padding:'2rem',color:'#999'}}><div style={{fontSize:'2rem'}}>AI가 계산 중...</div></div>
          ) : selPieceId===null ? (
            <div style={{padding:'1rem',background:'#f5f5f5',borderRadius:8,color:'#666',lineHeight:1.7}}>
              <div style={{fontWeight:'bold',color:'#1976d2',marginBottom:'0.5rem'}}>사용 방법</div>
              파란 말을 클릭하면 각 이동의 승률을 분석해드립니다.
            </div>
          ) : (
            <div>
              <div style={{marginBottom:'0.5rem',fontSize:'0.9rem',color:'#555'}}>선택한 말: <strong>{selPieceId}</strong></div>
              {validMoves.length===0 ? <div style={{color:'#f44336',fontSize:'0.85rem'}}>이동 가능한 위치가 없습니다.</div> : (
                validMoves.map(mv => {
                  const tp=def.points.find(p=>p.row===mv.to.row&&p.col===mv.to.col); if(!tp) return null
                  const sc=scores.get(tp.id)??0, isBest=tp.id===bestId
                  const wr=Math.max(0,Math.min(100,Math.round(((-sc+6)/12)*100)))
                  return (
                    <div key={tp.id} style={{padding:'0.6rem 0.75rem',borderRadius:8,marginBottom:'0.4rem',background:isBest?'#e8f5e9':'#f5f5f5',border:isBest?'2px solid #4caf50':'1px solid #e0e0e0'}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.3rem'}}>
                        <span style={{fontSize:'0.88rem',fontWeight:isBest?'bold':'normal'}}>{tp.id} {isBest?'추천':''}</span>
                        <span style={{fontSize:'0.88rem',fontWeight:'bold',color:isBest?'#2e7d32':'#555'}}>{wr}%</span>
                      </div>
                      <div style={{background:'#e0e0e0',borderRadius:4,height:8,overflow:'hidden'}}>
                        <div style={{width:`${wr}%`,height:'100%',borderRadius:4,background:isBest?'#4caf50':wr>50?'#1976d2':'#f44336',transition:'width 0.3s'}} />
                      </div>
                    </div>
                  )
                })
              )}
              {bestId && <div style={{marginTop:'0.5rem',padding:'0.6rem',background:'#e8f5e9',borderRadius:8,fontSize:'0.85rem',color:'#2e7d32',fontWeight:'bold'}}>{bestId} 위치로 이동하세요!</div>}
            </div>
          )}
          {tree && (
            <div style={{marginTop:'1rem'}}>
              <div style={{fontWeight:'bold',fontSize:'0.85rem',color:'#555',marginBottom:'0.5rem'}}>AI 미니맥스 탐색 트리 (*=선택 경로)</div>
              <div style={{overflowX:'auto',padding:'0.5rem',background:'#fafafa',borderRadius:8,border:'1px solid #eee'}}>
                <MiniTreeView node={tree} />
              </div>
              <div style={{fontSize:'0.75rem',color:'#888',marginTop:'0.4rem'}}>
                <span style={{color:'#d32f2f',fontWeight:'bold'}}>MAX</span>=AI(점수 최대화) 
                <span style={{color:'#1976d2',fontWeight:'bold'}}>MIN</span>=플레이어(점수 최소화)
              </div>
            </div>
          )}
          <div style={{marginTop:'1rem',padding:'0.75rem',background:'#e3f2fd',borderRadius:8,fontSize:'0.8rem',color:'#1565c0',lineHeight:1.7}}>
            <strong>승률 해석</strong><br />높을수록 플레이어에게 유리한 이동입니다.
          </div>
          <div style={{marginTop:'1rem',display:'flex',flexWrap:'wrap',gap:'0.4rem'}}>
            {GONU_VARIANTS.map(d=>(
              <button key={d.variant} onClick={()=>startGame(d)} style={{padding:'0.3rem 0.6rem',borderRadius:6,fontSize:'0.78rem',border:d.variant===def.variant?'2px solid #667eea':'1px solid #ddd',background:d.variant===def.variant?'#eef0ff':'white',cursor:'pointer',fontWeight:d.variant===def.variant?'bold':'normal',color:d.variant===def.variant?'#667eea':'#555'}}>{d.name}</button>
            ))}
          </div>
        </div>
      </div>
      <div className='content-card' style={{marginTop:'1.5rem'}}>
        <h3>미니맥스 알고리즘 동작 원리</h3>
        <p>미니맥스(Minimax)는 두 플레이어 게임에서 최적의 수를 찾는 알고리즘입니다. 고누에서는 <strong>상대가 이동 못하게 막는 것이 목표</strong>입니다. AI는 depth=1로 탐색하여 사람이 이기기 쉽습니다.</p>
      </div>
    </div>
  )
}
