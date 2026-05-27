"""Kanban Meeting tools — async deliberation for orchestrators and participants."""

from __future__ import annotations

import json
import os
from typing import Any, Optional

from tools.registry import registry, tool_error


def _check_meeting_tools() -> bool:
    """Available when the kanban toolset is enabled or a kanban worker is active."""
    if os.environ.get("HERMES_KANBAN_TASK"):
        return True
    try:
        from hermes_cli.config import load_config

        toolsets = load_config().get("toolsets", [])
        return "kanban" in toolsets
    except Exception:
        return False


def _active_profile() -> str:
    from hermes_cli.profiles import get_active_profile_name

    return get_active_profile_name() or "default"


def _connect(board: Optional[str] = None):
    from hermes_cli import kanban_db as kb

    return kb, kb.connect(board=board)


def _ok(**fields: Any) -> str:
    return json.dumps({"ok": True, **fields})


def _handle_create(args: dict, **kw: Any) -> str:
    from hermes_cli import kanban_meeting as km

    title = (args.get("title") or "").strip()
    agenda = (args.get("agenda") or "").strip()
    moderator = (args.get("moderator") or _active_profile()).strip()
    participants = args.get("participants") or []
    if isinstance(participants, str):
        participants = [p.strip() for p in participants.split(",") if p.strip()]
    observers = args.get("observers") or []
    if isinstance(observers, str):
        observers = [p.strip() for p in observers.split(",") if p.strip()]

    kb, conn = _connect(args.get("board"))
    try:
        created = km.create_meeting(
            conn,
            title=title,
            agenda=agenda,
            moderator=moderator,
            participants=participants,
            observers=observers,
            created_by=_active_profile(),
            tenant=args.get("tenant"),
            idempotency_key=args.get("idempotency_key"),
        )
        return _ok(**created.as_dict())
    except ValueError as exc:
        return tool_error(str(exc))
    finally:
        conn.close()


def _handle_join(args: dict, **kw: Any) -> str:
    from hermes_cli import kanban_meeting as km

    meeting_id = (args.get("meeting_id") or "").strip()
    profile = (args.get("profile") or _active_profile()).strip()
    kb, conn = _connect(args.get("board"))
    try:
        result = km.join_meeting(conn, meeting_id, profile)
        return _ok(**result)
    except ValueError as exc:
        return tool_error(str(exc))
    finally:
        conn.close()


def _handle_invite(args: dict, **kw: Any) -> str:
    from hermes_cli import kanban_meeting as km

    meeting_id = (args.get("meeting_id") or "").strip()
    profile = (args.get("profile") or "").strip()
    role = (args.get("role") or km.ROLE_PARTICIPANT).strip()
    kb, conn = _connect(args.get("board"))
    try:
        result = km.invite_participant(
            conn,
            meeting_id,
            profile=profile,
            role=role,
            invited_by=_active_profile(),
        )
        return _ok(**result)
    except ValueError as exc:
        return tool_error(str(exc))
    finally:
        conn.close()


def _handle_speak(args: dict, **kw: Any) -> str:
    from hermes_cli import kanban_meeting as km

    meeting_id = (args.get("meeting_id") or "").strip()
    kind = (args.get("kind") or "note").strip()
    body = (args.get("body") or "").strip()
    author = (args.get("author") or _active_profile()).strip()
    round_no = int(args.get("round") or 0)
    metadata = args.get("metadata")
    if isinstance(metadata, str) and metadata.strip():
        try:
            metadata = json.loads(metadata)
        except json.JSONDecodeError:
            return tool_error("metadata must be valid JSON")
    kb, conn = _connect(args.get("board"))
    try:
        result = km.speak_in_meeting(
            conn,
            meeting_id,
            author=author,
            kind=kind,
            body=body,
            round=round_no,
            metadata=metadata if isinstance(metadata, dict) else None,
        )
        return _ok(**result)
    except ValueError as exc:
        return tool_error(str(exc))
    finally:
        conn.close()


def _handle_show(args: dict, **kw: Any) -> str:
    from hermes_cli import kanban_meeting as km

    meeting_id = (args.get("meeting_id") or "").strip()
    as_transcript = bool(args.get("transcript", True))
    kb, conn = _connect(args.get("board"))
    try:
        ctx = km.get_meeting_context(conn, meeting_id)
        if as_transcript:
            return km.format_meeting_transcript(ctx)
        return json.dumps({"ok": True, **ctx}, ensure_ascii=False, indent=2)
    except ValueError as exc:
        return tool_error(str(exc))
    finally:
        conn.close()


def _handle_advance(args: dict, **kw: Any) -> str:
    from hermes_cli import kanban_meeting as km

    meeting_id = (args.get("meeting_id") or "").strip()
    next_step = (args.get("step") or "").strip()
    kb, conn = _connect(args.get("board"))
    try:
        result = km.advance_meeting_step(
            conn,
            meeting_id,
            moderator=_active_profile(),
            next_step=next_step,
        )
        return _ok(**result)
    except ValueError as exc:
        return tool_error(str(exc))
    finally:
        conn.close()


