import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDown, Sparkles, Zap, DollarSign, Shield, Activity, BarChart3, Building2, GitBranch, Database, Loader2, Wand2, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';
import { ProcessMetrics } from './MetricsVisualization';
import ProcessVisualization from './ProcessVisualization';

interface UploadedFile {
  filename: string;
  storedFilename: string;
  fileSize: number;
  uploadTime: string;
}

interface AgentOutputs {
  performance?: string;
  finance?: string;
  compliance?: string;
  requirements?: string;
  economic?: string;
}

// Prozessvisualisierungs-Typen
interface ProcessVisualizationData {
  success: boolean;
  graph?: {
    nodes: Array<{
      id: string;
      label: string;
      type: 'start' | 'end' | 'activity' | 'gateway' | 'event';
      frequency: number;
      duration: number;
    }>;
    edges: Array<{
      source: string;
      target: string;
      frequency: number;
      label: string;
    }>;
    metadata: Record<string, unknown>;
  };
  image?: string;
  statistics?: {
    activities?: number;
    variants?: number;
    top_activities?: Record<string, number>;
  };
  file_type?: string;
  file_name?: string;
  error?: string;
}

interface DashboardProps {
  uploadedFile: { filename: string } | null;
  uploadedFiles?: UploadedFile[];
  processDescription?: string;
  onNewAnalysis: () => void;
  aiAnalysisResult?: string | null;
  agentOutputs?: AgentOutputs | null;
  processMetrics?: ProcessMetrics | null;
  processVisualization?: ProcessVisualizationData | null;
}

