def normalize_record(record: dict) -> dict:
    """Normalize provider names and basic meteorological units at the ingestion boundary."""
    aliases = {"temperature_2m": ["t2m", "TMP_2maboveground"], "relative_humidity": ["rh2m", "RH_2maboveground"], "pressure_msl": ["prmsl", "PRMSL_meansealevel"], "rainfall": ["apcp", "APCP_surface"]}
    normalized = dict(record)
    for canonical, names in aliases.items():
        for name in names:
            if name in record and canonical not in normalized:
                normalized[canonical] = record[name]
    return normalized
