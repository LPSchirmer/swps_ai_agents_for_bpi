import { useState } from 'react';
import { ChevronRight, Sparkles, Zap, DollarSign, Shield, FileText, Settings, Wrench, MessageSquare, Database, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

interface DashboardProps {
  uploadedFile: { filename: string } | null;
  uploadedFiles?: UploadedFile[];
  onNewAnalysis: () => void;
  aiAnalysisResult?: string | null;
  agentOutputs?: AgentOutputs | null;
}

const Dashboard = ({ uploadedFile, uploadedFiles = [], onNewAnalysis, aiAnalysisResult, agentOutputs }: DashboardProps) => {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [expandedExplainer, setExpandedExplainer] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Debug: Log wenn Component mountet und bei jeder Änderung
  console.log('📊 Dashboard gerendert mit:', {
    uploadedFile: uploadedFile?.filename,
    uploadedFilesCount: uploadedFiles?.length,
    hasAiResult: !!aiAnalysisResult,
    agentOutputs: agentOutputs,
  });

  // Mock data für Agent Explainability (später aus Backend)
  const agentExplainability = {
    performance: {
      prompt: "Analysiere die Prozessperformance anhand der Event-Log-Daten. Identifiziere Bottlenecks, Durchlaufzeiten und Optimierungspotenziale.",
      tools: ["Process Mining Analysis", "Bottleneck Detection", "Cycle Time Calculator"],
      toolInput: "Event-Log mit Case ID, Activity, Timestamp, Resource",
      toolOutput: "Performance-Metriken, identifizierte Engpässe, Optimierungsvorschläge"
    },
    finance: {
      prompt: "Bewerte die finanziellen Aspekte des Prozesses. Berechne Kosten pro Aktivität und identifiziere Einsparungspotenziale.",
      tools: ["Cost Calculation Tool", "ROI Analyzer", "Budget Optimizer"],
      toolInput: "Prozesskosten, Ressourcenkosten, Aktivitätshäufigkeiten",
      toolOutput: "Kostenaufschlüsselung, Einsparungspotenziale, ROI-Prognosen"
    },
    compliance: {
      prompt: "Prüfe den Prozess auf Einhaltung regulatorischer Anforderungen und Compliance-Vorgaben.",
      tools: ["Compliance Checker", "Regulation Matcher", "Gap Analyzer"],
      toolInput: "Prozessmodell, relevante Regulierungen, Unternehmensrichtlinien",
      toolOutput: "Compliance-Status, identifizierte Verstöße, Empfehlungen"
    }
  };

  const markdownComponents = {
    h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-xl font-bold text-white mb-3">{children}</h1>,
    h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h2>,
    h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-md font-semibold text-slate-200 mt-3 mb-2">{children}</h3>,
    p: ({ children }: { children?: React.ReactNode }) => <p className="text-slate-300 mb-2 leading-relaxed">{children}</p>,
    ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc list-inside space-y-1 mb-3 text-slate-300">{children}</ul>,
    ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-slate-300">{children}</ol>,
    li: ({ children }: { children?: React.ReactNode }) => <li className="text-slate-300">{children}</li>,
    strong: ({ children }: { children?: React.ReactNode }) => <strong className="text-cyan-400 font-semibold">{children}</strong>,
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="overflow-x-auto my-3">
        <table className="min-w-full border border-slate-700 rounded-lg overflow-hidden text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => <thead className="bg-slate-800">{children}</thead>,
    th: ({ children }: { children?: React.ReactNode }) => <th className="px-3 py-2 text-left text-xs font-semibold text-white border-b border-slate-700">{children}</th>,
    td: ({ children }: { children?: React.ReactNode }) => <td className="px-3 py-2 text-xs text-slate-300 border-b border-slate-700/50">{children}</td>,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 p-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <span className="text-xl font-bold">ProcessAI</span>
          </div>
          <button 
            onClick={onNewAnalysis}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all"
          >
            Neue Analyse starten
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        
        {/* 1. PROZESSBESCHREIBUNG MIT ALLEN DATEIEN - Zentriert oben */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="flex items-center space-x-2 text-emerald-500 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Analyse abgeschlossen</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">Prozessanalyse-Dashboard</h1>
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 inline-block">
            <p className="text-slate-400 mb-2">Analysierte Dateien:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {uploadedFiles && uploadedFiles.length > 0 ? (
                uploadedFiles.map((file, index) => (
                  <span key={index} className="px-3 py-1 bg-cyan-900/30 border border-cyan-700/50 rounded-full text-cyan-400 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {file.filename}
                  </span>
                ))
              ) : uploadedFile ? (
                <span className="px-3 py-1 bg-cyan-900/30 border border-cyan-700/50 rounded-full text-cyan-400 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {uploadedFile.filename}
                </span>
              ) : (
                <span className="text-slate-500">Keine Dateien</span>
              )}
            </div>
          </div>
        </div>

        {/* 2. BPMN + KPI LAYOUT - Nebeneinander */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* BPMN Visualisierung - Links */}
          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Prozess-Visualisierung (BPMN)</h3>
                <span className="px-2 py-1 bg-amber-900/30 text-amber-400 text-xs rounded font-medium">Ist-Prozess</span>
              </div>
              <p className="text-sm text-slate-400">Identifizierte Prozessstruktur</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4 aspect-[16/9] flex items-center justify-center border border-slate-700">
              <svg className="w-full h-full max-w-full max-h-full" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet">
                {/* Start Event */}
                <circle cx="40" cy="150" r="20" fill="none" stroke="#22c55e" strokeWidth="2"/>
                <circle cx="40" cy="150" r="18" fill="none" stroke="#22c55e" strokeWidth="1"/>
                
                {/* Activity 1 - Datenvalidierung */}
                <rect x="100" y="120" width="100" height="60" rx="8" fill="#1e293b" stroke="#64748b" strokeWidth="2"/>
                <text x="150" y="145" textAnchor="middle" fill="#94a3b8" fontSize="11">Datenvalidierung</text>
                <text x="150" y="160" textAnchor="middle" fill="#ef4444" fontSize="9">⚠️ Engpass</text>
                <line x1="60" y1="150" x2="100" y2="150" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                
                {/* Gateway */}
                <g transform="translate(240, 150) rotate(45)">
                  <rect x="-20" y="-20" width="40" height="40" fill="#1e293b" stroke="#64748b" strokeWidth="2"/>
                </g>
                <text x="240" y="155" textAnchor="middle" fill="#94a3b8" fontSize="16">×</text>
                <line x1="200" y1="150" x2="220" y2="150" stroke="#64748b" strokeWidth="2"/>
                
                {/* Activity 2 - Qualitätsprüfung */}
                <rect x="300" y="90" width="100" height="60" rx="8" fill="#1e293b" stroke="#64748b" strokeWidth="2"/>
                <text x="350" y="115" textAnchor="middle" fill="#94a3b8" fontSize="11">Qualitätsprüfung</text>
                <text x="350" y="130" textAnchor="middle" fill="#ef4444" fontSize="9">⚠️ Engpass</text>
                <line x1="260" y1="150" x2="300" y2="120" stroke="#64748b" strokeWidth="2"/>
                
                {/* Activity 3 - Genehmigung */}
                <rect x="300" y="180" width="100" height="60" rx="8" fill="#1e293b" stroke="#64748b" strokeWidth="2"/>
                <text x="350" y="205" textAnchor="middle" fill="#94a3b8" fontSize="11">Genehmigung</text>
                <text x="350" y="220" textAnchor="middle" fill="#f59e0b" fontSize="9">⚠️ Verzögerung</text>
                <line x1="260" y1="150" x2="300" y2="210" stroke="#64748b" strokeWidth="2"/>
                
                {/* Merge Gateway */}
                <g transform="translate(440, 150) rotate(45)">
                  <rect x="-20" y="-20" width="40" height="40" fill="#1e293b" stroke="#64748b" strokeWidth="2"/>
                </g>
                <text x="440" y="155" textAnchor="middle" fill="#94a3b8" fontSize="16">×</text>
                <line x1="400" y1="120" x2="420" y2="140" stroke="#64748b" strokeWidth="2"/>
                <line x1="400" y1="210" x2="420" y2="170" stroke="#64748b" strokeWidth="2"/>
                
                {/* Activity 4 - Dokumentation */}
                <rect x="480" y="120" width="80" height="60" rx="8" fill="#1e293b" stroke="#64748b" strokeWidth="2"/>
                <text x="520" y="145" textAnchor="middle" fill="#94a3b8" fontSize="11">Dokumentation</text>
                <line x1="460" y1="150" x2="480" y2="150" stroke="#64748b" strokeWidth="2"/>
                
                {/* End Event */}
                <circle cx="580" cy="150" r="20" fill="none" stroke="#ef4444" strokeWidth="4"/>
                
                {/* Arrow marker definition */}
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#64748b"/>
                  </marker>
                </defs>
              </svg>
            </div>
          </div>

          {/* KPI vom aktuellen Prozess - Rechts */}
          <div className="bg-slate-900/60 backdrop-blur-sm border border-amber-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-amber-500" />
                <h3 className="text-lg font-semibold">Aktuelle Prozess-KPIs</h3>
              </div>
              <span className="px-2 py-1 bg-amber-900/30 text-amber-400 text-xs rounded font-medium">Ist-Stand</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-700">
                <span className="text-slate-400">Anzahl Prozessvarianten</span>
                <span className="font-semibold text-amber-500 text-xl">6</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-700">
                <span className="text-slate-400">Durchschnittliche Durchlaufzeit</span>
                <span className="font-semibold text-amber-500 text-xl">45 Min</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-700">
                <span className="text-slate-400">Durchschnittliche Prozesskosten</span>
                <span className="font-semibold text-amber-500 text-xl">1.500 €</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-700">
                <span className="text-slate-400">Anzahl Prozessaktivitäten</span>
                <span className="font-semibold text-amber-500 text-xl">7</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-slate-400">Involvierte Ressourcen</span>
                <span className="font-semibold text-amber-500 text-xl">8</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. AGENTS SEKTION - Performance, Finance, Compliance mit Expand Animation */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-3">
            <Sparkles className="w-7 h-7 text-cyan-500" />
            <span>KI-Agenten Analyse</span>
          </h2>
          
          <div className="flex gap-4 overflow-hidden">
            {/* Performance Agent Card */}
            <div 
              className={`
                bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-2 rounded-2xl cursor-pointer
                transition-all duration-500 ease-in-out transform
                ${expandedAgent === 'performance' 
                  ? 'flex-grow border-amber-500 shadow-lg shadow-amber-500/20' 
                  : expandedAgent 
                    ? 'flex-shrink w-0 opacity-0 scale-95 border-transparent overflow-hidden p-0' 
                    : 'flex-1 border-amber-700/50 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10'
                }
              `}
              onClick={() => setExpandedAgent(expandedAgent === 'performance' ? null : 'performance')}
            >
              <div className={`p-6 ${expandedAgent && expandedAgent !== 'performance' ? 'hidden' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Performance Agent</h3>
                      <p className="text-slate-400 text-sm">Analysiert Durchlaufzeiten, Bottlenecks und Effizienz</p>
                    </div>
                  </div>
                  {expandedAgent === 'performance' ? (
                    <button 
                      className="p-2 hover:bg-amber-800/50 rounded-lg transition-colors"
                      onClick={(e) => { e.stopPropagation(); setExpandedAgent(null); }}
                    >
                      <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : (
                    <ChevronRight className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                
                {expandedAgent === 'performance' && (
                  <div className="animate-fadeIn">
                    <div className="bg-slate-900/60 rounded-lg p-6 max-h-[500px] overflow-y-auto">
                      {agentOutputs?.performance ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {agentOutputs.performance}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-slate-400 italic">Keine Performance-Analyse verfügbar.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Finance Agent Card */}
            <div 
              className={`
                bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-2 rounded-2xl cursor-pointer
                transition-all duration-500 ease-in-out transform
                ${expandedAgent === 'finance' 
                  ? 'flex-grow border-emerald-500 shadow-lg shadow-emerald-500/20' 
                  : expandedAgent 
                    ? 'flex-shrink w-0 opacity-0 scale-95 border-transparent overflow-hidden p-0' 
                    : 'flex-1 border-emerald-700/50 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10'
                }
              `}
              onClick={() => setExpandedAgent(expandedAgent === 'finance' ? null : 'finance')}
            >
              <div className={`p-6 ${expandedAgent && expandedAgent !== 'finance' ? 'hidden' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Finance Agent</h3>
                      <p className="text-slate-400 text-sm">Bewertet Kosten und Einsparungspotenziale</p>
                    </div>
                  </div>
                  {expandedAgent === 'finance' ? (
                    <button 
                      className="p-2 hover:bg-emerald-800/50 rounded-lg transition-colors"
                      onClick={(e) => { e.stopPropagation(); setExpandedAgent(null); }}
                    >
                      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : (
                    <ChevronRight className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                
                {expandedAgent === 'finance' && (
                  <div className="animate-fadeIn">
                    <div className="bg-slate-900/60 rounded-lg p-6 max-h-[500px] overflow-y-auto">
                      {agentOutputs?.finance ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {agentOutputs.finance}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-slate-400 italic">Keine Finance-Analyse verfügbar.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Compliance Agent Card */}
            <div 
              className={`
                bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-2 rounded-2xl cursor-pointer
                transition-all duration-500 ease-in-out transform
                ${expandedAgent === 'compliance' 
                  ? 'flex-grow border-blue-500 shadow-lg shadow-blue-500/20' 
                  : expandedAgent 
                    ? 'flex-shrink w-0 opacity-0 scale-95 border-transparent overflow-hidden p-0' 
                    : 'flex-1 border-blue-700/50 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10'
                }
              `}
              onClick={() => setExpandedAgent(expandedAgent === 'compliance' ? null : 'compliance')}
            >
              <div className={`p-6 ${expandedAgent && expandedAgent !== 'compliance' ? 'hidden' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Compliance Agent</h3>
                      <p className="text-slate-400 text-sm">Prüft regulatorische Anforderungen</p>
                    </div>
                  </div>
                  {expandedAgent === 'compliance' ? (
                    <button 
                      className="p-2 hover:bg-blue-800/50 rounded-lg transition-colors"
                      onClick={(e) => { e.stopPropagation(); setExpandedAgent(null); }}
                    >
                      <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : (
                    <ChevronRight className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                
                {expandedAgent === 'compliance' && (
                  <div className="animate-fadeIn">
                    <div className="bg-slate-900/60 rounded-lg p-6 max-h-[500px] overflow-y-auto">
                      {agentOutputs?.compliance ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {agentOutputs.compliance}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-slate-400 italic">Keine Compliance-Analyse verfügbar.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. AGENT EXPLAINABILITY SEKTION */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-3">
            <Settings className="w-7 h-7 text-purple-500" />
            <span>Agent Explainability</span>
          </h2>
          <p className="text-slate-400 mb-6">Transparente Einblicke in die Arbeitsweise der KI-Agenten</p>
          
          <div className="space-y-4">
            {/* Performance Explainer */}
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden">
              <button 
                className="w-full p-5 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                onClick={() => setExpandedExplainer(expandedExplainer === 'performance' ? null : 'performance')}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold">Performance Agent - Details</span>
                </div>
                <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedExplainer === 'performance' ? 'rotate-90' : ''}`} />
              </button>
              
              {expandedExplainer === 'performance' && (
                <div className="border-t border-slate-700 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-5 h-5 text-cyan-500" />
                      <h4 className="font-semibold text-cyan-400">Prompt an Agent</h4>
                    </div>
                    <p className="text-slate-300 text-sm">{agentExplainability.performance.prompt}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Wrench className="w-5 h-5 text-purple-500" />
                      <h4 className="font-semibold text-purple-400">Tools</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {agentExplainability.performance.tools.map((tool, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-900/30 border border-purple-700/50 rounded text-purple-300 text-xs">{tool}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="w-5 h-5 text-emerald-500" />
                      <h4 className="font-semibold text-emerald-400">Tool Input</h4>
                    </div>
                    <p className="text-slate-300 text-sm">{agentExplainability.performance.toolInput}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-amber-500" />
                      <h4 className="font-semibold text-amber-400">Tool Output</h4>
                    </div>
                    <p className="text-slate-300 text-sm">{agentExplainability.performance.toolOutput}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Finance Explainer */}
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden">
              <button 
                className="w-full p-5 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                onClick={() => setExpandedExplainer(expandedExplainer === 'finance' ? null : 'finance')}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold">Finance Agent - Details</span>
                </div>
                <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedExplainer === 'finance' ? 'rotate-90' : ''}`} />
              </button>
              
              {expandedExplainer === 'finance' && (
                <div className="border-t border-slate-700 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-5 h-5 text-cyan-500" />
                      <h4 className="font-semibold text-cyan-400">Prompt an Agent</h4>
                    </div>
                    <p className="text-slate-300 text-sm">{agentExplainability.finance.prompt}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Wrench className="w-5 h-5 text-purple-500" />
                      <h4 className="font-semibold text-purple-400">Tools</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {agentExplainability.finance.tools.map((tool, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-900/30 border border-purple-700/50 rounded text-purple-300 text-xs">{tool}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="w-5 h-5 text-emerald-500" />
                      <h4 className="font-semibold text-emerald-400">Tool Input</h4>
                    </div>
                    <p className="text-slate-300 text-sm">{agentExplainability.finance.toolInput}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-amber-500" />
                      <h4 className="font-semibold text-amber-400">Tool Output</h4>
                    </div>
                    <p className="text-slate-300 text-sm">{agentExplainability.finance.toolOutput}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Compliance Explainer */}
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl overflow-hidden">
              <button 
                className="w-full p-5 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                onClick={() => setExpandedExplainer(expandedExplainer === 'compliance' ? null : 'compliance')}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold">Compliance Agent - Details</span>
                </div>
                <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedExplainer === 'compliance' ? 'rotate-90' : ''}`} />
              </button>
              
              {expandedExplainer === 'compliance' && (
                <div className="border-t border-slate-700 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-5 h-5 text-cyan-500" />
                      <h4 className="font-semibold text-cyan-400">Prompt an Agent</h4>
                    </div>
                    <p className="text-slate-300 text-sm">{agentExplainability.compliance.prompt}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Wrench className="w-5 h-5 text-purple-500" />
                      <h4 className="font-semibold text-purple-400">Tools</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {agentExplainability.compliance.tools.map((tool, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-900/30 border border-purple-700/50 rounded text-purple-300 text-xs">{tool}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="w-5 h-5 text-emerald-500" />
                      <h4 className="font-semibold text-emerald-400">Tool Input</h4>
                    </div>
                    <p className="text-slate-300 text-sm">{agentExplainability.compliance.toolInput}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-amber-500" />
                      <h4 className="font-semibold text-amber-400">Tool Output</h4>
                    </div>
                    <p className="text-slate-300 text-sm">{agentExplainability.compliance.toolOutput}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5. REQUIREMENTS AGENT & ECONOMIC CONTEXT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Requirements Agent */}
          <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-700/50 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Requirements Agent</h3>
                <p className="text-slate-400 text-sm">Anforderungsanalyse und -validierung</p>
              </div>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-4 max-h-[300px] overflow-y-auto">
              {agentOutputs?.requirements ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {agentOutputs.requirements}
                </ReactMarkdown>
              ) : (
                <div className="text-slate-400">
                  <p className="mb-2"><strong className="text-purple-400">Input:</strong> Prozessdaten, Geschäftsanforderungen</p>
                  <p><strong className="text-purple-400">Output:</strong> Validierte Anforderungen, Gap-Analyse</p>
                </div>
              )}
            </div>
          </div>

          {/* Economic Context */}
          <div className="bg-gradient-to-br from-teal-900/30 to-cyan-900/30 border border-teal-700/50 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Economic Context</h3>
                <p className="text-slate-400 text-sm">Wirtschaftlicher Kontext und Marktanalyse</p>
              </div>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-4 max-h-[300px] overflow-y-auto">
              {agentOutputs?.economic ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {agentOutputs.economic}
                </ReactMarkdown>
              ) : (
                <div className="text-slate-400">
                  <p className="mb-2"><strong className="text-teal-400">Input:</strong> Branchendaten, Marktbedingungen</p>
                  <p><strong className="text-teal-400">Output:</strong> Wirtschaftliche Bewertung, Benchmarking</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className={`fixed right-0 top-0 h-full bg-slate-900 border-l border-slate-700 transition-all duration-300 ${isChatOpen ? 'w-96' : 'w-16'}`}>
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-full h-full flex flex-col items-center justify-center space-y-2 hover:bg-slate-800 transition-colors"
          >
            <Sparkles className="w-6 h-6 text-cyan-500" />
            <div className="text-xs text-slate-400 rotate-0 writing-mode-vertical">KI-Assistent</div>
          </button>
        ) : (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-500" />
                <h3 className="font-semibold">KI-Assistent</h3>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
                <p className="text-sm text-slate-300">
                  Hallo! Ich bin der KI-Assistent für Prozessoptimierung. Wie kann ich Ihnen helfen?
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700">
              <div className="space-y-2 mb-4">
                <button className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors">
                  Erkläre die Änderungen
                </button>
                <button className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors">
                  Performance verbessern
                </button>
                <button className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors">
                  Compliance-Check
                </button>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Fragen Sie die KI..."
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
