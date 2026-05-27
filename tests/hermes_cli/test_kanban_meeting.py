"""Tests for async Kanban meetings (issue_type=meeting)."""

from pathlib import Path

import pytest

from hermes_cli import kanban_db as kb
from hermes_cli import kanban_meeting as km


@pytest.fixture
def kanban_home(tmp_path, monkeypatch):
    home = tmp_path / ".hermes"
    home.mkdir()
    monkeypatch.setenv("HERMES_HOME", str(home))
    monkeypatch.setattr(Path, "home", lambda: tmp_path)
    kb.init_db()
    return home


def test_create_join_speak_advance_close(kanban_home):
    with kb.connect() as conn:
        created = km.create_meeting(
            conn,
            title="Brainstorm pitch",
            agenda="Pick a novel genre for Q3.",
            moderator="mod",
            participants=["worker-a", "worker-b"],
        )
        mid = created.meeting_id
        task = kb.get_task(conn, mid)
        assert task is not None
        assert task.issue_type == "meeting"
        assert task.workflow_template_id == km.MEETING_TEMPLATE_ID
        assert task.current_step_key == "collecting"
        assert task.assignee == "mod"

        km.join_meeting(conn, mid, "worker-a")
        spoke = km.speak_in_meeting(
            conn,
            mid,
            author="worker-a",
            kind="proposal",
            body="东方克苏鲁",
        )
        assert spoke["utterance_id"] > 0

        km.advance_meeting_step(
            conn, mid, moderator="mod", next_step="deliberating",
        )
        km.speak_in_meeting(
            conn,
            mid,
            author="worker-b",
            kind="objection",
            body="末世科幻与首选不一致",
        )

        closed = km.close_meeting(
            conn,
            mid,
            moderator="mod",
            decision="采用东方克苏鲁；worker-b 反对已记录",
        )
        assert closed["status"] == "done"

        ctx = km.get_meeting_context(conn, mid)
        assert len(ctx["utterances"]) == 2
        assert kb.get_task(conn, mid).status == "done"


def test_observer_cannot_speak(kanban_home):
    with kb.connect() as conn:
        created = km.create_meeting(
            conn,
            title="Observe",
            agenda="Watch only",
            moderator="mod",
            observers=["watcher"],
        )
        mid = created.meeting_id
        km.join_meeting(conn, mid, "watcher")
        try:
            km.speak_in_meeting(
                conn,
                mid,
                author="watcher",
                kind="note",
                body="should fail",
            )
            raised = False
        except ValueError:
            raised = True
        assert raised


def test_meeting_tools_registered():
    import tools.kanban_meeting_tools  # noqa: F401
    from tools.registry import registry

    names = {
        "meeting_create",
        "meeting_join",
        "meeting_invite",
        "meeting_speak",
        "meeting_show",
        "meeting_advance",
        "meeting_close",
    }
    registered = set(registry.get_all_tool_names())
    assert names <= registered