const Dashboard = ({ uploadedFile, uploadedFiles = [], processDescription = '', onNewAnalysis, aiAnalysisResult, agentOutputs, processMetrics, processVisualization }: DashboardProps) => {
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [showDetailedCharts, setShowDetailedCharts] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ success: boolean; message: string; filename?: string } | null>(null);
  
  // Prozess-Optimierung States
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<{
    success: boolean;
    explanation?: string;
    xes_content?: string;
    xes_filename?: string;
    error?: string;
    warning?: string;
  } | null>(null);
  const [showOptimizationDetails, setShowOptimizationDetails] = useState(false);
  
  // State für die Visualisierung des optimierten Prozesses
  const [optimizedVisualization, setOptimizedVisualization] = useState<ProcessVisualizationData | null>(null);
  const [isLoadingOptimizedVisualization, setIsLoadingOptimizedVisualization] = useState(false);
  
  // Ref um zu verhindern, dass der Export mehrfach ausgeführt wird
  const hasExportedRef = useRef(false);
  
  // Automatischer Export der Rohdaten beim Laden des Dashboards
  useEffect(() => {
    const autoExportRawData = async () => {
      // Nur einmal exportieren
      if (hasExportedRef.current) return;
      hasExportedRef.current = true;
      
      try {
        console.log('📁 Automatischer Export der Rohdaten...');
        const response = await axios.post('http://localhost:5001/api/export-raw-data', {
          aiAnalysisResult: aiAnalysisResult || '',
          agentOutputs: agentOutputs || {},
          processMetrics: processMetrics || {},
          processDescription: processDescription,
          uploadedFiles: uploadedFiles
        });
        
        if (response.data.success) {
          console.log(`✅ Rohdaten automatisch gespeichert: ${response.data.filename}`);
          setExportStatus({
            success: true,
            message: 'Rohdaten automatisch gespeichert',
            filename: response.data.filename
          });
        } else {
          console.error('❌ Auto-Export fehlgeschlagen:', response.data.error);
        }
      } catch (error) {
        console.error('❌ Auto-Export Fehler:', error);
      }
    };
    
    // Export starten sobald Dashboard geladen ist
    autoExportRawData();
  }, []); // Leeres Dependency-Array = nur beim ersten Render
  
  // Toggle-Funktion für Agenten - mehrere können gleichzeitig offen sein
  const toggleAgent = (agentId: string) => {
    setExpandedAgents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };
  
  // Parse Company und Process aus Requirements-Output
  const complianceMetadata = useMemo(() => {
    if (!agentOutputs?.requirements) return null;
    
    try {
      // Der Requirements Agent gibt JSON zurück - versuche es zu parsen
      const jsonMatch = agentOutputs.requirements.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          company: data.company_name || null,
          process: data.process_name || null,
        };
      }
    } catch (e) {
      // Falls JSON-Parsing fehlschlägt, versuche Regex
      console.warn('Requirements JSON parsing failed, trying regex:', e);
    }
    
    // Fallback: Versuche Regex-Matching
    const companyMatch = agentOutputs.requirements.match(/["']?company_name["']?\s*:\s*["']([^"'\n,}]+)["']?/i);
    const processMatch = agentOutputs.requirements.match(/["']?process_name["']?\s*:\s*["']([^"'\n,}]+)["']?/i);
    
    if (!companyMatch && !processMatch) return null;
    
    return {
      company: companyMatch ? companyMatch[1].trim() : null,
      process: processMatch ? processMatch[1].trim() : null,
    };
  }, [agentOutputs?.requirements]);
  
  // Parse Issue-Counts aus allen Agents
  const agentIssueCounts = useMemo(() => {
    const counts: { performance: number | null; finance: number | null; compliance: number | null } = {
      performance: null,
      finance: null,
      compliance: null,
    };
    
    // Performance Issues
    if (agentOutputs?.performance) {
      const match = agentOutputs.performance.match(/\*\*Performance Issues Found:\*\*\s*(\d+)/i);
      if (match) counts.performance = parseInt(match[1], 10);
    }
    
    // Cost Drivers (Finance)
    if (agentOutputs?.finance) {
      const match = agentOutputs.finance.match(/\*\*Cost Drivers Found:\*\*\s*(\d+)/i);
      if (match) counts.finance = parseInt(match[1], 10);
    }
    
    // Compliance Issues
    if (agentOutputs?.compliance) {
      const match = agentOutputs.compliance.match(/\*\*Compliance Issues Found:\*\*\s*(\d+)/i);
      if (match) counts.compliance = parseInt(match[1], 10);
    }
    
    return counts;
  }, [agentOutputs]);
  
  // Debug: Log wenn Component mountet und bei jeder Änderung
  console.log('📊 Dashboard gerendert mit:', {
    uploadedFile: uploadedFile?.filename,
    uploadedFilesCount: uploadedFiles?.length,
    hasAiResult: !!aiAnalysisResult,
    agentOutputs: agentOutputs,
  });

  const markdownComponents = {
    // Überschriften - einheitliches Styling
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="text-xl font-semibold text-text-primary mb-4 mt-2 font-display border-b border-border/30 pb-2">{children}</h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-lg font-semibold text-accent mt-5 mb-3 font-display">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-base font-medium text-text-primary mt-4 mb-2">{children}</h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
      <h4 className="text-sm font-medium text-text-secondary mt-3 mb-2">{children}</h4>
    ),
    // Absätze und Text
    p: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-text-secondary mb-3 leading-relaxed break-words text-sm">{children}</p>
    ),
    // Listen - einheitlich mit Farbe
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="space-y-2 mb-4 ml-1">{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-decimal list-inside space-y-2 mb-4 text-text-secondary text-sm">{children}</ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li className="text-text-secondary break-words text-sm flex items-start gap-2">
        <span className="text-accent mt-1.5 text-xs">•</span>
        <span className="flex-1">{children}</span>
      </li>
    ),
    // Hervorhebungen
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="text-accent font-semibold">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="text-text-muted italic">{children}</em>
    ),
    // Code-Blöcke
    code: ({ children }: { children?: React.ReactNode }) => (
      <code className="bg-background-elevated px-1.5 py-0.5 rounded text-xs text-accent-highlight font-mono break-all">{children}</code>
    ),
    pre: ({ children }: { children?: React.ReactNode }) => (
      <pre className="bg-background-elevated p-3 rounded-card text-xs overflow-x-auto mb-4 border border-border font-mono">{children}</pre>
    ),
    // Tabellen
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="my-4 border border-border rounded-card overflow-hidden">
        <table className="w-full text-sm table-fixed">{children}</table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => (
      <thead className="bg-background-elevated">{children}</thead>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th className="px-3 py-2 text-left text-xs font-medium text-text-primary border-b border-border break-words">{children}</th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td className="px-3 py-2 text-xs text-text-secondary border-b border-border/50 break-words">{children}</td>
    ),
    // Links
    a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
      <a href={href} className="text-accent hover:text-accent-hover underline break-all" target="_blank" rel="noopener noreferrer">{children}</a>
    ),
    // Zitate
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-4 border-accent/50 pl-4 my-4 text-text-muted italic bg-accent/5 py-2 rounded-r-card">{children}</blockquote>
    ),
    // Horizontale Linie
    hr: () => <hr className="border-border my-4" />,
  };

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      {/* Header */}
      <div className="border-b border-border px-8 py-5">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <span className="text-xl font-semibold font-display">ProcessAI</span>
          <button 
            onClick={onNewAnalysis}
            className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-button font-medium transition-all duration-150 shadow-button hover:-translate-y-0.5"
          >
            Neue Analyse starten
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 py-10">
        
        {/* 1. PROZESSBESCHREIBUNG MIT ALLEN DATEIEN - Zentriert oben */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-5">
            <div className="flex items-center space-x-2 text-success text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Analyse abgeschlossen</span>
            </div>
          </div>
          <h1 className="text-4xl font-semibold mb-6 font-display tracking-tight">Prozessanalyse-Dashboard</h1>
          
          {/* Prozess-Metadaten aus Compliance Agent */}
          {complianceMetadata && (
            <div className="flex flex-wrap gap-4 justify-center mb-6">
              {complianceMetadata.company && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/20 rounded-button">
                  <Building2 className="w-4 h-4 text-text-secondary" />
                  <span className="text-text-muted text-sm">Unternehmen:</span>
                  <span className="text-text-primary font-medium">{complianceMetadata.company}</span>
                </div>
              )}
              {complianceMetadata.process && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/20 rounded-button">
                  <GitBranch className="w-4 h-4 text-text-secondary" />
                  <span className="text-text-muted text-sm">Prozess:</span>
                  <span className="text-text-primary font-medium">{complianceMetadata.process}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Issue-Counts aus allen Agents */}
          {(agentIssueCounts.compliance !== null || agentIssueCounts.performance !== null || agentIssueCounts.finance !== null) && (
            <div className="flex flex-wrap gap-4 justify-center mb-6">
              {agentIssueCounts.compliance !== null && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-accent/15 border border-accent/40 rounded-button shadow-sm">
                  <Shield className="w-5 h-5 text-accent" />
                  <span className="text-text-primary font-semibold text-lg">{agentIssueCounts.compliance}</span>
                  <span className="text-text-muted text-sm">Compliance-Probleme</span>
                </div>
              )}
              {agentIssueCounts.performance !== null && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-semantic-warning/15 border border-semantic-warning/40 rounded-button shadow-sm">
                  <Zap className="w-5 h-5 text-semantic-warning" />
                  <span className="text-text-primary font-semibold text-lg">{agentIssueCounts.performance}</span>
                  <span className="text-text-muted text-sm">Performance-Issues</span>
                </div>
              )}
              {agentIssueCounts.finance !== null && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-semantic-success/15 border border-semantic-success/40 rounded-button shadow-sm">
                  <DollarSign className="w-5 h-5 text-semantic-success" />
                  <span className="text-text-primary font-semibold text-lg">{agentIssueCounts.finance}</span>
                  <span className="text-text-muted text-sm">Kostentreiber</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. HAUPT-LAYOUT: Prozess-Visualisierung LINKS + KPIs RECHTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* LINKS: Prozess-Visualisierung (2/3 Breite) - GRAPH + DIAGRAMME */}
          <div className="lg:col-span-2">
            <div className="bg-background-surface border border-border rounded-panel overflow-hidden shadow-card">
              {processVisualization && processVisualization.success && processVisualization.graph ? (
                <>
                  {/* Prozess-Graph */}
                  <div className="p-6">
                    <ProcessVisualization 
                      visualizationData={processVisualization}
                      processMetrics={processMetrics}
                      mode="graph"
                    />
                  </div>
                  
                  {/* Diagramme mit "Mehr erfahren" Button - DIREKT UNTER DEM GRAPH */}
                  <div className="border-t border-border">
                    <button
                      onClick={() => setShowDetailedCharts(!showDetailedCharts)}
                      className="w-full p-4 flex items-center justify-between hover:bg-background-elevated transition-colors duration-150"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-accent/15 border border-accent/40 rounded-card flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-accent" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-base text-text-primary font-display">Detaillierte KPI-Analyse</h3>
                          <p className="text-text-muted text-xs">Performance, Kosten & Nacharbeit visualisiert</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1.5 bg-accent/10 text-accent text-sm rounded-button font-medium">
                          {showDetailedCharts ? 'Ausblenden' : 'Mehr erfahren'}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-accent transition-transform duration-200 ${showDetailedCharts ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    
                    {showDetailedCharts && (
                      <div className="border-t border-border animate-fadeIn">
                        <ProcessVisualization 
                          visualizationData={processVisualization}
                          processMetrics={processMetrics}
                          mode="charts"
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Fallback: Statische Platzhalter-Visualisierung */
                <div className="p-10">
                  <div className="mb-8 text-center">
                    <h3 className="text-2xl font-semibold mb-2 font-display">Prozess-Visualisierung</h3>
                    <p className="text-text-secondary">Laden Sie eine BPMN, XES oder CSV Datei hoch</p>
                  </div>
                  
                  <div className="bg-background-elevated rounded-card p-16 min-h-[400px] flex flex-col items-center justify-center border border-border">
                    <Activity className="w-16 h-16 text-text-muted mb-4" />
                    <p className="text-text-secondary text-center text-lg">Keine Prozessdaten verfügbar</p>
                    <p className="text-text-muted text-sm text-center mt-2">
                      Unterstützte Formate: XES, BPMN, CSV
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RECHTS: KPIs - Untereinander angeordnet (1/3 Breite) */}
          <div className="flex flex-col h-full">
            {processVisualization && processVisualization.success && processVisualization.graph ? (
              <div className="bg-background-surface border border-border rounded-panel overflow-hidden shadow-card h-full">
                <ProcessVisualization 
                  visualizationData={processVisualization}
                  processMetrics={processMetrics}
                  mode="kpis"
                />
              </div>
            ) : (
              <div className="bg-background-surface border border-border rounded-panel p-6 h-full flex flex-col items-center justify-center">
                <BarChart3 className="w-12 h-12 text-text-muted mb-4" />
                <p className="text-text-secondary text-center">Keine KPIs verfügbar</p>
                <p className="text-text-muted text-sm text-center mt-2">
                  Laden Sie eine Prozessdatei hoch
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. AGENTEN-SEKTION: Compliance, Performance, Finance - Horizontal über volle Breite - TOGGLE */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-3 font-display">
            <Sparkles className="w-5 h-5 text-accent" />
            <span>KI-Agenten Analyse</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Compliance Agent - TOGGLE */}
            <div className="bg-background-surface border-2 border-accent/40 rounded-panel overflow-hidden shadow-card flex flex-col transition-all duration-300 hover:shadow-card-hover hover:border-accent/60">
              <button 
                onClick={() => toggleAgent('compliance')}
                className="w-full p-6 flex items-center justify-between hover:bg-background-elevated transition-colors duration-150"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-accent/15 border border-accent/40 rounded-card flex items-center justify-center">
                    <Shield className="w-7 h-7 text-accent" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-xl text-text-primary font-display">Compliance Agent</h3>
                    <p className="text-text-muted text-sm mt-1">Regulatorische Prüfung</p>
                  </div>
                </div>
                <ChevronDown className={`w-6 h-6 text-accent transition-transform duration-200 ${expandedAgents.has('compliance') ? 'rotate-180' : ''}`} />
              </button>
              
              {expandedAgents.has('compliance') && (
                <div className="border-t border-accent/20 animate-fadeIn">
                  <div className="p-4 bg-accent/5">
                    <div className="bg-background-surface rounded-card p-4 min-h-[350px] max-h-[500px] overflow-y-auto border border-border">
                      {agentOutputs?.compliance ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {agentOutputs.compliance}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-text-muted italic text-sm">Keine Compliance-Analyse verfügbar.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Performance Agent - TOGGLE */}
            <div className="bg-background-surface border-2 border-semantic-warning/40 rounded-panel overflow-hidden shadow-card flex flex-col transition-all duration-300 hover:shadow-card-hover hover:border-semantic-warning/60">
              <button 
                onClick={() => toggleAgent('performance')}
                className="w-full p-6 flex items-center justify-between hover:bg-background-elevated transition-colors duration-150"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-semantic-warning/15 border border-semantic-warning/40 rounded-card flex items-center justify-center">
                    <Zap className="w-7 h-7 text-semantic-warning" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-xl text-text-primary font-display">Performance Agent</h3>
                    <p className="text-text-muted text-sm mt-1">Durchlaufzeiten & Engpässe</p>
                  </div>
                </div>
                <ChevronDown className={`w-6 h-6 text-semantic-warning transition-transform duration-200 ${expandedAgents.has('performance') ? 'rotate-180' : ''}`} />
              </button>
              
              {expandedAgents.has('performance') && (
                <div className="border-t border-semantic-warning/20 animate-fadeIn">
                  <div className="p-4 bg-semantic-warning/5">
                    <div className="bg-background-surface rounded-card p-4 min-h-[350px] max-h-[500px] overflow-y-auto border border-border">
                      {agentOutputs?.performance ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {agentOutputs.performance}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-text-muted italic text-sm">Keine Performance-Analyse verfügbar.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Finance Agent - TOGGLE */}
            <div className="bg-background-surface border-2 border-semantic-success/40 rounded-panel overflow-hidden shadow-card flex flex-col transition-all duration-300 hover:shadow-card-hover hover:border-semantic-success/60">
              <button 
                onClick={() => toggleAgent('finance')}
                className="w-full p-6 flex items-center justify-between hover:bg-background-elevated transition-colors duration-150"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-semantic-success/15 border border-semantic-success/40 rounded-card flex items-center justify-center">
                    <DollarSign className="w-7 h-7 text-semantic-success" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-xl text-text-primary font-display">Finance Agent</h3>
                    <p className="text-text-muted text-sm mt-1">Finanzielle Effizienz</p>
                  </div>
                </div>
                <ChevronDown className={`w-6 h-6 text-semantic-success transition-transform duration-200 ${expandedAgents.has('finance') ? 'rotate-180' : ''}`} />
              </button>
              
              {expandedAgents.has('finance') && (
                <div className="border-t border-semantic-success/20 animate-fadeIn">
                  <div className="p-4 bg-semantic-success/5">
                    <div className="bg-background-surface rounded-card p-4 min-h-[350px] max-h-[500px] overflow-y-auto border border-border">
                      {agentOutputs?.finance ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {agentOutputs.finance}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-text-muted italic text-sm">Keine Finance-Analyse verfügbar.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PROZESS-OPTIMIERUNG MIT KI SEKTION */}
        <div className="mt-10 mb-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 via-slate-700/30 to-slate-800/50 border border-slate-600/40 rounded-panel p-10 shadow-card backdrop-blur-sm">
            {/* Animierter Hintergrund-Effekt */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-teal-500/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            </div>
            
            {/* Zentrierter Inhalt */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-xl flex items-center justify-center mb-6">
                <Wand2 className="w-8 h-8 text-cyan-400" />
              </div>
              
              <h3 className="text-2xl font-display font-semibold text-text-primary mb-3">
                KI-Gestützte Prozess-Optimierung
              </h3>
              
              {/* Zeige Stichpunkte und Button NUR wenn noch keine erfolgreiche Optimierung */}
              {!optimizationResult?.success && (
                <>
                  <p className="text-text-secondary mb-6 max-w-xl">
                    Lassen Sie GPT-4 basierend auf den Agenten-Analysen einen optimierten Prozess erstellen
                  </p>
                  
                  <ul className="text-sm text-text-secondary mb-8 space-y-3">
                    <li className="flex items-center justify-center space-x-3">
                      <div className="w-5 h-5 bg-cyan-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Analysiert alle Erkenntnisse aus Compliance, Performance & Finance Agenten</span>
                    </li>
                    <li className="flex items-center justify-center space-x-3">
                      <div className="w-5 h-5 bg-cyan-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Erstellt einen optimierten Prozess im XES-Format (IEEE 1849)</span>
                    </li>
                    <li className="flex items-center justify-center space-x-3">
                      <div className="w-5 h-5 bg-cyan-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Detaillierte Erklärung aller vorgenommenen Verbesserungen</span>
                    </li>
                  </ul>
                  
                  <div className="flex flex-col items-center space-y-4">
                    <button
                      onClick={async () => {
                        setIsOptimizing(true);
                        setOptimizationResult(null);
                        setOptimizedVisualization(null);
                        
                        try {
                          const response = await axios.post('http://localhost:5001/api/optimize-process');
                          
                          if (response.data.success) {
                            setOptimizationResult({
                              success: true,
                              explanation: response.data.explanation,
                              xes_content: response.data.xes_content,
                              xes_filename: response.data.xes_filename,
                              warning: response.data.warning
                            });
                            setShowOptimizationDetails(true);
                            
                            // Automatisch die Visualisierung des optimierten Prozesses laden
                            if (response.data.xes_content) {
                              setIsLoadingOptimizedVisualization(true);
                              try {
                                const vizResponse = await axios.get('http://localhost:5001/api/visualize-optimized-process');
                                if (vizResponse.data.success) {
                                  setOptimizedVisualization(vizResponse.data);
                                  console.log('✅ Optimierte Prozessvisualisierung geladen');
                                }
                              } catch (vizError) {
                                console.error('Fehler beim Laden der Visualisierung:', vizError);
                              } finally {
                                setIsLoadingOptimizedVisualization(false);
                              }
                            }
                          } else {
                            setOptimizationResult({
                              success: false,
                              error: response.data.error
                            });
                          }
                        } catch (error) {
                          console.error('Optimization error:', error);
                          setOptimizationResult({
                            success: false,
                            error: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Optimierung'
                          });
                        } finally {
                          setIsOptimizing(false);
                        }
                      }}
                      disabled={isOptimizing}
                      className={`flex items-center justify-center space-x-3 px-10 py-4 rounded-button font-medium text-lg transition-all duration-300 ${
                        isOptimizing 
                          ? 'bg-slate-600/50 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5'
                      } text-white shadow-button`}
                    >
                      {isOptimizing ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>KI analysiert und optimiert Prozess...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-6 h-6" />
                          <span>Optimierten Prozess mit GPT-4 generieren</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
              
              {/* Optimierung Ergebnis */}
              {optimizationResult && (
                <div className="mt-8 w-full">
                  {optimizationResult.success ? (
                    <div className="space-y-6">
                      {/* Erfolgs-Header */}
                      <div className="flex items-center justify-center space-x-3 p-4 bg-semantic-success/10 border border-semantic-success/30 rounded-card max-w-2xl mx-auto">
                        <CheckCircle2 className="w-6 h-6 text-semantic-success" />
                        <div className="text-left">
                          <p className="text-semantic-success font-medium">
                            Prozess-Optimierung erfolgreich abgeschlossen!
                          </p>
                          {optimizationResult.warning && (
                            <p className="text-semantic-warning text-sm mt-1">
                              {optimizationResult.warning}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* XES Download Button - Dezent gestaltet */}
                      {optimizationResult.xes_content && (
                        <button
                          onClick={() => {
                            const blob = new Blob([optimizationResult.xes_content!], { type: 'application/xml;charset=utf-8' });
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = optimizationResult.xes_filename || 'optimized_process.xes';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                          }}
                          className="max-w-md mx-auto flex items-center justify-center space-x-3 px-5 py-2.5 bg-slate-700/50 hover:bg-slate-600/60 border border-slate-500/30 text-text-secondary hover:text-text-primary rounded-button text-sm font-medium transition-all duration-150"
                        >
                          <FileCode className="w-4 h-4" />
                          <span>XES-Datei herunterladen</span>
                          <span className="text-xs text-text-muted">({optimizationResult.xes_filename})</span>
                        </button>
                      )}
                      
                      {/* 2-Spalten Layout: Visualisierung LINKS (breiter), Erklärung RECHTS (schmaler) */}
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
                        {/* LINKS: Optimierte Prozess-Visualisierung - 3/5 Breite */}
                        <div className="lg:col-span-3 bg-background-surface border border-cyan-500/30 rounded-panel overflow-hidden shadow-card">
                          <div className="px-4 py-3 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center space-x-3">
                            <Activity className="w-5 h-5 text-cyan-400" />
                            <h4 className="font-semibold text-text-primary font-display">Optimierter Prozess</h4>
                            {optimizationResult.xes_filename && (
                              <span className="text-xs text-text-muted bg-slate-700/50 px-2 py-1 rounded">
                                {optimizationResult.xes_filename}
                              </span>
                            )}
                          </div>
                          
                          <div className="p-4">
                            {isLoadingOptimizedVisualization ? (
                              <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                                <p className="text-text-secondary">Lade Prozess-Visualisierung...</p>
                              </div>
                            ) : optimizedVisualization && optimizedVisualization.success && optimizedVisualization.graph ? (
                              <ProcessVisualization 
                                visualizationData={optimizedVisualization}
                                mode="graph"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                                <Activity className="w-12 h-12 text-text-muted" />
                                <p className="text-text-secondary text-center">
                                  {optimizedVisualization?.error || 'Visualisierung wird vorbereitet...'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* RECHTS: KI-Erklärung - 2/5 Breite */}
                        <div className="lg:col-span-2 bg-background-surface border border-slate-600/40 rounded-panel overflow-hidden shadow-card flex flex-col">
                          <button
                            onClick={() => setShowOptimizationDetails(!showOptimizationDetails)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors duration-150 bg-slate-800/30 border-b border-slate-600/30"
                          >
                            <div className="flex items-center space-x-3">
                              <Sparkles className="w-5 h-5 text-cyan-400" />
                              <span className="font-semibold text-text-primary font-display">KI-Erklärung der Optimierungen</span>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${showOptimizationDetails ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {showOptimizationDetails && optimizationResult.explanation && (
                            <div className="p-5 flex-1 overflow-y-auto max-h-[500px]">
                              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                {optimizationResult.explanation}
                              </ReactMarkdown>
                            </div>
                          )}
                          
                          {!showOptimizationDetails && (
                            <div className="p-5 flex-1 flex items-center justify-center text-text-muted">
                              <p className="text-sm">Klicken Sie oben, um die detaillierte KI-Analyse anzuzeigen</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-3 p-4 bg-semantic-error/10 border border-semantic-error/30 rounded-card max-w-2xl mx-auto">
                      <AlertCircle className="w-6 h-6 text-semantic-error" />
                      <div className="text-left">
                        <p className="text-semantic-error font-medium">Optimierung fehlgeschlagen</p>
                        <p className="text-semantic-error/80 text-sm mt-1">{optimizationResult.error}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROHDATEN DOWNLOAD BUTTON */}
        {exportStatus && exportStatus.success && (
          <div className="mb-8">
            <a
              href={`http://localhost:5001/api/download-raw-data/${exportStatus.filename}`}
              download={exportStatus.filename}
              className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 rounded-button text-white font-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
            >
              <Database className="w-5 h-5" />
              <span>Rohdaten herunterladen</span>
              <span className="text-slate-400 text-sm">({exportStatus.filename})</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
