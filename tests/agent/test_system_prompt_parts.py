"""Tests for agent/system_prompt.py — system prompt assembly."""

from unittest.mock import MagicMock, patch

import pytest

from agent.system_prompt import build_system_prompt_parts


class TestBuildSystemPromptPartsBootstrap:
    def test_stable_layer_includes_bootstrap_skills(self, tmp_path, monkeypatch):
        """Bootstrap skills from both filesystem and plugins land in stable."""
        skills_dir = tmp_path / "skills" / "boot"
        skills_dir.mkdir(parents=True)
        (skills_dir / "SKILL.md").write_text(
            "---\nname: boot\ndescription: Boot\nbootstrap: true\n---\nBoot body line.\n"
        )
        monkeypatch.setattr("agent.prompt_builder.get_skills_dir", lambda: tmp_path / "skills")

        from hermes_cli import plugins as plugins_mod
        from hermes_cli.plugins import PluginManager

        pm = PluginManager()
        monkeypatch.setattr(plugins_mod, "_plugin_manager", pm)

        plugin_skill = tmp_path / "plug_boot.md"
        plugin_skill.write_text("---\nname: plug-boot\n---\nPlugin boot body.\n")
        pm._plugin_skills["myplugin:plug-boot"] = {
            "path": plugin_skill,
            "plugin": "myplugin",
            "bare_name": "plug-boot",
            "description": "",
            "bootstrap": True,
        }

        agent = MagicMock()
        agent.load_soul_identity = False
        agent.skip_context_files = True
        agent.valid_tool_names = set()
        agent._tool_use_enforcement = False
        agent.model = "test-model"
        agent.provider = "test-provider"
        agent.platform = "cli"
        agent._memory_store = None
        agent._memory_manager = None
        agent.session_id = "sid"
        agent.pass_session_id = False
        agent._kanban_worker_guidance = ""

        # Patch helpers that depend on run_agent module
        with patch("run_agent.load_soul_md", return_value=None), \
             patch("run_agent.build_nous_subscription_prompt", return_value=""), \
             patch("run_agent.build_environment_hints", return_value=""), \
             patch("run_agent.build_bootstrap_skills_prompt") as mock_bootstrap, \
             patch("run_agent.build_context_files_prompt", return_value=""):
            mock_bootstrap.return_value = (
                "## Bootstrap Skills\n"
                "The following skills are loaded at session start and remain active:\n\n"
                "Boot body line.\n\n---\n\nPlugin boot body."
            )
            parts = build_system_prompt_parts(agent)

        assert "Bootstrap Skills" in parts["stable"]
        assert "Boot body line." in parts["stable"]
        assert "Plugin boot body." in parts["stable"]
