import pandas as pd
import pm4py

# Mapping of canonical PM4Py column names to possible alternative labels in the input dataset
column_map = {
    "case:concept:name":["case_id", "case", "caseid", "case id", "instance_id", "instance", "instanceid", "instance id"],
    "concept:name":["activity", "activity_name", "event", "event_name", "task", "operation", "step"],
    "time:timestamp":["timestamp", "time", "datetime", "date", "eventtime"],
    "org:resource":["resource", "user", "worker", "agent", "performer"],
    "cost:amount":["cost", "costs"],
    "lifecycle:transition":["lifecycle", "transition", "event_type", "eventtype"]
}

def rename_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Standardizes DataFrame column names to the canonical names expected by PM4Py
    """
    mapped = {}
    for canonical_col, synonyms in column_map.items():
        for column in df.columns:
            if column.lower().strip() in synonyms:
                mapped[column] = canonical_col
    df.rename(columns=mapped, inplace=True)
    df = df.loc[:, ~df.columns.duplicated(keep='first')]
    return df

def transform_data_types(df: pd.DataFrame) -> pd.DataFrame:
    """
    Converts data types into a format suitable for the process analysis engine
    """
    df["time:timestamp"] = pd.to_datetime(df["time:timestamp"], errors="ignore")
    df["case:concept:name"] = df["case:concept:name"].astype(str)
    if "cost:amount" in df.columns:
        df["cost:amount"] = pd.to_numeric(df["cost:amount"], errors="ignore")
    df.sort_values(by=["case:concept:name", "time:timestamp"], ascending=[True, True])
    return df
    
def bpmn_to_df(bpmn_model: pm4py.BPMN) -> pd.DataFrame:
    """
    Simulates a BPMN model and generates an event log in DataFrame format
    """
    pn, im, fm = pm4py.convert_to_petri_net(bpmn_model)
    simulated_event_log = pm4py.sim.play_out(pn, im, fm)
    rows = []
    for i, trace in enumerate(simulated_event_log):
        for event in trace:
            row = {"case:concept:name":i}
            row.update(event)
            rows.append(row)
    event_log = pd.DataFrame(rows)
    event_log["case:concept:name"] = event_log["case:concept:name"].astype(str)
    return event_log