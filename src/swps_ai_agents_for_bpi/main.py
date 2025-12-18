#!/usr/bin/env python
import sys
import warnings
from datetime import datetime
import os

# Get the textual user input and event log
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend/etl')))
from pipeline import get_textual_data, get_event_log

user_input = get_textual_data("testdata/combined_data/example_1") # For Demonstration
event_log = get_event_log("testdata/combined_data/example_1") # For Demonstration

# Get the calculated kpi's of event log
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend/process_analysis_engine')))
from analysis_workflow import calculate_result_dict_basic, calculate_result_dict_performance, calculate_result_dict_finance, calculate_result_dict_compliance

process_data_basic = None
process_kpis_performance = None
process_kpis_finance = None
process_kpis_compliance = None

if event_log is not None:
    process_data_basic = calculate_result_dict_basic(event_log)
    process_kpis_performance = calculate_result_dict_performance(event_log)
    process_kpis_finance = calculate_result_dict_finance(event_log)
    process_kpis_compliance = calculate_result_dict_compliance(event_log)

from swps_ai_agents_for_bpi.crew import SwpsAiAgentsForBpi
warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

# This main file is intended to be a way for you to run your
# crew locally, so refrain from adding unnecessary logic into this file.
# Replace with inputs you want to test with, it will automatically
# interpolate any tasks and agents information

# Get current, last and next year
current_year = datetime.now().year
last_year = current_year-1
next_year = current_year+1

def run():
    """
    Run the crew.
    """
    inputs = {
        "topic": "Process",
        "textual_user_input": user_input,
        "process_data_basic": process_data_basic,
        "process_kpis_performance": process_kpis_performance,
        "process_kpis_finance": process_kpis_finance,
        "process_kpis_compliance": process_kpis_compliance,
        "current_year": current_year,
        "last_year": last_year,
        "next_year": next_year
    }
    
    try:
        SwpsAiAgentsForBpi().crew().kickoff(inputs=inputs)
    except Exception as e:
        raise Exception(f"An error occurred while running the crew: {e}")


def train():
    """
    Train the crew for a given number of iterations.
    """
    inputs = {
        "topic": "Process",
        "textual_user_input": user_input,
        "process_data_basic": process_data_basic,
        "process_kpis_performance": process_kpis_performance,
        "process_kpis_finance": process_kpis_finance,
        "process_kpis_compliance": process_kpis_compliance,
        "current_year": current_year,
        "last_year": last_year,
        "next_year": next_year
        }
    try:
        SwpsAiAgentsForBpi().crew().train(n_iterations=int(sys.argv[1]), filename=sys.argv[2], inputs=inputs)

    except Exception as e:
        raise Exception(f"An error occurred while training the crew: {e}")

def replay():
    """
    Replay the crew execution from a specific task.
    """
    try:
        SwpsAiAgentsForBpi().crew().replay(task_id=sys.argv[1])

    except Exception as e:
        raise Exception(f"An error occurred while replaying the crew: {e}")

def test():
    """
    Test the crew execution and returns the results.
    """
    inputs = {
        "topic": "Process",
        "textual_user_input": user_input,
        "process_data_basic": process_data_basic,
        "process_kpis_performance": process_kpis_performance,
        "process_kpis_finance": process_kpis_finance,
        "process_kpis_compliance": process_kpis_compliance,
        "current_year": current_year,
        "last_year": last_year,
        "next_year": next_year
    }
    
    try:
        SwpsAiAgentsForBpi().crew().test(n_iterations=int(sys.argv[1]), eval_llm=sys.argv[2], inputs=inputs)

    except Exception as e:
        raise Exception(f"An error occurred while testing the crew: {e}")