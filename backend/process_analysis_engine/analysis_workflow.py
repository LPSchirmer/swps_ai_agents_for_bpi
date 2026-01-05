from analysis_utils import *
import json

def calculate_result_dict_basic(event_log: pd.DataFrame) -> str:
    dict = get_basic_information(event_log)
    cleaned_dict = make_json_serializable(dict)
    json_obj = json.dumps(cleaned_dict)
    return json_obj

def calculate_result_dict_performance(event_log: pd.DataFrame) -> str:
    dict = {
    "process_paths_with_its_variants":get_process_paths(event_log).to_dict(orient="records"),
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
    # Costs per Variant fehlt hier noch
    dict = {
    "process_paths_with_its_variants":get_process_paths(event_log).to_dict(orient="records"),
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

def calculate_result_dict_compliance(event_log: pd.DataFrame) -> str:
    dict = {
    "process_paths_with_its_variants":get_process_paths(event_log).to_dict(orient="records"),
    "activities_per_resources":get_activities_per_resources(event_log).to_dict(orient="records"),
    "resources_per_activity":get_resources_per_activities(event_log).to_dict(orient="records")
    }
    cleaned_dict = make_json_serializable(dict)
    json_obj = json.dumps(cleaned_dict)
    return json_obj