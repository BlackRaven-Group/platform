import { useState, useEffect, useRef } from 'react';
import { Users, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getTargetCorrelations, type TargetCorrelation } from '../lib/correlation';

interface NetworkGraphProps {
  dossierId: string;
}

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number;
}

interface GraphEdge {
  source: string;
  target: string;
  strength: number;
  label: string;
}

export default function NetworkGraph({ dossierId }: NetworkGraphProps) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    loadNetworkData();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dossierId]);

  useEffect(() => {
    if (nodes.length > 0) {
      startSimulation();
    }
  }, [nodes, edges]);

  const loadNetworkData = async () => {
    setLoading(true);

    const { data: targets } = await supabase
      .from('targets')
      .select('id, first_name, last_name, code_name')
      .eq('dossier_id', dossierId);

    if (!targets) {
      setLoading(false);
      return;
    }

    const nodeMap = new Map<string, GraphNode>();
    const edgeList: GraphEdge[] = [];

    for (const target of targets) {
      const displayName = target.first_name !== 'ND' && target.last_name !== 'ND'
        ? `${target.first_name} ${target.last_name}`
        : target.code_name;

      nodeMap.set(target.id, {
        id: target.id,
        label: displayName,
        x: Math.random() * 800 - 400,
        y: Math.random() * 600 - 300,
        vx: 0,
        vy: 0,
        connections: 0
      });
    }

    for (const target of targets) {
      const correlations = await getTargetCorrelations(target.id);

      for (const corr of correlations) {
        const otherId = corr.target_a_id === target.id ? corr.target_b_id : corr.target_a_id;

        if (nodeMap.has(otherId)) {
          const existingEdge = edgeList.find(
            e => (e.source === target.id && e.target === otherId) ||
                 (e.source === otherId && e.target === target.id)
          );

          if (!existingEdge) {
            edgeList.push({
              source: target.id,
              target: otherId,
              strength: corr.confidence_score,
              label: corr.correlation_type
            });

            const node = nodeMap.get(target.id)!;
            node.connections++;
            const otherNode = nodeMap.get(otherId)!;
            otherNode.connections++;
          }
        }
      }
    }

    setNodes(Array.from(nodeMap.values()));
    setEdges(edgeList);
    setLoading(false);
  };

  const startSimulation = () => {
    const simulate = () => {
      setNodes(prevNodes => {
        const updated = [...prevNodes];

        for (let i = 0; i < updated.length; i++) {
          updated[i].vx = 0;
          updated[i].vy = 0;
        }

        for (const edge of edges) {
          const sourceIdx = updated.findIndex(n => n.id === edge.source);
          const targetIdx = updated.findIndex(n => n.id === edge.target);

          if (sourceIdx !== -1 && targetIdx !== -1) {
            const dx = updated[targetIdx].x - updated[sourceIdx].x;
            const dy = updated[targetIdx].y - updated[sourceIdx].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const idealDist = 150;
            const force = (dist - idealDist) * 0.01;

            updated[sourceIdx].vx += (dx / dist) * force;
            updated[sourceIdx].vy += (dy / dist) * force;
            updated[targetIdx].vx -= (dx / dist) * force;
            updated[targetIdx].vy -= (dy / dist) * force;
          }
        }

        for (let i = 0; i < updated.length; i++) {
          for (let j = i + 1; j < updated.length; j++) {
            const dx = updated[j].x - updated[i].x;
            const dy = updated[j].y - updated[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            if (dist < 200) {
              const force = 100 / (dist * dist);
              updated[i].vx -= (dx / dist) * force;
              updated[i].vy -= (dy / dist) * force;
              updated[j].vx += (dx / dist) * force;
              updated[j].vy += (dy / dist) * force;
            }
          }
        }

        const centerForce = 0.005;
        for (const node of updated) {
          node.vx -= node.x * centerForce;
          node.vy -= node.y * centerForce;
        }

        const damping = 0.85;
        for (const node of updated) {
          node.x += node.vx;
          node.y += node.vy;
          node.vx *= damping;
          node.vy *= damping;
        }

        return updated;
      });

      drawGraph();
      animationRef.current = requestAnimationFrame(simulate);
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    simulate();
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(zoom, zoom);

    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);

      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        const alpha = Math.min(1, edge.strength / 100);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
        ctx.lineWidth = 1 + (edge.strength / 50);
        ctx.stroke();
      }
    });

    nodes.forEach(node => {
      const isSelected = node.id === selectedNode;
      const radius = 8 + (node.connections * 2);

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#ffffff' : '#27272a';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + radius + 12);
    });

    ctx.restore();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left - canvas.width / 2 - pan.x) / zoom);
    const y = ((e.clientY - rect.top - canvas.height / 2 - pan.y) / zoom);

    for (const node of nodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = 8 + (node.connections * 2);

      if (dist < radius) {
        setSelectedNode(node.id === selectedNode ? null : node.id);
        return;
      }
    }

    setSelectedNode(null);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(3, prev * 1.2));
  const handleZoomOut = () => setZoom(prev => Math.max(0.3, prev / 1.2));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (loading) {
    return (
      <div className="terminal-box flex items-center justify-center h-96">
        <div className="text-green-500 animate-pulse">LOADING NETWORK GRAPH...</div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="terminal-box flex flex-col items-center justify-center h-96">
        <Users className="w-12 h-12 text-green-700 mb-4" />
        <p className="text-green-700">No connections found</p>
        <p className="text-xs text-green-800 mt-2">Run correlation analysis to discover relationships</p>
      </div>
    );
  }

  return (
    <div className="terminal-box">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-green-500">NETWORK GRAPH</h3>
          <p className="text-xs text-green-700">
            {nodes.length} nodes, {edges.length} connections
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleZoomOut} className="terminal-button p-2">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={handleReset} className="terminal-button p-2">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={handleZoomIn} className="terminal-button p-2">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleCanvasClick}
        className="w-full border-2 border-green-900 bg-black cursor-pointer"
        style={{ maxHeight: '600px' }}
      />

      {selectedNode && (
        <div className="mt-4 p-4 border-2 border-green-500 bg-green-950/20">
          <div className="data-label mb-2">SELECTED NODE:</div>
          <div className="text-green-400">
            {nodes.find(n => n.id === selectedNode)?.label}
          </div>
          <div className="text-xs text-green-700 mt-2">
            Connections: {nodes.find(n => n.id === selectedNode)?.connections || 0}
          </div>
        </div>
      )}
    </div>
  );
}
