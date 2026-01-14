import pandas as pd
import csv
import pm4py
from pathlib import Path
import pypdf
import docx2txt

def extract_process_data(file_path: str) -> pd.DataFrame | pm4py.BPMN:
    """
    Extract process-related data from a file.
    Depending on the file extension, this function reads and returns
    process data in different formats:
    - ".xes": Event log read via pm4py
    - ".csv": CSV file loaded into a pandas DataFrame with automatic delimiter detection
    - ".bpmn": BPMN model read via pm4py
    """
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
    """
    Detect the delimiter used in a CSV file
    """
    with open(file_path, 'r') as csv_file:
        delimiter = str(csv.Sniffer().sniff(csv_file.read()).delimiter)
        return delimiter
    
def extract_textual_data(file_path: str) -> str:
    """
    Extracts and returns text content from a .txt, .pdf, or .docx file based on its extension
    """
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"Datei nicht gefunden: {file_path}")
    
    ext = path.suffix.lower()

    if ext == ".txt":
        with open(path, "r", encoding="UTF-8") as txt_file:
            text = txt_file.read()
            return text
    elif ext == ".pdf":
        reader = pypdf.PdfReader(path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    elif ext == ".docx":
        text = docx2txt.process(path)
        return text
    else:
        raise ValueError(f"Unsupported file format: .{ext}")