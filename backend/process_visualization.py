"""
Prozess-Visualisierung für BPMN, XES und XML Dateien
=====================================================

Dieses Modul extrahiert Prozessinformationen aus verschiedenen Dateiformaten
und generiert interaktive Prozess-Graph-Visualisierungen.

Unterstützte Formate:
- XES (Event Logs)
- BPMN (Business Process Model and Notation)
- CSV (mit Process Mining Spalten)
"""

import os
import json
import base64
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from io import BytesIO
from dataclasses import dataclass, asdict
from enum import Enum

import pm4py
from pm4py.algo.discovery.dfg import algorithm as dfg_discovery
from pm4py.visualization.dfg import visualizer as dfg_visualization
from pm4py.visualization.bpmn import visualizer as bpmn_visualizer
from pm4py.objects.bpmn.importer import importer as bpmn_importer
from pm4py.algo.discovery.alpha import algorithm as alpha_miner
from pm4py.algo.discovery.heuristics import algorithm as heuristics_miner
from pm4py.visualization.petri_net import visualizer as pn_visualizer
from pm4py.objects.conversion.process_tree import converter as pt_converter
from pm4py.statistics.traces.generic.log import case_statistics
import pandas as pd


class ProcessNodeType(Enum):
    """Typen von Prozessknoten"""
    START = "start"
    END = "end"
    ACTIVITY = "activity"
    GATEWAY = "gateway"
    EVENT = "event"


@dataclass
class ProcessNode:
    """Repräsentiert einen Knoten im Prozessgraphen"""
    id: str
    label: str
    type: ProcessNodeType
    frequency: int = 0
    duration: float = 0.0
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "label": self.label,
            "type": self.type.value,
            "frequency": self.frequency,
            "duration": self.duration
        }


@dataclass
class ProcessEdge:
    """Repräsentiert eine Kante im Prozessgraphen"""
    source: str
    target: str
    frequency: int = 0
    label: str = ""
    
    def to_dict(self) -> Dict:
        return {
            "source": self.source,
            "target": self.target,
            "frequency": self.frequency,
            "label": self.label
        }


@dataclass
class ProcessGraph:
    """Kompletter Prozessgraph mit Knoten und Kanten"""
    nodes: List[ProcessNode]
    edges: List[ProcessEdge]
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict:
        return {
            "nodes": [node.to_dict() for node in self.nodes],
            "edges": [edge.to_dict() for edge in self.edges],
            "metadata": self.metadata
        }


