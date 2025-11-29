from extract import extract_process_data, extract_textual_data
from transform import rename_columns, transform_data_types, bpmn_to_df
from load import load_chat_data_to_database, load_event_log_to_database, load_textual_process_data_to_database
import pandas as pd
from pathlib import Path
import os

def run_etl(dir_path: str) -> None:
    load_chat_data_to_database(dir_path)
    for file in os.listdir(dir_path):
        file_path = dir_path + "/" + file
        ext = Path(file_path).suffix.lower()
        if ext in [".xes", ".csv", ".bpmn"]:
            if ext == ".bpmn":
                bpmn_model = extract_process_data(file_path)
                df = bpmn_to_df(bpmn_model)
            else:
                df = extract_process_data(file_path)
            df = rename_columns(df)
            df = transform_data_types(df)
            load_event_log_to_database(file_path, df)
        elif ext in [".txt", ".pdf", ".docx"]:
            text = extract_textual_data(file_path)
            load_textual_process_data_to_database(text)

def get_event_log(dir_path: str) -> pd.DataFrame:
    for file in os.listdir(dir_path):
        file_path = dir_path + "/" + file
        ext = Path(file_path).suffix.lower()
        if ext in [".xes", ".csv", ".bpmn"]:
            if ext == ".bpmn":
                bpmn_model = extract_process_data(file_path)
                df = bpmn_to_df(bpmn_model)
            else:
                df = extract_process_data(file_path)
            df = rename_columns(df)
            df = transform_data_types(df)
    return df

def get_textual_data(dir_path: str) -> str:
    textual_data = []
    for file in os.listdir(dir_path):
        file_path = dir_path + "/" + file
        ext = Path(file_path).suffix.lower()
        if ext in [".txt", ".pdf", ".doc", ".docx"]:
            text = extract_textual_data(file_path)
            textual_data.append(text)
    if not textual_data:
        return None
    else:
        return textual_data