
import os
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from datetime import datetime
from dotenv import load_dotenv
import openai
import glob
import re


def clean_and_format_crewai_logs(raw_output: str) -> str:
    """
    Bereinigt und formatiert CrewAI Terminal-Logs für bessere Lesbarkeit.
    Entfernt ANSI-Escape-Codes, Box-Drawing-Zeichen und strukturiert die Ausgabe.
    """
    if not raw_output:
        return ""
    
    # 1. ANSI-Escape-Codes entfernen (Farben, Formatierung)
    ansi_pattern = re.compile(r'\x1b\[[0-9;]*m|\[\d+(?:;\d+)*m')
    text = ansi_pattern.sub('', raw_output)
    
    # 2. Box-Drawing-Zeichen und Rahmen entfernen
    box_chars = ['╭', '╮', '╰', '╯', '│', '─', '├', '┤', '┬', '┴', '┼', '└', '┘', '┌', '┐']
    for char in box_chars:
        text = text.replace(char, '')
    
    # 3. Zeilen verarbeiten
    lines = text.split('\n')
    cleaned_lines = []
    seen_content = set()  # Für Deduplizierung
    
    current_section = None
    
    for line in lines:
        # Leerzeichen am Anfang/Ende entfernen
        line = line.strip()
        
        # Leere Zeilen und reine Trennlinien überspringen
        if not line or line == '' or re.match(r'^[\s\-─]*$', line):
            continue
        
        # Duplikate überspringen (innerhalb ähnlicher Blöcke)
        content_hash = line[:100] if len(line) > 100 else line
        if content_hash in seen_content and not line.startswith(('🚀', '📋', '🤖', '🔧', '✅', '📚')):
            continue
        
        # Erkennung von Sektionen
        if 'Crew Execution Started' in line:
            if current_section != 'CREW_START':
                cleaned_lines.append("")
                cleaned_lines.append("=" * 60)
                cleaned_lines.append("CREW EXECUTION GESTARTET")
                cleaned_lines.append("=" * 60)
                current_section = 'CREW_START'
            continue
        
        if 'Agent Started' in line or '🤖 Agent Started' in line:
            current_section = 'AGENT'
            cleaned_lines.append("")
            cleaned_lines.append("-" * 50)
            cleaned_lines.append("AGENT GESTARTET")
            cleaned_lines.append("-" * 50)
            continue
        
        if 'Agent Final Answer' in line or '✅ Agent Final Answer' in line:
            current_section = 'ANSWER'
            cleaned_lines.append("")
            cleaned_lines.append("-" * 50)
            cleaned_lines.append("AGENT FINALE ANTWORT")
            cleaned_lines.append("-" * 50)
            continue
        
        if 'Task Completion' in line:
            current_section = 'TASK_COMPLETE'
            cleaned_lines.append("")
            cleaned_lines.append("-" * 50)
            cleaned_lines.append("TASK ABGESCHLOSSEN")
            cleaned_lines.append("-" * 50)
            continue
        
        if 'Agent Tool Execution' in line or '🔧 Agent Tool Execution' in line:
            current_section = 'TOOL'
            cleaned_lines.append("")
            cleaned_lines.append("-" * 50)
            cleaned_lines.append("TOOL-AUSFÜHRUNG")
            cleaned_lines.append("-" * 50)
            continue
        
        if 'Retrieved Knowledge' in line or '📚 Retrieved Knowledge' in line:
            current_section = 'KNOWLEDGE'
            cleaned_lines.append("")
            cleaned_lines.append("-" * 50)
            cleaned_lines.append("WISSEN ABGERUFEN")
            cleaned_lines.append("-" * 50)
            continue
        
        if 'Tool Input' in line:
            cleaned_lines.append("")
            cleaned_lines.append("[TOOL INPUT]")
            continue
        
        if 'Tool Output' in line:
            cleaned_lines.append("")
            cleaned_lines.append("[TOOL OUTPUT]")
            continue
        
        # Formatierung für wichtige Felder
        if line.startswith('Agent:'):
            cleaned_lines.append(f"  Agent: {line[6:].strip()}")
            continue
        
        if line.startswith('Task:'):
            cleaned_lines.append(f"  Task: {line[5:].strip()}")
            continue
        
        if line.startswith('Thought:'):
            cleaned_lines.append(f"  Gedanke: {line[8:].strip()}")
            continue
        
        if line.startswith('Using Tool:'):
            cleaned_lines.append(f"  Verwendetes Tool: {line[11:].strip()}")
            continue
        
        if line.startswith('Final Answer:'):
            cleaned_lines.append(f"  Finale Antwort:")
            continue
        
        if line.startswith('Name:'):
            cleaned_lines.append(f"  Name: {line[5:].strip()}")
            continue
        
        if line.startswith('ID:'):
            cleaned_lines.append(f"  ID: {line[3:].strip()}")
            continue
        
        if line.startswith('Status:'):
            cleaned_lines.append(f"  Status: {line[7:].strip()}")
            continue
        
        if line.startswith('Assigned to:'):
            cleaned_lines.append(f"  Zugewiesen an: {line[12:].strip()}")
            continue
        
        if line.startswith('Additional Information:'):
            cleaned_lines.append(f"  Zusätzliche Info: {line[23:].strip()}")
            continue
        
        # Crew/Task-Status-Zeilen formatieren
        if '🚀 Crew:' in line:
            crew_name = line.split('Crew:')[-1].strip() if 'Crew:' in line else ''
            cleaned_lines.append(f"\n[CREW STATUS] {crew_name}")
            continue
        
        if '📋 Task:' in line:
            # Task-Info extrahieren
            task_match = re.search(r'Task:\s*(\S+)', line)
            task_name = task_match.group(1) if task_match else line
            id_match = re.search(r'\(ID:\s*([^)]+)\)', line)
            task_id = id_match.group(1) if id_match else ''
            cleaned_lines.append(f"  📋 Task: {task_name}")
            if task_id:
                cleaned_lines.append(f"      ID: {task_id}")
            continue
        
        if '✅' in line and ('Completed' in line or 'Knowledge Retrieval' in line):
            cleaned_lines.append(f"  ✅ {line.replace('✅', '').strip()}")
            continue
        
        if '🔧' in line and 'Used' in line:
            cleaned_lines.append(f"  🔧 {line.replace('🔧', '').strip()}")
            continue
        
        # JSON-Inhalte erkennen und formatieren
        if line.startswith('{') or line.startswith('['):
            cleaned_lines.append(f"  {line}")
            continue
        
        # Standard-Zeilen hinzufügen
        if len(line) > 2:
            cleaned_lines.append(f"  {line}")
            seen_content.add(content_hash)
    
    # 4. Finale Bereinigung - mehrfache Leerzeilen entfernen
    result_lines = []
    prev_empty = False
    for line in cleaned_lines:
        is_empty = not line.strip()
        if is_empty and prev_empty:
            continue
        result_lines.append(line)
        prev_empty = is_empty
    
    return '\n'.join(result_lines)

