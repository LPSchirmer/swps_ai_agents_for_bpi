from analysis_utils import *
import json

def calculate_result_dict_basic(event_log: pd.DataFrame) -> str:
    """
    Computes basic process statistics from an event log and returns them as a JSON string.
    Ensures the result is JSON-serializable before conversion.
    """
    dict = get_basic_information(event_log)
    cleaned_dict = make_json_serializable(dict)
    json_obj = json.dumps(cleaned_dict)
    return json_obj

def calculate_result_dict_performance(event_log: pd.DataFrame) -> str:
    """
    Computes performance-related metrics from an event log and returns them as a JSON string.
    Ensures the result is JSON-serializable before conversion.
    """
    dict = {
    "case_durations":get_case_durations(event_log).to_dict(orient="records"),
    "case_durations_statistics":get_case_duration_statistics(event_log),
    "variants_frequency_total_mean_durations":get_variant_durations_frequency(event_log).to_dict(orient="records"),
    "activities_frequency_total_mean_durations":get_activity_duration(event_log).to_dict(orient="records"),
    "rework_cases_per_activity":get_rework_stats(event_log),
    "activities_per_resources":get_activities_per_resources(event_log).to_dict(orient="records"),
    "resources_per_activity":get_resources_per_activities(event_log).to_dict(orient="records")
    }
    cleaned_dict = make_json_serializable(dict)
    json_obj = json.dumps(cleaned_dict)
    return json_obj

def calculate_result_dict_finance(event_log: pd.DataFrame) -> str:
    """
    Computes finance-related metrics from an event log and returns them as a JSON string.
    Metrics are only calculated if the 'cost:amount' column exists.
    Returns None if no cost information is present.
    """
    if "cost:amount" in event_log.columns:
        dict = {
        "total_costs_per_case":get_costs_per_case(event_log).to_dict(orient="records"),
        "case_costs_statistics":get_case_costs_statistics(event_log),
        "total_mean_costs_per_activity":get_costs_per_activity(event_log).to_dict(orient="records"),
        "rework_cases_per_activity":get_rework_stats(event_log),
        "activities_per_resources":get_activities_per_resources(event_log).to_dict(orient="records"),
        "resources_per_activity":get_resources_per_activities(event_log).to_dict(orient="records")
        }
        cleaned_dict = make_json_serializable(dict)
        json_obj = json.dumps(cleaned_dict)
        return json_obj
    else:
        return None

def calculate_result_dict_compliance(event_log: pd.DataFrame) -> str:
    """
    Computes compliance-related metrics from an event log and returns them as a JSON string.
    The result is made JSON-serializable before conversion.
    """
    dict = {
    "activities_per_resources":get_activities_per_resources(event_log).to_dict(orient="records"),
    "resources_per_activity":get_resources_per_activities(event_log).to_dict(orient="records")
    }
    cleaned_dict = make_json_serializable(dict)
    json_obj = json.dumps(cleaned_dict)
    return json_obj