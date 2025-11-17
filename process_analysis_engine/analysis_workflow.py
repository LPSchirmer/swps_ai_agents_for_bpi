from analysis_utils import *
import json

event_log=None # Event Log muss hier reingeladen werden

result_dict = {
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
# Costs per Variant fehlt hier noch