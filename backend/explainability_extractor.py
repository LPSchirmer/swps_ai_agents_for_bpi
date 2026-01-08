#!/usr/bin/env python3
"""
Explainability Extractor - Extrahiert Agenten-Reasoning aus raw_data_export Dateien.
Zeigt transparent, wie jeder Agent zu seinen Ergebnissen kommt.
"""

import re
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict


@dataclass
class ToolUsage:
    """Repräsentiert eine Tool-Nutzung durch einen Agenten."""
    tool_name: str
    search_query: Optional[str] = None
    query_result: Optional[str] = None


@dataclass
class AgentExplainability:
    """Explainability-Daten für einen einzelnen Agenten."""
    agent_name: str
    agent_role: str = ""
    task_description: str = ""
    thoughts: List[str] = field(default_factory=list)
    retrieved_knowledge: List[str] = field(default_factory=list)
    tools_used: List[ToolUsage] = field(default_factory=list)
    final_answer_preview: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        """Konvertiert zu Dictionary für JSON-Serialisierung."""
        return {
            "agent_name": self.agent_name,
            "agent_role": self.agent_role,
            "task_description": self.task_description,
            "thoughts": self.thoughts,
            "retrieved_knowledge": self.retrieved_knowledge,
            "tools_used": [
                {
                    "tool_name": t.tool_name,
                    "search_query": t.search_query,
                    "query_result": t.query_result
                } for t in self.tools_used
            ],
            "final_answer_preview": self.final_answer_preview
        }


def clean_text(text: str) -> str:
    """Bereinigt Text von ANSI-Codes und Box-Zeichen."""
    # ANSI-Codes entfernen
    ansi_pattern = re.compile(r'\x1b\[[0-9;]*m|\[\d+(?:;\d+)*m')
    text = ansi_pattern.sub('', text)
    
    # Box-Drawing-Zeichen entfernen
    box_chars = ['╭', '╮', '╰', '╯', '│', '─', '├', '┤', '┬', '┴', '┼', '└', '┘', '┌', '┐']
    for char in box_chars:
        text = text.replace(char, '')
    
    return text.strip()


def truncate_text(text: str, max_length: int = 1000) -> str:
    """Kürzt Text auf maximale Länge."""
    if len(text) <= max_length:
        return text
    return text[:max_length] + "..."


