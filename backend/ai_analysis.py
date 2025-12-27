"""
AI Analysis Module
Verbindet ETL-Pipeline, Process Analysis Engine und CrewAI Multi-Agenten-System
"""

import sys
import os
from pathlib import Path
from datetime import datetime
import json
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

# Import ETL Pipeline
try:
    from pipeline import get_textual_data, get_event_log
    ETL_AVAILABLE = True
except Exception as e:
    print(f"⚠️  ETL Pipeline Import Warning: {e}")
    ETL_AVAILABLE = False


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
    
    crew_inputs = {
        'topic': 'Process',
        'textual_user_input': extracted_data['textual_data'] or "Keine textuellen Eingaben vorhanden.",
        'process_data_basic': kpis.get('basic'),
        'process_kpis_performance': kpis.get('performance'),
        'process_kpis_finance': kpis.get('finance'),
        'process_kpis_compliance': kpis.get('compliance'),
        'current_year': current_year,
        'last_year': current_year - 1,
        'next_year': current_year + 1
    }
    
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
        
        crew_instance = SwpsAiAgentsForBpi()
        crew = crew_instance.crew()
        result = crew.kickoff(inputs=crew_inputs)
        
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
        
        return {
            'success': True,
            'analysis_result': str(result),
            'agent_outputs': agent_outputs,
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