# Lade .env Datei
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# ETL-Import
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'etl')))
from etl.pipeline import run_etl_event_log, run_etl_textual_process_data

# AI-Analyse Import
from ai_analysis import run_ai_analysis

# Prozess-Visualisierung Import
from process_visualization import ProcessVisualizer, visualize_process, visualize_all_uploads

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
# Pfad zum Haupt-uploads Ordner (eine Ebene höher)
UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '../uploads'))
VERBESSERUNGEN_FOLDER = os.path.join(UPLOAD_FOLDER, 'verbesserungen')
ALLOWED_EXTENSIONS = {'bpmn', 'xes', 'csv', 'txt', 'docx', 'pdf'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['VERBESSERUNGEN_FOLDER'] = VERBESSERUNGEN_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Create upload folders if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(VERBESSERUNGEN_FOLDER, exist_ok=True)

# --- ETL-Filter und API-Route ---
from pathlib import Path
RELEVANT_ETL_EXTENSIONS = {'.xes', '.csv', '.bpmn', '.txt', '.docx', '.pdf'}

def get_etl_ready_files():
    """Gibt alle Uploads mit relevanten Endungen für den ETL-Prozess zurück"""
    files = []
    for filename in os.listdir(app.config['UPLOAD_FOLDER']):
        ext = Path(filename).suffix.lower()
        if ext in RELEVANT_ETL_EXTENSIONS:
            files.append(filename)
    return files

def delete_file(filepath):
    """Löscht eine Datei, falls sie existiert"""
    try:
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
            print(f"🗑️ Datei gelöscht: {filepath}")
    except Exception as e:
        print(f"⚠️ Fehler beim Löschen von {filepath}: {e}")

@app.route('/api/etl-ready-uploads', methods=['GET'])
def list_etl_ready_uploads():
    """Listet alle für den ETL-Prozess geeigneten Dateien auf"""
    try:
        files = get_etl_ready_files()
        return jsonify({
            'success': True,
            'etl_ready_files': files,
            'count': len(files)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Flask backend is running'
    }), 200


@app.route('/api/upload', methods=['POST'])
def upload_file():
    filepath = None
    """Handle file uploads"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Check if file type is allowed
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
        
        # Secure the filename and add timestamp
        original_filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{original_filename}"
        
        # Save the file
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Nach dem Upload: ETL-Prozess starten
        ext = Path(filename).suffix.lower()
        etl_result = None
        try:
            if ext in {'.xes', '.csv', '.bpmn'}:
                run_etl_event_log(filepath)
                etl_result = 'event_log_etl_done'
            elif ext in {'.txt', '.docx', '.pdf'}:
                run_etl_textual_process_data(filepath)
                etl_result = 'textual_etl_done'
            else:
                etl_result = 'no_etl_run'
        except Exception as etl_error:
            etl_result = f'ETL-Error: {etl_error}'

        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'filename': original_filename,
            'stored_filename': filename,
            'file_size': os.path.getsize(filepath),
            'upload_time': timestamp,
            'etl_result': etl_result
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    finally:
        delete_file(filepath)


@app.route('/api/text-input', methods=['POST'])
def text_input():
    """Handle text input and save as .txt file"""
    filepath = None
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'No text provided'
            }), 400
        
        text_content = data['text']
        
        if not text_content.strip():
            return jsonify({
                'success': False,
                'error': 'Text content is empty'
            }), 400
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_user_input.txt"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Save text to file
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text_content)
        
        # Run ETL for text file
        etl_result = None
        try:
            run_etl_textual_process_data(filepath)
            etl_result = 'textual_etl_done'
        except Exception as etl_error:
            etl_result = f'ETL-Error: {etl_error}'
        
        return jsonify({
            'success': True,
            'message': 'Text saved successfully',
            'filename': filename,
            'file_size': os.path.getsize(filepath),
            'upload_time': timestamp,
            'etl_result': etl_result
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    finally:
        delete_file(filepath)


@app.route('/api/combined-upload', methods=['POST'])
def combined_upload():
    """Handle combined text and file uploads"""
    created_filepaths = []
    try:
        uploaded_files = []
        text_file_info = None
        etl_results = []
        
        # Handle text input if provided
        text_content = request.form.get('text', '').strip()
        if text_content:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{timestamp}_user_input.txt"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(text_content)

            created_filepaths.append(filepath)
            
            text_file_info = {
                'filename': 'user_input.txt',
                'stored_filename': filename,
                'file_size': os.path.getsize(filepath),
                'type': 'text'
            }
            
            # Run ETL for text
            try:
                run_etl_textual_process_data(filepath)
                etl_results.append({'file': filename, 'status': 'textual_etl_done'})
            except Exception as etl_error:
                etl_results.append({'file': filename, 'status': f'ETL-Error: {etl_error}'})
        
        # Handle file uploads if provided
        if 'files' in request.files:
            files = request.files.getlist('files')
            
            for file in files:
                if file.filename == '':
                    continue
                
                if not allowed_file(file.filename):
                    continue
                
                # Secure the filename and add timestamp
                original_filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"{timestamp}_{original_filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                
                # Save the file
                file.save(filepath)
                created_filepaths.append(filepath)
                
                uploaded_files.append({
                    'filename': original_filename,
                    'stored_filename': filename,
                    'file_size': os.path.getsize(filepath),
                    'type': 'file'
                })
                
                # Run ETL for this file
                ext = Path(filename).suffix.lower()
                try:
                    if ext in {'.xes', '.csv', '.bpmn'}:
                        run_etl_event_log(filepath)
                        etl_results.append({'file': filename, 'status': 'event_log_etl_done'})
                    elif ext == '.txt':
                        run_etl_textual_process_data(filepath)
                        etl_results.append({'file': filename, 'status': 'textual_etl_done'})
                    else:
                        etl_results.append({'file': filename, 'status': 'no_etl_run'})
                except Exception as etl_error:
                    etl_results.append({'file': filename, 'status': f'ETL-Error: {etl_error}'})
        
        all_files = []
        if text_file_info:
            all_files.append(text_file_info)
        all_files.extend(uploaded_files)
        
        # 🤖 NEU: KI-Analyse mit den Agenten durchführen
        print("\n" + "="*80)
        print("🤖 Starte KI-Analyse mit CrewAI...")
        print("="*80)
        
        ai_result = None
        try:
            ai_result = run_ai_analysis(app.config['UPLOAD_FOLDER'])
            print("\n✅ KI-Analyse abgeschlossen")
            
            if ai_result.get('success'):
                print(f"📊 Analyse erfolgreich: {len(ai_result.get('analysis_result', ''))} Zeichen")
            else:
                print(f"⚠️  Analyse-Fehler: {ai_result.get('error', 'Unbekannter Fehler')}")
                
        except Exception as ai_error:
            print(f"\n❌ KI-Analyse Fehler: {str(ai_error)}")
            ai_result = {
                'success': False,
                'error': str(ai_error),
                'stage': 'execution'
            }
        
        return jsonify({
            'success': True,
            'message': 'Upload successful',
            'data': {
                'files': all_files,
                'total_files': len(all_files),
                'etl_results': etl_results,
                'ai_analysis': ai_result,  # 🤖 KI-Analyseergebnisse hinzugefügt
                'upload_time': datetime.now().strftime('%Y%m%d_%H%M%S')
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    finally:
        for path in created_filepaths:
            delete_file(path)


@app.route('/api/uploads', methods=['GET'])
def list_uploads():
    """List all uploaded files"""
    try:
        files = []
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if os.path.isfile(filepath):
                files.append({
                    'filename': filename,
                    'size': os.path.getsize(filepath),
                    'modified': datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()
                })
        
        return jsonify({
            'success': True,
            'files': files,
            'count': len(files)
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================
# PROZESS-VISUALISIERUNG ENDPOINTS
# ============================================================

@app.route('/api/visualize-process', methods=['POST'])
def visualize_process_endpoint():
    """
    Visualisiert einen Prozess aus einer hochgeladenen Datei.
    
    Akzeptiert: XES, BPMN, CSV, XML Dateien
    Gibt zurück: Prozessgraph (nodes, edges), Base64-Bild, Statistiken
    """
    filepath = None
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'Keine Datei bereitgestellt'
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'Keine Datei ausgewählt'
            }), 400
        
        # Datei speichern
        original_filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{original_filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Prozess visualisieren
        visualizer = ProcessVisualizer()
        result = visualizer.visualize_from_file(filepath)
        
        return jsonify(result), 200
        
    except FileNotFoundError as e:
        return jsonify({
            'success': False,
            'error': f'Datei nicht gefunden: {str(e)}'
        }), 404
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': f'Ungültiges Format: {str(e)}'
        }), 400
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    finally:
        if filepath and os.path.exists(filepath):
            delete_file(filepath)


@app.route('/api/visualize-uploaded/<filename>', methods=['GET'])
def visualize_uploaded_file(filename):
    """
    Visualisiert eine bereits hochgeladene Datei.
    """
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        if not os.path.exists(filepath):
            return jsonify({
                'success': False,
                'error': f'Datei nicht gefunden: {filename}'
            }), 404
        
        visualizer = ProcessVisualizer()
        result = visualizer.visualize_from_file(filepath)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/visualize-all', methods=['GET'])
def visualize_all_files():
    """
    Visualisiert alle Prozessdateien im Upload-Ordner.
    """
    try:
        results = visualize_all_uploads(app.config['UPLOAD_FOLDER'])
        
        return jsonify({
            'success': True,
            'visualizations': results,
            'count': len(results)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/visualize-optimized-process', methods=['GET'])
def visualize_optimized_process():
    """
    Visualisiert die neueste optimized_process_*.xes Datei aus dem verbesserungen-Ordner.
    
    Returns
    -------
    JSON mit Prozessgraph (nodes, edges), Base64-Bild und Statistiken
    """
    try:
        # Finde die neueste optimized_process_*.xes Datei
        pattern = os.path.join(VERBESSERUNGEN_FOLDER, 'optimized_process_*.xes')
        xes_files = glob.glob(pattern)
        
        if not xes_files:
            return jsonify({
                'success': False,
                'error': 'Keine optimierte Prozessdatei gefunden. Bitte zuerst eine Prozess-Optimierung durchführen.'
            }), 404
        
        # Sortiere nach Datum (neueste zuerst) - Dateiname enthält Timestamp
        xes_files.sort(reverse=True)
        latest_xes = xes_files[0]
        
        print(f"📊 Visualisiere optimierten Prozess: {latest_xes}")
        
        # Prozess visualisieren
        visualizer = ProcessVisualizer()
        result = visualizer.visualize_from_file(latest_xes)
        
        # Füge den Dateinamen hinzu
        result['optimized_filename'] = os.path.basename(latest_xes)
        
        return jsonify(result), 200
        
    except FileNotFoundError as e:
        return jsonify({
            'success': False,
            'error': f'Datei nicht gefunden: {str(e)}'
        }), 404
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': f'Ungültiges Format: {str(e)}'
        }), 400
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/process-graph', methods=['POST'])
def get_process_graph():
    """
    Gibt nur den Prozessgraph (nodes, edges) zurück ohne Bild.
    Schnellere Alternative für interaktive Visualisierungen.
    """
    filepath = None
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'Keine Datei bereitgestellt'
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'Keine Datei ausgewählt'
            }), 400
        
        # Datei speichern
        original_filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{original_filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Prozess visualisieren
        visualizer = ProcessVisualizer()
        result = visualizer.visualize_from_file(filepath)
        
        # Nur Graph zurückgeben, kein Bild
        return jsonify({
            'success': True,
            'graph': result.get('graph'),
            'statistics': result.get('statistics'),
            'file_type': result.get('file_type'),
            'file_name': result.get('file_name')
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
    finally:
        if filepath and os.path.exists(filepath):
            delete_file(filepath)


# ============================================================
# ROHDATEN-EXPORT ENDPOINT
# ============================================================

# Globale Variable zum Speichern der Crew-Logs während der Analyse
crew_execution_logs = []

def log_crew_output(message: str):
    """Fügt eine Log-Nachricht zur globalen Log-Liste hinzu"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    crew_execution_logs.append(f"[{timestamp}] {message}")

@app.route('/api/export-raw-data', methods=['POST'])
def export_raw_data():
    """
    Exportiert alle Rohdaten in strukturierter Form als eine große Datei.
    Beinhaltet:
    - Alle User-Uploads (Log-Dateien, Textbeschreibungen, etc.)
    - Alle Agenten-Outputs
    - Terminal/Crew-Logs während der Analyse
    """
    try:
        data = request.get_json() or {}
        
        # Daten aus dem Frontend
        agent_outputs = data.get('agentOutputs', {})
        ai_analysis_result = data.get('aiAnalysisResult', '')
        process_metrics = data.get('processMetrics', {})
        process_description = data.get('processDescription', '')
        uploaded_files_info = data.get('uploadedFiles', [])
        
        # Timestamp für den Export
        export_timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Strukturierter Export-Inhalt
        export_content = []
        export_content.append("=" * 80)
        export_content.append("ROHDATEN-EXPORT - SWPS AI Agents for BPI")
        export_content.append(f"Export-Zeitpunkt: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        export_content.append("=" * 80)
        export_content.append("")
        
        # ============================================================
        # SEKTION 1: USER UPLOADS
        # ============================================================
        export_content.append("")
        export_content.append("#" * 80)
        export_content.append("# SEKTION 1: USER UPLOADS")
        export_content.append("#" * 80)
        export_content.append("")
        
        # Prozessbeschreibung vom User
        if process_description:
            export_content.append("-" * 40)
            export_content.append("## Prozessbeschreibung (User-Input)")
            export_content.append("-" * 40)
            export_content.append(process_description)
            export_content.append("")
        
        # Alle Dateien im Upload-Ordner auslesen
        export_content.append("-" * 40)
        export_content.append("## Hochgeladene Dateien")
        export_content.append("-" * 40)
        
        upload_folder = app.config['UPLOAD_FOLDER']
        if os.path.exists(upload_folder):
            files_in_folder = os.listdir(upload_folder)
            for filename in files_in_folder:
                filepath = os.path.join(upload_folder, filename)
                if os.path.isfile(filepath):
                    export_content.append(f"\n### Datei: {filename}")
                    export_content.append(f"Größe: {os.path.getsize(filepath)} Bytes")
                    export_content.append(f"Geändert: {datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()}")
                    
                    # Textdateien vollständig einlesen
                    ext = Path(filename).suffix.lower()
                    if ext in {'.txt', '.csv', '.xes', '.bpmn'}:
                        try:
                            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                                content = f.read()
                                # Limitiere auf 50000 Zeichen pro Datei
                                if len(content) > 50000:
                                    content = content[:50000] + "\n... [INHALT GEKÜRZT - " + str(len(content)) + " Zeichen insgesamt]"
                                export_content.append("--- INHALT ---")
                                export_content.append(content)
                                export_content.append("--- ENDE INHALT ---")
                        except Exception as e:
                            export_content.append(f"[Fehler beim Lesen: {str(e)}]")
                    else:
                        export_content.append(f"[Binärdatei - nicht angezeigt]")
        else:
            export_content.append("[Kein Upload-Ordner gefunden]")
        
        # ============================================================
        # SEKTION 2: AGENTEN-OUTPUTS
        # ============================================================
        export_content.append("")
        export_content.append("#" * 80)
        export_content.append("# SEKTION 2: AGENTEN-OUTPUTS")
        export_content.append("#" * 80)
        export_content.append("")
        
        # Hauptanalyse-Ergebnis
        if ai_analysis_result:
            export_content.append("-" * 40)
            export_content.append("## Haupt-Analyse-Ergebnis")
            export_content.append("-" * 40)
            export_content.append(ai_analysis_result)
            export_content.append("")
        
        # Einzelne Agenten-Outputs
        if agent_outputs:
            for agent_name, output in agent_outputs.items():
                if output:
                    export_content.append("-" * 40)
                    export_content.append(f"## Agent: {agent_name.upper()}")
                    export_content.append("-" * 40)
                    export_content.append(str(output))
                    export_content.append("")
        
        # ============================================================
        # SEKTION 3: PROZESS-METRIKEN
        # ============================================================
        export_content.append("")
        export_content.append("#" * 80)
        export_content.append("# SEKTION 3: PROZESS-METRIKEN")
        export_content.append("#" * 80)
        export_content.append("")
        
        if process_metrics:
            export_content.append("-" * 40)
            export_content.append("## Berechnete Metriken (JSON)")
            export_content.append("-" * 40)
            try:
                import json
                export_content.append(json.dumps(process_metrics, indent=2, ensure_ascii=False, default=str))
            except Exception as e:
                export_content.append(f"[Fehler bei JSON-Serialisierung: {str(e)}]")
                export_content.append(str(process_metrics))
            export_content.append("")
        
        # ============================================================
        # SEKTION 4: CREW-AI TERMINAL-LOGS
        # ============================================================
        export_content.append("")
        export_content.append("#" * 80)
        export_content.append("# SEKTION 4: CREWAI TERMINAL-LOGS")
        export_content.append("#" * 80)
        export_content.append("")
        
        # HAUPTQUELLE: Erfasster Terminal-Output während Agenten-Ausführung
        from ai_analysis import last_crew_terminal_output
        if last_crew_terminal_output:
            export_content.append("-" * 40)
            export_content.append("## KOMPLETTER AGENTEN-TERMINAL-OUTPUT")
            export_content.append("## (Tool Inputs, Executions, Agent-Aktionen)")
            export_content.append("-" * 40)
            # Bereinige und formatiere die Terminal-Logs für bessere Lesbarkeit
            cleaned_logs = clean_and_format_crewai_logs(last_crew_terminal_output)
            export_content.append(cleaned_logs)
            export_content.append("")
            logs_found = True
        else:
            logs_found = False
        
        # Versuche die Log-Datei zu lesen, falls vorhanden
        backend_dir = os.path.dirname(__file__)
        log_files_to_check = [
            os.path.join(backend_dir, 'backend.log'),
            os.path.join(backend_dir, 'crew_output.log'),
            os.path.join(backend_dir, '..', 'crew_output.log'),
        ]
        
        for log_file in log_files_to_check:
            if os.path.exists(log_file):
                try:
                    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                        log_content = f.read()
                        export_content.append(f"-" * 40)
                        export_content.append(f"## Log-Datei: {os.path.basename(log_file)}")
                        export_content.append(f"-" * 40)
                        # Bereinige Log-Inhalte
                        cleaned_log = clean_and_format_crewai_logs(log_content)
                        export_content.append(cleaned_log)
                        export_content.append("")
                        logs_found = True
                except Exception as e:
                    export_content.append(f"[Fehler beim Lesen von {log_file}: {str(e)}]")
        
        # Globale Logs hinzufügen
        if crew_execution_logs:
            export_content.append("-" * 40)
            export_content.append("## Crew-Execution-Logs (Session)")
            export_content.append("-" * 40)
            # Bereinige Session-Logs
            cleaned_session_logs = clean_and_format_crewai_logs("\n".join(crew_execution_logs))
            export_content.append(cleaned_session_logs)
            export_content.append("")
        
        if not logs_found and not crew_execution_logs:
            export_content.append("[Keine Terminal-Logs gefunden]")
            export_content.append("Hinweis: Um Terminal-Logs zu erfassen, starten Sie das Backend mit:")
            export_content.append("python app.py 2>&1 | tee crew_output.log")
        
        # ============================================================
        # DATEI IM VERBESSERUNGEN-ORDNER SPEICHERN
        # ============================================================
        export_filename = f"raw_data_export_{export_timestamp}.txt"
        export_filepath = os.path.join(app.config['VERBESSERUNGEN_FOLDER'], export_filename)
        
        full_content = "\n".join(export_content)
        
        with open(export_filepath, 'w', encoding='utf-8') as f:
            f.write(full_content)
        
        print(f"📁 Rohdaten gespeichert in: {export_filepath}")
        
        return jsonify({
            'success': True,
            'message': 'Rohdaten erfolgreich im Verbesserungen-Ordner gespeichert',
            'filename': export_filename,
            'filepath': export_filepath,
            'folder': 'verbesserungen',
            'file_size': os.path.getsize(export_filepath),
            'export_time': export_timestamp
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/download-raw-data/<filename>', methods=['GET'])
def download_raw_data(filename):
    """
    Ermöglicht den Download einer exportierten Rohdaten-Datei aus dem Verbesserungen-Ordner
    """
    try:
        filepath = os.path.join(app.config['VERBESSERUNGEN_FOLDER'], filename)
        
        if not os.path.exists(filepath):
            return jsonify({
                'success': False,
                'error': f'Datei nicht gefunden: {filename}'
            }), 404
        
        return send_file(
            filepath,
            mimetype='text/plain',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================
# PROZESS-OPTIMIERUNG MIT OPENAI
# ============================================================

def get_latest_raw_data_export():
    """Findet die aktuellste raw_data_export Datei im verbesserungen-Ordner basierend auf dem Dateinamen-Timestamp"""
    verbesserungen_folder = VERBESSERUNGEN_FOLDER
    pattern = os.path.join(verbesserungen_folder, 'raw_data_export_*.txt')
    files = glob.glob(pattern)
    
    if not files:
        return None, None
    
    # Extrahiere Timestamp aus Dateinamen und sortiere danach (höchste Zahl = neueste)
    # Format: raw_data_export_YYYYMMDD_HHMMSS.txt
    def extract_timestamp(filepath):
        filename = os.path.basename(filepath)
        # Extrahiere den Timestamp-Teil: YYYYMMDD_HHMMSS
        match = re.search(r'raw_data_export_(\d{8}_\d{6})\.txt', filename)
        if match:
            return match.group(1)
        return "00000000_000000"  # Fallback für ungültige Namen
    
    # Sortiere nach Timestamp im Dateinamen (höchste/neueste zuerst)
    files.sort(key=extract_timestamp, reverse=True)
    latest_file = files[0]
    
    print(f"📄 Ausgewählte Datei für Optimierung: {os.path.basename(latest_file)}")
    
    try:
        with open(latest_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        return latest_file, content
    except Exception as e:
        print(f"Fehler beim Lesen der Datei: {e}")
        return latest_file, None


def create_optimized_xes_prompt(raw_data_content: str) -> str:
    """Erstellt den Prompt für die OpenAI API zur Prozessoptimierung"""
    
    system_prompt = """Du bist ein Experte für Business Process Improvement (BPI) und Process Mining. 
Deine Aufgabe ist es, basierend auf Analysedaten einen optimierten Geschäftsprozess zu modellieren.

Du erhältst Rohdaten einer Prozessanalyse, die folgende Informationen enthalten können:
- Original-Prozessdaten (Event Logs, Prozessbeschreibungen)
- Ergebnisse von KI-Agenten (Compliance, Performance, Finance Analyse)
- Identifizierte Probleme und Verbesserungsvorschläge
- Prozess-Metriken und Statistiken

Deine Aufgabe:
1. Analysiere die bereitgestellten Daten sorgfältig
2. Identifiziere die wichtigsten Verbesserungspotenziale
3. Erstelle einen OPTIMIERTEN Prozess im XES-Format (IEEE 1849 Standard)
4. Erkläre die vorgenommenen Optimierungen detailliert

Der optimierte Prozess soll:
- Bottlenecks eliminieren oder reduzieren
- Compliance-Anforderungen erfüllen
- Kosten senken wo möglich
- Durchlaufzeiten verbessern
- Unnötige Schritte entfernen oder automatisieren

Antworte in folgendem Format:

## 🎯 Zusammenfassung der Optimierung
[Kurze Beschreibung der Hauptänderungen]

## 📊 Identifizierte Probleme im Original-Prozess
[Liste der erkannten Probleme aus den Agenten-Analysen]

## ✨ Durchgeführte Optimierungen
[Detaillierte Erklärung jeder Optimierung mit Begründung]

## 📈 Erwartete Verbesserungen
[Quantifizierte oder qualitative Verbesserungserwartungen]

## 🔧 Optimierter Prozess (XES-Format)
```xes
[Vollständige XES-Datei hier]
```

Wichtig: Die XES-Datei muss valide sein und alle notwendigen XML-Elemente enthalten."""

    user_prompt = f"""Hier sind die Rohdaten der Prozessanalyse. Bitte erstelle basierend auf diesen Daten und den Erkenntnissen der Agenten einen optimierten Prozess im XES-Format:

---
ROHDATEN DER ANALYSE:
---

{raw_data_content}

---
ENDE DER ROHDATEN
---

Bitte erstelle nun:
1. Eine detaillierte Erklärung der Optimierungen
2. Eine vollständige, valide XES-Datei mit dem optimierten Prozess

Der neue Prozess soll die Erkenntnisse der Compliance-, Performance- und Finance-Agenten berücksichtigen und einen verbesserten Ablauf darstellen."""

    return system_prompt, user_prompt


def extract_xes_from_response(response_text: str) -> str:
    """Extrahiert den XES-Code aus der OpenAI Antwort"""
    # Suche nach XES-Code im Markdown-Format
    xes_pattern = r'```(?:xes|xml)?\s*([\s\S]*?(?:<\?xml[\s\S]*?</log>|<log[\s\S]*?</log>))\s*```'
    match = re.search(xes_pattern, response_text, re.IGNORECASE)
    
    if match:
        return match.group(1).strip()
    
    # Fallback: Suche nach XES ohne Code-Block
    xml_pattern = r'(<\?xml[\s\S]*?</log>|<log[\s\S]*?</log>)'
    match = re.search(xml_pattern, response_text, re.IGNORECASE)
    
    if match:
        return match.group(1).strip()
    
    return None


@app.route('/api/optimize-process', methods=['POST'])
def optimize_process():
    """
    Sendet die aktuellste raw_data_export an OpenAI und generiert 
    einen optimierten Prozess im XES-Format.
    """
    try:
        # OpenAI API Key aus .env
        api_key = os.getenv('API_KEY_OPENAI')
        
        if not api_key:
            return jsonify({
                'success': False,
                'error': 'OpenAI API Key nicht gefunden. Bitte in .env konfigurieren.'
            }), 500
        
        # Aktuellste raw_data_export Datei finden
        filepath, raw_data_content = get_latest_raw_data_export()
        
        if not filepath:
            return jsonify({
                'success': False,
                'error': 'Keine raw_data_export Datei gefunden. Bitte zuerst einen Rohdaten-Export durchführen.'
            }), 404
        
        if not raw_data_content:
            return jsonify({
                'success': False,
                'error': f'Konnte die Datei nicht lesen: {filepath}'
            }), 500
        
        print(f"\n{'='*80}")
        print(f"🚀 Starte Prozess-Optimierung mit OpenAI...")
        print(f"📄 Verwende Datei: {filepath}")
        print(f"📊 Datengröße: {len(raw_data_content)} Zeichen")
        print(f"{'='*80}\n")
        
        # Prompt erstellen
        system_prompt, user_prompt = create_optimized_xes_prompt(raw_data_content)
        
        # Kürze den Inhalt falls zu lang (OpenAI Limit)
        max_chars = 100000  # ~25k tokens
        if len(raw_data_content) > max_chars:
            print(f"⚠️  Rohdaten gekürzt von {len(raw_data_content)} auf {max_chars} Zeichen")
            raw_data_content = raw_data_content[:max_chars] + "\n\n[... INHALT GEKÜRZT ...]"
            system_prompt, user_prompt = create_optimized_xes_prompt(raw_data_content)
        
        # OpenAI API Aufruf
        client = openai.OpenAI(api_key=api_key)
        
        print("📡 Sende Anfrage an OpenAI GPT-4...")
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=8000
        )
        
        ai_response = response.choices[0].message.content
        print(f"✅ OpenAI Antwort erhalten: {len(ai_response)} Zeichen")
        
        # XES-Code extrahieren
        xes_content = extract_xes_from_response(ai_response)
        
        if xes_content:
            # XES-Datei im verbesserungen-Ordner speichern
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            xes_filename = f"optimized_process_{timestamp}.xes"
            xes_filepath = os.path.join(VERBESSERUNGEN_FOLDER, xes_filename)
            
            with open(xes_filepath, 'w', encoding='utf-8') as f:
                f.write(xes_content)
            
            print(f"💾 Optimierter Prozess gespeichert in: {xes_filepath}")
            
            return jsonify({
                'success': True,
                'message': 'Prozess-Optimierung erfolgreich abgeschlossen',
                'explanation': ai_response,
                'xes_content': xes_content,
                'xes_filename': xes_filename,
                'folder': 'verbesserungen',
                'source_file': os.path.basename(filepath),
                'model_used': 'gpt-4o'
            }), 200
        else:
            # Keine XES gefunden, aber Erklärung zurückgeben
            return jsonify({
                'success': True,
                'message': 'Analyse abgeschlossen, aber keine XES-Datei generiert',
                'explanation': ai_response,
                'xes_content': None,
                'xes_filename': None,
                'source_file': os.path.basename(filepath),
                'model_used': 'gpt-4o',
                'warning': 'Die KI konnte keine valide XES-Datei generieren. Bitte prüfen Sie die Erklärung.'
            }), 200
            
    except openai.APIError as e:
        print(f"❌ OpenAI API Fehler: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'OpenAI API Fehler: {str(e)}'
        }), 500
        
    except Exception as e:
        print(f"❌ Allgemeiner Fehler: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    print(f"🚀 Flask Backend starting...")
    print(f"📁 Upload folder: {os.path.abspath(UPLOAD_FOLDER)}")
    print(f"✅ Allowed file types: {', '.join(ALLOWED_EXTENSIONS)}")
    # Debug mode disabled for background running
    app.run(debug=False, host='0.0.0.0', port=5001)