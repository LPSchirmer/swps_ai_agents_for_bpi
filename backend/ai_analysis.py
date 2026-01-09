"""
AI Analysis Module
Verbindet ETL-Pipeline, Process Analysis Engine und CrewAI Multi-Agenten-System
"""

import sys
import os
from pathlib import Path
from datetime import datetime
import json
import io
from typing import Optional, Dict, Any

# Setup paths
BACKEND_DIR = Path(__file__).parent
PROJECT_ROOT = BACKEND_DIR.parent
sys.path.append(str(PROJECT_ROOT / 'src'))
sys.path.append(str(BACKEND_DIR / 'process_analysis_engine'))
sys.path.append(str(BACKEND_DIR / 'etl'))

# Import CrewAI
try:
    from swps_ai_agents_for_bpi.crew import SwpsAiAgentsForBpi
    CREW_AVAILABLE = True
except Exception as e:
    print(f"⚠️  CrewAI Import Warning: {e}")
    CREW_AVAILABLE = False

# Import Process Analysis Engine
try:
    from analysis_workflow import (
        calculate_result_dict_basic,
        calculate_result_dict_performance,
        calculate_result_dict_finance,
        calculate_result_dict_compliance
    )
    ANALYSIS_AVAILABLE = True
except Exception as e:
    print(f"⚠️  Analysis Engine Import Warning: {e}")
    ANALYSIS_AVAILABLE = False

# Import Process Visualization
try:
    from process_visualization import ProcessVisualizer
    VISUALIZATION_AVAILABLE = True
except Exception as e:
    print(f"⚠️  Process Visualization Import Warning: {e}")
    VISUALIZATION_AVAILABLE = False

# Import ETL Pipeline
try:
    from pipeline import get_textual_data, get_event_log
    ETL_AVAILABLE = True
except Exception as e:
    print(f"⚠️  ETL Pipeline Import Warning: {e}")
    ETL_AVAILABLE = False


# ============================================================
# GLOBALE VARIABLE FÜR TERMINAL-OUTPUT
# ============================================================
last_crew_terminal_output = ""