def _handle_close(args: dict, **kw: Any) -> str:
    from hermes_cli import kanban_meeting as km

    meeting_id = (args.get("meeting_id") or "").strip()
    decision = (args.get("decision") or "").strip()
    metadata = args.get("metadata")
    if isinstance(metadata, str) and metadata.strip():
        try:
            metadata = json.loads(metadata)
        except json.JSONDecodeError:
            return tool_error("metadata must be valid JSON")
    kb, conn = _connect(args.get("board"))
    try:
        result = km.close_meeting(
            conn,
            meeting_id,
            moderator=_active_profile(),
            decision=decision,
            metadata=metadata if isinstance(metadata, dict) else None,
        )
        return _ok(**result)
    except ValueError as exc:
        return tool_error(str(exc))
    finally:
        conn.close()


_BOARD_PROP = {
    "type": "string",
    "description": "Optional kanban board slug (default: active board).",
}


MEETING_CREATE_SCHEMA = {
    "name": "meeting_create",
    "description": (
        "Create an async Kanban meeting: a durable issue where a moderator "
        "and participant profiles deliberate via meeting_speak before a "
        "decision is recorded. Not a real-time call — each agent joins and "
        "speaks from its own session."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "Meeting title."},
            "agenda": {"type": "string", "description": "Agenda / question to resolve."},
            "moderator": {
                "type": "string",
                "description": "Host profile (defaults to active profile).",
            },
            "participants": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Worker profiles invited to speak.",
            },
            "observers": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Read-only profiles.",
            },
            "tenant": {"type": "string"},
            "idempotency_key": {"type": "string"},
            "board": _BOARD_PROP,
        },
        "required": ["title", "agenda"],
    },
}

MEETING_JOIN_SCHEMA = {
    "name": "meeting_join",
    "description": "Join a meeting roster as an active participant (call before speaking).",
    "parameters": {
        "type": "object",
        "properties": {
            "meeting_id": {"type": "string"},
            "profile": {"type": "string", "description": "Defaults to active profile."},
            "board": _BOARD_PROP,
        },
        "required": ["meeting_id"],
    },
}

MEETING_INVITE_SCHEMA = {
    "name": "meeting_invite",
    "description": "Moderator adds a profile to the meeting roster.",
    "parameters": {
        "type": "object",
        "properties": {
            "meeting_id": {"type": "string"},
            "profile": {"type": "string"},
            "role": {
                "type": "string",
                "enum": ["participant", "observer", "moderator"],
            },
            "board": _BOARD_PROP,
        },
        "required": ["meeting_id", "profile"],
    },
}

MEETING_SPEAK_SCHEMA = {
    "name": "meeting_speak",
    "description": (
        "Post one utterance to a meeting (proposal, objection, amendment, vote, "
        "note, chair, summary). Requires roster membership."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "meeting_id": {"type": "string"},
            "kind": {
                "type": "string",
                "enum": sorted(
                    {
                        "proposal",
                        "objection",
                        "amendment",
                        "vote",
                        "note",
                        "chair",
                        "summary",
                    }
                ),
            },
            "body": {"type": "string"},
            "round": {"type": "integer", "description": "Deliberation round (default 0)."},
            "metadata": {"type": "object"},
            "author": {"type": "string"},
            "board": _BOARD_PROP,
        },
        "required": ["meeting_id", "body"],
    },
}

MEETING_SHOW_SCHEMA = {
    "name": "meeting_show",
    "description": "Show meeting roster, phase, and full transcript.",
    "parameters": {
        "type": "object",
        "properties": {
            "meeting_id": {"type": "string"},
            "transcript": {
                "type": "boolean",
                "description": "If true (default), return markdown transcript.",
            },
            "board": _BOARD_PROP,
        },
        "required": ["meeting_id"],
    },
}

MEETING_ADVANCE_SCHEMA = {
    "name": "meeting_advance",
    "description": (
        "Moderator advances meeting phase: collecting → deliberating → "
        "voting → decided."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "meeting_id": {"type": "string"},
            "step": {
                "type": "string",
                "enum": ["collecting", "deliberating", "voting", "decided"],
            },
            "board": _BOARD_PROP,
        },
        "required": ["meeting_id", "step"],
    },
}

MEETING_CLOSE_SCHEMA = {
    "name": "meeting_close",
    "description": "Moderator closes the meeting with a final decision (marks task done).",
    "parameters": {
        "type": "object",
        "properties": {
            "meeting_id": {"type": "string"},
            "decision": {"type": "string", "description": "Final resolution text."},
            "metadata": {"type": "object"},
            "board": _BOARD_PROP,
        },
        "required": ["meeting_id", "decision"],
    },
}


for _name, _schema, _handler in (
    ("meeting_create", MEETING_CREATE_SCHEMA, _handle_create),
    ("meeting_join", MEETING_JOIN_SCHEMA, _handle_join),
    ("meeting_invite", MEETING_INVITE_SCHEMA, _handle_invite),
    ("meeting_speak", MEETING_SPEAK_SCHEMA, _handle_speak),
    ("meeting_show", MEETING_SHOW_SCHEMA, _handle_show),
    ("meeting_advance", MEETING_ADVANCE_SCHEMA, _handle_advance),
    ("meeting_close", MEETING_CLOSE_SCHEMA, _handle_close),
):
    registry.register(
        name=_name,
        toolset="kanban",
        schema=_schema,
        handler=_handler,
        check_fn=_check_meeting_tools,
        emoji="🗣",
    )