def extract_explainability_from_raw_data(raw_data_content: str) -> Dict[str, AgentExplainability]:
    """
    Extrahiert Explainability-Daten für alle Agenten aus dem raw_data_export.
    
    Returns:
        Dict mit Agent-Namen als Keys und AgentExplainability als Values
    """
    # Bereinige den Content
    content = clean_text(raw_data_content)
    
    # Agent-Mapping für die Reihenfolge
    agent_mapping = {
        "Senior Process Compliance Analyst": "compliance",
        "Senior Process Performance Analyst": "performance", 
        "Senior Process Finance Analyst": "finance",
        "Senior Corporate & Macroeconomic Research Analyst": "economic",
        "Senior Requirements Analyst": "requirements"
    }
    
    agents: Dict[str, AgentExplainability] = {}
    
    # Initialisiere alle Agenten
    for role, key in agent_mapping.items():
        agents[key] = AgentExplainability(
            agent_name=key.title(),
            agent_role=role
        )
    
    # Finde SEKTION 4: CREWAI TERMINAL-LOGS
    sektion4_match = re.search(r'SEKTION 4.*?(?=SEKTION \d|$)', content, re.DOTALL | re.IGNORECASE)
    if not sektion4_match:
        return agents
    
    logs_content = sektion4_match.group(0)
    lines = logs_content.split('\n')
    
    # Variablen für das Parsing
    current_agent_key = None
    pending_knowledge = []  # Wissen das dem nächsten Agent zugeordnet wird
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        # ============ WISSEN ABGERUFEN ============
        # Wissen wird VOR dem Agent-Start geloggt und muss gesammelt werden
        if 'WISSEN ABGERUFEN' in line:
            i += 1
            # Skip separator lines
            while i < len(lines) and lines[i].strip().startswith('---'):
                i += 1
            
            # Suche nach "Zusätzliche Info:"
            knowledge_text = ""
            while i < len(lines):
                current_line = lines[i].strip()
                if current_line.startswith('Zusätzliche Info:') or current_line.startswith('Additional Information:'):
                    knowledge_text = current_line.replace('Zusätzliche Info:', '').replace('Additional Information:', '').strip()
                    i += 1
                    # Sammle mehrzeiligen Text
                    while i < len(lines):
                        next_line = lines[i].strip()
                        if next_line.startswith(('---', 'AGENT', 'TOOL', '[CREW', 'WISSEN', '===')):
                            break
                        if next_line:
                            knowledge_text += ' ' + next_line
                        i += 1
                    break
                elif current_line.startswith(('---', 'AGENT', 'TOOL', '[CREW')):
                    break
                i += 1
            
            if knowledge_text and len(knowledge_text) > 30:
                pending_knowledge.append(knowledge_text)
            continue
        
        # ============ AGENT GESTARTET ============
        if 'AGENT GESTARTET' in line:
            i += 1
            # Skip separator lines
            while i < len(lines) and lines[i].strip().startswith('---'):
                i += 1
            
            # Finde Agent-Rolle und Task
            temp_agent_key = None
            task_text = ""
            
            while i < len(lines):
                current_line = lines[i].strip()
                
                if current_line.startswith('Agent:'):
                    role = current_line.replace('Agent:', '').strip()
                    for agent_role, key in agent_mapping.items():
                        if agent_role in role or role in agent_role:
                            temp_agent_key = key
                            current_agent_key = key
                            break
                    i += 1
                    continue
                
                if current_line.startswith('Task:') and temp_agent_key:
                    task_text = current_line.replace('Task:', '').strip()
                    i += 1
                    # Sammle mehrzeilige Task-Beschreibung
                    while i < len(lines):
                        next_line = lines[i].strip()
                        if next_line.startswith(('Agent:', '---', 'AGENT', 'TOOL', '[CREW', 'WISSEN', '===')):
                            break
                        if next_line:
                            task_text += ' ' + next_line
                        i += 1
                    
                    if temp_agent_key:
                        agents[temp_agent_key].task_description = task_text  # Kein Truncate!
                        # Ordne pending knowledge diesem Agent zu
                        for knowledge in pending_knowledge:
                            agents[temp_agent_key].retrieved_knowledge.append(knowledge)
                        pending_knowledge = []
                    break
                
                if current_line.startswith(('---', '[CREW', 'WISSEN')):
                    break
                    
                i += 1
            continue
        
        # ============ TOOL-AUSFÜHRUNG ============
        if 'TOOL-AUSFÜHRUNG' in line or 'Agent Tool Execution' in line:
            i += 1
            # Skip separator
            while i < len(lines) and lines[i].strip().startswith('---'):
                i += 1
            
            thought_text = ""
            tool_name = ""
            search_query = ""
            query_result = ""
            
            while i < len(lines):
                current_line = lines[i].strip()
                
                # Gedanke
                if current_line.startswith('Gedanke:') or current_line.startswith('Thought:'):
                    thought_text = current_line.replace('Gedanke:', '').replace('Thought:', '').strip()
                    i += 1
                    while i < len(lines):
                        next_line = lines[i].strip()
                        if next_line.startswith(('Verwendetes Tool:', 'Using Tool:', '---', 'AGENT', '[CREW', '[TOOL')):
                            break
                        if next_line:
                            thought_text += ' ' + next_line
                        i += 1
                    continue
                
                # Tool Name
                if current_line.startswith('Verwendetes Tool:') or current_line.startswith('Using Tool:'):
                    tool_name = current_line.replace('Verwendetes Tool:', '').replace('Using Tool:', '').strip()
                    i += 1
                    continue
                
                # Tool Input
                if '[TOOL INPUT]' in current_line:
                    i += 1
                    json_lines = []
                    while i < len(lines):
                        next_line = lines[i]
                        if '[TOOL OUTPUT]' in next_line or next_line.strip().startswith(('---', 'AGENT', '[CREW')):
                            break
                        json_lines.append(next_line)
                        i += 1
                    
                    json_str = '\n'.join(json_lines)
                    # Extrahiere search_query
                    query_match = re.search(r'"search_query"\s*:\s*"([^"]*)"', json_str)
                    if not query_match:
                        query_match = re.search(r'"q"\s*:\s*"([^"]*)"', json_str)
                    if query_match:
                        search_query = query_match.group(1)
                    continue
                
                # Tool Output
                if '[TOOL OUTPUT]' in current_line:
                    i += 1
                    output_lines = []
                    while i < len(lines):
                        next_line = lines[i].strip()
                        if next_line.startswith(('---', 'AGENT', '[CREW', 'TOOL', 'WISSEN', '===')):
                            break
                        if next_line:
                            output_lines.append(next_line)
                        i += 1
                    query_result = ' '.join(output_lines)
                    break
                
                if current_line.startswith(('---', 'AGENT', '[CREW', 'WISSEN')):
                    break
                    
                i += 1
            
            # Speichere die Tool-Nutzung
            if current_agent_key and tool_name:
                if thought_text:
                    agents[current_agent_key].thoughts.append(thought_text)
                tool_usage = ToolUsage(
                    tool_name=tool_name,
                    search_query=search_query if search_query else None,
                    query_result=query_result if query_result else None
                )
                agents[current_agent_key].tools_used.append(tool_usage)
            continue
        
        # ============ AGENT FINALE ANTWORT ============
        if 'AGENT FINALE ANTWORT' in line:
            i += 1
            # Skip separator
            while i < len(lines) and lines[i].strip().startswith('---'):
                i += 1
            
            while i < len(lines):
                current_line = lines[i].strip()
                
                if current_line.startswith('Agent:'):
                    role = current_line.replace('Agent:', '').strip()
                    for agent_role, key in agent_mapping.items():
                        if agent_role in role or role in agent_role:
                            current_agent_key = key
                            break
                    i += 1
                    continue
                
                if current_line.startswith('Finale Antwort:') or current_line.startswith('Final Answer:'):
                    i += 1
                    answer_lines = []
                    while i < len(lines) and len(answer_lines) < 20:
                        next_line = lines[i].strip()
                        if next_line.startswith(('---', 'AGENT', '[CREW', 'TASK', '===')):
                            break
                        if next_line:
                            answer_lines.append(next_line)
                        i += 1
                    
                    if current_agent_key:
                        agents[current_agent_key].final_answer_preview = ' '.join(answer_lines)
                    break
                
                if current_line.startswith(('---', '[CREW')):
                    break
                    
                i += 1
            continue
        
        i += 1
    
    return agents


def extract_explainability_data(raw_data_filepath: str) -> Dict[str, Any]:
    """
    Hauptfunktion: Extrahiert Explainability-Daten aus einer raw_data_export Datei.
    
    Returns:
        Dict mit strukturierten Explainability-Daten für jeden Agenten
    """
    try:
        with open(raw_data_filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        agents = extract_explainability_from_raw_data(content)
        
        # Konvertiere zu JSON-serialisierbarem Format
        result = {
            key: agent.to_dict() 
            for key, agent in agents.items()
        }
        
        return {
            "success": True,
            "agents": result
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "agents": {}
        }


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python explainability_extractor.py <raw_data_export_file>")
        sys.exit(1)
    
    result = extract_explainability_data(sys.argv[1])
    print(json.dumps(result, indent=2, ensure_ascii=False))

