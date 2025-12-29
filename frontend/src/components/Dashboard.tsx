import { useState } from 'react';
import { ChevronRight, Sparkles, Zap, DollarSign, Shield, FileText, TrendingUp, Activity, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
    cases?: number;
    events?: number;
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
  onNewAnalysis: () => void;
  aiAnalysisResult?: string | null;
  agentOutputs?: AgentOutputs | null;
  processMetrics?: ProcessMetrics | null;
  processVisualization?: ProcessVisualizationData | null;
}

const Dashboard = ({ uploadedFile, uploadedFiles = [], onNewAnalysis, aiAnalysisResult, agentOutputs, processMetrics, processVisualization }: DashboardProps) => {
  const [expandedExplainer, setExpandedExplainer] = useState<string | null>(null);
  
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
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent rounded-button flex items-center justify-center shadow-button">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <span className="text-xl font-semibold font-display">ProcessAI</span>
          </div>
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
          <div className="bg-background-surface border border-border rounded-panel p-5 inline-block shadow-card">
            <p className="text-text-muted text-label-lg mb-3">Analysierte Dateien</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {uploadedFiles && uploadedFiles.length > 0 ? (
                uploadedFiles.map((file, index) => (
                  <span key={index} className="px-3 py-1.5 bg-background-elevated border border-border rounded-button text-text-secondary text-sm flex items-center gap-2 transition-colors hover:border-accent/50">
                    <FileText className="w-4 h-4 text-text-muted" />
                    {file.filename}
                  </span>
                ))
              ) : uploadedFile ? (
                <span className="px-3 py-1.5 bg-background-elevated border border-border rounded-button text-text-secondary text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-text-muted" />
                  {uploadedFile.filename}
                </span>
              ) : (
                <span className="text-text-muted">Keine Dateien</span>
              )}
            </div>
          </div>
        </div>

        {/* 2. HAUPT-LAYOUT: Prozess-Visualisierung LINKS + Top 3 Agents RECHTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* LINKS: Prozess-Visualisierung (2/3 Breite) - NUR GRAPH */}
          <div className="lg:col-span-2">
            <div className="bg-background-surface border border-border rounded-panel overflow-hidden shadow-card h-full">
              {processVisualization && processVisualization.success && processVisualization.graph ? (
                <div className="p-6">
                  <ProcessVisualization 
                    visualizationData={processVisualization}
                    processMetrics={processMetrics}
                    mode="graph"
                  />
                </div>
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

          {/* RECHTS: Top 3 Agents - Compliance, Performance, Finance (1/3 Breite) */}
          {/* EXKLUSIV-MODUS: Wenn ein Agent geöffnet ist, werden nur dieser angezeigt */}
          <div className="flex flex-col gap-4 h-full">
            {/* 1. Compliance Agent */}
            {(!expandedExplainer || expandedExplainer === 'compliance') && (
              <div className={`bg-background-surface border-2 border-accent/40 rounded-panel overflow-hidden shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-accent/60 flex-1 flex flex-col`}>
                <button 
                  className="w-full p-5 flex items-center justify-between hover:bg-background-elevated transition-colors duration-150"
                  onClick={() => setExpandedExplainer(expandedExplainer === 'compliance' ? null : 'compliance')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-accent/15 border border-accent/40 rounded-card flex items-center justify-center">
                      <Shield className="w-6 h-6 text-accent" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg text-text-primary font-display">Compliance Agent</h3>
                      <p className="text-text-muted text-sm">Regulatorische Prüfung</p>
                    </div>
                  </div>
                  {expandedExplainer === 'compliance' ? (
                    <X className="w-5 h-5 text-accent" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-accent" />
                  )}
                </button>
                
                {expandedExplainer === 'compliance' && (
                  <div className="border-t border-accent/20 animate-fadeIn flex-1">
                    <div className="p-5 bg-accent/5 h-full">
                      <div className="bg-background-surface rounded-card p-4 h-full min-h-[400px] max-h-[600px] overflow-y-auto border border-border">
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
            )}

            {/* 2. Performance Agent */}
            {(!expandedExplainer || expandedExplainer === 'performance') && (
              <div className={`bg-background-surface border-2 border-semantic-warning/40 rounded-panel overflow-hidden shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-semantic-warning/60 flex-1 flex flex-col`}>
                <button 
                  className="w-full p-5 flex items-center justify-between hover:bg-background-elevated transition-colors duration-150"
                  onClick={() => setExpandedExplainer(expandedExplainer === 'performance' ? null : 'performance')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-semantic-warning/15 border border-semantic-warning/40 rounded-card flex items-center justify-center">
                      <Zap className="w-6 h-6 text-semantic-warning" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg text-text-primary font-display">Performance Agent</h3>
                      <p className="text-text-muted text-sm">Durchlaufzeiten & Bottlenecks</p>
                    </div>
                  </div>
                  {expandedExplainer === 'performance' ? (
                    <X className="w-5 h-5 text-semantic-warning" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-semantic-warning" />
                  )}
                </button>
                
                {expandedExplainer === 'performance' && (
                  <div className="border-t border-semantic-warning/20 animate-fadeIn flex-1">
                    <div className="p-5 bg-semantic-warning/5 h-full">
                      <div className="bg-background-surface rounded-card p-4 h-full min-h-[400px] max-h-[600px] overflow-y-auto border border-border">
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
            )}

            {/* 3. Finance Agent */}
            {(!expandedExplainer || expandedExplainer === 'finance') && (
              <div className={`bg-background-surface border-2 border-semantic-success/40 rounded-panel overflow-hidden shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-semantic-success/60 flex-1 flex flex-col`}>
                <button 
                  className="w-full p-5 flex items-center justify-between hover:bg-background-elevated transition-colors duration-150"
                  onClick={() => setExpandedExplainer(expandedExplainer === 'finance' ? null : 'finance')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-semantic-success/15 border border-semantic-success/40 rounded-card flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-semantic-success" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg text-text-primary font-display">Finance Agent</h3>
                      <p className="text-text-muted text-sm">Kostenanalyse & ROI</p>
                    </div>
                  </div>
                  {expandedExplainer === 'finance' ? (
                    <X className="w-5 h-5 text-semantic-success" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-semantic-success" />
                  )}
                </button>
                
                {expandedExplainer === 'finance' && (
                  <div className="border-t border-semantic-success/20 animate-fadeIn flex-1">
                    <div className="p-5 bg-semantic-success/5 h-full">
                      <div className="bg-background-surface rounded-card p-4 h-full min-h-[400px] max-h-[600px] overflow-y-auto border border-border">
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
            )}
          </div>
        </div>

        {/* 3. UNTERE SEKTION: KPIs & Metriken - Volle Breite */}
        {processVisualization && processVisualization.success && processVisualization.graph && (
          <div className="mb-12">
            <div className="border-t-2 border-border pt-8">
              <ProcessVisualization 
                visualizationData={processVisualization}
                processMetrics={processMetrics}
                mode="metrics"
              />
            </div>
          </div>
        )}

        {/* 4. KONTEXT-ANALYSE: Requirements & Economic Agents */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-3 font-display">
            <Sparkles className="w-5 h-5 text-accent" />
            <span>Kontext-Analyse</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Requirements Agent */}
            <div className="bg-background-surface border-2 border-accent-highlight/30 rounded-panel overflow-hidden shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-accent-highlight/50">
              <button 
                className="w-full p-5 flex items-center justify-between hover:bg-background-elevated transition-colors duration-150"
                onClick={() => setExpandedExplainer(expandedExplainer === 'requirements' ? null : 'requirements')}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-accent-highlight/15 border border-accent-highlight/30 rounded-card flex items-center justify-center">
                    <FileText className="w-5 h-5 text-accent-highlight" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg text-text-primary font-display">Requirements Agent</h3>
                    <p className="text-text-muted text-sm">Anforderungsanalyse & Validierung</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-accent-highlight transition-transform duration-200 ${expandedExplainer === 'requirements' ? 'rotate-90' : ''}`} />
              </button>
              
              {expandedExplainer === 'requirements' && (
                <div className="border-t border-accent-highlight/20 animate-fadeIn">
                  <div className="p-5 bg-accent-highlight/5">
                    <div className="bg-background-surface rounded-card p-4 max-h-[400px] overflow-y-auto border border-border">
                      {agentOutputs?.requirements ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {agentOutputs.requirements}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-text-muted italic">Keine Requirements-Analyse verfügbar.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Economic Context Agent */}
            <div className="bg-background-surface border-2 border-purple-500/30 rounded-panel overflow-hidden shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-purple-500/50">
              <button 
                className="w-full p-5 flex items-center justify-between hover:bg-background-elevated transition-colors duration-150"
                onClick={() => setExpandedExplainer(expandedExplainer === 'economic' ? null : 'economic')}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-500/15 border border-purple-500/30 rounded-card flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg text-text-primary font-display">Economic Context Agent</h3>
                    <p className="text-text-muted text-sm">Wirtschaftlicher Kontext & Benchmarking</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-purple-400 transition-transform duration-200 ${expandedExplainer === 'economic' ? 'rotate-90' : ''}`} />
              </button>
              
              {expandedExplainer === 'economic' && (
                <div className="border-t border-purple-500/20 animate-fadeIn">
                  <div className="p-5 bg-purple-500/5">
                    <div className="bg-background-surface rounded-card p-4 max-h-[400px] overflow-y-auto border border-border">
                      {agentOutputs?.economic ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {agentOutputs.economic}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-text-muted italic">Keine Economic-Analyse verfügbar.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
