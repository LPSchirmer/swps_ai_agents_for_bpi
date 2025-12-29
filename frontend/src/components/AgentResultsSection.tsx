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
    
    // Define section patterns and their metadata - Muted Tech Design
    const sectionPatterns = [
      {
        pattern: /#{1,2}\s*(?:1\.?\s*)?(?:\*\*)?Relevant Legal|Compliance Assessment|Legal.*Regulatory/i,
        id: 'compliance',
        title: 'Compliance & Regulatorische Analyse',
        icon: <Shield className="w-6 h-6" />,
        color: 'text-accent',
        bgGradient: 'from-accent/5 to-accent/10',
        borderColor: 'border-accent/20'
      },
      {
        pattern: /#{1,2}\s*(?:2\.?\s*)?(?:\*\*)?Compliance Assessment|Gap.*Identified|Nonconformit/i,
        id: 'gaps',
        title: 'Identifizierte Lücken & Verstöße',
        icon: <AlertTriangle className="w-6 h-6" />,
        color: 'text-semantic-warning',
        bgGradient: 'from-semantic-warning/5 to-semantic-warning/10',
        borderColor: 'border-semantic-warning/20'
      },
      {
        pattern: /#{1,2}\s*(?:3\.?\s*)?(?:\*\*)?Improvement|Optimization|Proposal|Recommendation/i,
        id: 'improvements',
        title: 'Optimierungsvorschläge',
        icon: <TrendingUp className="w-6 h-6" />,
        color: 'text-semantic-success',
        bgGradient: 'from-semantic-success/5 to-semantic-success/10',
        borderColor: 'border-semantic-success/20'
      },
      {
        pattern: /#{1,2}\s*(?:4\.?\s*)?(?:\*\*)?Summary.*Table|Compliance Gaps|Action/i,
        id: 'actions',
        title: 'Maßnahmen-Übersicht',
        icon: <CheckCircle className="w-6 h-6" />,
        color: 'text-purple-400',
        bgGradient: 'from-purple-500/5 to-purple-500/10',
        borderColor: 'border-purple-500/20'
      },
      {
        pattern: /#{1,2}\s*(?:5\.?\s*)?(?:\*\*)?Conclusion|Zusammenfassung|Fazit/i,
        id: 'conclusion',
        title: 'Fazit & Empfehlungen',
        icon: <FileText className="w-6 h-6" />,
        color: 'text-accent',
        bgGradient: 'from-accent/5 to-accent/10',
        borderColor: 'border-accent/20'
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
        color: 'text-accent',
        bgGradient: 'from-accent/5 to-accent/10',
        borderColor: 'border-accent/20'
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
        color: 'text-accent',
        bgGradient: 'from-accent/5 to-accent/10',
        borderColor: 'border-accent/20'
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
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-text-primary">KI-Agenten Analyseergebnisse</h2>
            <p className="text-text-secondary text-sm">Detaillierte Auswertung durch das Multi-Agenten-System</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs bg-background-elevated hover:bg-background-elevated/80 text-text-secondary border border-border rounded-button transition-all duration-150"
          >
            Alle öffnen
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs bg-background-elevated hover:bg-background-elevated/80 text-text-secondary border border-border rounded-button transition-all duration-150"
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
              className={`bg-background-surface border rounded-card p-4 ${
                metric.status === 'good' ? 'border-semantic-success/30' :
                metric.status === 'warning' ? 'border-semantic-warning/30' :
                'border-semantic-error/30'
              }`}
            >
              <div className="text-xs text-text-secondary mb-1">{metric.label}</div>
              <div className={`text-2xl font-display font-bold ${
                metric.status === 'good' ? 'text-semantic-success' :
                metric.status === 'warning' ? 'text-semantic-warning' :
                'text-semantic-error'
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
            className={`bg-gradient-to-br ${section.bgGradient} border ${section.borderColor} rounded-card overflow-hidden transition-all duration-150`}
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors duration-150"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 bg-background-elevated rounded-lg flex items-center justify-center ${section.color}`}>
                  {section.icon}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-display font-semibold text-text-primary">{section.title}</h3>
                  <p className="text-sm text-text-secondary">
                    {section.content.length > 100 
                      ? `${Math.ceil(section.content.length / 500)} Absätze • ${section.content.split('\n').filter(l => l.startsWith('-') || l.startsWith('*')).length} Punkte`
                      : 'Kompakte Übersicht'
                    }
                  </p>
                </div>
              </div>
              <div className={`transform transition-transform duration-150 ${expandedSections.has(section.id) ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-5 h-5 text-text-secondary" />
              </div>
            </button>

            {/* Section Content */}
            {expandedSections.has(section.id) && (
              <div className="border-t border-border p-6 bg-background-surface/50">
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-display font-bold text-text-primary mb-4 pb-2 border-b border-border">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-display font-semibold text-text-primary mt-6 mb-3">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-semibold text-text-primary mt-4 mb-2">{children}</h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-text-secondary mb-3 leading-relaxed">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-1 mb-4 text-text-secondary">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-1 mb-4 text-text-secondary">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-text-secondary">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="text-text-primary font-semibold">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="text-accent italic">{children}</em>
                      ),
                      code: ({ children }) => (
                        <code className="bg-background-elevated text-accent px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full border border-border rounded-lg overflow-hidden">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-background-elevated">{children}</thead>
                      ),
                      th: ({ children }) => (
                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-4 py-3 text-sm text-text-secondary border-b border-border/50">
                          {children}
                        </td>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-accent pl-4 my-4 italic text-text-secondary">
                          {children}
                        </blockquote>
                      ),
                      hr: () => <hr className="border-border my-6" />
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
      <div className="border-t border-border pt-6">
        <button
          onClick={() => setShowRawData(!showRawData)}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          {showRawData ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="text-sm font-medium">Vollständige Rohdaten anzeigen</span>
        </button>
        
        {showRawData && (
          <div className="mt-4 bg-background border border-border rounded-card p-6 max-h-[600px] overflow-auto">
            <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap leading-relaxed">
              {aiAnalysisResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentResultsSection;
