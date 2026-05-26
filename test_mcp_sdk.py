#!/usr/bin/env python3
"""Test MCP SDK stdio_client + ClientSession directly."""

import asyncio
import sys
from pathlib import Path
from mcp.client.stdio import stdio_client, StdioServerParameters
from mcp import ClientSession

async def main():
    # Use absolute path to avoid CWD issues
    server_path = Path(__file__).resolve().parent / "plugins" / "demo-mcp-plugin" / "mcp_server.py"
    params = StdioServerParameters(
        command=sys.executable,
        args=[str(server_path)],
    )
    print("Server path:", server_path)
    print("Connecting...")
    try:
        async with stdio_client(params) as (read_stream, write_stream):
            print("Connected! Starting session...")
            async with ClientSession(read_stream, write_stream) as session:
                print("Session created, initializing...")
                result = await session.initialize()
                print("Initialized! result:", result)
                tools = await session.list_tools()
                print("Tools:", tools)
    except Exception as e:
        print("Error:", type(e).__name__, e)
        import traceback
        traceback.print_exc()
        if hasattr(e, 'exceptions'):
            for i, exc in enumerate(e.exceptions):
                print(f"  Nested [{i}]:", type(exc).__name__, exc)
                traceback.print_exception(type(exc), exc, exc.__traceback__)

if __name__ == "__main__":
    asyncio.run(main())
