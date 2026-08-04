import argparse
import os

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
        choices=["water_quality", "tides", "weather", "marine", "sun_times"],
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

    # Every node spawns its own `claude` CLI subprocess, so an uncapped fan-out
    # starves a small node and the CLI misses its 60s initialize handshake.
    config = {
        "max_concurrency": int(os.environ.get("LANGGRAPH_MAX_CONCURRENCY", "2")),
    }

    if args.fetch:
        from langraph.app.graph import build_fetch_graph

        graph = build_fetch_graph(args.fetch)
        result = graph.invoke(state, config)
        print(result.get(args.fetch, ""))
    else:
        from langraph.app.graph import build_graph

        graph = build_graph()
        result = graph.invoke(state, config)
        print(f"Forecast complete for {args.slug}")


if __name__ == "__main__":  # pragma: no cover
    main()
