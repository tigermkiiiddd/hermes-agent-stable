#!/usr/bin/env python3
"""Minimal standalone test for MCP server connection."""

import sys
import os
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from tools import mcp_tool

config = {
    "command": sys.executable,
    "args": [str(Path("plugins/demo-mcp-plugin/mcp_server.py").resolve())],
    "timeout": 120,
    "supports_parallel_tool_calls": False,
}

print("Starting MCP server...")
try:
    tools = mcp_tool.register_dynamic_server("test-server", config)
    print("Success! Registered tools:", tools)
    print("Servers:", list(mcp_tool._servers.keys()))
except Exception as e:
    print("Top-level error:", type(e).__name__, e)
    traceback.print_exc()
    # Try to unwrap nested exceptions
    if hasattr(e, '__cause__') and e.__cause__:
        print("\nCaused by:")
        traceback.print_exception(type(e.__cause__), e.__cause__, e.__cause__.__traceback__)
    if hasattr(e, 'exceptions'):
        print("\nNested exceptions:")
        for i, exc in enumerate(e.exceptions):
            print(f"  [{i}] {type(exc).__name__}: {exc}")
            traceback.print_exception(type(exc), exc, exc.__traceback__)