def extract_visualizable_metrics(kpis: Dict[str, Optional[str]]) -> Dict[str, Any]:
    """
    Extrahiert visualisierbare Metriken aus den berechneten KPIs
    
    Args:
        kpis: Dictionary mit JSON-serialisierten KPIs (basic, performance, finance, compliance)
        
    Returns:
        Dictionary mit strukturierten Daten für Frontend-Visualisierungen
    """
    metrics = {
        'overview': {},           # Radar Chart Daten
        'activityCosts': [],      # Bar Chart: Kosten pro Aktivität
        'activityDurations': [],  # Bar Chart: Dauer pro Aktivität
        'caseDurations': [],      # Histogramm: Durchlaufzeiten
        'reworkStats': [],        # Bar Chart: Nacharbeit pro Aktivität
        'resourceHeatmap': [],    # Heatmap: Ressourcen-Aktivitäten
        'variantStats': [],       # Bar Chart: Varianten-Statistiken
        'costDistribution': {}    # Kosten-Verteilung
    }
    
    try:
        # 1. Basic Information für Übersichts-Radar
        if kpis.get('basic'):
            basic_data = json.loads(kpis['basic'])
            metrics['overview'] = {
                'cases': basic_data.get('number_cases', 0),
                'variants': basic_data.get('number_variants', 0),
                'activities': basic_data.get('number_activities', 0),
                'resources': basic_data.get('number_resources', 0),
                'events': basic_data.get('number_events', 0)
            }
            
            # Aktivitäten-Häufigkeit für Pie Chart
            if basic_data.get('activities_frequency'):
                metrics['activityFrequency'] = [
                    {'name': name, 'value': count}
                    for name, count in basic_data['activities_frequency'].items()
                ]
        
        # 2. Performance Metriken
        if kpis.get('performance'):
            perf_data = json.loads(kpis['performance'])
            
            # Aktivitäten-Dauern für Bar Chart
            if perf_data.get('activities_frequency_total_mean_durations'):
                metrics['activityDurations'] = [
                    {
                        'activity': item.get('concept:name', 'Unknown'),
                        'meanDuration': round(item.get('mean_activity_duration_hours', 0), 2),
                        'totalDuration': round(item.get('overall_activity_duration_hours', 0), 2),
                        'frequency': item.get('frequency', 0)
                    }
                    for item in perf_data['activities_frequency_total_mean_durations']
                ]
            
            # Case-Dauer-Statistiken
            if perf_data.get('case_durations_statistics'):
                stats = perf_data['case_durations_statistics']
                metrics['caseDurationStats'] = {
                    'min': stats.get('min', 0),
                    'max': stats.get('max', 0),
                    'median': stats.get('median', 0),
                    'mean': stats.get('mean', 0),
                    'variance': stats.get('variance', 0),
                    'standardDeviation': stats.get('standard_deviation', 0)
                }
            
            # Case-Dauern für Histogramm
            if perf_data.get('case_durations'):
                durations = [item.get('case_duration_hours', 0) for item in perf_data['case_durations']]
                # Gruppiere in Bins für Histogramm
                if durations:
                    min_d, max_d = min(durations), max(durations)
                    bin_size = (max_d - min_d) / 10 if max_d > min_d else 1
                    bins = {}
                    for d in durations:
                        bin_idx = int((d - min_d) / bin_size) if bin_size > 0 else 0
                        bin_label = f"{round(min_d + bin_idx * bin_size, 1)}-{round(min_d + (bin_idx + 1) * bin_size, 1)}"
                        bins[bin_label] = bins.get(bin_label, 0) + 1
                    metrics['caseDurations'] = [
                        {'range': k, 'count': v}
                        for k, v in bins.items()
                    ]
            
            # Rework-Statistiken für Bar Chart
            if perf_data.get('rework_cases_per_activity'):
                metrics['reworkStats'] = [
                    {'activity': name, 'reworkCases': count}
                    for name, count in perf_data['rework_cases_per_activity'].items()
                ]
            
            # Varianten-Statistiken
            if perf_data.get('variants_frequency_total_mean_durations'):
                metrics['variantStats'] = [
                    {
                        'variant': f"Variante {i+1}",
                        'fullPath': item.get('@@variant_column', ''),
                        'frequency': item.get('frequency', 0),
                        'meanDuration': round(item.get('mean_variant_duration_hours', 0), 2)
                    }
                    for i, item in enumerate(perf_data['variants_frequency_total_mean_durations'][:10])
                ]
            
            # Ressourcen-Aktivitäten Heatmap
            if perf_data.get('activities_per_resources'):
                heatmap_data = []
                for item in perf_data['activities_per_resources']:
                    resource = item.get('org:resource', 'Unknown')
                    activities = item.get('concept:name', [])
                    for activity in activities:
                        # Finde existierenden Eintrag oder erstelle neuen
                        existing = next((x for x in heatmap_data if x['resource'] == resource and x['activity'] == activity), None)
                        if existing:
                            existing['count'] += 1
                        else:
                            heatmap_data.append({'resource': resource, 'activity': activity, 'count': 1})
                metrics['resourceHeatmap'] = heatmap_data
        
        # 3. Finance Metriken
        if kpis.get('finance'):
            finance_data = json.loads(kpis['finance'])
            
            # Kosten pro Aktivität für Bar Chart
            if finance_data.get('total_mean_costs_per_activity'):
                metrics['activityCosts'] = [
                    {
                        'activity': item.get('concept:name', 'Unknown'),
                        'totalCost': round(item.get('total_costs', 0), 2),
                        'meanCost': round(item.get('mean_costs', 0), 2)
                    }
                    for item in finance_data['total_mean_costs_per_activity']
                ]

            metrics['costDistribution'] = {}

            # Kosten-Verteilung
            if finance_data.get('case_costs_statistics'):
                costs = finance_data['case_costs_statistics']
                metrics['costDistribution'].update({
                    'min': costs.get('min', 0),
                    'max': costs.get('max', 0),
                    'median': costs.get('median', 0),
                    'mean': costs.get('mean', 0),
                    'variance': costs.get('variance', 0),
                    'standardDeviation': costs.get('standard_deviation', 0)
                    })
                
            if finance_data.get('total_costs_per_case'):
                costs_helper = [item.get('cost:amount', 0) for item in finance_data['total_costs_per_case']]
                if costs_helper:
                    metrics['costDistribution'].update({
                        'total': round(sum(costs_helper), 2),
                        'caseCount': len(costs_helper)
                    })
    
    except Exception as e:
        print(f"⚠️  Fehler beim Extrahieren der Visualisierungs-Metriken: {e}")
        import traceback
        traceback.print_exc()
    
    return metrics


