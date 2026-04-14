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

/**
 * 위반 상태도 포함한 모든 다음 상태 반환
 */
function getAllNextStates(state: RiverCrossingState): { state: RiverCrossingState; action: string; isViolation: boolean }[] {
  const results: { state: RiverCrossingState; action: string; isViolation: boolean }[] = []
  const fromBank = state.farmerSide === 'left' ? state.leftBank : state.rightBank
  const toSide = state.farmerSide === 'left' ? 'right' : 'left'

  const entityNames: Record<Entity, string> = {
    farmer: '농부',
    fox: '여우',
    chicken: '닭',
    grain: '곡식',
  }

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
  results.push({ state: aloneState, action: '농부 혼자 이동', isViolation: isViolation(aloneState) })

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
    results.push({ state: nextState, action: `농부 + ${entityNames[entity]} 이동`, isViolation: isViolation(nextState) })
  }

  return results
}

export function getNextStates(state: RiverCrossingState): { state: RiverCrossingState; action: string }[] {
  return getAllNextStates(state)
    .filter(r => !r.isViolation)
    .map(r => ({ state: r.state, action: r.action }))
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

/**
 * 금지 상태를 포함한 전체 상태 공간 트리 계산 (최대 깊이 7)
 * - 위반 상태: status='dead-end'
 * - 사이클(이미 방문): status='visited', 자식 없음
 * - 목표 상태: status='goal'
 * - 일반 상태: status='unvisited'
 */
export function computeFullStateTree(): SearchTreeNode[] {
  nodeIdCounter = 0
  const allNodes = new Map<string, SearchTreeNode>()
  const MAX_DEPTH = 7

  const rootId = nextNodeId()
  const rootNode: SearchTreeNode = {
    id: rootId,
    state: INITIAL_STATE,
    parentId: null,
    children: [],
    status: 'unvisited',
    depth: 0,
    action: '시작',
  }
  allNodes.set(rootId, rootNode)

  // BFS로 전체 트리 구성
  type QueueEntry = { nodeId: string; state: RiverCrossingState; depth: number; visitedOnPath: Set<string> }
  const queue: QueueEntry[] = [{
    nodeId: rootId,
    state: INITIAL_STATE,
    depth: 0,
    visitedOnPath: new Set([serializeState(INITIAL_STATE)]),
  }]

  while (queue.length > 0) {
    const entry = queue.shift()!
    const { nodeId, state, depth, visitedOnPath } = entry
    const node = allNodes.get(nodeId)!

    if (isGoal(state)) {
      node.status = 'goal'
      continue
    }

    if (depth >= MAX_DEPTH) continue

    const nexts = getAllNextStates(state)

    for (const { state: nextState, action, isViolation: violation } of nexts) {
      const childId = nextNodeId()
      const serialized = serializeState(nextState)

      if (violation) {
        // 위반 상태: dead-end로 표시, 자식 없음
        const childNode: SearchTreeNode = {
          id: childId,
          state: nextState,
          parentId: nodeId,
          children: [],
          status: 'dead-end',
          depth: depth + 1,
          action,
        }
        allNodes.set(childId, childNode)
        node.children.push(childId)
      } else if (visitedOnPath.has(serialized)) {
        // 사이클: visited로 표시, 자식 없음
        const childNode: SearchTreeNode = {
          id: childId,
          state: nextState,
          parentId: nodeId,
          children: [],
          status: 'visited',
          depth: depth + 1,
          action,
        }
        allNodes.set(childId, childNode)
        node.children.push(childId)
      } else {
        // 일반 상태
        const childNode: SearchTreeNode = {
          id: childId,
          state: nextState,
          parentId: nodeId,
          children: [],
          status: isGoal(nextState) ? 'goal' : 'unvisited',
          depth: depth + 1,
          action,
        }
        allNodes.set(childId, childNode)
        node.children.push(childId)

        if (!isGoal(nextState)) {
          const newVisited = new Set(visitedOnPath)
          newVisited.add(serialized)
          queue.push({ nodeId: childId, state: nextState, depth: depth + 1, visitedOnPath: newVisited })
        }
      }
    }
  }

  return Array.from(allNodes.values())
}

export function computeDFSSteps(): SearchStep[] {
  nodeIdCounter = 0
  const steps: SearchStep[] = []
  const visited = new Set<string>()

  // 전체 트리를 먼저 계산
  const fullTree = computeFullStateTree()
  // nodeIdCounter를 리셋하지 않고 계속 사용 (전체 트리 이후 ID 부여)
  // DFS용 별도 노드 맵 구성
  const allNodes = new Map<string, SearchTreeNode>()

  // 전체 트리 노드를 allNodes에 복사 (상태는 unvisited로 초기화)
  for (const node of fullTree) {
    allNodes.set(node.id, {
      ...node,
      children: [...node.children],
      status: node.status === 'dead-end' || node.status === 'visited' ? node.status : 'unvisited',
    })
  }

  // 루트 노드 ID (첫 번째 노드)
  const rootNode = fullTree.find(n => n.parentId === null)
  if (!rootNode) return steps

  const rootId = rootNode.id

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

    // 전체 트리에서 이 노드의 자식 중 유효한(dead-end/visited 아닌) 것만 스택에 추가
    const nodeInTree = allNodes.get(nodeId)!
    const validChildIds = nodeInTree.children.filter(cid => {
      const child = allNodes.get(cid)!
      return child.status !== 'dead-end'
    })

    // 역순으로 스택에 추가 (첫 번째 자식이 먼저 처리되도록)
    for (let i = validChildIds.length - 1; i >= 0; i--) {
      const childId = validChildIds[i]
      const childNode = allNodes.get(childId)!
      const childSerialized = serializeState(childNode.state)
      if (!visited.has(childSerialized)) {
        stack.push({
          nodeId: childId,
          state: childNode.state,
          depth: childNode.depth,
          parentId: nodeId,
          action: childNode.action,
        })
      }
    }
  }

  return steps
}

export function computeBFSSteps(): SearchStep[] {
  nodeIdCounter = 0
  const steps: SearchStep[] = []
  const visited = new Set<string>()

  // 전체 트리를 먼저 계산
  const fullTree = computeFullStateTree()
  const allNodes = new Map<string, SearchTreeNode>()

  // 전체 트리 노드를 allNodes에 복사 (상태는 unvisited로 초기화)
  for (const node of fullTree) {
    allNodes.set(node.id, {
      ...node,
      children: [...node.children],
      status: node.status === 'dead-end' || node.status === 'visited' ? node.status : 'unvisited',
    })
  }

  const rootNode = fullTree.find(n => n.parentId === null)
  if (!rootNode) return steps

  const rootId = rootNode.id
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

    // 전체 트리에서 이 노드의 유효한 자식만 큐에 추가
    const nodeInTree = allNodes.get(nodeId)!
    for (const childId of nodeInTree.children) {
      const childNode = allNodes.get(childId)!
      if (childNode.status === 'dead-end' || childNode.status === 'visited') continue
      const childSerialized = serializeState(childNode.state)
      if (!visited.has(childSerialized)) {
        visited.add(childSerialized)
        queue.push({ nodeId: childId, state: childNode.state, depth: childNode.depth })
      }
    }

    const updatedQueue = queue.map(e => e.state)
    snapshot(nodeId, 'visited', `큐 업데이트: ${queue.length}개 대기 중`, updatedQueue)
  }

  return steps
}
