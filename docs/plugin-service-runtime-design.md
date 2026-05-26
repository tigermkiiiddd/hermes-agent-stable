# Plugin Service Runtime — Design Document

> **Goal:** Enable Hermes plugins to declare and run their own external service processes (MCP servers, HTTP APIs, WebSocket endpoints) alongside the main agent, with lifecycle binding, dynamic port allocation, and unified service discovery.
>
> **Status:** Design ready for review. Implementation split into three phases.

---

## 1. Background & Motivation

### Current State

Hermes plugins today are **in-process only**: a Python `register(ctx)` function injects tools, hooks, and skills directly into the agent runtime via `PluginContext`. This works well for lightweight utilities but has hard limits:

| Limitation | Impact |
|---|---|
| **Language lock-in** | Plugins must be Python. A Node.js MCP server or Rust tool cannot be packaged as a Hermes plugin. |
| **No long-running services** | Plugins cannot host HTTP APIs, WebSocket endpoints, or background workers — anything that blocks or needs its own event loop. |
| **No process isolation** | A buggy plugin crashes the agent. There is no sandbox. |
| **MCP is external-only** | `mcp_servers` in `config.yaml` connects to **externally managed** MCP servers. Plugins cannot declare "I need this MCP server started for me." |
| **No bundled web UI** | A plugin that wants a dashboard must ask the user to manually run a separate server. |

### What Others Do

| Project | Model | Relevant Insight |
|---|---|---|
| **GitNexus** | Single npm package exposes `mcp` (stdio), `serve` (HTTP :4747), and a separate `gitnexus-web` frontend (:4173). | Same codebase, multiple entrypoints. Stdio transport avoids port conflicts entirely. |
| **Claude Code** | Plugin = content bundle (`skills/`, `hooks/`, `.mcp.json`). Hooks spawn external commands. MCP servers are referenced, not hosted. | Plugin does not run code — it configures the agent to spawn external processes. |
| **OpenClaw** | Persistent Gateway + process-tree management. Plugins can be in-process or spawn stdio servers. | Process tree ensures no orphans on shutdown. Docker sandbox for isolation. |
| **Cline** | VS Code extension spawns MCP servers as child processes. Auto-approve whitelist per server. | MCP Host manages multiple 1:1 client-server connections. Marketplace for discovery. |

### Motivation

Hermes needs a **hybrid plugin model**:
- **In-Process Plugin** (existing): Python code injection. Fast, simple, for lightweight tools.
- **External Service Plugin** (new): Plugin declares one or more service processes. Agent spawns them, manages ports, binds lifecycle, and discovers their endpoints.

This lets a plugin provide:
- An **MCP server** (stdio or HTTP) for agent tool discovery
- An **HTTP API/Web UI** for user interaction via browser
- A **WebSocket** for real-time push
- Any combination of the above

---

## 2. Design Goals & Non-Goals

### Goals

1. **Plugin declares services in `plugin.yaml`** — no code required in the agent to configure a new service type.
2. **Agent manages process lifecycle** — spawn on plugin load, SIGTERM/SIGKILL on unload, cascade on agent shutdown.
3. **Dynamic port allocation for HTTP/WebSocket** — agent assigns free ports, plugins receive them via env var or CLI arg. No manual port management.
4. **Unified service discovery** — agent maintains a registry of all running plugin services (URLs, PIDs, health status) accessible to gateway, TUI, and other plugins.
5. **Reuse existing infrastructure** — `MCPServerTask` for MCP connections, `ProcessRegistry` for process tracking, `PluginManager` for load/unload orchestration.
6. **Stdout isolation for stdio MCP** — prevent third-party libraries from corrupting the JSON-RPC transport (as GitNexus does with `installGlobalStdoutSentinel`).

### Non-Goals

1. **Kubernetes / container orchestration** — out of scope. Plugins run as local OS processes.
2. **Reverse proxy / unified URL scheme** — Phase 1 does not proxy plugin HTTP services through an agent-owned endpoint. Each plugin HTTP service binds to its own `localhost:port`.
3. **Cross-machine service discovery** — services are localhost-only in Phase 1.
4. **Plugin-to-plugin direct IPC** — plugins communicate through agent-mediated tool calls, not direct channels.

---

## 3. Architecture

