import pandas as pd
import pm4py

column_map = {
    "case:concept:name":["case_id", "case", "caseid", "case id", "instance_id", "instance", "instanceid", "instance id"],
    "concept:name":["activity", "activity_name", "event", "event_name", "task", "operation", "step"],
    "time:timestamp":["timestamp", "time", "datetime", "date", "eventtime"],
    "org:resource":["resource", "user", "worker", "agent", "performer"],
    "cost:amount":["cost", "costs"]
}

def rename_columns(df: pd.DataFrame) -> pd.DataFrame:
    # df = pm4py.format_dataframe(df) funktioniert nur bedingt
    mapped = {}
    for canonical_col, synonyms in column_map.items():
        for column in df.columns:
            if column.lower().strip() in synonyms:
                mapped[column] = canonical_col
    return df.rename(columns=mapped)

def transform_data_types(df: pd.DataFrame) -> pd.DataFrame:
    for column in df.columns:
        if column == "time:timestamp":
            df["time:timestamp"] = pd.to_datetime(df["time:timestamp"], errors="ignore")
        else:
            # Set all columns, except timestamp, to numeric values -> All numbers that are stored as a string will be numeric and all text data, which is stored as a string, will remain as a string
            df[column] = pd.to_numeric(df[column], errors="ignore")
    # Be careful with sorting, don't know if we really need that
    df.sort_values(by=["case:concept:name", "time:timestamp"], ascending=[True, True])
    return df
    
def bpmn_to_df(bpmn_model: pm4py.BPMN) -> pd.DataFrame:
    simulated_event_log = pm4py.sim.play_out(pm4py.convert_to_process_tree(bpmn_model))
    rows = []
    for i, trace in enumerate(simulated_event_log):
        for event in trace:
            row = {"case:concept:name":i}
            row.update(event)
            rows.append(row)
    event_log = pd.DataFrame(rows)
    return event_log