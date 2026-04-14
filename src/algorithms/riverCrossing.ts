import { RiverCrossingState, Entity, SearchStep, SearchTreeNode, NodeStatus } from '../types/index'

export function serializeState(state: RiverCrossingState): string {
  return `${[...state.leftBank].sort().join(',')}|${state.farmerSide}`
}

export function isViolation(state: RiverCrossingState): boolean {
  const alone = state.farmerSide === 'left' ? state.rightBank : state.leftBank
  const foxChicken = alone.includes('fox') && alone.includes('chicken')
  const chickenGrain = alone.includes('chicken') && alone.includes('grain')
  return foxChicken || chickenGrain
}

export function isGoal(state: RiverCrossingState): boolean {
  return state.rightBank.length === 4  // 모든 객체가 우안
}

export function getNextStates(state: RiverCrossingState): { state: RiverCrossingState; action: string }[] {
  const results: { state: RiverCrossingState; action: string }[] = []
  const fromBank = state.farmerSide === 'left' ? state.leftBank : state.rightBank
  const toSide = state.farmerSide === 'left' ? 'right' : 'left'

  // 농부 혼자 이동
  const aloneState: RiverCrossingState = {
    leftBank: state.farmerSide === 'left'
      ? state.leftBank.filter(e => e !== 'farmer')
      : [...state.leftBank, 'farmer'],
    rightBank: state.farmerSide === 'right'
      ? state.rightBank.filter(e => e !== 'farmer')
      : [...state.rightBank, 'farmer'],
    farmerSide: toSide,
  }
  if (!isViolation(aloneState)) {
    results.push({ state: aloneState, action: '농부 혼자 이동' })
  }

  // 농부와 함께 이동 가능한 객체 (farmer 제외)
  const companions = fromBank.filter(e => e !== 'farmer')
  for (const entity of companions) {
    const newLeftBank = state.farmerSide === 'left'
      ? state.leftBank.filter(e => e !== 'farmer' && e !== entity)
      : [...state.leftBank, 'farmer', entity]
    const newRightBank = state.farmerSide === 'right'
      ? state.rightBank.filter(e => e !== 'farmer' && e !== entity)
      : [...state.rightBank, 'farmer', entity]

    const nextState: RiverCrossingState = {
      leftBank: newLeftBank,
      rightBank: newRightBank,
      farmerSide: toSide,
    }
    if (!isViolation(nextState)) {
      const entityNames: Record<Entity, string> = {
        farmer: '농부',
        fox: '여우',
        chicken: '닭',
        grain: '곡식',
      }
      results.push({ state: nextState, action: `농부 + ${entityNames[entity]} 이동` })
    }
  }

  return results
}

const INITIAL_STATE: RiverCrossingState = {
  leftBank: ['farmer', 'fox', 'chicken', 'grain'],
  rightBank: [],
  farmerSide: 'left',
}

let nodeIdCounter = 0
function nextNodeId(): string {
  return `node-${nodeIdCounter++}`
}

