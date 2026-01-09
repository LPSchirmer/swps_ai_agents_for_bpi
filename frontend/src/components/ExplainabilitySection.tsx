import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Brain, Search, BookOpen, Wrench, Lightbulb, Eye, EyeOff, Loader2, AlertCircle, Shield, Zap, DollarSign, Globe, ClipboardList } from 'lucide-react';
import axios from 'axios';

interface ToolUsage {
  tool_name: string;
  search_query: string | null;
  query_result: string | null;
}

interface AgentExplainability {
  agent_name: string;
  agent_role: string;
  task_description: string;
  thoughts: string[];
  retrieved_knowledge: string[];
  tools_used: ToolUsage[];
  final_answer_preview: string;
}

interface ExplainabilityData {
  success: boolean;
  agents: {
    compliance?: AgentExplainability;
    performance?: AgentExplainability;
    finance?: AgentExplainability;
    economic?: AgentExplainability;
    requirements?: AgentExplainability;
  };
  source_file?: string;
  error?: string;
}

// Agent-Konfiguration für Reihenfolge und Styling
// Reihenfolge: Requirements → Economic Context → Compliance → Performance → Finance
const AGENT_CONFIG = [
  {
    key: 'requirements',
    label: 'Requirements Agent',
    icon: ClipboardList,
    color: 'blue',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    description: 'Extrahiert & strukturiert Anforderungen'
  },
  {
    key: 'economic',
    label: 'Economic Agent',
    icon: Globe,
    color: 'purple',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    description: 'Bewertet makroökonomischen, industriespezifischen und organisationalen Kontext'
  },
  {
    key: 'compliance',
    label: 'Compliance Agent',
    icon: Shield,
    color: 'cyan',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    iconColor: 'text-cyan-400',
    description: 'Prüft regulatorische & rechtliche Anforderungen'
  },
  {
    key: 'performance',
    label: 'Performance Agent',
    icon: Zap,
    color: 'amber',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    description: 'Analysiert Prozessgeschwindigkeit & Effizienz'
  },
  {
    key: 'finance',
    label: 'Finance Agent',
    icon: DollarSign,
    color: 'emerald',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    description: 'Identifiziert Kostentreiber & Einsparpotenziale'
  }
];

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

