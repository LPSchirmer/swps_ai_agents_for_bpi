import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Activity, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  RefreshCw,
  AlertCircle,
  Layers,
  Zap,
  Clock,
  DollarSign,
  TrendingUp,
  ChevronDown,
  BarChart3,
  Users
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface ProcessNode {
  id: string;
  label: string;
  type: 'start' | 'end' | 'activity' | 'gateway' | 'event';
  frequency: number;
  duration: number;
}

interface ProcessEdge {
  source: string;
  target: string;
  frequency: number;
  label: string;
}

interface ProcessGraph {
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  metadata: Record<string, unknown>;
}

interface ProcessStatistics {
  activities?: number;
  variants?: number;
  top_activities?: Record<string, number>;
}

// ProcessMetrics Type für die Visualisierungscharts
interface ProcessMetrics {
  overview?: {
    variants: number;
    activities: number;
    resources: number;
  };
  activityCosts?: Array<{
    activity: string;
    totalCost: number;
    meanCost: number;
  }>;
  activityDurations?: Array<{
    activity: string;
    meanDuration: number;
    totalDuration: number;
    frequency: number;
  }>;
  caseDurations?: Array<{
    range: string;
    count: number;
  }>;
  caseDurationStats?: {
    mean: number;
    variance: number;
    standardDeviation: number;
  };
  reworkStats?: Array<{
    activity: string;
    reworkCases: number;
  }>;
  variantStats?: Array<{
    variant: string;
    fullPath: string;
    frequency: number;
    meanDuration: number;
  }>;
  activityFrequency?: Array<{
    name: string;
    value: number;
  }>;
  costDistribution?: {
    total: number;
    mean: number;
    min: number;
    max: number;
    caseCount: number;
  };
}

interface VisualizationResult {
  success: boolean;
  graph?: ProcessGraph;
  image?: string;
  statistics?: ProcessStatistics;
  file_type?: string;
  file_name?: string;
  error?: string;
}

interface ProcessVisualizationProps {
  file?: File;
  visualizationData?: VisualizationResult | null;
  onVisualizationComplete?: (result: VisualizationResult) => void;
  processMetrics?: ProcessMetrics | null;
  mode?: 'graph' | 'metrics' | 'kpis' | 'charts' | 'all';  // graph = nur Graph, kpis = nur KPI-Boxen, charts = nur Diagramme/Tabs, metrics = KPIs+Charts, all = alles
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Muted Tech Farbpalette für Nodes
// Activity = Blau, Start = Grün, Ende = Rot
const getNodeColor = (type: string): string => {
  switch (type) {
    case 'start': return '#22C55E';    // Success Green
    case 'end': return '#EF4444';      // Error Red
    case 'gateway': return '#F59E0B';  // Warning Amber
    case 'event': return '#3B82F6';    // Accent Blue
    case 'activity':
    default: return '#3B82F6';         // Accent Blue - einheitlich für alle Activities
  }
};

// ============================================================
// INTERACTIVE GRAPH COMPONENT
// ============================================================

interface NodePosition {
  x: number;
  y: number;
}

const InteractiveGraph = ({ 
  graph, 
  width = 800, 
  height = 600 
}: { 
  graph: ProcessGraph; 
  width?: number; 
  height?: number;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<ProcessNode | null>(null);
  const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map());
  
  // Drag-State für Pan-Funktionalität
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Mouse-Event-Handler für Drag & Pan
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Nur linke Maustaste
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    
    const dx = (e.clientX - dragStart.x) / zoom;
    const dy = (e.clientY - dragStart.y) / zoom;
    
    setPan(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Mausrad-Zoom
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(Math.max(z * delta, 0.3), 3));
  };

