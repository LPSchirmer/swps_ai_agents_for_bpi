import pandas as pd
import numpy as np
import pm4py

# Information that describes the basic structure of a given event log and its underlying process, relevant for all agents
def get_basic_information(event_log: pd.DataFrame) -> dict:
    return {
        "event_log_columns" : list(event_log.columns),
        
        "number_cases" : event_log["case:concept:name"].nunique(),
        
        "variants_frequency" : pm4py.get_variants(event_log),
        "number_variants" : len(pm4py.get_variants(event_log)),

        "number_events" : len(event_log),

        "activities" : list(event_log["concept:name"].unique()),
        "number_activities" : event_log["concept:name"].nunique(),
        "activities_frequency" : event_log["concept:name"].value_counts().to_dict(),
        "start_activities" : pm4py.get_start_activities(event_log),
        "end_activities" : pm4py.get_end_activities(event_log),

        "number_resources" : event_log["org:resource"].nunique(),
        "resources" : list(event_log["org:resource"].unique())
    }

# KPI's for Performance Agent
# Case Durations in hours, works for Datasets with 1 Timestamp Column
def get_case_durations(event_log: pd.DataFrame) -> pd.DataFrame:
    return (event_log.groupby("case:concept:name")["time:timestamp"]
            .agg(lambda x: ((x.max() - x.min()).total_seconds())/3600)
            .reset_index(name="case_duration_hours")
    )

def get_case_duration_mean_var_std(event_log: pd.DataFrame) -> dict:
    case_durations = get_case_durations(event_log)
    return {
        "mean": np.mean(case_durations["case_duration_hours"]).round(2),
        "variance": np.var(case_durations["case_duration_hours"]).round(2), 
        "standard_deviation": np.std(case_durations["case_duration_hours"]).round(2)
    }

# Variant durations in hours (overall & mean) with its respective frequency in event log
def get_variant_durations_frequency(event_log: pd.DataFrame) -> pd.DataFrame:
    variants = get_basic_information(event_log)["variants_frequency"]
    variants_df = pd.DataFrame([
        {"@@variant_column":x, "frequency":y} for x, y in variants.items()
    ])
    variants_path_duration = pm4py.get_variants_paths_duration(event_log)
    variants_duration = variants_path_duration.groupby("@@variant_column").agg(
        total_variant_duration_hours = ("@@flow_time", lambda x: (x.sum()/3600).round(2)),
    ).reset_index()
    variants_durations_frequency = pd.merge(variants_df, variants_duration, on="@@variant_column", how="inner")
    variants_durations_frequency["mean_variant_duration_hours"] = (variants_durations_frequency["total_variant_duration_hours"]/variants_durations_frequency["frequency"]).round(2)
    return variants_durations_frequency

# Activity duratations in hours (overall & mean) with its respective frequency in event log
def get_activity_duration(event_log: pd.DataFrame, end_time: bool = False) -> pd.DataFrame:
    if end_time == True:
        pass # ToDo: Write case if end_time == True
    # Ending activities are not analyzed
    else:
        activities = get_basic_information(event_log)["activities_frequency"]
        activities_df = pd.DataFrame([
        {"concept:name":x, "frequency":y} for x, y in activities.items()
        ])
        activities_durations = (event_log.groupby("case:concept:name")["time:timestamp"]
        .apply(lambda x: (((x.shift(-1)-x).dt.total_seconds())/3600).round(2)) # ToDo: Check if event log needs to be sorted first
        .reset_index())
        activities_durations_frequency = pd.merge(activities_durations, event_log, left_on="level_1", right_on=event_log.index)
        activities_durations_frequency_agg = activities_durations_frequency.groupby("concept:name").agg(
        overall_activity_duration_hours = ("time:timestamp_x", "sum")
        ).reset_index()
        df = pd.merge(activities_df, activities_durations_frequency_agg, on="concept:name", how="inner")
        df["mean_activity_duration_hours"] = (df["overall_activity_duration_hours"]/df["frequency"]).round(2)
        return df

# KPI's for Finance Agent
# Costs per Case, Cost column needs to be of type Integer
def get_costs_per_case(event_log: pd.DataFrame) -> pd.DataFrame:
    return event_log.groupby("case:concept:name")["cost:amount"].sum().reset_index()

# Costs per Variant
def get_costs_per_variant(event_log: pd.DataFrame) -> pd.DataFrame:
    pass

# Costs per Activity
def get_costs_per_activity(event_log: pd.DataFrame) -> pd.DataFrame:
    return (event_log.groupby("concept:name")
                          .agg(total_costs = ("cost:amount", "sum"),
                               mean_costs = ("cost:amount", "mean"))
                               .reset_index())

# KPI's for Risk Agent
def get_rework_stats(event_log: pd.DataFrame) -> dict:
    rework_cases_per_activity = pm4py.get_rework_cases_per_activity(event_log)
    for i in range(get_basic_information(event_log)["number_activities"]):
        if get_basic_information(event_log)["activities"][i] not in rework_cases_per_activity:
            rework_cases_per_activity[get_basic_information(event_log)["activities"][i]] = 0
    return rework_cases_per_activity

# KPI's for Compliance Agent
# All process paths with its corresponding variant
def get_process_paths(event_log: pd.DataFrame) -> pd.DataFrame:
    return pm4py.get_variants_paths_duration(event_log)[["concept:name", "concept:name_2", "@@variant_column"]].reset_index(drop=True)

def get_activities_per_resources(event_log: pd.DataFrame):
    return event_log.groupby("org:resource")["concept:name"].agg(list).reset_index()

def get_resources_per_activities(event_log: pd.DataFrame) -> pd.DataFrame:
    return event_log.groupby("concept:name")["org:resource"].agg(list).reset_index()