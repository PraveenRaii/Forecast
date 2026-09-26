def normalize_grib_dataset(dataset):
    """Adapter point for cfgrib/xarray datasets; keeps downstream records provider-neutral."""
    return dataset.to_dataframe().reset_index().to_dict("records")