const ExpandableText = ({ text, maxLength = 300, className = '' }: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text) return null;
  
  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? text.substring(0, maxLength) + '...' 
    : text;
  
  return (
    <div className={className}>
      <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap break-words">
        {displayText}
      </p>
      {shouldTruncate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="mt-2 flex items-center space-x-1 text-xs text-accent hover:text-accent-hover transition-colors font-medium"
        >
          {isExpanded ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Weniger anzeigen</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Mehr anzeigen</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

interface AgentExplainabilityCardProps {
  config: typeof AGENT_CONFIG[0];
  data: AgentExplainability | undefined;
  isExpanded: boolean;
  onToggle: () => void;
}

const AgentExplainabilityCard = ({ config, data, isExpanded, onToggle }: AgentExplainabilityCardProps) => {
  const Icon = config.icon;
  
  const hasContent = data && (
    data.thoughts.length > 0 ||
    data.retrieved_knowledge.length > 0 ||
    data.tools_used.length > 0
  );
  
  return (
    <div className={`border ${config.borderColor} rounded-panel overflow-hidden transition-all duration-200 ${config.bgColor}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center space-x-4">
          <div className={`w-10 h-10 ${config.bgColor} border ${config.borderColor} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-text-primary font-display">{config.label}</h4>
            <p className="text-xs text-text-muted">{config.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {hasContent && (
            <div className="flex items-center space-x-2 text-xs text-text-muted">
              {data!.thoughts.length > 0 && (
                <span className="px-2 py-1 bg-white/5 rounded">
                  {data!.thoughts.length} Gedanken
                </span>
              )}
              {data!.tools_used.length > 0 && (
                <span className="px-2 py-1 bg-white/5 rounded">
                  {data!.tools_used.length} Tools
                </span>
              )}
            </div>
          )}
          {isExpanded ? (
            <ChevronDown className={`w-5 h-5 ${config.iconColor}`} />
          ) : (
            <ChevronRight className={`w-5 h-5 ${config.iconColor}`} />
          )}
        </div>
      </button>
      
      {/* Expandierter Inhalt */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
          {!hasContent ? (
            <p className="text-sm text-text-muted italic">
              Keine detaillierten Reasoning-Daten für diesen Agenten verfügbar.
            </p>
          ) : (
            <>
              {/* Task Description */}
              {data!.task_description && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="w-4 h-4 text-text-muted" />
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Aufgabe</span>
                  </div>
                  <ExpandableText 
                    text={data!.task_description} 
                    maxLength={250}
                    className="pl-6"
                  />
                </div>
              )}
              
              {/* Thoughts */}
              {data!.thoughts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Gedanken & Reasoning</span>
                  </div>
                  <div className="pl-6 space-y-3">
                    {data!.thoughts.map((thought, idx) => (
                      <div key={idx} className="relative pl-4 border-l-2 border-amber-500/30">
                        <ExpandableText 
                          text={thought} 
                          maxLength={300}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Retrieved Knowledge */}
              {data!.retrieved_knowledge.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Abgerufenes Wissen</span>
                  </div>
                  <div className="pl-6 space-y-3">
                    {data!.retrieved_knowledge.map((knowledge, idx) => (
                      <div key={idx} className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                        <ExpandableText 
                          text={knowledge} 
                          maxLength={300}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tools Used */}
              {data!.tools_used.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Wrench className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Verwendete Tools</span>
                  </div>
                  <div className="pl-6 space-y-4">
                    {data!.tools_used.map((tool, idx) => (
                      <div key={idx} className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-3">
                        <div className="flex items-center space-x-2">
                          <Search className="w-4 h-4 text-emerald-400" />
                          <span className="font-medium text-sm text-text-primary">{tool.tool_name}</span>
                        </div>
                        
                        {tool.search_query && (
                          <div className="space-y-1">
                            <span className="text-xs text-text-muted">Suchanfrage:</span>
                            <p className="text-sm text-text-secondary bg-black/20 px-3 py-2 rounded font-mono">
                              "{tool.search_query}"
                            </p>
                          </div>
                        )}
                        
                        {tool.query_result && (
                          <div className="space-y-1">
                            <span className="text-xs text-text-muted">Ergebnis:</span>
                            <ExpandableText 
                              text={tool.query_result}
                              maxLength={350}
                              className="bg-black/20 px-3 py-2 rounded"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const ExplainabilitySection = () => {
  const [data, setData] = useState<ExplainabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Einzelne Agenten-Karten sind standardmäßig GESCHLOSSEN
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  // Die Explainability-Sektion ist standardmäßig OFFEN
  const [isSectionExpanded, setIsSectionExpanded] = useState(true);
  
  // Lade Explainability-Daten automatisch beim Mounten (da Sektion offen startet)
  useEffect(() => {
    if (isSectionExpanded && !data && !isLoading) {
      loadExplainabilityData();
    }
  }, [isSectionExpanded]);
  
  const loadExplainabilityData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<ExplainabilityData>('http://localhost:5001/api/explainability-data');
      
      if (response.data.success) {
        setData(response.data);
      } else {
        setError(response.data.error || 'Fehler beim Laden der Daten');
      }
    } catch (err) {
      console.error('Explainability load error:', err);
      setError('Verbindung zum Server fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleAgent = (agentKey: string) => {
    setExpandedAgents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agentKey)) {
        newSet.delete(agentKey);
      } else {
        newSet.add(agentKey);
      }
      return newSet;
    });
  };
  
  const expandAll = () => {
    setExpandedAgents(new Set(AGENT_CONFIG.map(c => c.key)));
  };
  
  const collapseAll = () => {
    setExpandedAgents(new Set());
  };
  
  return (
    <div className="mt-8 mb-8">
      <div className="bg-background-surface border border-border rounded-panel overflow-hidden shadow-card">
        {/* Header - Klickbar zum Auf/Zuklappen */}
        <button
          onClick={() => setIsSectionExpanded(!isSectionExpanded)}
          className="w-full px-6 py-5 flex items-center justify-between hover:bg-background-elevated transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-violet-400" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-display font-semibold text-text-primary">
                Explainability - Wie die Agenten denken
              </h3>
              <p className="text-sm text-text-muted mt-1">
                Transparente Darstellung des KI-Reasoning: Gedanken, Wissensabruf & Tool-Nutzung
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1.5 bg-violet-500/10 text-violet-400 text-sm rounded-button font-medium">
              {isSectionExpanded ? 'Ausblenden' : 'Anzeigen'}
            </span>
            <ChevronDown className={`w-5 h-5 text-violet-400 transition-transform duration-200 ${isSectionExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>
        
        {/* Expandierter Inhalt */}
        {isSectionExpanded && (
          <div className="border-t border-border p-6 animate-fadeIn">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
                <p className="text-text-secondary">Lade Explainability-Daten...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center space-x-3 py-12">
                <AlertCircle className="w-6 h-6 text-semantic-error" />
                <p className="text-semantic-error">{error}</p>
                <button
                  onClick={loadExplainabilityData}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-button text-sm font-medium transition-colors"
                >
                  Erneut versuchen
                </button>
              </div>
            ) : data ? (
              <div className="space-y-4">
                {/* Controls */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-text-muted">
                    Quelle: {data.source_file}
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={expandAll}
                      className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary bg-white/5 hover:bg-white/10 rounded-button transition-colors"
                    >
                      Alle öffnen
                    </button>
                    <button
                      onClick={collapseAll}
                      className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary bg-white/5 hover:bg-white/10 rounded-button transition-colors"
                    >
                      Alle schließen
                    </button>
                  </div>
                </div>
                
                {/* Agent Cards */}
                <div className="space-y-3">
                  {AGENT_CONFIG.map(config => (
                    <AgentExplainabilityCard
                      key={config.key}
                      config={config}
                      data={data.agents[config.key as keyof typeof data.agents]}
                      isExpanded={expandedAgents.has(config.key)}
                      onToggle={() => toggleAgent(config.key)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Brain className="w-12 h-12 text-text-muted" />
                <p className="text-text-secondary">Keine Explainability-Daten verfügbar</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplainabilitySection;
