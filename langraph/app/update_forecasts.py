import argparse
import os
import sys

from dotenv import load_dotenv


def main():
    load_dotenv()

    # LangSmith tracing
    os.environ.setdefault("LANGSMITH_TRACING", "true")

    parser = argparse.ArgumentParser(description="Update forecasts using LangGraph")
    parser.add_argument("--lat", required=True, help="Latitude")
    parser.add_argument("--lng", required=True, help="Longitude")
    parser.add_argument("--date", required=True, help="ISO date (e.g. 2026-03-23)")
    parser.add_argument("--timezone", required=True, help="IANA timezone")
    parser.add_argument("--slug", required=True, help="Location slug")
    parser.add_argument(
        "--fetch",
        choices=["water_quality", "tides", "swell", "weather", "sea_temp", "sun_times"],
        help="Run a single fetch node for testing",
    )
    args = parser.parse_args()

    state = {
        "latitude": args.lat,
        "longitude": args.lng,
        "date": args.date,
        "timezone": args.timezone,
        "location_slug": args.slug,
    }

    if args.fetch:
        from langraph.app.graph import build_fetch_graph

        graph = build_fetch_graph(args.fetch)
        result = graph.invoke(state)
        print(result.get(args.fetch, ""))
    else:
        from langraph.app.graph import build_graph

        graph = build_graph()
        result = graph.invoke(state)
        print(f"Forecast complete for {args.slug}")


if __name__ == "__main__":  # pragma: no cover
    main()
