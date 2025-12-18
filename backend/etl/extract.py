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

    Parameters
    ----------
    file_path : str
        Path to the process data file.

    Returns
    -------
    pandas.DataFrame or pm4py.BPMN
        The extracted process data as a DataFrame (CSV)
        or a BPMN / event log object (XES, BPMN).

    Raises
    ------
    FileNotFoundError
        If the specified file does not exist.
    ValueError
        If the file format is not supported.
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
    Detect the delimiter used in a CSV file.

    This function uses Python's csv.Sniffer to automatically
    determine the delimiter of a given CSV file.

    Parameters
    ----------
    file_path : str
        Path to the CSV file.

    Returns
    -------
    str
        The detected delimiter character.
    """
    with open(file_path, 'r') as csv_file:
        delimiter = str(csv.Sniffer().sniff(csv_file.read()).delimiter)
        return delimiter
    
def extract_textual_data(file_path: str) -> str:
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