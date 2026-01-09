import pandas as pd
import numpy as np
import pm4py

def get_basic_information(event_log: pd.DataFrame) -> dict:

    """Returns a dictionary with basic information about the event log and the underlying process."""

    return {
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

def get_case_durations(event_log: pd.DataFrame) -> pd.DataFrame:

    """Returns a DataFrame with case durations in hours for each case. Works for datasets with one timestamp column."""

    return (event_log.groupby("case:concept:name")["time:timestamp"]
            .agg(lambda x: ((x.max() - x.min()).total_seconds())/3600)
            .reset_index(name="case_duration_hours")
    )

def get_case_duration_statistics(event_log: pd.DataFrame) -> dict:

    """Returns a dictionary with descriptive statistics about case durations in hours."""

    case_durations = get_case_durations(event_log)
    return {
        "min": np.min(case_durations["case_duration_hours"]).round(2),
        "max": np.max(case_durations["case_duration_hours"]).round(2),
        "median": np.median(case_durations["case_duration_hours"]).round(2),
        "mean": np.mean(case_durations["case_duration_hours"]).round(2),
        "variance": np.var(case_durations["case_duration_hours"]).round(2), 
        "standard_deviation": np.std(case_durations["case_duration_hours"]).round(2)
    }

def get_variant_durations_frequency(event_log: pd.DataFrame) -> pd.DataFrame:

    """Returns a DataFrame with variant durations in hours (overall & mean) along with their respective frequency in the event log."""

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
def get_activity_duration(event_log: pd.DataFrame) -> pd.DataFrame:
    if "lifecycle:transition" in event_log.columns:
        event_log.sort_values(["case:concept:name", "concept:name", "time:timestamp"], inplace=True)
        event_log["occurrence"] = (event_log.groupby(["case:concept:name", "concept:name", "lifecycle:transition"]).cumcount())
        start_activities = event_log[event_log["lifecycle:transition"] == "start"]
        end_activities = event_log[event_log["lifecycle:transition"] == "complete"]
        merged_activities = pd.merge(
            start_activities,
            end_activities,
            on=[
                "case:concept:name",
                "concept:name",
                "occurrence"
                ],
                suffixes=("_start", "_end"),
                how="inner"
                )

        merged_activities["duration_seconds"] = (
            (merged_activities["time:timestamp_end"] - merged_activities["time:timestamp_start"]).dt.total_seconds())

        merged_activities = merged_activities[
            [
        "case:concept:name",
        "concept:name",
        "duration_seconds",
        "time:timestamp_start",
        "time:timestamp_end"
        ]
        ]

        result = (merged_activities.groupby("concept:name")["duration_seconds"].sum()/(60*60)).round(2).reset_index(name="overall_activity_duration_hours")
        result["mean_activity_duration_hours"] = (merged_activities.groupby("concept:name")["duration_seconds"].mean()/(60*60)).round(2).values
        return result
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
    
def get_waiting_times(event_log: pd.DataFrame) -> pd.DataFrame:
    pass

def get_costs_per_case(event_log: pd.DataFrame) -> pd.DataFrame:

    """Returns a DataFrame with total costs per case."""

    return event_log.groupby("case:concept:name")["cost:amount"].sum().reset_index()

def get_case_costs_statistics(event_log: pd.DataFrame) -> dict:

    """Returns a dictionary with descriptive statistics about case costs."""

    case_costs = get_costs_per_case(event_log)
    return {
        "min": np.min(case_costs["cost:amount"]).round(2),
        "max": np.max(case_costs["cost:amount"]).round(2),
        "median": np.median(case_costs["cost:amount"]).round(2),
        "mean": np.mean(case_costs["cost:amount"]).round(2),
        "variance": np.var(case_costs["cost:amount"]).round(2), 
        "standard_deviation": np.std(case_costs["cost:amount"]).round(2)
    }


def get_costs_per_variant(event_log: pd.DataFrame) -> pd.DataFrame:
    pass


def get_costs_per_activity(event_log: pd.DataFrame) -> pd.DataFrame:

    """Returns a DataFrame with total and mean costs per activity."""

    return (event_log.groupby("concept:name")
                          .agg(total_costs = ("cost:amount", "sum"),
                               mean_costs = ("cost:amount", "mean"))
                               .reset_index())

def get_rework_stats(event_log: pd.DataFrame) -> dict:
    rework_cases_per_activity = pm4py.get_rework_cases_per_activity(event_log)
    for i in range(get_basic_information(event_log)["number_activities"]):
        if get_basic_information(event_log)["activities"][i] not in rework_cases_per_activity:
            rework_cases_per_activity[get_basic_information(event_log)["activities"][i]] = 0
    return rework_cases_per_activity

def get_activities_per_resources(event_log: pd.DataFrame):
    """Returns a DataFrame with activities per resource."""

    return event_log.groupby("org:resource")["concept:name"].agg(list).reset_index()

def get_resources_per_activities(event_log: pd.DataFrame) -> pd.DataFrame:
    """Returns a DataFrame with resources per activity."""

    return event_log.groupby("concept:name")["org:resource"].agg(list).reset_index()

def make_json_serializable(obj) -> None:
    """Recursively makes an object JSON serializable by converting non-serializable types."""

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