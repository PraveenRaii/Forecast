"""Reference-data adapter boundary for ERA5 or observation integrations."""
class ERA5ReferenceProvider:
    async def get_reference(self, latitude: float, longitude: float, valid_time: str):
        raise NotImplementedError("Configure a Copernicus/ERA5 client before using live reference data")
