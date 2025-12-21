import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

interface DashboardProps {
  uploadedFile: { filename: string } | null;
  onNewAnalysis: () => void;
  aiAnalysisResult?: string | null;
}

const Dashboard = ({ uploadedFile, onNewAnalysis, aiAnalysisResult }: DashboardProps) => {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [expandedAISection, setExpandedAISection] = useState<string | null>(null);
  
  // Debug: Log wenn Component mountet
  console.log('📊 Dashboard gerendert mit:', {
    uploadedFile: uploadedFile?.filename,
    hasAiResult: !!aiAnalysisResult,
    aiResultLength: aiAnalysisResult?.length
  });
  
  // Parse AI result to extract agent-specific information
  const parseAgentResults = (_result: string) => {
    const agents = [
      { id: 'requirements', name: 'Requirements Agent', icon: '📋', color: 'blue' },
      { id: 'economic', name: 'Economic Context Agent', icon: '📊', color: 'green' },
      { id: 'performance', name: 'Performance Agent', icon: '⚡', color: 'amber' },
      { id: 'finance', name: 'Finance Agent', icon: '💰', color: 'emerald' },
      { id: 'compliance', name: 'Compliance Agent', icon: '✓', color: 'purple' }
    ];
    
    return agents;
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
        {/* Status Badge */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex items-center space-x-2 text-emerald-500 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Analyse abgeschlossen</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">Prozessanalyse-Dashboard</h1>
        <p className="text-slate-400 mb-8">Datei(en): {uploadedFile?.filename || 'jobs.csv'}</p>

        {/* 🤖 KI-Analyseergebnisse anzeigen */}
        {aiAnalysisResult && (
          <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-700/50 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              <span>Finales Analyseergebnis</span>
            </h2>
            <div className="bg-slate-900/60 rounded-xl p-6 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-slate-300 text-sm font-mono">
                {aiAnalysisResult}
              </pre>
            </div>
            <div className="mt-4 text-xs text-slate-400">
              Generiert von CrewAI Multi-Agenten-System
            </div>
          </div>
        )}

        {/* KI Analysis Box */}
        <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 mb-8">
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-4">KI-Prozessanalyse</h2>
              <p className="text-slate-300 mb-4">Automatische Analyse und Optimierungsvorschläge</p>
              
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Aktueller Prozess</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Ihr hochgeladener Geschäftsprozess wurde erfolgreich analysiert. Der aktuelle Prozess weist eine{' '}
                    <span className="text-amber-500 font-semibold">Durchlaufzeit von 45 Minuten</span> auf und nutzt{' '}
                    <span className="text-amber-500 font-semibold">8 Ressourcen</span> bei einer Effizienz von{' '}
                    <span className="text-amber-500 font-semibold">62%</span>.
                  </p>
                  <p className="text-slate-300 text-sm">
                    Dabei wurden <span className="text-red-500 font-semibold">4 Engpässe</span> identifiziert, die die Prozessleistung beeinträchtigen.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-700/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center space-x-2">
                    <span>📈</span>
                    <span>Optimierter Prozess</span>
                  </h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Unsere KI-Agenten haben den Prozess analysiert und einen optimierten Ablauf entwickelt. Der neue Prozess reduziert die{' '}
                    <span className="text-emerald-400 font-semibold">Durchlaufzeit auf 28 Minuten</span> (-38%) und benötigt nur noch{' '}
                    <span className="text-emerald-400 font-semibold">6 Ressourcen</span> (-25%).
                  </p>
                  <p className="text-slate-300 text-sm">
                    Die Effizienz steigt auf <span className="text-emerald-400 font-semibold">94%</span> (+32%), während alle Engpässe eliminiert wurden.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Cards */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Detaillierte Agenten-Analyse</h3>
            <div className="space-y-3">
              {/* Performance Agent */}
              <div 
                className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-700/50 rounded-xl p-5 cursor-pointer hover:from-amber-900/30 hover:to-orange-900/30 transition-all"
                onClick={() => setExpandedAgent(expandedAgent === 'performance' ? null : 'performance')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center text-2xl">
                      ⚡
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-lg">Performance Agent</h4>
                      <p className="text-sm text-slate-400">
                        Analysiert und optimiert die Geschwindigkeit und Effizienz Ihrer Geschäftsprozesse.
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedAgent === 'performance' ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Finance Agent */}
              <div 
                className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-700/50 rounded-xl p-5 cursor-pointer hover:from-emerald-900/30 hover:to-teal-900/30 transition-all"
                onClick={() => setExpandedAgent(expandedAgent === 'finance' ? null : 'finance')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center text-2xl">
                      💰
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-lg">Finance Agent</h4>
                      <p className="text-sm text-slate-400">
                        Bewertet finanzielle Aspekte und identifiziert Kosteneinsparungspotenziale im Prozess.
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedAgent === 'finance' ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Compliance Agent */}
              <div 
                className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-700/50 rounded-xl p-5 cursor-pointer hover:from-blue-900/30 hover:to-cyan-900/30 transition-all"
                onClick={() => setExpandedAgent(expandedAgent === 'compliance' ? null : 'compliance')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-2xl">
                      🛡️
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-lg">Compliance Agent</h4>
                      <p className="text-sm text-slate-400">
                        Stellt sicher, dass alle regulatorischen Anforderungen und Compliance-Vorgaben erfüllt werden.
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedAgent === 'compliance' ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Risk Agent */}
              <div 
                className="bg-gradient-to-r from-red-900/20 to-rose-900/20 border border-red-700/50 rounded-xl p-5 cursor-pointer hover:from-red-900/30 hover:to-rose-900/30 transition-all"
                onClick={() => setExpandedAgent(expandedAgent === 'risk' ? null : 'risk')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-2xl">
                      ⚠️
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-lg">Risk Agent</h4>
                      <p className="text-sm text-slate-400">
                        Identifiziert und bewertet potenzielle Risiken und Schwachstellen im Prozess.
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedAgent === 'risk' ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BPMN Visualisierung */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-6 -mx-2">
            {/* Aktueller Ist-Prozess */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 flex-1 min-w-[320px] max-w-full mx-2 mb-4" style={{flexBasis:'400px'}}>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Aktueller Ist-Prozess</h3>
                  <span className="px-2 py-1 bg-amber-900/30 text-amber-400 text-xs rounded font-medium">Aktuell</span>
                </div>
                <p className="text-sm text-slate-400">Identifizierte Problembereiche</p>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-2 sm:p-6 aspect-[2/1] flex items-center justify-center border border-slate-700 min-w-0">
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
                  <line x1="560" y1="150" x2="560" y2="150" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                  
                  {/* Arrow marker definition */}
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="#64748b"/>
                    </marker>
                  </defs>
                </svg>
              </div>
              
              <div className="mt-4 text-xs text-slate-500">
                BPMN Visualisierung • Wird geladen...
              </div>
            </div>

            {/* Optimierter Soll-Prozess */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-emerald-700/50 rounded-2xl p-6 flex-1 min-w-[320px] max-w-full mx-2 mb-4" style={{flexBasis:'400px'}}>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Optimierter Soll-Prozess</h3>
                  <span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 text-xs rounded font-medium">Optimiert</span>
                </div>
                <p className="text-sm text-slate-400">KI-generierte Verbesserungen</p>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-2 sm:p-6 aspect-[2/1] flex items-center justify-center border border-emerald-700/50 min-w-0">
                <svg className="w-full h-full max-w-full max-h-full" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet">
                  {/* Start Event */}
                  <circle cx="40" cy="150" r="20" fill="none" stroke="#22c55e" strokeWidth="2"/>
                  <circle cx="40" cy="150" r="18" fill="none" stroke="#22c55e" strokeWidth="1"/>
                  
                  {/* Activity 1 - Parallelisiert */}
                  <rect x="100" y="100" width="110" height="50" rx="8" fill="#064e3b" stroke="#10b981" strokeWidth="2"/>
                  <text x="155" y="122" textAnchor="middle" fill="#6ee7b7" fontSize="11">Datenvalidierung</text>
                  <text x="155" y="138" textAnchor="middle" fill="#10b981" fontSize="9">✓ Parallelisiert</text>
                  <line x1="60" y1="150" x2="100" y2="125" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowgreen)"/>
                  
                  {/* Activity 2 - Optimiert */}
                  <rect x="100" y="170" width="110" height="50" rx="8" fill="#064e3b" stroke="#10b981" strokeWidth="2"/>
                  <text x="155" y="192" textAnchor="middle" fill="#6ee7b7" fontSize="11">Qualitätsprüfung</text>
                  <text x="155" y="208" textAnchor="middle" fill="#10b981" fontSize="9">✓ Automatisiert</text>
                  <line x1="60" y1="150" x2="100" y2="195" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowgreen)"/>
                  
                  {/* Merge Gateway */}
                  <g transform="translate(260, 150) rotate(45)">
                    <rect x="-20" y="-20" width="40" height="40" fill="#064e3b" stroke="#10b981" strokeWidth="2"/>
                  </g>
                  <text x="260" y="155" textAnchor="middle" fill="#6ee7b7" fontSize="16">×</text>
                  <line x1="210" y1="125" x2="240" y2="140" stroke="#10b981" strokeWidth="2"/>
                  <line x1="210" y1="195" x2="240" y2="160" stroke="#10b981" strokeWidth="2"/>
                  
                  {/* Activity 3 - Smart Approval */}
                  <rect x="320" y="120" width="120" height="60" rx="8" fill="#064e3b" stroke="#10b981" strokeWidth="2"/>
                  <text x="380" y="142" textAnchor="middle" fill="#6ee7b7" fontSize="11">Smart Approval</text>
                  <text x="380" y="158" textAnchor="middle" fill="#10b981" fontSize="9">✓ KI-gestützt</text>
                  <text x="380" y="172" textAnchor="middle" fill="#10b981" fontSize="8">Keine Verzögerungen</text>
                  <line x1="280" y1="150" x2="320" y2="150" stroke="#10b981" strokeWidth="2"/>
                  
                  {/* Activity 4 - Auto Documentation */}
                  <rect x="480" y="120" width="90" height="60" rx="8" fill="#064e3b" stroke="#10b981" strokeWidth="2"/>
                  <text x="525" y="142" textAnchor="middle" fill="#6ee7b7" fontSize="11">Auto-Doku</text>
                  <text x="525" y="158" textAnchor="middle" fill="#10b981" fontSize="9">✓ Automatisch</text>
                  <line x1="440" y1="150" x2="480" y2="150" stroke="#10b981" strokeWidth="2"/>
                  
                  {/* End Event */}
                  <circle cx="580" cy="150" r="20" fill="none" stroke="#10b981" strokeWidth="4"/>
                  <line x1="570" y1="150" x2="560" y2="150" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowgreen)"/>
                  
                  {/* Green Arrow marker */}
                  <defs>
                    <marker id="arrowgreen" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="#10b981"/>
                    </marker>
                  </defs>
                </svg>
              </div>
              
              <div className="mt-4 text-xs text-emerald-500">
                Optimierte BPMN Visualisierung • Wird geladen...
              </div>
            </div>
          </div>
        </div>

  {/* Process Comparison */}
  <div className="flex flex-wrap gap-6 mb-8 -mx-2">
          <div className="bg-slate-900/60 backdrop-blur-sm border border-amber-700/50 rounded-2xl p-6 flex-1 min-w-[280px] max-w-full mx-2 mb-4" style={{flexBasis:'340px'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-amber-900/30 text-amber-400 text-xs rounded font-medium">Aktuell</span>
                <h3 className="font-semibold">Aktueller Prozess</h3>
              </div>
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400">Anzahl unterschiedlicher Prozessvarianten</span>
                <span className="font-semibold text-amber-500">6</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400">Durchschnittliche Durchlaufzeit</span>
                <span className="font-semibold text-amber-500">45 Min</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400">Durchschnittliche Prozesskosten</span>
                <span className="font-semibold text-amber-500">1500 EUR</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400">Anzahl Prozessaktivitäten</span>
                <span className="font-semibold text-amber-500">7</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Involvierte Ressourcen</span>
                <span className="font-semibold text-amber-500">8</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-sm border border-emerald-700/50 rounded-2xl p-6 flex-1 min-w-[280px] max-w-full mx-2 mb-4" style={{flexBasis:'340px'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 text-xs rounded font-medium">Optimiert</span>
                <h3 className="font-semibold">Optimierter Prozess</h3>
              </div>
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400">Durchlaufzeit</span>
                <span className="font-semibold text-emerald-500">28 Min</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400">Ressourcen</span>
                <span className="font-semibold text-emerald-500">6</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400">Effizienz</span>
                <span className="font-semibold text-emerald-500">94%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Engpässe</span>
                <span className="font-semibold text-emerald-500">0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Improvements */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <span>📈</span>
            <span>Verbesserungen im Überblick</span>
          </h2>
          <div className="flex flex-wrap gap-6 -mx-2">
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700 rounded-xl p-6 flex-1 min-w-[180px] max-w-full mx-2 mb-4" style={{flexBasis:'220px'}}>
              <div className="text-sm text-slate-400 mb-2">Zeitersparnis</div>
              <div className="text-4xl font-bold text-emerald-500 mb-1">38%</div>
              <div className="text-xs text-slate-500">17 Minuten schneller</div>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700 rounded-xl p-6 flex-1 min-w-[180px] max-w-full mx-2 mb-4" style={{flexBasis:'220px'}}>
              <div className="text-sm text-slate-400 mb-2">Ressourcen-Optimierung</div>
              <div className="text-4xl font-bold text-emerald-500 mb-1">25%</div>
              <div className="text-xs text-slate-500">2 Ressourcen weniger</div>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700 rounded-xl p-6 flex-1 min-w-[180px] max-w-full mx-2 mb-4" style={{flexBasis:'220px'}}>
              <div className="text-sm text-slate-400 mb-2">Effizienzsteigerung</div>
              <div className="text-4xl font-bold text-emerald-500 mb-1">+32%</div>
              <div className="text-xs text-slate-500">Von 62% auf 94%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 🤖 NEU: Detaillierte Agenten-Antworten Bereich */}
      {aiAnalysisResult && (
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-2 flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span>Detaillierte KI-Agenten-Analyse</span>
            </h2>
            <p className="text-slate-400 mb-8 ml-15">
              Vollständige Antworten aller 5 spezialisierten KI-Agenten
            </p>

            {/* Agent Cards Grid */}
            <div className="space-y-4">
              {parseAgentResults(aiAnalysisResult).map((agent) => (
                <div
                  key={agent.id}
                  className={`bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden transition-all ${
                    expandedAISection === agent.id ? 'ring-2 ring-' + agent.color + '-500' : ''
                  }`}
                >
                  {/* Agent Header */}
                  <button
                    onClick={() => setExpandedAISection(expandedAISection === agent.id ? null : agent.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-14 h-14 bg-gradient-to-br from-${agent.color}-600 to-${agent.color}-700 rounded-lg flex items-center justify-center text-3xl shadow-lg`}>
                        {agent.icon}
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-white">{agent.name}</h3>
                        <p className="text-sm text-slate-400">
                          {agent.id === 'requirements' && 'Extrahiert und strukturiert alle Anforderungen'}
                          {agent.id === 'economic' && 'Analysiert wirtschaftlichen Kontext und Marktbedingungen'}
                          {agent.id === 'performance' && 'Optimiert Durchlaufzeiten und Prozesseffizienz'}
                          {agent.id === 'finance' && 'Identifiziert Kosteneinsparpotenziale'}
                          {agent.id === 'compliance' && 'Prüft Einhaltung regulatorischer Vorgaben'}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-6 h-6 text-slate-400 transition-transform ${
                        expandedAISection === agent.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Agent Content - Expanded */}
                  {expandedAISection === agent.id && (
                    <div className="border-t border-slate-700 p-6 bg-slate-900/40">
                      <div className="bg-slate-950/60 rounded-lg p-6 max-h-[600px] overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-slate-300 text-sm font-mono leading-relaxed">
                          {aiAnalysisResult}
                        </pre>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                        <span>Generiert von CrewAI Multi-Agenten-System</span>
                        <span>Powered by OpenAI GPT-4.1</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Raw JSON View Toggle */}
            <div className="mt-8 pt-8 border-t border-slate-700">
              <button
                onClick={() => setExpandedAISection(expandedAISection === 'raw' ? null : 'raw')}
                className="w-full p-4 bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700 rounded-lg flex items-center justify-between transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span className="font-semibold">Vollständige Rohdaten anzeigen</span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform ${
                    expandedAISection === 'raw' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {expandedAISection === 'raw' && (
                <div className="mt-4 bg-slate-950/80 border border-slate-700 rounded-lg p-6 max-h-[800px] overflow-y-auto">
                  <pre className="text-xs text-slate-300 font-mono leading-relaxed">
                    {aiAnalysisResult}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
