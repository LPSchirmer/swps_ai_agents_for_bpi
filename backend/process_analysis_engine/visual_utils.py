import pm4py
import pandas as pd
import os
import sys
import tempfile

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../etl')))
from pipeline import get_event_log

def convert_event_log_to_bpmn(df: pd.DataFrame) -> None:
    bpmn_model = pm4py.discover_bpmn_inductive(df)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".bpmn") as tmp:
        pm4py.write_bpmn(bpmn_model, tmp.name)

    with open(tmp.name, "r", encoding="utf-8") as f:
        bpmn_xml_string = f.read()

    return bpmn_xml_string