export function computeDFSSteps(): SearchStep[] {
  nodeIdCounter = 0
  const steps: SearchStep[] = []
  const visited = new Set<string>()
  const allNodes = new Map<string, SearchTreeNode>()

  const rootId = nextNodeId()
  const rootNode: SearchTreeNode = {
    id: rootId,
    state: INITIAL_STATE,
    parentId: null,
    children: [],
    status: 'visiting',
    depth: 0,
    action: '시작',
  }
  allNodes.set(rootId, rootNode)

  // DFS 스택: [nodeId, state, depth, parentId, action]
  type StackEntry = { nodeId: string; state: RiverCrossingState; depth: number; parentId: string | null; action: string }
  const stack: StackEntry[] = [{ nodeId: rootId, state: INITIAL_STATE, depth: 0, parentId: null, action: '시작' }]

  function snapshot(nodeId: string, status: NodeStatus, message: string, queue?: RiverCrossingState[]) {
    const node = allNodes.get(nodeId)!
    node.status = status
    steps.push({
      stepIndex: steps.length,
      state: node.state,
      nodeId,
      parentNodeId: node.parentId,
      status,
      depth: node.depth,
      allNodes: Array.from(allNodes.values()).map(n => ({ ...n, children: [...n.children] })),
      queue,
      message,
    })
  }

  while (stack.length > 0) {
    const entry = stack.pop()!
    const { nodeId, state, depth } = entry
    const serialized = serializeState(state)

    if (visited.has(serialized)) {
      snapshot(nodeId, 'visited', `이미 방문한 상태 (중복 제거)`)
      continue
    }

    visited.add(serialized)
    snapshot(nodeId, 'visiting', `깊이 ${depth}: 상태 방문 중`)

    if (isGoal(state)) {
      snapshot(nodeId, 'goal', `목표 상태 도달! 모든 객체가 우안에 있습니다.`)
      break
    }

    const nexts = getNextStates(state)

    if (nexts.length === 0) {
      snapshot(nodeId, 'dead-end', `막다른 상태: 이동 가능한 유효한 상태 없음`)
      continue
    }

    snapshot(nodeId, 'visited', `상태 방문 완료, 자식 ${nexts.length}개 탐색 예정`)

    // 스택에 역순으로 추가 (첫 번째 자식이 먼저 처리되도록)
    for (let i = nexts.length - 1; i >= 0; i--) {
      const { state: nextState, action } = nexts[i]
      const nextSerialized = serializeState(nextState)
      if (!visited.has(nextSerialized)) {
        const childId = nextNodeId()
        const childNode: SearchTreeNode = {
          id: childId,
          state: nextState,
          parentId: nodeId,
          children: [],
          status: 'unvisited',
          depth: depth + 1,
          action,
        }
        allNodes.set(childId, childNode)
        const parentNode = allNodes.get(nodeId)!
        parentNode.children.push(childId)
        stack.push({ nodeId: childId, state: nextState, depth: depth + 1, parentId: nodeId, action })
      }
    }
  }

  return steps
}

export function computeBFSSteps(): SearchStep[] {
  nodeIdCounter = 0
  const steps: SearchStep[] = []
  const visited = new Set<string>()
  const allNodes = new Map<string, SearchTreeNode>()

  const rootId = nextNodeId()
  const rootNode: SearchTreeNode = {
    id: rootId,
    state: INITIAL_STATE,
    parentId: null,
    children: [],
    status: 'visiting',
    depth: 0,
    action: '시작',
  }
  allNodes.set(rootId, rootNode)
  visited.add(serializeState(INITIAL_STATE))

  type QueueEntry = { nodeId: string; state: RiverCrossingState; depth: number }
  const queue: QueueEntry[] = [{ nodeId: rootId, state: INITIAL_STATE, depth: 0 }]

  function snapshot(nodeId: string, status: NodeStatus, message: string, bfsQueue?: RiverCrossingState[]) {
    const node = allNodes.get(nodeId)!
    node.status = status
    steps.push({
      stepIndex: steps.length,
      state: node.state,
      nodeId,
      parentNodeId: node.parentId,
      status,
      depth: node.depth,
      allNodes: Array.from(allNodes.values()).map(n => ({ ...n, children: [...n.children] })),
      queue: bfsQueue,
      message,
    })
  }

  while (queue.length > 0) {
    const entry = queue.shift()!
    const { nodeId, state, depth } = entry
    const currentQueue = queue.map(e => e.state)

    snapshot(nodeId, 'visiting', `깊이 ${depth}: 상태 방문 중`, currentQueue)

    if (isGoal(state)) {
      snapshot(nodeId, 'goal', `목표 상태 도달! 최단 경로 (깊이 ${depth})`, [])
      break
    }

    const nexts = getNextStates(state)

    if (nexts.length === 0) {
      snapshot(nodeId, 'dead-end', `막다른 상태: 이동 가능한 유효한 상태 없음`, currentQueue)
      continue
    }

    snapshot(nodeId, 'visited', `상태 방문 완료, 자식 ${nexts.length}개 큐에 추가`, currentQueue)

    for (const { state: nextState, action } of nexts) {
      const nextSerialized = serializeState(nextState)
      if (!visited.has(nextSerialized)) {
        visited.add(nextSerialized)
        const childId = nextNodeId()
        const childNode: SearchTreeNode = {
          id: childId,
          state: nextState,
          parentId: nodeId,
          children: [],
          status: 'unvisited',
          depth: depth + 1,
          action,
        }
        allNodes.set(childId, childNode)
        const parentNode = allNodes.get(nodeId)!
        parentNode.children.push(childId)
        queue.push({ nodeId: childId, state: nextState, depth: depth + 1 })
      }
    }

    const updatedQueue = queue.map(e => e.state)
    snapshot(nodeId, 'visited', `큐 업데이트: ${queue.length}개 대기 중`, updatedQueue)
  }

  return steps
}
