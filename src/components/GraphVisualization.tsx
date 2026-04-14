import { Node, Edge } from '../types'
import './GraphVisualization.css'

interface GraphVisualizationProps {
  nodes: Node[];
  edges: Edge[];
  selectedNode?: string | null;
  onNodeClick?: (nodeId: string) => void;
  width?: number;
  height?: number;
}

export default function GraphVisualization({
  nodes,
  edges,
  selectedNode,
  onNodeClick,
  width = 800,
  height = 400,
}: GraphVisualizationProps) {
  return (
    <svg width={width} height={height} className="graph-svg">
      {/* Draw edges */}
      {edges.map((edge, idx) => {
        const fromNode = nodes.find(n => n.id === edge.from)
        const toNode = nodes.find(n => n.id === edge.to)
        if (!fromNode || !toNode) return null

        return (
          <line
            key={idx}
            x1={fromNode.x}
            y1={fromNode.y}
            x2={toNode.x}
            y2={toNode.y}
            className="edge"
          />
        )
      })}

      {/* Draw nodes */}
      {nodes.map(node => (
        <g key={node.id} onClick={() => onNodeClick?.(node.id)}>
          <circle
            cx={node.x}
            cy={node.y}
            r={30}
            className={`node ${node.visited ? 'visited' : ''} ${
              node.current ? 'current' : ''
            } ${node.inPath ? 'in-path' : ''} ${
              selectedNode === node.id ? 'selected' : ''
            }`}
          />
          <text
            x={node.x}
            y={node.y}
            className="node-label"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {node.label}
          </text>
          {node.heuristic !== undefined && (
            <text
              x={node.x}
              y={node.y + 50}
              className="node-info"
              textAnchor="middle"
            >
              h={node.heuristic}
            </text>
          )}
          {node.cost !== undefined && (
            <text
              x={node.x}
              y={node.y + 65}
              className="node-info"
              textAnchor="middle"
            >
              g={node.cost}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
