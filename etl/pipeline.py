from extract import extract_process_data
from transform import rename_columns, transform_data_types, bpmn_to_df
from load import load_to_database
from pathlib import Path

def run_etl(file_path: str):
    ext = Path(file_path).suffix.lower()
    if ext == ".bpmn":
        bpmn_model = extract_process_data(file_path)
        df = bpmn_to_df(bpmn_model)
    else:
        df = extract_process_data(file_path)
    df = rename_columns(df)
    df = transform_data_types(df)
    load_to_database(file_path, df)