### 3.1 Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         Hermes Agent                                │
│                                                                     │
│  ┌─────────────────┐    ┌──────────────────────────────────────┐   │
│  │ PluginManager   │    │     PluginServiceRegistry            │   │
│  │ (existing)      │◄──►│  ┌────────────────────────────────┐  │   │
│  │                 │    │  │  my-plugin/mcp  → stdio://pid  │  │   │
│  │  load(plugin)   │───►│  │  my-plugin/web  → http://:53421│  │   │
│  │  unload(plugin) │◄───│  │  my-plugin/ws   → ws://:53422  │  │   │
│  │                 │    │  └────────────────────────────────┘  │   │
│  └─────────────────┘    └──────────────────────────────────────┘   │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              PluginServiceManager (new)                     │   │
│  │                                                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │
│  │  │ spawn_mcp() │  │ spawn_http()│  │   spawn_websocket() │  │   │
│  │  │             │  │             │  │                     │  │   │
│  │  │ delegates   │  │ find_free_  │  │   find_free_port()  │  │   │
│  │  │ to          │  │ port()      │  │                     │  │   │
│  │  │ MCPServerTask│  │ subprocess. │  │   subprocess.Popen()│  │   │
│  │  │             │  │ Popen()     │  │                     │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
           │                       │                       │
           │ stdio                 │ http                  │ ws
           ▼                       ▼                       ▼
    ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
    │ MCP Server  │        │ HTTP Server │        │ WS Server   │
    │ (any lang)  │        │ (any lang)  │        │ (any lang)  │
    └─────────────┘        └─────────────┘        └─────────────┘
```

### 3.2 Plugin Modes

A single plugin can be **hybrid**: it can provide in-process tools/hooks via `register()` **and** declare external services. There is no `type` field. Presence of `services` enables external services; presence of `__init__.py` with `register()` enables in-process features.

```yaml
# plugin.yaml — In-Process only (existing)
id: calculator
provides_tools:
  - calculate
provides_hooks:
  - post_tool_call
```

```yaml
# plugin.yaml — External Service only
id: code-visualizer

services:
  - name: mcp
    type: mcp-stdio
    command: ["node", "dist/mcp-server.js"]
    working_dir: "./server"
    env:
      NODE_ENV: production
    restart: on-failure

  - name: web
    type: http
    command: ["node", "dist/web-server.js"]
    # User-configurable port. If omitted, falls back to dynamic allocation.
    port: 8080
    port_env: HERMES_PLUGIN_PORT
    health_check:
      path: /health
      interval: 10
      timeout: 5
    restart: on-failure

  - name: realtime
    type: websocket
    command: ["python", "-m", "visualizer.ws"]
    port_allocation: dynamic
    port_arg: --port
```

```yaml
# plugin.yaml — Hybrid (both in-process + external)
id: enhanced-search
provides_tools:
  - local_search
provides_hooks:
  - pre_tool_call

services:
  - name: graph-mcp
    type: mcp-stdio
    command: ["npx", "-y", "@my-org/graph-mcp"]
    restart: on-failure
```

### 3.3 Component Definitions

| Component | File | Responsibility |
|---|---|---|
| `PluginServiceManager` | `hermes_cli/plugin_services.py` (new) | Spawns, monitors, and stops plugin service processes. Port allocation. Health checks. |
| `PluginServiceRegistry` | `hermes_cli/plugin_services.py` (new) | In-memory registry mapping `(plugin_id, service_name)` → URL/PID/health. Queryable by gateway and TUI. |
| `PluginManifest` | `hermes_cli/plugins.py` (extend) | Add `type`, `services` fields. |
| `PluginManager` | `hermes_cli/plugins.py` (extend) | On load: parse `services`, delegate to `PluginServiceManager`. On unload: cascade stop. |
| `MCPServerTask` | `tools/mcp_tool.py` (extend) | Add `register_dynamic_server()` public API so plugins can inject MCP configs at runtime. |
| `StdoutSentinel` | `tools/mcp_stdout_sentinel.py` (new) | Python equivalent of GitNexus `installGlobalStdoutSentinel()` — intercepts non-MCP stdout writes from child processes. |

---

## 4. Detailed Design

### 4.1 Data Models

```python
# hermes_cli/plugin_services.py

from dataclasses import dataclass, field
from typing import Literal, List, Dict, Optional
from subprocess import Popen


@dataclass
class ServiceDescriptor:
    """Parsed from plugin.yaml services[] entry."""
    name: str
    type: Literal["mcp-stdio", "mcp-http", "http", "websocket"]
    command: List[str]
    working_dir: Optional[str] = None
    env: Dict[str, str] = field(default_factory=dict)
    
    # Port allocation (for http / websocket)
    port: Optional[int] = None                # user-configured preferred port
    port_allocation: Literal["dynamic", "auto"] = "auto"
    port_env: Optional[str] = None            # e.g. "HERMES_PLUGIN_PORT"
    port_arg: Optional[str] = None            # e.g. "--port"
    
    # Lifecycle
    auto_start: bool = True
    restart: Literal["never", "on-failure", "always"] = "on-failure"
    max_restarts: int = 3
    
    # Health check (for http only)
    health_check_path: Optional[str] = None
    health_check_interval: int = 10
    health_check_timeout: int = 5


