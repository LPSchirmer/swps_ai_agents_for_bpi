import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronRight, Sparkles, CheckCircle, AlertTriangle, TrendingUp, Shield, FileText, BarChart3 } from 'lucide-react';

interface AgentResultsSectionProps {
  aiAnalysisResult: string;
}

interface ParsedSection {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  borderColor: string;
}

const AgentResultsSection = ({ aiAnalysisResult }: AgentResultsSectionProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [showRawData, setShowRawData] = useState(false);

  // Parse the markdown content into structured sections
  const parseMarkdownSections = (markdown: string): ParsedSection[] => {
    const sections: ParsedSection[] = [];
    
    // Define section patterns and their metadata
    const sectionPatterns = [
      {
        pattern: /#{1,2}\s*(?:1\.?\s*)?(?:\*\*)?Relevant Legal|Compliance Assessment|Legal.*Regulatory/i,
        id: 'compliance',
        title: 'Compliance & Regulatorische Analyse',
        icon: <Shield className="w-6 h-6" />,
        color: 'text-blue-400',
        bgGradient: 'from-blue-900/30 to-cyan-900/30',
        borderColor: 'border-blue-600/50'
      },
      {
        pattern: /#{1,2}\s*(?:2\.?\s*)?(?:\*\*)?Compliance Assessment|Gap.*Identified|Nonconformit/i,
        id: 'gaps',
        title: 'Identifizierte Lücken & Verstöße',
        icon: <AlertTriangle className="w-6 h-6" />,
        color: 'text-amber-400',
        bgGradient: 'from-amber-900/30 to-orange-900/30',
        borderColor: 'border-amber-600/50'
      },
      {
        pattern: /#{1,2}\s*(?:3\.?\s*)?(?:\*\*)?Improvement|Optimization|Proposal|Recommendation/i,
        id: 'improvements',
        title: 'Optimierungsvorschläge',
        icon: <TrendingUp className="w-6 h-6" />,
        color: 'text-emerald-400',
        bgGradient: 'from-emerald-900/30 to-teal-900/30',
        borderColor: 'border-emerald-600/50'
      },
      {
        pattern: /#{1,2}\s*(?:4\.?\s*)?(?:\*\*)?Summary.*Table|Compliance Gaps|Action/i,
        id: 'actions',
        title: 'Maßnahmen-Übersicht',
        icon: <CheckCircle className="w-6 h-6" />,
        color: 'text-purple-400',
        bgGradient: 'from-purple-900/30 to-indigo-900/30',
        borderColor: 'border-purple-600/50'
      },
      {
        pattern: /#{1,2}\s*(?:5\.?\s*)?(?:\*\*)?Conclusion|Zusammenfassung|Fazit/i,
        id: 'conclusion',
        title: 'Fazit & Empfehlungen',
        icon: <FileText className="w-6 h-6" />,
        color: 'text-cyan-400',
        bgGradient: 'from-cyan-900/30 to-blue-900/30',
        borderColor: 'border-cyan-600/50'
      }
    ];

    // Split markdown by main headers
    const headerRegex = /(?=^#{1,2}\s+)/gm;
    const parts = markdown.split(headerRegex).filter(p => p.trim());

    // Create summary section from the title
    const titleMatch = markdown.match(/^#\s+(.+?)(?:\n|$)/);
    if (titleMatch) {
      sections.push({
        id: 'summary',
        title: 'Analyse-Zusammenfassung',
        content: `# ${titleMatch[1]}`,
        icon: <Sparkles className="w-6 h-6" />,
        color: 'text-purple-400',
        bgGradient: 'from-purple-900/40 to-indigo-900/40',
        borderColor: 'border-purple-500/50'
      });
    }

    // Match each part to a section pattern
    parts.forEach(part => {
      for (const pattern of sectionPatterns) {
        if (pattern.pattern.test(part)) {
          sections.push({
            id: pattern.id,
            title: pattern.title,
            content: part.trim(),
            icon: pattern.icon,
            color: pattern.color,
            bgGradient: pattern.bgGradient,
            borderColor: pattern.borderColor
          });
          break;
        }
      }
    });

    // If no sections were parsed, create a single section with all content
    if (sections.length <= 1) {
      sections.push({
        id: 'full-analysis',
        title: 'Vollständige Analyse',
        content: markdown,
        icon: <BarChart3 className="w-6 h-6" />,
        color: 'text-blue-400',
        bgGradient: 'from-blue-900/30 to-indigo-900/30',
        borderColor: 'border-blue-600/50'
      });
    }

    return sections;
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allIds = parsedSections.map(s => s.id);
    setExpandedSections(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  const parsedSections = parseMarkdownSections(aiAnalysisResult);

  // Extract key metrics from the content
  const extractMetrics = (content: string) => {
    const metrics: { label: string; value: string; status: 'good' | 'warning' | 'critical' }[] = [];
    
    // Look for percentage improvements
    const percentMatch = content.match(/(\d+)%/g);
    if (percentMatch && percentMatch.length > 0) {
      metrics.push({
        label: 'Effizienzverbesserung',
        value: percentMatch[0],
        status: 'good'
      });
    }

    // Look for time savings
    const timeMatch = content.match(/(\d+)\s*(?:Min|Minuten|minutes)/i);
    if (timeMatch) {
      metrics.push({
        label: 'Zeitersparnis',
        value: `${timeMatch[1]} Min`,
        status: 'good'
      });
    }

    // Count violations/gaps
    const violationCount = (content.match(/violation|verstoss|lücke|gap/gi) || []).length;
    if (violationCount > 0) {
      metrics.push({
        label: 'Identifizierte Probleme',
        value: String(violationCount),
        status: violationCount > 5 ? 'critical' : 'warning'
      });
    }

    return metrics;
  };

  const metrics = extractMetrics(aiAnalysisResult);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">KI-Agenten Analyseergebnisse</h2>
            <p className="text-slate-400 text-sm">Detaillierte Auswertung durch das Multi-Agenten-System</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Alle öffnen
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Alle schließen
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className={`bg-slate-800/60 border rounded-xl p-4 ${
                metric.status === 'good' ? 'border-emerald-600/50' :
                metric.status === 'warning' ? 'border-amber-600/50' :
                'border-red-600/50'
              }`}
            >
              <div className="text-xs text-slate-400 mb-1">{metric.label}</div>
              <div className={`text-2xl font-bold ${
                metric.status === 'good' ? 'text-emerald-400' :
                metric.status === 'warning' ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expandable Sections */}
      <div className="space-y-3">
        {parsedSections.map((section) => (
          <div
            key={section.id}
            className={`bg-gradient-to-br ${section.bgGradient} border ${section.borderColor} rounded-xl overflow-hidden transition-all duration-300`}
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 bg-slate-800/80 rounded-lg flex items-center justify-center ${section.color}`}>
                  {section.icon}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                  <p className="text-sm text-slate-400">
                    {section.content.length > 100 
                      ? `${Math.ceil(section.content.length / 500)} Absätze • ${section.content.split('\n').filter(l => l.startsWith('-') || l.startsWith('*')).length} Punkte`
                      : 'Kompakte Übersicht'
                    }
                  </p>
                </div>
              </div>
              <div className={`transform transition-transform ${expandedSections.has(section.id) ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </div>
            </button>

            {/* Section Content */}
            {expandedSections.has(section.id) && (
              <div className="border-t border-slate-700/50 p-6 bg-slate-900/40">
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-white mb-4 pb-2 border-b border-slate-700">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-semibold text-white mt-6 mb-3">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-semibold text-slate-200 mt-4 mb-2">{children}</h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-slate-300 mb-3 leading-relaxed">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-1 mb-4 text-slate-300">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-1 mb-4 text-slate-300">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-slate-300">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="text-white font-semibold">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="text-cyan-400 italic">{children}</em>
                      ),
                      code: ({ children }) => (
                        <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-sm">{children}</code>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full border border-slate-700 rounded-lg overflow-hidden">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-slate-800">{children}</thead>
                      ),
                      th: ({ children }) => (
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white border-b border-slate-700">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-4 py-3 text-sm text-slate-300 border-b border-slate-700/50">
                          {children}
                        </td>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-cyan-500 pl-4 my-4 italic text-slate-400">
                          {children}
                        </blockquote>
                      ),
                      hr: () => <hr className="border-slate-700 my-6" />
                    }}
                  >
                    {section.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Raw Data Toggle */}
      <div className="border-t border-slate-700 pt-6">
        <button
          onClick={() => setShowRawData(!showRawData)}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
        >
          {showRawData ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="text-sm font-medium">Vollständige Rohdaten anzeigen</span>
        </button>
        
        {showRawData && (
          <div className="mt-4 bg-slate-950 border border-slate-700 rounded-xl p-6 max-h-[600px] overflow-auto">
            <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
              {aiAnalysisResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentResultsSection;
