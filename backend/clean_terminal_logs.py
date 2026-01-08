#!/usr/bin/env python3
"""
Skript zum nachträglichen Bereinigen von raw_data_export Dateien.
Entfernt ANSI-Escape-Codes und formatiert CrewAI Terminal-Logs.
"""

import re
import sys
import os


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


def process_raw_data_export(input_file: str, output_file: str = None):
    """
    Verarbeitet eine raw_data_export Datei und bereinigt Sektion 4.
    """
    if not os.path.exists(input_file):
        print(f"Fehler: Datei '{input_file}' nicht gefunden.")
        return False
    
    with open(input_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Finde Sektion 4
    sektion4_marker = "# SEKTION 4: CREWAI TERMINAL-LOGS"
    
    if sektion4_marker not in content:
        print("Warnung: SEKTION 4 nicht gefunden in der Datei.")
        return False
    
    # Teile die Datei in vor und nach Sektion 4
    parts = content.split(sektion4_marker)
    before_section4 = parts[0]
    section4_and_after = sektion4_marker + parts[1]
    
    # Bereinige Sektion 4
    cleaned_section4 = clean_and_format_crewai_logs(section4_and_after)
    
    # Füge Header für Sektion 4 hinzu
    cleaned_content = before_section4 + "\n" + "#" * 80 + "\n"
    cleaned_content += "# SEKTION 4: CREWAI TERMINAL-LOGS (BEREINIGT)\n"
    cleaned_content += "#" * 80 + "\n\n"
    cleaned_content += cleaned_section4
    
    # Ausgabe
    if output_file is None:
        # Erstelle _cleaned Version
        base, ext = os.path.splitext(input_file)
        output_file = f"{base}_cleaned{ext}"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(cleaned_content)
    
    print(f"✅ Bereinigte Datei gespeichert: {output_file}")
    return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Verwendung: python clean_terminal_logs.py <input_file> [output_file]")
        print("Beispiel: python clean_terminal_logs.py ../uploads/verbesserungen/raw_data_export_20260108_142324.txt")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    success = process_raw_data_export(input_file, output_file)
    sys.exit(0 if success else 1)