@dataclass
class ServiceInstance:
    """Runtime state of a spawned service."""
    plugin_id: str
    descriptor: ServiceDescriptor
    process: Optional[Popen] = None
    pid: Optional[int] = None
    url: Optional[str] = None          # e.g. "http://localhost:53421"
    status: Literal["starting", "healthy", "unhealthy", "stopped", "crashed"] = "starting"
    restart_count: int = 0
```

### 4.2 Port Allocation

```python
def find_free_port(start: int = 30000, end: int = 60000) -> int:
    """Bind to port 0 and let OS assign, then return the assigned port."""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]
```

For each HTTP/WebSocket service:
1. If the plugin declares `port: 8080`:
   - **At install time**: Agent checks if port 8080 is free.
   - If occupied → prompt user: *"Port 8080 is in use by plugin-X. Enter a different port for code-visualizer/web (or leave blank for auto):"*
   - User input is persisted to `~/.hermes/plugins/code-visualizer/plugin.local.yaml` (overlay config, git-ignored).
2. If `port` is set and free (or after user override):
   - Use the configured port.
3. If `port` is not set:
   - Agent calls `find_free_port()` for dynamic allocation.
4. If `port_env` is set → inject `PORT={assigned}` into subprocess env.
5. If `port_arg` is set → append `--port {assigned}` to command args.

This gives users explicit control while eliminating conflict surprises.

### 4.3 Lifecycle Binding

```
Agent startup
    │
    ▼
PluginManager.load_all()
    │
    ├── For each external-service plugin:
    │       PluginServiceManager.start_services(plugin_id, services)
    │           ├── spawn each service
    │           ├── wait for health check (http only)
    │           └── register in PluginServiceRegistry
    │
    └── For each in-process plugin:
            import + register()  (existing logic)

Agent shutdown / PluginManager.unload(plugin_id)
    │
    ▼
PluginServiceManager.stop_services(plugin_id)
    ├── SIGTERM each service process (timeout 5s)
    ├── SIGKILL if still alive
    ├── unregister from PluginServiceRegistry
    └── cleanup ports
```

### 4.4 MCP Stdio Isolation

When spawning an `mcp-stdio` service, the agent must ensure the child process's stdout is **exclusively** used for JSON-RPC. Any accidental print from a third-party library corrupts the stream.

**GitNexus solution** (Node.js): Replace `process.stdout.write` with a sentinel that redirects non-MCP writes to stderr.

**Hermes solution** (Python): Prepend a small Python shim to the subprocess command:

```python
# tools/mcp_stdout_sentinel.py
import sys
import os

# This module is prepended to the PYTHONPATH of mcp-stdio child processes.
# It intercepts sys.stdout.write and tags MCP writes vs stray writes.

_original_write = sys.stdout.write
_mcp_mode = os.environ.get("HERMES_MCP_MODE", "0") == "1"

def _safe_write(data):
    if isinstance(data, bytes):
        data = data.decode("utf-8", errors="replace")
    # If the data looks like JSON-RPC, allow it through.
    # Otherwise redirect to stderr with a prefix.
    stripped = data.lstrip()
    if stripped.startswith("{") or stripped.startswith("["):
        _original_write(data)
    else:
        sys.stderr.write(f"[mcp:stdout-redirect] {data}")

if _mcp_mode:
    sys.stdout.write = _safe_write
```

The agent sets `HERMES_MCP_MODE=1` and `PYTHONPATH={sentinel_dir}:$PYTHONPATH` for all `mcp-stdio` child processes.

> **Note:** For non-Python MCP servers (e.g., Node.js `npx -y @modelcontextprotocol/server-filesystem`), the sentinel cannot be injected. In that case we rely on the MCP SDK's stdio transport to handle stray output, or document that such servers should not print to stdout.

### 4.5 Health Checks

For `type: http` services:

```python
async def _health_check_loop(self, instance: ServiceInstance):
    url = f"{instance.url}{instance.descriptor.health_check_path}"
    while instance.process and instance.process.poll() is None:
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                async with session.get(url) as resp:
                    if resp.status == 200:
                        instance.status = "healthy"
                    else:
                        instance.status = "unhealthy"
        except Exception:
            instance.status = "unhealthy"
        await asyncio.sleep(instance.descriptor.health_check_interval)
