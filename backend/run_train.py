import asyncio
import os
import sys
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Importing train_models...", flush=True)
    from app.ml.train import train_models
    print("Imported OK. Calling train_models()...", flush=True)
    asyncio.run(train_models())
    print("SUCCESS: train_models finished!", flush=True)
except Exception as e:
    print("ERROR CAUGHT IN RUN_TRAIN:", e, flush=True)
    traceback.print_exc()
