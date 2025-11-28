from analysis_utils import *
import json
import os
from datetime import datetime

def make_json_serializable(obj) -> None:
    if isinstance(obj, dict):
        new_dict = {}
        for key, value in obj.items():
            # Tuple-Keys zu String konvertieren
            if isinstance(key, tuple):
                key = ",".join(key)
            else:
                key = str(key)
            new_dict[key] = make_json_serializable(value)
        return new_dict
    elif isinstance(obj, (list, tuple)):
        return [make_json_serializable(x) for x in obj]
    elif isinstance(obj, (np.integer, int)):
        return int(obj)
    elif isinstance(obj, (np.floating, float)):
        return float(obj)
    elif isinstance(obj, (np.ndarray,)):
        return obj.tolist()
    else:
        return obj

def calculate_result_dict(event_log: pd.DataFrame) -> dict:
    dict = {
    "event_log_name":None, # Name vom Event Log bzw. Prozess muss hier reingeladen werden
    "event_log_metadata":get_basic_information(event_log),
    "process_paths_with_its_variants":get_process_paths(event_log).to_dict(orient="records"),
    "case_durations":get_case_durations(event_log).to_dict(orient="records"),
    "case_durations_variance_standard_deviation":get_case_duration_var_std(event_log),
    "variants_frequency_total_mean_durations":get_variant_durations_frequency(event_log).to_dict(orient="records"),
    "activities_frequency_total_mean_durations":get_activity_duration(event_log).to_dict(orient="records"),
    "total_costs_per_case":get_costs_per_case(event_log).to_dict(orient="records"),
    "total_mean_costs_per_activity":get_costs_per_activity(event_log).to_dict(orient="records"),
    "rework_cases_per_activity":get_rework_stats(event_log),
    "activities_per_resources":get_activities_per_resources(event_log).to_dict(orient="records"),
    "resources_per_activity":get_resources_per_activities(event_log).to_dict(orient="records")
    }
    cleaned_dict = make_json_serializable(dict)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    with open(os.path.join("kpi_calculations", f"{timestamp}_{dict["event_log_name"]}_kpis"), "w") as outfile:
        json.dump(cleaned_dict, outfile, indent=1)
# Costs per Variant fehlt hier noch