```

### 4.6 Service Discovery API

```python
class PluginServiceRegistry:
    def get_service_url(self, plugin_id: str, service_name: str = "web") -> Optional[str]:
        """Return the URL of a plugin's service, e.g. http://localhost:53421"""
        
    def list_web_services(self) -> List[Tuple[str, str]]:
        """Return all (plugin_id, url) pairs for type=http services."""
        
    def get_mcp_config(self, plugin_id: str, service_name: str = "mcp") -> Optional[dict]:
        """Return the runtime MCP config for a plugin's MCP service."""
```

Used by:
- **Gateway**: Embed plugin web UI links in Telegram/Discord messages (`/plugins` command).
- **TUI**: `Ctrl+W` to open plugin dashboard in browser.
- **Other plugins**: Query registry to call another plugin's HTTP API.

---

## 5. PluginContext API Extensions

In-process plugins can also interact with the service registry:

```python
class PluginContext:
    # ── Existing APIs ──
    def register_tool(self, name, handler, schema): ...
    def register_hook(self, name, callback): ...
    
    # ── New APIs ──
    def register_service(self, descriptor: ServiceDescriptor) -> str:
        """Declare a service for this plugin. Agent spawns it immediately."""
        
    def get_service_url(self, name: str = "web") -> Optional[str]:
        """Get the URL of one of this plugin's services."""
        
    def list_plugin_services(self) -> List[Tuple[str, str]]:
        """List all services across all plugins: [(plugin_id, url), ...]"""
```

This allows an in-process plugin to **also** spawn an external service, or query other plugins' services.

---

## 6. Configuration Examples

### 6.1 Plugin with MCP + Web UI

```yaml
# ~/.hermes/plugins/code-visualizer/plugin.yaml
id: code-visualizer
name: Code Visualizer
version: 1.0.0
type: external-service

services:
  - name: mcp
    type: mcp-stdio
    command: ["node", "dist/mcp.js"]
    working_dir: "./server"
    restart: on-failure
    
  - name: web
    type: http
    command: ["node", "dist/web.js"]
    working_dir: "./server"
    port_allocation: dynamic
    port_env: PORT
    health_check:
      path: /health
      interval: 10
```

### 6.2 Plugin with WebSocket Only

```yaml
# ~/.hermes/plugins/live-metrics/plugin.yaml
id: live-metrics
type: external-service

services:
  - name: ws
    type: websocket
    command: ["python", "-m", "metrics.ws_server"]
    port_allocation: dynamic
    port_arg: --port
```

### 6.3 In-Process Plugin with External MCP

```python
# ~/.hermes/plugins/enhanced-search/__init__.py

def register(ctx):
    # Register in-process tools
    ctx.register_tool("local_search", handler, schema)
    
    # Also spawn an external MCP server for complex graph queries
    ctx.register_service(ServiceDescriptor(
        name="graph-mcp",
        type="mcp-stdio",
        command=["npx", "-y", "@my-org/graph-mcp"],
        restart="on-failure",
    ))
```

---

## 7. Integration with Existing Systems

### 7.1 PluginManager (`hermes_cli/plugins.py`)

Extend `load()` and `unload()` to support hybrid plugins:

```python
class PluginManager:
    def load(self, plugin_id: str):
        manifest = self._load_manifest(plugin_id)
        
        # In-process features (tools, hooks) — always try if __init__.py exists
        if self._has_register_module(plugin_id):
            self._load_in_process(plugin_id, manifest)
        
        # External services — always try if services declared
        if manifest.services:
            self._service_manager.start_services(plugin_id, manifest.services)
        
        # Skills are independent of execution model
        self._register_plugin_skills(plugin_id, manifest)
    
    def unload(self, plugin_id: str):
        self._service_manager.stop_services(plugin_id)
        self._unload_in_process(plugin_id)
```

A plugin can provide **all four** surfaces simultaneously:
- In-process tools via `register_tool()`
- In-process hooks via `register_hook()`
- External MCP server via `services:`
- External Web UI via `services:`

### 7.2 MCPServerTask (`tools/mcp_tool.py`)

Add runtime registration:

```python
# tools/mcp_tool.py

_registered_servers: Dict[str, MCPServerTask] = {}

