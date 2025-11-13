import pandas as pd
import csv
import pm4py
from pathlib import Path

def extract_process_data(file_path: str) -> pd.DataFrame | pm4py.BPMN:
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"Datei nicht gefunden: {file_path}")
    
    ext = path.suffix.lower()

    if ext == ".xes":
        return pm4py.read_xes(file_path)
    elif ext == ".csv":
        return pd.read_csv(file_path, sep=get_delimiter(file_path))
    elif ext == ".bpmn":
        return pm4py.read_bpmn(file_path)
    else:
        raise ValueError(f"Unsupported file format: .{ext}")
    
def get_delimiter(file_path: str) -> str:
    with open(file_path, 'r') as csv_file:
        delimiter = str(csv.Sniffer().sniff(csv_file.read()).delimiter)
        return delimiter