class ProcessVisualizer:
    """
    Hauptklasse für die Prozessvisualisierung.
    
    Unterstützt XES, BPMN und CSV Dateien und generiert
    verschiedene Visualisierungsformate.
    """
    
    def __init__(self):
        self.supported_extensions = {'.xes', '.bpmn', '.csv', '.xml'}
    
    def visualize_from_file(self, file_path: str) -> Dict[str, Any]:
        """
        Hauptmethode: Lädt eine Datei und erstellt die Visualisierung.
        
        Parameters
        ----------
        file_path : str
            Pfad zur Prozessdatei (XES, BPMN, CSV)
            
        Returns
        -------
        Dict[str, Any]
            Enthält den Prozessgraph (nodes, edges), 
            eine Base64-kodierte Bildvisualisierung und Metadaten.
        """
        path = Path(file_path)
        
        if not path.exists():
            return {
                "success": False,
                "error": f"Datei nicht gefunden: {file_path}",
                "file_name": path.name
            }
        
        ext = path.suffix.lower()
        
        if ext not in self.supported_extensions:
            return {
                "success": False,
                "error": f"Nicht unterstütztes Dateiformat: {ext}. Unterstützt: {self.supported_extensions}",
                "file_name": path.name
            }
        
        try:
            if ext == '.xes':
                return self._visualize_xes(file_path)
            elif ext == '.bpmn':
                return self._visualize_bpmn(file_path)
            elif ext == '.csv':
                return self._visualize_csv(file_path)
            elif ext == '.xml':
                # XML könnte BPMN oder XES sein
                return self._detect_and_visualize_xml(file_path)
        except Exception as e:
            print(f"❌ Fehler beim Visualisieren von {path.name}: {e}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": f"Fehler beim Verarbeiten der Datei: {str(e)}",
                "file_name": path.name,
                "file_type": ext.replace('.', '')
            }
        
        return {
            "success": False,
            "error": f"Unbekanntes Format: {ext}",
            "file_name": path.name
        }
    
    def _visualize_xes(self, file_path: str) -> Dict[str, Any]:
        """Visualisiert ein XES Event Log"""
        # Event Log laden
        log = pm4py.read_xes(file_path)
        
        # DFG (Directly-Follows Graph) erstellen
        dfg, start_activities, end_activities = pm4py.discover_dfg(log)
        
        # Prozessgraph extrahieren
        graph = self._dfg_to_process_graph(dfg, start_activities, end_activities, log)
        
        # Bild generieren
        image_base64 = self._generate_dfg_image(log)
        
        # Statistiken sammeln
        stats = self._get_log_statistics(log)
        
        return {
            "success": True,
            "graph": graph.to_dict(),
            "image": image_base64,
            "statistics": stats,
            "file_type": "xes",
            "file_name": Path(file_path).name
        }
    
    def _visualize_bpmn(self, file_path: str) -> Dict[str, Any]:
        """Visualisiert ein BPMN Modell"""
        # BPMN-XML Inhalt lesen für Frontend-Visualisierung
        bpmn_xml = None
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                bpmn_xml = f.read()
            print(f"📄 BPMN-XML gelesen: {len(bpmn_xml)} Zeichen")
            print(f"   Preview: {bpmn_xml[:200]}...")
        except Exception as e:
            print(f"⚠️ Konnte BPMN-XML nicht lesen: {e}")
            bpmn_xml = None
        
        # BPMN laden mit pm4py
        bpmn_graph = pm4py.read_bpmn(file_path)
        
        # Prozessgraph extrahieren (für Fallback-Visualisierung)
        graph = self._bpmn_to_process_graph(bpmn_graph)
        
        # Bild generieren (für Fallback)
        image_base64 = self._generate_bpmn_image(bpmn_graph)
        
        return {
            "success": True,
            "graph": graph.to_dict(),
            "image": image_base64,
            "bpmn_xml": bpmn_xml,  # NEU: Rohes BPMN-XML für bpmn-js Viewer
            "statistics": {
                "activities": len([n for n in graph.nodes if n.type == ProcessNodeType.ACTIVITY]),
                "variants": 1,  # BPMN hat nur eine Variante (das Modell selbst)
                "nodes": len(graph.nodes),
                "edges": len(graph.edges)
            },
            "file_type": "bpmn",
            "file_name": Path(file_path).name
        }
    
    def _visualize_csv(self, file_path: str) -> Dict[str, Any]:
        """Visualisiert ein CSV Event Log"""
        # CSV laden und in Event Log konvertieren
        df = pd.read_csv(file_path)
        
        # Spalten identifizieren
        case_col, activity_col, timestamp_col = self._identify_csv_columns(df)
        
        if not all([case_col, activity_col]):
            raise ValueError("CSV muss mindestens Case ID und Activity Spalten enthalten")
        
        # In pm4py Event Log Format konvertieren
        log = pm4py.format_dataframe(
            df, 
            case_id=case_col, 
            activity_key=activity_col,
            timestamp_key=timestamp_col if timestamp_col else None
        )
        log = pm4py.convert_to_event_log(log)
        
        # DFG erstellen
        dfg, start_activities, end_activities = pm4py.discover_dfg(log)
        
        # Prozessgraph extrahieren
        graph = self._dfg_to_process_graph(dfg, start_activities, end_activities, log)
        
        # Bild generieren
        image_base64 = self._generate_dfg_image(log)
        
        # Statistiken sammeln
        stats = self._get_log_statistics(log)
        
        return {
            "success": True,
            "graph": graph.to_dict(),
            "image": image_base64,
            "statistics": stats,
            "file_type": "csv",
            "file_name": Path(file_path).name
        }
    
    def _detect_and_visualize_xml(self, file_path: str) -> Dict[str, Any]:
        """Erkennt ob XML eine BPMN oder XES Datei ist und visualisiert entsprechend"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read(1000)  # Erste 1000 Zeichen lesen
        
        if 'bpmn' in content.lower() or 'definitions' in content.lower():
            return self._visualize_bpmn(file_path)
        elif 'log' in content.lower() and 'trace' in content.lower():
            return self._visualize_xes(file_path)
        else:
            # Versuche als BPMN
            try:
                return self._visualize_bpmn(file_path)
            except:
                try:
                    return self._visualize_xes(file_path)
                except:
                    raise ValueError("XML-Datei konnte nicht als BPMN oder XES erkannt werden")
    
    def _dfg_to_process_graph(
        self, 
        dfg: Dict, 
        start_activities: Dict, 
        end_activities: Dict,
        log: Any
    ) -> ProcessGraph:
        """Konvertiert einen DFG in einen ProcessGraph"""
        nodes: List[ProcessNode] = []
        edges: List[ProcessEdge] = []
        node_ids: Dict[str, str] = {}
        
        # Aktivitätsfrequenzen berechnen
        activity_freq = pm4py.get_event_attribute_values(log, "concept:name")
        
        # Start-Knoten hinzufügen
        start_node = ProcessNode(
            id="start",
            label="Start",
            type=ProcessNodeType.START,
            frequency=sum(start_activities.values())
        )
        nodes.append(start_node)
        
        # Aktivitätsknoten hinzufügen
        all_activities = set()
        for (src, tgt), freq in dfg.items():
            all_activities.add(src)
            all_activities.add(tgt)
        
        for activity in all_activities:
            node_id = f"activity_{len(node_ids)}"
            node_ids[activity] = node_id
            
            is_start = activity in start_activities
            is_end = activity in end_activities
            
            node = ProcessNode(
                id=node_id,
                label=activity,
                type=ProcessNodeType.ACTIVITY,
                frequency=activity_freq.get(activity, 0)
            )
            nodes.append(node)
        
        # End-Knoten hinzufügen
        end_node = ProcessNode(
            id="end",
            label="End",
            type=ProcessNodeType.END,
            frequency=sum(end_activities.values())
        )
        nodes.append(end_node)
        
        # Kanten von Start zu Start-Aktivitäten
        for activity, freq in start_activities.items():
            if activity in node_ids:
                edge = ProcessEdge(
                    source="start",
                    target=node_ids[activity],
                    frequency=freq
                )
                edges.append(edge)
        
        # DFG Kanten
        for (src, tgt), freq in dfg.items():
            if src in node_ids and tgt in node_ids:
                edge = ProcessEdge(
                    source=node_ids[src],
                    target=node_ids[tgt],
                    frequency=freq,
                    label=str(freq)
                )
                edges.append(edge)
        
        # Kanten von End-Aktivitäten zu End
        for activity, freq in end_activities.items():
            if activity in node_ids:
                edge = ProcessEdge(
                    source=node_ids[activity],
                    target="end",
                    frequency=freq
                )
                edges.append(edge)
        
        metadata = {
            "total_activities": len(all_activities),
            "total_transitions": len(dfg)
        }
        
        return ProcessGraph(nodes=nodes, edges=edges, metadata=metadata)
    
    def _bpmn_to_process_graph(self, bpmn_graph: Any) -> ProcessGraph:
        """Konvertiert ein BPMN Modell in einen ProcessGraph"""
        nodes: List[ProcessNode] = []
        edges: List[ProcessEdge] = []
        node_map: Dict[str, str] = {}
        
        # BPMN Knoten extrahieren
        for node in bpmn_graph.get_nodes():
            node_id = str(id(node))
            node_map[node] = node_id
            
            # Typ bestimmen
            node_class = type(node).__name__.lower()
            
            if 'start' in node_class:
                node_type = ProcessNodeType.START
            elif 'end' in node_class:
                node_type = ProcessNodeType.END
            elif 'gateway' in node_class:
                node_type = ProcessNodeType.GATEWAY
            elif 'event' in node_class:
                node_type = ProcessNodeType.EVENT
            else:
                node_type = ProcessNodeType.ACTIVITY
            
            # Label extrahieren
            label = getattr(node, 'get_name', lambda: str(node))()
            if not label:
                label = node_type.value.capitalize()
            
            process_node = ProcessNode(
                id=node_id,
                label=label,
                type=node_type
            )
            nodes.append(process_node)
        
        # BPMN Kanten extrahieren
        for flow in bpmn_graph.get_flows():
            source = flow.get_source()
            target = flow.get_target()
            
            if source in node_map and target in node_map:
                edge = ProcessEdge(
                    source=node_map[source],
                    target=node_map[target]
                )
                edges.append(edge)
        
        metadata = {
            "bpmn_type": "process_model"
        }
        
        return ProcessGraph(nodes=nodes, edges=edges, metadata=metadata)
    
    def _generate_dfg_image(self, log: Any) -> str:
        """Generiert ein DFG Bild als Base64"""
        try:
            # DFG visualisieren
            dfg, start_activities, end_activities = pm4py.discover_dfg(log)
            
            gviz = dfg_visualization.apply(
                dfg, 
                log=log,
                variant=dfg_visualization.Variants.FREQUENCY,
                parameters={
                    dfg_visualization.Variants.FREQUENCY.value.Parameters.START_ACTIVITIES: start_activities,
                    dfg_visualization.Variants.FREQUENCY.value.Parameters.END_ACTIVITIES: end_activities,
                    dfg_visualization.Variants.FREQUENCY.value.Parameters.FORMAT: "png",
                    "bgcolor": "transparent",
                    "rankdir": "LR",  # Left to Right Layout
                }
            )
            
            # Fix für fehlende Pfeilspitzen: Graphviz-Attribute explizit setzen
            if hasattr(gviz, 'graph_attr'):
                gviz.graph_attr.update({
                    'splines': 'ortho',  # Orthogonale Kanten für bessere Pfeildarstellung
                    'nodesep': '1.0',
                    'ranksep': '1.5'
                })
            if hasattr(gviz, 'edge_attr'):
                gviz.edge_attr.update({
                    'arrowhead': 'vee',  # Explizite Pfeilspitze
                    'arrowsize': '1.0',
                    'penwidth': '2.0'
                })
            
            # In BytesIO speichern
            tmp_file = "/tmp/process_dfg.png"
            dfg_visualization.save(gviz, tmp_file)
            
            with open(tmp_file, 'rb') as f:
                image_data = f.read()
            
            # Aufräumen
            os.remove(tmp_file)
            
            return base64.b64encode(image_data).decode('utf-8')
            
        except Exception as e:
            print(f"Fehler bei DFG-Bild-Generierung: {e}")
            return ""
    
    def _generate_bpmn_image(self, bpmn_graph: Any) -> str:
        """Generiert ein BPMN Bild als Base64"""
        try:
            gviz = bpmn_visualizer.apply(
                bpmn_graph,
                parameters={bpmn_visualizer.Variants.CLASSIC.value.Parameters.FORMAT: "png"}
            )
            
            tmp_file = "/tmp/process_bpmn.png"
            bpmn_visualizer.save(gviz, tmp_file)
            
            with open(tmp_file, 'rb') as f:
                image_data = f.read()
            
            os.remove(tmp_file)
            
            return base64.b64encode(image_data).decode('utf-8')
            
        except Exception as e:
            print(f"Fehler bei BPMN-Bild-Generierung: {e}")
            return ""
    
    def _identify_csv_columns(self, df: pd.DataFrame) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """Identifiziert Case ID, Activity und Timestamp Spalten im CSV"""
        columns = [col.lower() for col in df.columns]
        original_columns = list(df.columns)
        
        case_col = None
        activity_col = None
        timestamp_col = None
        
        # Case ID suchen
        case_keywords = ['case', 'caseid', 'case_id', 'case id', 'traceid', 'trace_id', 'trace']
        for i, col in enumerate(columns):
            if any(keyword in col for keyword in case_keywords):
                case_col = original_columns[i]
                break
        
        # Activity suchen
        activity_keywords = ['activity', 'event', 'action', 'task', 'concept:name']
        for i, col in enumerate(columns):
            if any(keyword in col for keyword in activity_keywords):
                activity_col = original_columns[i]
                break
        
        # Timestamp suchen
        timestamp_keywords = ['timestamp', 'time', 'date', 'datetime', 'time:timestamp']
        for i, col in enumerate(columns):
            if any(keyword in col for keyword in timestamp_keywords):
                timestamp_col = original_columns[i]
                break
        
        return case_col, activity_col, timestamp_col
    
    def _get_log_statistics(self, log: Any) -> Dict[str, Any]:
        """Sammelt Statistiken über das Event Log"""
        try:
            # Basis-Statistiken
            num_cases = len(log)
            num_events = sum(len(trace) for trace in log)
            
            # Aktivitäten
            activities = pm4py.get_event_attribute_values(log, "concept:name")
            
            # Varianten
            variants = case_statistics.get_variant_statistics(log)
            
            return {
                "cases": num_cases,
                "events": num_events,
                "activities": len(activities),
                "variants": len(variants),
                "top_activities": dict(sorted(activities.items(), key=lambda x: x[1], reverse=True)[:10])
            }
        except Exception as e:
            return {"error": str(e)}


def visualize_process(file_path: str) -> Dict[str, Any]:
    """
    Convenience-Funktion für die Prozessvisualisierung.
    
    Parameters
    ----------
    file_path : str
        Pfad zur Prozessdatei
        
    Returns
    -------
    Dict[str, Any]
        Visualisierungsergebnis mit Graph, Bild und Statistiken
    """
    visualizer = ProcessVisualizer()
    return visualizer.visualize_from_file(file_path)


def visualize_all_uploads(upload_folder: str) -> List[Dict[str, Any]]:
    """
    Visualisiert alle Prozessdateien in einem Upload-Ordner.
    
    Parameters
    ----------
    upload_folder : str
        Pfad zum Upload-Ordner
        
    Returns
    -------
    List[Dict[str, Any]]
        Liste aller Visualisierungsergebnisse
    """
    visualizer = ProcessVisualizer()
    results = []
    
    supported = {'.xes', '.bpmn', '.csv', '.xml'}
    
    for filename in os.listdir(upload_folder):
        path = Path(upload_folder) / filename
        if path.suffix.lower() in supported:
            try:
                result = visualizer.visualize_from_file(str(path))
                results.append(result)
            except Exception as e:
                results.append({
                    "success": False,
                    "error": str(e),
                    "file_name": filename
                })
    
    return results


if __name__ == "__main__":
    # Test
    import sys
    if len(sys.argv) > 1:
        result = visualize_process(sys.argv[1])
        print(json.dumps(result, indent=2, default=str))
