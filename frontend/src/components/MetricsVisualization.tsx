import { useState } from 'react';
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
  Cell,
  ComposedChart,
  Line,
  Area
} from 'recharts';
import { BarChart3, Activity, Clock, DollarSign, Users, RefreshCw, TrendingUp } from 'lucide-react';

// TypeScript Interfaces
export interface ProcessMetrics {
  overview?: {
    cases: number;
    variants: number;
    activities: number;
    resources: number;
    events: number;
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
  resourceHeatmap?: Array<{
    resource: string;
    activity: string;
    count: number;
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

interface MetricsVisualizationProps {
  metrics: ProcessMetrics | null;
}

// Farbpaletten - Muted Tech Design
const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#10B981', '#F97316'];

const MetricsVisualization = ({ metrics }: MetricsVisualizationProps) => {
  const [activeChart, setActiveChart] = useState<string>('overview');

  if (!metrics) {
    return (
      <div className="bg-background-surface border border-border rounded-card p-8 text-center">
        <BarChart3 className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <p className="text-text-secondary">Keine Prozessmetriken verfügbar</p>
        <p className="text-text-muted text-sm mt-2">Laden Sie ein Event Log hoch, um Visualisierungen zu sehen</p>
      </div>
    );
  }

  // Überprüfe ob überhaupt Daten vorhanden sind
  const hasData = metrics.overview && (
    metrics.overview.cases > 0 || 
    metrics.overview.variants > 0 ||
    (metrics.activityDurations && metrics.activityDurations.length > 0) ||
    (metrics.activityCosts && metrics.activityCosts.length > 0)
  );

  if (!hasData) {
    return (
      <div className="bg-background-surface border border-border rounded-card p-8 text-center">
        <BarChart3 className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <p className="text-text-secondary">Event Log ohne auswertbare Metriken</p>
        <p className="text-text-muted text-sm mt-2">Stellen Sie sicher, dass die Datei valide Prozessdaten enthält</p>
      </div>
    );
  }

  // Radar-Chart Daten für Übersicht
  const radarData = metrics.overview ? [
    { subject: 'Cases', A: Math.min(metrics.overview.cases, 100), fullMark: 100 },
    { subject: 'Varianten', A: Math.min(metrics.overview.variants, 50), fullMark: 50 },
    { subject: 'Aktivitäten', A: Math.min(metrics.overview.activities, 30), fullMark: 30 },
    { subject: 'Ressourcen', A: Math.min(metrics.overview.resources, 20), fullMark: 20 },
    { subject: 'Events (k)', A: Math.min(metrics.overview.events / 1000, 10), fullMark: 10 }
  ] : [];

  // Chart Tabs
  const chartTabs = [
    { id: 'overview', label: 'Übersicht', icon: <Activity className="w-4 h-4" /> },
    { id: 'performance', label: 'Performance', icon: <Clock className="w-4 h-4" /> },
    { id: 'costs', label: 'Kosten', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'resources', label: 'Ressourcen', icon: <Users className="w-4 h-4" /> },
    { id: 'rework', label: 'Nacharbeit', icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'variants', label: 'Varianten', icon: <TrendingUp className="w-4 h-4" /> }
  ];

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background-elevated border border-border rounded-lg p-3 shadow-card">
          <p className="text-text-primary font-medium mb-2">{label}</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-text-primary">Prozess-Metriken Visualisierung</h2>
            <p className="text-text-secondary text-sm">Interaktive Analyse basierend auf Event Log Daten</p>
          </div>
        </div>
      </div>

      {/* Chart Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {chartTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveChart(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-button transition-all duration-150 ${
              activeChart === tab.id
                ? 'bg-accent text-white'
                : 'bg-background-elevated text-text-secondary hover:bg-background-elevated/80 hover:text-text-primary border border-border'
            }`}
          >
            {tab.icon}
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Chart Container */}
      <div className="bg-background-surface border border-border rounded-card p-6">
        
        {/* Übersicht - Radar Chart */}
        {activeChart === 'overview' && radarData.length > 0 && (
          <div>
            <h3 className="text-lg font-display font-semibold text-text-primary mb-4">🎯 Prozess-Übersicht (Radar)</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fill: '#6B7280', fontSize: 10 }} />
                  <Radar
                    name="Prozess-Metriken"
                    dataKey="A"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.4}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
              
              {/* Aktivitäten Pie Chart */}
              {metrics.activityFrequency && metrics.activityFrequency.length > 0 && (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={metrics.activityFrequency.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) => 
                        name && percent !== undefined 
                          ? `${name.slice(0, 15)}${name.length > 15 ? '...' : ''} (${(percent * 100).toFixed(0)}%)`
                          : ''
                      }
                      labelLine={false}
                    >
                      {metrics.activityFrequency.slice(0, 8).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Performance - Aktivitäten-Dauern */}
        {activeChart === 'performance' && metrics.activityDurations && metrics.activityDurations.length > 0 && (
          <div>
            <h3 className="text-lg font-display font-semibold text-text-primary mb-4">⏱️ Aktivitäten-Dauern</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={metrics.activityDurations} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" tick={{ fill: '#9CA3AF' }} />
                <YAxis 
                  dataKey="activity" 
                  type="category" 
                  width={150} 
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="meanDuration" name="Ø Dauer (h)" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                <Line dataKey="frequency" name="Häufigkeit" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Kosten - Aktivitäten-Kosten */}
        {activeChart === 'costs' && metrics.activityCosts && metrics.activityCosts.length > 0 && (
          <div>
            <h3 className="text-lg font-display font-semibold text-text-primary mb-4">💰 Kosten pro Aktivität</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={metrics.activityCosts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" tick={{ fill: '#9CA3AF' }} />
                <YAxis 
                  dataKey="activity" 
                  type="category" 
                  width={150} 
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="totalCost" name="Gesamtkosten (€)" fill="#22C55E" radius={[0, 4, 4, 0]} />
                <Bar dataKey="meanCost" name="Ø Kosten (€)" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Ressourcen - Heatmap als Bar Chart gruppiert */}
        {activeChart === 'resources' && metrics.resourceHeatmap && metrics.resourceHeatmap.length > 0 && (
          <div>
            <h3 className="text-lg font-display font-semibold text-text-primary mb-4">👥 Ressourcen-Aktivitäten Verteilung</h3>
            <div className="overflow-x-auto">
              {/* Gruppiere nach Ressource */}
              {(() => {
                const resourceGroups: Record<string, Array<{ activity: string; count: number }>> = {};
                metrics.resourceHeatmap.forEach(item => {
                  if (!resourceGroups[item.resource]) {
                    resourceGroups[item.resource] = [];
                  }
                  resourceGroups[item.resource].push({ activity: item.activity, count: item.count });
                });
                
                return Object.entries(resourceGroups).slice(0, 8).map(([resource, activities]) => (
                  <div key={resource} className="mb-4">
                    <div className="text-sm text-accent mb-2">{resource}</div>
                    <div className="flex flex-wrap gap-2">
                      {activities.slice(0, 10).map((act, i) => (
                        <div 
                          key={i}
                          className="px-3 py-1 rounded-full text-xs"
                          style={{ 
                            backgroundColor: `rgba(59, 130, 246, ${Math.min(act.count / 10, 1)})`,
                            color: act.count > 5 ? 'white' : '#9CA3AF'
                          }}
                        >
                          {act.activity.slice(0, 20)}: {act.count}
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Rework - Nacharbeit */}
        {activeChart === 'rework' && metrics.reworkStats && metrics.reworkStats.length > 0 && (
          <div>
            <h3 className="text-lg font-display font-semibold text-text-primary mb-4">🔄 Nacharbeit pro Aktivität</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={metrics.reworkStats.filter(r => r.reworkCases > 0)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" tick={{ fill: '#9CA3AF' }} />
                <YAxis 
                  dataKey="activity" 
                  type="category" 
                  width={150} 
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="reworkCases" name="Nacharbeits-Cases" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {metrics.reworkStats.filter(r => r.reworkCases > 0).length === 0 && (
              <p className="text-center text-text-secondary mt-4">✅ Keine Nacharbeit erkannt - der Prozess läuft optimal!</p>
            )}
          </div>
        )}

        {/* Varianten */}
        {activeChart === 'variants' && metrics.variantStats && metrics.variantStats.length > 0 && (
          <div>
            <h3 className="text-lg font-display font-semibold text-text-primary mb-4">📊 Top 10 Prozessvarianten</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={metrics.variantStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="variant" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis yAxisId="left" orientation="left" tick={{ fill: '#9CA3AF' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9CA3AF' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="frequency" name="Häufigkeit" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Area yAxisId="right" dataKey="meanDuration" name="Ø Dauer (h)" fill="#3B82F6" stroke="#3B82F6" fillOpacity={0.3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Fallback wenn keine Daten für aktiven Chart */}
        {((activeChart === 'performance' && (!metrics.activityDurations || metrics.activityDurations.length === 0)) ||
          (activeChart === 'costs' && (!metrics.activityCosts || metrics.activityCosts.length === 0)) ||
          (activeChart === 'resources' && (!metrics.resourceHeatmap || metrics.resourceHeatmap.length === 0)) ||
          (activeChart === 'rework' && (!metrics.reworkStats || metrics.reworkStats.length === 0)) ||
          (activeChart === 'variants' && (!metrics.variantStats || metrics.variantStats.length === 0))) && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">Keine Daten für diese Ansicht verfügbar</p>
            <p className="text-text-muted text-sm mt-2">Wechseln Sie zu einer anderen Visualisierung</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsVisualization;