  // Layout-Berechnung für den Graphen (HORIZONTAL: Links nach Rechts)
  useEffect(() => {
    if (!graph.nodes.length) return;

    const positions = new Map<string, NodePosition>();
    
    // Finde Start-Knoten
    const startNodes = graph.nodes.filter(n => n.type === 'start');
    
    // Horizontales Layout: Links nach Rechts
    const padding = 60;
    const nodeHeight = 50;
    const levelWidth = 180;  // Horizontaler Abstand zwischen Levels
    const verticalSpacing = 80; // Vertikaler Abstand zwischen Knoten im gleichen Level
    
    // Berechne Levels basierend auf Kanten
    const levels = new Map<string, number>();
    const incoming = new Map<string, string[]>();
    const outgoing = new Map<string, string[]>();
    
    graph.nodes.forEach(n => {
      incoming.set(n.id, []);
      outgoing.set(n.id, []);
    });
    
    graph.edges.forEach(e => {
      const inc = incoming.get(e.target) || [];
      inc.push(e.source);
      incoming.set(e.target, inc);
      
      const out = outgoing.get(e.source) || [];
      out.push(e.target);
      outgoing.set(e.source, out);
    });
    
    // BFS für Level-Zuweisung
    startNodes.forEach(n => levels.set(n.id, 0));
    const queue = [...startNodes.map(n => n.id)];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLevel = levels.get(current) || 0;
      
      const neighbors = outgoing.get(current) || [];
      neighbors.forEach(neighbor => {
        if (!levels.has(neighbor)) {
          levels.set(neighbor, currentLevel + 1);
          queue.push(neighbor);
        }
      });
    }
    
    // Knoten ohne Level (nicht erreichbar) auf letztes Level
    graph.nodes.forEach(n => {
      if (!levels.has(n.id)) {
        levels.set(n.id, Math.max(...Array.from(levels.values())) + 1);
      }
    });
    
    // Gruppiere nach Level
    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, nodeId) => {
      const group = levelGroups.get(level) || [];
      group.push(nodeId);
      levelGroups.set(level, group);
    });
    
    // Positioniere Knoten HORIZONTAL (Links nach Rechts)
    levelGroups.forEach((nodeIds, level) => {
      // X-Position basiert auf Level (horizontal)
      const x = padding + level * levelWidth;
      
      // Y-Positionen verteilen die Knoten vertikal im gleichen Level
      const totalHeight = nodeIds.length * nodeHeight + (nodeIds.length - 1) * verticalSpacing;
      const startY = Math.max(padding, (height - totalHeight) / 2);
      
      nodeIds.forEach((nodeId, index) => {
        positions.set(nodeId, {
          x,
          y: startY + index * (nodeHeight + verticalSpacing)
        });
      });
    });
    
    setNodePositions(positions);
  }, [graph, width, height]);

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.3));

  // Berechne Kantenpfade (HORIZONTAL: Links nach Rechts)
  const getEdgePath = (edge: ProcessEdge): string => {
    const sourcePos = nodePositions.get(edge.source);
    const targetPos = nodePositions.get(edge.target);
    
    if (!sourcePos || !targetPos) return '';
    
    const nodeWidth = 140;
    const nodeHeight = 50;
    
    // Horizontale Verbindung: Von rechter Seite des Source zur linken Seite des Target
    const sx = sourcePos.x + nodeWidth;  // Rechte Kante des Source
    const sy = sourcePos.y + nodeHeight / 2;  // Mitte vertikal
    const tx = targetPos.x;  // Linke Kante des Target
    const ty = targetPos.y + nodeHeight / 2;  // Mitte vertikal
    
    // Bezier-Kurve für schönere horizontale Kanten
    const midX = (sx + tx) / 2;
    return `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;
  };

  return (
    <div className="relative w-full h-full bg-background-primary rounded-panel overflow-hidden border border-border">
      {/* Toolbar */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-background-elevated hover:bg-border border border-border rounded-button transition-colors duration-150"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-text-secondary" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-background-elevated hover:bg-border border border-border rounded-button transition-colors duration-150"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="absolute top-4 left-4 bg-background-surface border border-border rounded-card p-4 z-10 max-w-xs shadow-card animate-fadeIn">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getNodeColor(selectedNode.type) }}
            />
            <span className="font-medium text-text-primary font-display">{selectedNode.label}</span>
          </div>
          <div className="text-xs text-text-muted space-y-1">
            <div>Typ: {selectedNode.type}</div>
            {selectedNode.frequency > 0 && <div>Frequenz: {selectedNode.frequency}</div>}
            {selectedNode.duration > 0 && <div>Dauer: {selectedNode.duration}s</div>}
          </div>
          <button 
            onClick={() => setSelectedNode(null)}
            className="mt-2 text-xs text-accent hover:text-accent-hover transition-colors duration-150"
          >
            Schließen
          </button>
        </div>
      )}

      {/* SVG Graph */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${-pan.x} ${-pan.y} ${width / zoom} ${height / zoom}`}
        className={`${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        style={{ userSelect: 'none' }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#6B7280"
            />
          </marker>
          
          {/* Subtiler Glow filter (weniger aggressiv) */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid Background (subtiler) */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1F2937" strokeWidth="0.5"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Edges - Graue Kanten, Akzent nur bei Hover */}
        <g className="edges">
          {graph.edges.map((edge, index) => {
            const path = getEdgePath(edge);
            if (!path) return null;
            
            return (
              <g key={`edge-${index}`}>
                <path
                  d={path}
                  fill="none"
                  stroke="#374151"
                  strokeWidth="1.5"
                  markerEnd="url(#arrowhead)"
                  className="transition-all duration-200 hover:stroke-accent"
                />
                {edge.frequency > 0 && (
                  <text
                    x={((nodePositions.get(edge.source)?.x || 0) + 140 + (nodePositions.get(edge.target)?.x || 0)) / 2}
                    y={((nodePositions.get(edge.source)?.y || 0) + (nodePositions.get(edge.target)?.y || 0)) / 2 + 25 - 5}
                    fill="#6B7280"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {edge.frequency}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Nodes - Dunkle Cards mit farbigem Border */}
        <g className="nodes">
          {graph.nodes.map((node) => {
            const pos = nodePositions.get(node.id);
            if (!pos) return null;

            const nodeWidth = 140;
            const nodeHeight = 50;
            const isSelected = selectedNode?.id === node.id;
            // Einheitliche Farben: Activity = Blau, Start = Grün, Ende = Rot
            const nodeColor = getNodeColor(node.type);

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer"
              >
                {/* Node background - dunkle Card mit farbigem Border */}
                <rect
                  width={nodeWidth}
                  height={nodeHeight}
                  rx="10"
                  fill={isSelected ? '#151F2E' : '#111827'}
                  stroke={nodeColor}
                  strokeWidth={isSelected ? 2.5 : 2}
                  strokeOpacity={isSelected ? 1 : 0.6}
                  filter={isSelected ? "url(#glow)" : undefined}
                  className="transition-all duration-200"
                />
                
                {/* Node type indicator - gleiche Farbe wie der Border */}
                <circle
                  cx="15"
                  cy={nodeHeight / 2}
                  r="5"
                  fill={nodeColor}
                />
                
                {/* Node label */}
                <text
                  x={nodeWidth / 2 + 5}
                  y={nodeHeight / 2}
                  fill={isSelected ? '#E5E7EB' : '#9CA3AF'}
                  fontSize="11"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-medium pointer-events-none transition-all duration-200"
                >
                  {node.label.length > 12 ? node.label.slice(0, 12) + '...' : node.label}
                </text>

                {/* Frequency badge - gedämpfter */}
                {node.frequency > 0 && (
                  <g transform={`translate(${nodeWidth - 20}, -8)`}>
                    <rect
                      width="24"
                      height="16"
                      rx="8"
                      fill="#3B82F6"
                    />
                    <text
                      x="12"
                      y="12"
                      fill="#FFFFFF"
                      fontSize="9"
                      textAnchor="middle"
                      fontWeight="500"
                    >
                      {node.frequency > 999 ? '999+' : node.frequency}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const ProcessVisualization = ({ 
  file, 
  visualizationData,
  onVisualizationComplete,
  processMetrics,
  mode = 'all'
}: ProcessVisualizationProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VisualizationResult | null>(visualizationData || null);
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [activeMetricTab, setActiveMetricTab] = useState<string>('performance');

  // Farbpaletten für Charts (Muted Tech - keine Neon-Farben!)
  const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#6B7280', '#9CA3AF', '#374151', '#1F2937'];

  // API-Aufruf für Prozessvisualisierung
  const visualizeProcess = useCallback(async (fileToVisualize: File) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', fileToVisualize);

      const response = await fetch('http://localhost:5001/api/visualize-process', {
        method: 'POST',
        body: formData,
      });

      const data: VisualizationResult = await response.json();

      if (data.success) {
        setResult(data);
        onVisualizationComplete?.(data);
      } else {
        setError(data.error || 'Unbekannter Fehler bei der Visualisierung');
      }
    } catch (err) {
      setError(`Netzwerkfehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    } finally {
      setLoading(false);
    }
  }, [onVisualizationComplete]);

  // Automatische Visualisierung bei Datei-Änderung
  useEffect(() => {
    if (file) {
      visualizeProcess(file);
    }
  }, [file, visualizeProcess]);

  // Use provided visualization data
  useEffect(() => {
    if (visualizationData) {
      setResult(visualizationData);
    }
  }, [visualizationData]);

  // Download-Funktion für das Bild
  const downloadImage = () => {
    if (!result?.image) return;
    
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${result.image}`;
    link.download = `process_${result.file_name || 'visualization'}.png`;
    link.click();
  };

  // Metric Tabs Definition - nur Performance, Kosten, Nacharbeit
  const metricTabs = [
    { id: 'performance', label: 'Performance', icon: <Clock className="w-4 h-4" /> },
    { id: 'costs', label: 'Kosten', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'rework', label: 'Nacharbeit', icon: <RefreshCw className="w-4 h-4" /> }
  ];

  // Custom Tooltip für Charts
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background-surface border border-border rounded-card p-3 shadow-card">
          <p className="text-text-primary font-medium mb-2 font-display">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('de-DE') : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Radar-Chart Daten für Übersicht
  const radarData = processMetrics?.overview ? [
    { subject: 'Varianten', A: Math.min(processMetrics.overview.variants, 50), fullMark: 50 },
    { subject: 'Aktivitäten', A: Math.min(processMetrics.overview.activities, 30), fullMark: 30 },
    { subject: 'Ressourcen', A: Math.min(processMetrics.overview.resources, 20), fullMark: 20 }
  ] : [];

  // Loading State
  if (loading) {
    return (
      <div className="bg-background-surface border border-border rounded-panel p-8 flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-12 h-12 text-accent animate-spin mb-4" />
        <p className="text-text-primary text-lg font-display">Prozess wird visualisiert...</p>
        <p className="text-text-muted text-sm mt-2">Analysiere {file?.name || 'Datei'}</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-background-surface border border-error/30 rounded-panel p-8 flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-error mb-4" />
        <p className="text-error text-lg font-medium font-display">Fehler bei der Visualisierung</p>
        <p className="text-text-secondary text-sm mt-2 text-center max-w-md">{error}</p>
        {file && (
          <button
            onClick={() => visualizeProcess(file)}
            className="mt-4 px-4 py-2 bg-background-elevated hover:bg-border border border-border rounded-button text-sm text-text-secondary flex items-center gap-2 transition-colors duration-150"
          >
            <RefreshCw className="w-4 h-4" />
            Erneut versuchen
          </button>
        )}
      </div>
    );
  }

  // No Data State
  if (!result || !result.graph) {
    return (
      <div className="bg-background-surface border border-border rounded-panel p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <Activity className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <p className="text-text-secondary">Keine Prozessvisualisierung verfügbar</p>
        <p className="text-text-muted text-sm mt-2">
          Laden Sie eine BPMN, XES oder CSV Datei hoch
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-background-surface ${mode !== 'metrics' ? 'border border-border rounded-panel shadow-card' : ''} overflow-hidden`}>
      {/* Header - nur anzeigen wenn mode 'graph' oder 'all' */}
      {(mode === 'graph' || mode === 'all') && (
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-accent" />
            <div>
              <h3 className="text-text-primary font-semibold font-display">Prozessvisualisierung</h3>
              <p className="text-text-muted text-sm">
                {result.file_name} • {result.file_type?.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Button */}
            {result.image && (
              <button
                onClick={downloadImage}
                className="p-2 bg-background-elevated hover:bg-border border border-border rounded-button transition-colors duration-150"
                title="Bild herunterladen"
              >
                <Download className="w-4 h-4 text-text-secondary" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Visualization Area - nur anzeigen wenn mode 'graph' oder 'all' */}
      {(mode === 'graph' || mode === 'all') && (
        <div className="relative" style={{ height: '500px' }}>
          <InteractiveGraph graph={result.graph} width={1200} height={500} />
        </div>
      )}

      {/* KPI Statistics - Premium Design - nur anzeigen wenn mode 'kpis', 'metrics' oder 'all' */}
      {(mode === 'kpis' || mode === 'metrics' || mode === 'all') && (result.statistics || processMetrics?.overview) && (
        <div className={mode === 'kpis' ? 'p-4' : 'border-t border-border p-5'}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-text-primary font-display">Prozess-KPIs</h3>
            </div>
            <span className="px-2.5 py-1 bg-accent/10 text-accent text-xs rounded-button font-medium">Live-Daten</span>
          </div>
          
          {/* Vertikales Layout für mode='kpis', Grid für andere Modi */}
          <div className={mode === 'kpis' ? 'flex flex-col gap-3' : 'grid grid-cols-2 md:grid-cols-4 gap-4'}>
            {/* Aktivitäten KPI */}
            <div className="border-2 border-semantic-warning/30 rounded-card overflow-hidden bg-semantic-warning/5 hover:bg-semantic-warning/10 hover:border-semantic-warning/50 transition-all duration-150">
              <button 
                onClick={() => setExpandedKpi(expandedKpi === 'activities' ? null : 'activities')}
                className="w-full flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-semantic-warning/20 rounded-button flex items-center justify-center">
                    <Zap className="w-4 h-4 text-semantic-warning" />
                  </div>
                  <span className="text-semantic-warning text-label font-medium">Aktivitäten</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-semantic-warning text-lg font-display">
                    {(processMetrics?.overview?.activities ?? result.statistics?.activities ?? 0).toLocaleString('de-DE')}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-semantic-warning/70 transition-transform duration-200 ${expandedKpi === 'activities' ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {expandedKpi === 'activities' && (
                <div className="px-3 pb-3 text-xs text-text-secondary bg-background-surface animate-fadeIn">
                  Eindeutige Prozessschritte im Workflow.
                </div>
              )}
            </div>

            {/* Varianten KPI */}
            <div className="border-2 border-purple-500/30 rounded-card overflow-hidden bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all duration-150">
              <button 
                onClick={() => setExpandedKpi(expandedKpi === 'variants' ? null : 'variants')}
                className="w-full flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-button flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-purple-400 text-label font-medium">Varianten</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-purple-400 text-lg font-display">
                    {(processMetrics?.overview?.variants ?? result.statistics?.variants ?? 0).toLocaleString('de-DE')}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-purple-400/70 transition-transform duration-200 ${expandedKpi === 'variants' ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {expandedKpi === 'variants' && (
                <div className="px-3 pb-3 text-xs text-text-secondary bg-background-surface animate-fadeIn">
                  Unterschiedliche Ausführungspfade des Prozesses.
                </div>
              )}
            </div>

            {/* Ressourcen KPI */}
            <div className="border-2 border-accent-highlight/30 rounded-card overflow-hidden bg-accent-highlight/5 hover:bg-accent-highlight/10 hover:border-accent-highlight/50 transition-all duration-150">
              <button 
                onClick={() => setExpandedKpi(expandedKpi === 'resources' ? null : 'resources')}
                className="w-full flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-accent-highlight/20 rounded-button flex items-center justify-center">
                    <Users className="w-4 h-4 text-accent-highlight" />
                  </div>
                  <span className="text-accent-highlight text-label font-medium">Ressourcen</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-accent-highlight text-lg font-display">
                    {(processMetrics?.overview?.resources ?? 0).toLocaleString('de-DE')}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-accent-highlight/70 transition-transform duration-200 ${expandedKpi === 'resources' ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {expandedKpi === 'resources' && (
                <div className="px-3 pb-3 text-xs text-text-secondary bg-background-surface animate-fadeIn">
                  Beteiligte Mitarbeiter, Systeme oder Abteilungen im Prozess.
                </div>
              )}
            </div>

            {/* Durchlaufzeit KPI */}
            {processMetrics?.caseDurationStats && (
              <div className="border-2 border-semantic-success/30 rounded-card overflow-hidden bg-semantic-success/5 hover:bg-semantic-success/10 hover:border-semantic-success/50 transition-all duration-150">
                <button 
                  onClick={() => setExpandedKpi(expandedKpi === 'duration' ? null : 'duration')}
                  className="w-full flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-semantic-success/20 rounded-button flex items-center justify-center">
                      <Clock className="w-4 h-4 text-semantic-success" />
                    </div>
                    <span className="text-semantic-success text-label font-medium">Ø Durchlaufzeit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-semantic-success text-lg font-display">
                      {processMetrics.caseDurationStats.mean >= 1440 
                        ? `${(processMetrics.caseDurationStats.mean / 1440).toFixed(1)} Tage`
                        : processMetrics.caseDurationStats.mean >= 60
                          ? `${(processMetrics.caseDurationStats.mean / 60).toFixed(1)} Std`
                          : `${processMetrics.caseDurationStats.mean.toFixed(0)} Min`
                      }
                    </span>
                    <ChevronDown className={`w-4 h-4 text-semantic-success/70 transition-transform duration-200 ${expandedKpi === 'duration' ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {expandedKpi === 'duration' && (
                  <div className="px-3 pb-3 text-xs text-text-secondary bg-background-surface space-y-1 animate-fadeIn">
                    <p>Durchschnittliche Zeit vom Start bis zum Abschluss eines Falls.</p>
                    <p className="text-text-muted">Standardabweichung: {processMetrics.caseDurationStats.standardDeviation.toFixed(1)} Min</p>
                  </div>
                )}
              </div>
            )}

            {/* Kosten KPI */}
            {processMetrics?.costDistribution && (
              <div className="border-2 border-semantic-error/30 rounded-card overflow-hidden bg-semantic-error/5 hover:bg-semantic-error/10 hover:border-semantic-error/50 transition-all duration-150">
                <button 
                  onClick={() => setExpandedKpi(expandedKpi === 'costs' ? null : 'costs')}
                  className="w-full flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-semantic-error/20 rounded-button flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-semantic-error" />
                    </div>
                    <span className="text-semantic-error text-label font-medium">Ø Prozesskosten</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-semantic-error text-lg font-display">
                      {processMetrics.costDistribution.mean.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-semantic-error/70 transition-transform duration-200 ${expandedKpi === 'costs' ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {expandedKpi === 'costs' && (
                  <div className="px-3 pb-3 text-xs text-text-secondary bg-background-surface space-y-1 animate-fadeIn">
                    <p>Durchschnittliche Kosten pro Prozessdurchlauf.</p>
                    <div className="flex justify-between text-text-muted mt-1">
                      <span>Min: {processMetrics.costDistribution.min.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
                      <span>Max: {processMetrics.costDistribution.max.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
                    </div>
                    <p className="text-text-muted">Gesamt: {processMetrics.costDistribution.total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metrics Visualization Tabs - integriert aus MetricsVisualization - nur anzeigen wenn mode 'charts', 'metrics' oder 'all' */}
      {(mode === 'charts' || mode === 'metrics' || mode === 'all') && processMetrics && (
        <div className="border-t border-border p-5">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-5">
            {metricTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveMetricTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-button transition-all duration-150 ${
                  activeMetricTab === tab.id
                    ? 'bg-accent text-white shadow-button'
                    : 'bg-background-elevated text-text-secondary hover:bg-border hover:text-text-primary border border-border'
                }`}
              >
                {tab.icon}
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Chart Content */}
          <div className="bg-background-elevated rounded-card p-5 border border-border">
            {/* Übersicht - Radar Chart */}
            {activeMetricTab === 'overview' && radarData.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4 font-display">🎯 Prozess-Übersicht</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <PolarRadiusAxis tick={{ fill: '#6B7280', fontSize: 10 }} />
                      <Radar name="Prozess" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                  
                  {/* Aktivitäten Pie Chart */}
                  {processMetrics.activityFrequency && processMetrics.activityFrequency.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={processMetrics.activityFrequency.slice(0, 8)}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }: { name?: string; percent?: number }) => 
                            `${(name || '').slice(0, 10)}${(name || '').length > 10 ? '...' : ''} (${((percent || 0) * 100).toFixed(0)}%)`
                          }
                        >
                          {processMetrics.activityFrequency.slice(0, 8).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* Performance - Aktivitätsdauern */}
            {activeMetricTab === 'performance' && processMetrics.activityDurations && (
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4 font-display">⏱️ Aktivitätsdauern</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={processMetrics.activityDurations.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <YAxis dataKey="activity" type="category" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={120} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="meanDuration" name="Ø Dauer (Std)" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Kosten */}
            {activeMetricTab === 'costs' && processMetrics.activityCosts && (
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4 font-display">💰 Kosten pro Aktivität</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={processMetrics.activityCosts.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="activity" tick={{ fill: '#9CA3AF', fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="totalCost" name="Gesamtkosten (€)" fill="#22C55E" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="meanCost" name="Ø Kosten (€)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Nacharbeit */}
            {activeMetricTab === 'rework' && processMetrics.reworkStats && (
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4 font-display">🔄 Nacharbeit pro Aktivität</h3>
                {processMetrics.reworkStats.filter(r => r.reworkCases > 0).length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={processMetrics.reworkStats.filter(r => r.reworkCases > 0)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                      <YAxis dataKey="activity" type="category" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={120} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="reworkCases" name="Nacharbeits-Cases" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>Keine Nacharbeit erkannt</p>
                  </div>
                )}
              </div>
            )}

            {/* Varianten */}
            {activeMetricTab === 'variants' && processMetrics.variantStats && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">📊 Top Prozessvarianten</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={processMetrics.variantStats.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="variant" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="frequency" name="Häufigkeit" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Fallback wenn keine Daten */}
            {activeMetricTab === 'overview' && radarData.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Keine Übersichtsdaten verfügbar</p>
              </div>
            )}
            {activeMetricTab === 'performance' && !processMetrics.activityDurations && (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Keine Performance-Daten verfügbar</p>
              </div>
            )}
            {activeMetricTab === 'costs' && !processMetrics.activityCosts && (
              <div className="text-center py-8 text-slate-500">
                <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Keine Kostendaten verfügbar</p>
              </div>
            )}
            {activeMetricTab === 'variants' && !processMetrics.variantStats && (
              <div className="text-center py-8 text-slate-500">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Keine Variantendaten verfügbar</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessVisualization;
