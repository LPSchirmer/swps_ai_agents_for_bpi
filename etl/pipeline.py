from extract import extract_process_data, extract_textual_data
from transform import rename_columns, transform_data_types, bpmn_to_df
from load import load_event_log_to_database, load_textual_process_data_to_database
from pathlib import Path

def run_etl_event_log(file_path: str) -> None:
    ext = Path(file_path).suffix.lower()
    if ext == ".bpmn":
        bpmn_model = extract_process_data(file_path)
        df = bpmn_to_df(bpmn_model)
    else:
        df = extract_process_data(file_path)
    df = rename_columns(df)
    df = transform_data_types(df)
    load_event_log_to_database(file_path, df)

def run_etl_textual_process_data(file_path: str) -> None:
    text = extract_textual_data(file_path)
    load_textual_process_data_to_database(text)


if __name__ == "__main__":
    run_etl_event_log("testdata/structured_data/xes_data/running-example.xes") # Just for demonstration
    run_etl_textual_process_data("testdata/unstructured_data/bad_structured.txt") # Just for demonstration