def generate_process_visualization(upload_dir: str, kpi_statistics: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Generiert Prozessvisualisierung aus XES/BPMN/CSV Dateien im Upload-Verzeichnis.
    Verwendet die KPI-Statistiken aus der Analysis-Engine anstatt eigene zu berechnen.
    
    Args:
        upload_dir: Pfad zum Upload-Verzeichnis
        kpi_statistics: Optional - Statistiken aus den KPIs (cases, events, activities, variants)
                        Diese werden anstelle der eigenen Berechnungen verwendet.
        
    Returns:
        Dictionary mit Visualisierungsdaten (graph, image, statistics)
    """
    if not VISUALIZATION_AVAILABLE:
        return {
            'success': False,
            'error': 'Process Visualization nicht verfügbar'
        }
    
    try:
        visualizer = ProcessVisualizer()
        supported_extensions = {'.xes', '.bpmn', '.csv', '.xml'}
        
        # Sammle alle Prozessdateien mit Modifikationszeit
        process_files = []
        for filename in os.listdir(upload_dir):
            filepath = os.path.join(upload_dir, filename)
            ext = Path(filename).suffix.lower()
            
            if ext in supported_extensions and os.path.isfile(filepath):
                # Priorität: XES > BPMN > CSV > XML
                priority = {'.xes': 4, '.bpmn': 3, '.csv': 2, '.xml': 1}.get(ext, 0)
                mtime = os.path.getmtime(filepath)
                process_files.append((filepath, filename, priority, mtime))
        
        if not process_files:
            return {
                'success': False,
                'error': 'Keine Prozessdateien (XES, BPMN, CSV) gefunden'
            }
        
        # Sortiere: Höchste Priorität und neueste Modifikationszeit zuerst
        process_files.sort(key=lambda x: (x[2], x[3]), reverse=True)
        
        # Nimm die beste/neueste Datei
        best_file, filename, _, _ = process_files[0]
        print(f"📊 Visualisiere Prozess aus: {filename}")
        result = visualizer.visualize_from_file(best_file)
        
        if result.get('success'):
            # WICHTIG: Überschreibe die Visualisierungs-Statistiken mit den KPI-Statistiken
            # So haben wir konsistente Zahlen zwischen Visualisierung und Metriken
            if kpi_statistics:
                result['statistics'] = {
                    'cases': kpi_statistics.get('cases', result.get('statistics', {}).get('cases', 0)),
                    'events': kpi_statistics.get('events', result.get('statistics', {}).get('events', 0)),
                    'activities': kpi_statistics.get('activities', result.get('statistics', {}).get('activities', 0)),
                    'variants': kpi_statistics.get('variants', result.get('statistics', {}).get('variants', 0)),
                    'top_activities': kpi_statistics.get('top_activities', result.get('statistics', {}).get('top_activities', {}))
                }
                print(f"   ✅ Statistiken aus KPIs übernommen: {result['statistics']['cases']} Cases, {result['statistics']['events']} Events")
            return result
        
        return {
            'success': False,
            'error': f'Fehler beim Visualisieren von {filename}'
        }
        
    except Exception as e:
        print(f"❌ Fehler bei Prozessvisualisierung: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def extract_data_from_uploads(upload_dir: str) -> Dict[str, Any]:
    """
    Extrahiert Daten aus dem Upload-Verzeichnis
    
    Args:
        upload_dir: Pfad zum Upload-Verzeichnis
        
    Returns:
        Dictionary mit extrahierten Daten
    """
    result = {
        'textual_data': None,
        'event_log': None,
        'error': None
    }
    
    if not ETL_AVAILABLE:
        result['error'] = "ETL Pipeline nicht verfügbar"
        return result
    
    try:
        # Textuelle Daten extrahieren
        textual_data = get_textual_data(upload_dir)
        textual_data_clean = None
        if textual_data:
            textual_data_clean = {k: " ".join(v.split()) for k, v in textual_data.items()}
        result['textual_data'] = textual_data_clean

        
        # Event Log extrahieren
        event_log = get_event_log(upload_dir)
        result['event_log'] = event_log
        
    except Exception as e:
        result['error'] = f"Fehler beim Extrahieren der Daten: {str(e)}"
    
    return result


def calculate_process_kpis(event_log) -> Dict[str, Optional[str]]:
    """
    Berechnet KPIs aus dem Event Log
    
    Args:
        event_log: Pandas DataFrame mit Event Log
        
    Returns:
        Dictionary mit JSON-serialisierten KPIs
    """
    kpis = {
        'basic': None,
        'performance': None,
        'finance': None,
        'compliance': None,
        'error': None
    }
    
    if not ANALYSIS_AVAILABLE:
        kpis['error'] = "Analysis Engine nicht verfügbar"
        return kpis
    
    if event_log is None:
        kpis['error'] = "Kein Event Log verfügbar"
        return kpis
    
    try:
        kpis['basic'] = calculate_result_dict_basic(event_log)
        kpis['performance'] = calculate_result_dict_performance(event_log)
        kpis['finance'] = calculate_result_dict_finance(event_log)
        kpis['compliance'] = calculate_result_dict_compliance(event_log)
    except Exception as e:
        kpis['error'] = f"Fehler beim Berechnen der KPIs: {str(e)}"
    
    return kpis


def run_ai_analysis(upload_dir: str) -> Dict[str, Any]:
    """
    Führt die vollständige KI-Analyse aus
    
    Args:
        upload_dir: Pfad zum Verzeichnis mit hochgeladenen Dateien
    
    Returns:
        Dictionary mit Analyseergebnissen der Agenten
    """
    print("\n" + "="*80)
    print("🤖 Starte KI-Analyse mit CrewAI Multi-Agenten-System")
    print("="*80)
    
    # 1. Prüfe Verfügbarkeit
    if not CREW_AVAILABLE:
        return {
            'success': False,
            'error': 'CrewAI ist nicht verfügbar. Bitte installieren Sie: pip install crewai crewai-tools',
            'stage': 'initialization'
        }
    
    # 2. Extrahiere Daten
    print("\n📂 Extrahiere Daten aus Uploads...")
    extracted_data = extract_data_from_uploads(upload_dir)
    
    if extracted_data['error']:
        return {
            'success': False,
            'error': extracted_data['error'],
            'stage': 'data_extraction'
        }
    
    # 3. Berechne KPIs
    print("📊 Berechne Prozess-KPIs...")
    kpis = calculate_process_kpis(extracted_data['event_log'])
    
    if kpis['error'] and extracted_data['event_log'] is not None:
        print(f"⚠️  KPI-Berechnung: {kpis['error']}")
    
    # 4. Bereite Input für Agenten vor
    current_year = datetime.now().year
    
    # WICHTIG: Kürze textuelle Daten um Token-Limits einzuhalten
    # OpenAI gpt-4.1 hat ein TPM Limit von 30000 Tokens
    MAX_TEXT_CHARS = 8000  # ~2000 Tokens
    MAX_KPI_CHARS_BASIC = 4000 # ~1000 Tokens
    MAX_KPI_CHARS_PERFORMANCE = 6000 # ~1500 Tokens
    MAX_KPI_CHARS_FINANCE = 6000 # ~1500 Tokens
    MAX_KPI_CHARS_COMPLIANCE = 3000 # ~750 Tokens
    
    textual_input = extracted_data['textual_data'] or "Keine textuellen Eingaben vorhanden."
    if isinstance(textual_input, dict):
        # Konvertiere Dict zu String und kürze
        textual_str = "\n".join([f"{k}: {v}" for k, v in textual_input.items()])
        if len(textual_str) > MAX_TEXT_CHARS:
            textual_str = textual_str[:MAX_TEXT_CHARS] + "\n... [GEKÜRZT]"
        textual_input = textual_str
    elif isinstance(textual_input, str) and len(textual_input) > MAX_TEXT_CHARS:
        textual_input = textual_input[:MAX_TEXT_CHARS] + "\n... [GEKÜRZT]"
    
    # Kürze KPIs falls nötig
    def truncate_kpi(kpi_data, max_chars):
        if kpi_data and len(str(kpi_data)) > max_chars:
            return str(kpi_data)[:max_chars] + "... [GEKÜRZT]"
        return kpi_data
    
    crew_inputs = {
        'topic': 'Process',
        'textual_user_input': textual_input,
        'process_data_basic': truncate_kpi(kpis.get('basic'), MAX_KPI_CHARS_BASIC),
        'process_kpis_performance': truncate_kpi(kpis.get('performance'), MAX_KPI_CHARS_PERFORMANCE),
        'process_kpis_finance': truncate_kpi(kpis.get('finance'), MAX_KPI_CHARS_FINANCE),
        'process_kpis_compliance': truncate_kpi(kpis.get('compliance'), MAX_KPI_CHARS_COMPLIANCE),
        'current_year': current_year,
        'last_year': current_year - 1,
        'next_year': current_year + 1
    }
    
    # Berechne geschätzte Token-Anzahl
    total_chars = sum(len(str(v)) for v in crew_inputs.values())
    estimated_tokens = total_chars // 4  # ~4 chars per token
    print(f"\n📏 Input-Größe: ~{total_chars} Zeichen (~{estimated_tokens} Tokens)")
    
    print(f"\n📝 Input-Zusammenfassung:")
    print(f"   - Textuelle Daten: {'✅ Vorhanden' if extracted_data['textual_data'] else '❌ Keine'}")
    print(f"   - Event Log: {'✅ Vorhanden' if extracted_data['event_log'] is not None else '❌ Keine'}")
    print(f"   - KPIs Basic: {'✅' if kpis.get('basic') else '❌'}")
    print(f"   - KPIs Performance: {'✅' if kpis.get('performance') else '❌'}")
    print(f"   - KPIs Finance: {'✅' if kpis.get('finance') else '❌'}")
    print(f"   - KPIs Compliance: {'✅' if kpis.get('compliance') else '❌'}")
    
    # 5. Starte KI-Agenten
    try:
        print("\n🚀 Starte CrewAI Multi-Agenten-System...")
        print("   (Dies kann 30-60 Sekunden dauern...)\n")
        
        # Erfasse ALLES aus dem Terminal während die Agenten laufen
        original_stdout = sys.stdout
        original_stderr = sys.stderr
        captured_output = io.StringIO()
        
        # Wrapper um sowohl zu schreiben als auch zu erfassen
        class TeeOutput:
            def __init__(self, *outputs):
                self.outputs = outputs
            def write(self, data):
                for output in self.outputs:
                    output.write(data)
                    output.flush()
            def flush(self):
                for output in self.outputs:
                    output.flush()
        
        # Leite stdout und stderr um
        tee_stdout = TeeOutput(original_stdout, captured_output)
        tee_stderr = TeeOutput(original_stderr, captured_output)
        sys.stdout = tee_stdout
        sys.stderr = tee_stderr
        
        crew_instance = SwpsAiAgentsForBpi()
        crew = crew_instance.crew()
        result = crew.kickoff(inputs=crew_inputs)
        
        # Stelle stdout/stderr wieder her
        sys.stdout = original_stdout
        sys.stderr = original_stderr
        
        # Speichere den erfassten Output global
        global last_crew_terminal_output
        last_crew_terminal_output = captured_output.getvalue()
        
        print("\n✅ KI-Analyse abgeschlossen!")
        print("="*80 + "\n")
        
        # Extrahiere einzelne Task-Outputs
        agent_outputs = {
            'requirements': None,
            'economic': None,
            'performance': None,
            'finance': None,
            'compliance': None
        }
        
        # Debug: Zeige das Result-Objekt
        print("\n🔍 DEBUG: Analysiere CrewAI Result...")
        print(f"   Result Type: {type(result)}")
        print(f"   Result Dir: {[attr for attr in dir(result) if not attr.startswith('_')]}")
        
        try:
            # Methode 1: tasks_output Attribut (CrewAI Standard)
            if hasattr(result, 'tasks_output') and result.tasks_output:
                print(f"\n📦 Gefunden: tasks_output mit {len(result.tasks_output)} Tasks")
                
                for i, task_output in enumerate(result.tasks_output):
                    # Debug jeden Task
                    task_attrs = [attr for attr in dir(task_output) if not attr.startswith('_')]
                    print(f"\n   Task {i} Attribute: {task_attrs}")
                    
                    # Hole Task-Namen und Output
                    task_name = getattr(task_output, 'name', None) or getattr(task_output, 'task_name', None) or f'task_{i}'
                    task_description = getattr(task_output, 'description', '')[:50] if hasattr(task_output, 'description') else ''
                    
                    # Raw output extrahieren
                    if hasattr(task_output, 'raw'):
                        task_raw = task_output.raw
                    elif hasattr(task_output, 'output'):
                        task_raw = str(task_output.output)
                    elif hasattr(task_output, 'result'):
                        task_raw = str(task_output.result)
                    else:
                        task_raw = str(task_output)
                    
                    print(f"   Task {i}: name='{task_name}', desc='{task_description}', output_len={len(str(task_raw))}")
                    
                    # Ordne nach Index (sequentielle Reihenfolge in crew.py)
                    # 0: analyze_user_input_task (Requirements)
                    # 1: analyze_economic_context_task (Economic)
                    # 2: performance_analysis_task (Performance)
                    # 3: finance_analysis_task (Finance)
                    # 4: compliance_analysis_task (Compliance)
                    
                    task_name_lower = str(task_name).lower() if task_name else ''
                    
                    if i == 0 or 'user_input' in task_name_lower or 'requirement' in task_name_lower:
                        agent_outputs['requirements'] = str(task_raw)
                        print(f"   ✅ Zugeordnet zu: requirements ({len(str(task_raw))} Zeichen)")
                    elif i == 1 or 'economic' in task_name_lower:
                        agent_outputs['economic'] = str(task_raw)
                        print(f"   ✅ Zugeordnet zu: economic ({len(str(task_raw))} Zeichen)")
                    elif i == 2 or 'performance' in task_name_lower:
                        agent_outputs['performance'] = str(task_raw)
                        print(f"   ✅ Zugeordnet zu: performance ({len(str(task_raw))} Zeichen)")
                    elif i == 3 or 'finance' in task_name_lower:
                        agent_outputs['finance'] = str(task_raw)
                        print(f"   ✅ Zugeordnet zu: finance ({len(str(task_raw))} Zeichen)")
                    elif i == 4 or 'compliance' in task_name_lower:
                        agent_outputs['compliance'] = str(task_raw)
                        print(f"   ✅ Zugeordnet zu: compliance ({len(str(task_raw))} Zeichen)")
                    else:
                        print(f"   ⚠️ Task {i} nicht zugeordnet!")
            
            # Methode 2: Falls tasks_output leer, versuche über crew.tasks
            elif hasattr(crew, 'tasks') and crew.tasks:
                print("\n📦 Versuche Alternative: crew.tasks")
                for i, task in enumerate(crew.tasks):
                    if hasattr(task, 'output') and task.output:
                        task_raw = getattr(task.output, 'raw', str(task.output))
                        print(f"   Task {i}: {len(str(task_raw))} Zeichen")
                        
                        if i == 0:
                            agent_outputs['requirements'] = str(task_raw)
                        elif i == 1:
                            agent_outputs['economic'] = str(task_raw)
                        elif i == 2:
                            agent_outputs['performance'] = str(task_raw)
                        elif i == 3:
                            agent_outputs['finance'] = str(task_raw)
                        elif i == 4:
                            agent_outputs['compliance'] = str(task_raw)
            
            # Methode 3: Versuche result.raw als Fallback für kombinierte Ausgabe
            if all(v is None for v in agent_outputs.values()):
                print("\n⚠️ Keine Task-Outputs gefunden, nutze Fallback...")
                if hasattr(result, 'raw'):
                    # Teile den kombinierten Output auf (falls möglich)
                    raw_output = result.raw
                    agent_outputs['combined'] = raw_output
                    print(f"   Fallback: combined output ({len(raw_output)} Zeichen)")
            
            # Finale Zusammenfassung
            print("\n📊 Agent Outputs Zusammenfassung:")
            for key, value in agent_outputs.items():
                if value:
                    print(f"   ✅ {key}: {len(value)} Zeichen")
                else:
                    print(f"   ❌ {key}: Nicht verfügbar")
                    
        except Exception as parse_error:
            print(f"\n❌ Fehler beim Parsen der Task-Outputs: {parse_error}")
            import traceback
            traceback.print_exc()
        
        # Extrahiere visualisierbare Metriken aus den KPIs
        visualizable_metrics = extract_visualizable_metrics(kpis)
        
        # Extrahiere die KPI-Statistiken für die Visualisierung
        # Diese werden an die Prozessvisualisierung übergeben für konsistente Zahlen
        kpi_statistics = visualizable_metrics.get('overview', {})
        
        # Füge top_activities hinzu (für die Visualisierung)
        if visualizable_metrics.get('activityFrequency'):
            top_activities = {item['name']: item['value'] for item in visualizable_metrics['activityFrequency'][:10]}
            kpi_statistics['top_activities'] = top_activities
        
        # Generiere Prozessvisualisierung MIT den KPI-Statistiken
        print("📊 Generiere Prozessvisualisierung...")
        process_viz = generate_process_visualization(upload_dir, kpi_statistics=kpi_statistics)
        if process_viz.get('success'):
            print(f"   ✅ Prozessvisualisierung erstellt: {process_viz.get('file_name', 'unknown')}")
        else:
            print(f"   ⚠️ Prozessvisualisierung: {process_viz.get('error', 'Keine Prozessdateien gefunden')}")
        
        return {
            'success': True,
            'analysis_result': str(result),
            'agent_outputs': agent_outputs,
            'process_metrics': visualizable_metrics,  # Neue strukturierte Metriken für Visualisierung
            'process_visualization': process_viz,  # NEU: Prozessvisualisierung
            'data_summary': {
                'has_textual_data': bool(extracted_data['textual_data']),
                'has_event_log': extracted_data['event_log'] is not None,
                'kpis_calculated': {
                    'basic': bool(kpis.get('basic')),
                    'performance': bool(kpis.get('performance')),
                    'finance': bool(kpis.get('finance')),
                    'compliance': bool(kpis.get('compliance'))
                }
            }
        }

        
    except Exception as e:
        error_msg = f"Fehler bei KI-Analyse: {str(e)}"
        print(f"\n❌ {error_msg}\n")
        
        return {
            'success': False,
            'error': error_msg,
            'stage': 'ai_execution'
        }


def run_ai_analysis_async(upload_dir: str) -> Dict[str, Any]:
    """
    Asynchrone Version für zukünftige Erweiterungen
    Aktuell ruft sie die synchrone Version auf
    """
    return run_ai_analysis(upload_dir)


if __name__ == "__main__":
    # Test-Modus
    print("🧪 AI Analysis Module - Test Mode")
    
    # Test mit uploads Verzeichnis
    test_dir = str(PROJECT_ROOT / 'uploads')
    
    if os.path.exists(test_dir):
        print(f"\n📁 Teste mit: {test_dir}")
        result = run_ai_analysis(test_dir)
        
        print("\n📋 Ergebnis:")
        print(json.dumps(result, indent=2, default=str))
    else:
        print(f"\n❌ Test-Verzeichnis nicht gefunden: {test_dir}")
