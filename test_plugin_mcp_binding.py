#!/usr/bin/env python3
"""End-to-end validation: plugin-declared MCP server auto-start/stop."""

import os
import sys
import tempfile
from pathlib import Path

# Ensure repo root is on path
sys.path.insert(0, str(Path(__file__).resolve().parent))


def main():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmppath = Path(tmpdir)
        hermes_home = tmppath / "hermes_home"
        plugins_dir = hermes_home / "plugins"
        plugins_dir.mkdir(parents=True)

        # Set HERMES_HOME BEFORE importing any hermes modules
        os.environ["HERMES_HOME"] = str(hermes_home)

        # Copy demo plugin into temp plugins dir
        demo_src = Path(__file__).resolve().parent / "plugins" / "demo-mcp-plugin"
        demo_dst = plugins_dir / "demo-mcp-plugin"
        import shutil
        shutil.copytree(demo_src, demo_dst)

        # Write config enabling the plugin
        import yaml
        cfg_path = hermes_home / "config.yaml"
        cfg_path.write_text(yaml.dump({"plugins": {"enabled": ["demo-mcp-plugin"]}}))

        from hermes_cli.plugins import PluginManager
        from tools import mcp_tool

        mgr = PluginManager()
        mgr.discover_and_load()

        plugin = mgr._plugins.get("demo-mcp-plugin")
        assert plugin is not None, "Plugin not discovered"
        assert plugin.enabled, "Plugin not enabled"
        assert len(plugin.mcp_servers_registered) == 1, f"Expected 1 MCP server, got {len(plugin.mcp_servers_registered)}"
        server_name = plugin.mcp_servers_registered[0]
        assert server_name == "demo-mcp-plugin/demo-server", f"Unexpected server name: {server_name}"

        # Check that the server was registered in mcp_tool
        with mcp_tool._lock:
            assert server_name in mcp_tool._servers, f"Server '{server_name}' not in mcp_tool._servers"

        print(f"✅ Plugin loaded, MCP server '{server_name}' started")

        # Unload the plugin
        mgr.unload_plugin("demo-mcp-plugin")

        # Check that the server was removed
        with mcp_tool._lock:
            assert server_name not in mcp_tool._servers, f"Server '{server_name}' still in mcp_tool._servers after unload"

        print(f"✅ Plugin unloaded, MCP server '{server_name}' stopped")
        print("\nAll checks passed.")


if __name__ == "__main__":
    main()
