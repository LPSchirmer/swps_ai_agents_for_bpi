import pandas as pd
import pm4py
from pathlib import Path

# Just Pseudocode, DP Connection required
def import_process_data(file_path: str):
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"Datei nicht gefunden: {file_path}")
    
    ext = path.suffix.lower()

    if ext == ".xes":
        return pm4py.read_xes(file_path)
    elif ext == ".csv":
        return pd.read_csv(file_path) # Seperator needs to be defined
    elif ext == ".bpmn":
        return pm4py.read_bpmn(file_path)
    else:
        raise ValueError(f"Unsupported file format: .{ext}")

def prepare_event_log(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df = pm4py.format_dataframe(df)

    if "time:timestamp" in df.columns:
        df["time:timestamp"] = pd.to_datetime(df["time:timestamp"], errors="coerce")
# Future Problems: fillna(0) and "costs"
    if "costs" in df.columns:
        df["costs"] = pd.to_numeric(df["costs"], errors="coerce").fillna(0).astype(int)
# Be careful with sorting
    df.sort_values(by=["case:concept:name", "time:timestamp"], ascending=[True, True])
    return df
    
def bpmn_to_df(bpmn_model: pm4py.BPMN) -> pd.DataFrame:
    simulated_event_log = pm4py.sim.play_out(pm4py.convert_to_process_tree(bpmn_model))
    rows = []
    for i, trace in enumerate(simulated_event_log):
        for event in trace:
            row = {"case:concept:name":i+1}
            row.update(event)
            rows.append(row)
    event_log = pd.DataFrame(rows)
    return event_log