def register_dynamic_server(name: str, config: dict) -> MCPServerTask:
    """Register an MCP server at runtime (e.g. from a plugin).
    
    Config format matches mcp_servers entry in config.yaml:
    {
        "command": "node",
        "args": ["dist/mcp.js"],
        "env": {"NODE_ENV": "production"},
        "timeout": 120,
    }
    """
    task = MCPServerTask(name, config)
    _registered_servers[name] = task
    task.start()
    return task
```

### 7.3 ProcessRegistry (`tools/process_registry.py`)

`ProcessRegistry` manages **background terminal tasks** (user-initiated, with output buffering and watch patterns). Plugin services are **not** terminal tasks — they are managed by `PluginServiceManager`.

However, `PluginServiceManager` can reuse `ProcessRegistry`'s subprocess spawning logic for consistency (env sanitization, shell resolution, etc.).

### 7.4 Gateway

Gateway gains access to `PluginServiceRegistry` so it can:
- List plugin web UIs in response to `/plugins`
- Include links in Telegram/Discord messages
- Route webhook callbacks to plugin HTTP services

### 7.5 Shutdown Path

`AIAgent` and `GatewayRunner` already have shutdown hooks. Add:

```python
# On agent shutdown:
plugin_manager.unload_all()  # stops all in-process + external services
```

---

## 8. Implementation Phases

### Phase 1: Foundation — MCP-only External Services (1 week)

**Goal:** Plugins can declare `mcp-stdio` services. Agent spawns them on load, stops on unload.

**Files:**
- `hermes_cli/plugin_services.py` — `PluginServiceManager`, `PluginServiceRegistry`, `ServiceDescriptor`
- `hermes_cli/plugins.py` — extend `PluginManifest`, `PluginManager.load/unload`
- `tools/mcp_tool.py` — add `register_dynamic_server()`

**Tests:**
- Spawn a mock MCP server (Python script that speaks JSON-RPC), verify agent can call `tools/list`.
- Verify process is killed on `PluginManager.unload()`.
- Verify no orphaned processes after agent SIGTERM.

**Deliverable:** External-service plugins with MCP stdio work end-to-end.

### Phase 2: HTTP + WebSocket + Port Allocation (1 week)

**Goal:** Add `http` and `websocket` service types with dynamic port allocation and health checks.

**Files:**
- `hermes_cli/plugin_services.py` — add `find_free_port()`, health check loop, URL registry
- Add `port_env`, `port_arg`, `health_check` to `ServiceDescriptor`

**Tests:**
- Spawn a FastAPI server as a plugin service, verify port allocation and health check.
- Verify two plugins with HTTP services get different ports.
- Verify `PluginServiceRegistry.list_web_services()` returns correct URLs.

**Deliverable:** Plugin can host a Web UI that the user opens in browser.

### Phase 3: Stdout Sentinel + Polish (3 days)

**Goal:** Protect MCP stdio streams from stray stdout. Add gateway/TUI integration.

**Files:**
- `tools/mcp_stdout_sentinel.py` — Python shim
- `gateway/run.py` — `/plugins` slash command lists web services
- `hermes_cli/plugins_cmd.py` — `hermes plugins` shows service URLs

**Tests:**
- MCP child process prints a banner → verify it is redirected to stderr, not breaking JSON-RPC.

**Deliverable:** Production-ready external service plugin system.

---

## 9. Resolved Decisions

| Question | Decision |
|---|---|
| **Port conflicts** | Plugins declare `port:` in `plugin.yaml`. At install time, agent checks availability. If occupied → interactive prompt asks user for alternative. Persist override to `plugin.local.yaml`. Dynamic fallback if no port declared. |
| **In-process + external hybrid** | **Mandatory**. A single plugin can simultaneously provide `register()` (tools/hooks) and `services:` (MCP/HTTP/WS). No `type` field. |
| **WebSocket health checks** | Skip in Phase 2. WS plugins can optionally declare a companion `http` health endpoint. |
| **Service logs** | `~/.hermes/logs/plugin-{plugin_id}-{service}.log`, rotated daily. |

---

## 10. References

- [GitNexus MCP + HTTP Architecture](https://github.com/abhigyanpatwari/GitNexus) — Same codebase, multiple entrypoints (`mcp`, `serve`, `web`).
- [Claude Code Plugin Docs](https://code.claude.com/docs/en/plugins) — Content-bundle model with `.mcp.json` and `hooks.json`.
- [OpenClaw MCP Integration](https://docs.openclaw.ai/cli/mcp) — Process-tree management and WebSocket bridging.
- [MCP Specification](https://modelcontextprotocol.io) — stdio and StreamableHTTP transports.
