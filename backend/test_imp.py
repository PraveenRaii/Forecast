import os
import sys
import time

print("STARTING TEST_IMP", flush=True)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
t0 = time.time()
print("Importing router...", flush=True)
from app.api.routes.router import health
print("IMPORTED ROUTER IN", round(time.time() - t0, 3), "s", flush=True)
