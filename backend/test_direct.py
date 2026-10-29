print("TOP OF TEST_DIRECT", flush=True)
import os
import sys
import time
import asyncio
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
t0 = time.time()
print("Importing router...", flush=True)
from app.api.routes.router import health, summary, regions, confidence_map, explanation, search
print(f"Router imported in {round(time.time() - t0, 2)}s", flush=True)

async def main():
    try:
        print("Executing health()...", flush=True)
        h = await health()
        print("1. Health ->", h["service"], "| Status:", h["status"], flush=True)
        
        print("Executing summary()...", flush=True)
        s = await summary(1)
        print("2. Summary -> Overall Confidence:", s["overall_confidence"], "% | High-Risk Regions:", s["high_risk_regions"], flush=True)
        
        print("Executing confidence_map()...", flush=True)
        m = await confidence_map(3)
        print("3. Confidence Map (Day 3) ->", m["total_points"], "points rendered", flush=True)
        
        print("Executing regions()...", flush=True)
        r = await regions()
        print("4. Regions ->", r["count"], "subdivisions in database", flush=True)
        
        print("Executing explanation()...", flush=True)
        exp = await explanation("delhi-ncr", 3)
        print("5. Explanation (Delhi NCR, Day 3) -> Confidence:", exp["confidence"], "% | Factors:", len(exp["top_factors"]), flush=True)
        
        print("Executing search()...", flush=True)
        srch = await search("mumbai")
        print("6. Global Search ('mumbai') ->", [m["name"] for m in srch["results"]], flush=True)
        print("\nALL ROUTER SERVICES VERIFIED & OPERATIONAL!", flush=True)
    except Exception as exc:
        print("EXCEPTION INSIDE MAIN:", exc, flush=True)
        traceback.print_exc()

if __name__ == "__main__":
    print("ABOUT TO CALL MAIN DIRECTLY...", flush=True)
    try:
        coro = main()
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(coro)
        loop.close()
        print("FINISHED ALL SUCCESSFULLY!", flush=True)
    except Exception as e:
        print("EXCEPTION IN RUNNER:", e, flush=True)
        traceback.print_exc()
