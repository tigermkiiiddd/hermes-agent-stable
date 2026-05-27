"""Kanban Meeting — async multi-agent deliberation as a first-class issue type.

Meetings are Kanban tasks with ``issue_type='meeting'`` and
``workflow_template_id='meeting/v1'``. Participants (workers) and a moderator
(host) join via explicit roster rows; speech is stored in
``meeting_utterances`` and mirrored to ``task_comments`` for the dashboard.

This is intentionally **async**: each profile participates by calling
``meeting_join`` / ``meeting_speak`` from its own Hermes session (or when
spawned as the moderator assignee). No WebSocket room is required.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from typing import Any, Iterable, Optional

from hermes_cli import kanban_db as kb
from hermes_cli.profiles import normalize_profile_name

MEETING_TEMPLATE_ID = "meeting/v1"
ISSUE_TYPE_MEETING = "meeting"

MEETING_STEPS = ("collecting", "deliberating", "voting", "decided")
STEP_TRANSITIONS: dict[str, tuple[str, ...]] = {
    "collecting": ("deliberating",),
    "deliberating": ("voting", "decided"),
    "voting": ("decided",),
    "decided": (),
}

VALID_UTTERANCE_KINDS = frozenset({
    "proposal",
    "objection",
    "amendment",
    "vote",
    "note",
    "chair",
    "summary",
})

ROLE_MODERATOR = "moderator"
ROLE_PARTICIPANT = "participant"
ROLE_OBSERVER = "observer"

UTTERANCE_COMMENT_PREFIX = "[meeting:utterance] "


@dataclass(frozen=True)
class MeetingParticipant:
    profile: str
    role: str
    status: str
    joined_at: Optional[int]


@dataclass(frozen=True)
class MeetingUtterance:
    id: int
    author: str
    kind: str
    body: str
    round: int
    metadata: Optional[dict[str, Any]]
    created_at: int


@dataclass
class MeetingCreated:
    meeting_id: str
    moderator: str
    participants: list[str]

    def as_dict(self) -> dict[str, Any]:
        return {
            "meeting_id": self.meeting_id,
            "moderator": self.moderator,
            "participants": list(self.participants),
        }


def _require_text(value: str, field_name: str) -> str:
    text = (value or "").strip()
    if not text:
        raise ValueError(f"{field_name} is required")
    return text


def _canonical_profile(value: str) -> str:
    return normalize_profile_name(_require_text(value, "profile"))


def _get_task(conn, task_id: str) -> kb.Task:
    task = kb.get_task(conn, task_id)
    if task is None:
        raise ValueError(f"unknown task {task_id}")
    return task


def _ensure_meeting_task(conn, task_id: str) -> kb.Task:
    task = _get_task(conn, task_id)
    if getattr(task, "issue_type", "work") != ISSUE_TYPE_MEETING:
        raise ValueError(f"task {task_id} is not a meeting (issue_type={task.issue_type!r})")
    return task


def _stamp_meeting_row(
    conn,
    task_id: str,
    *,
    moderator: str,
    step: str = "collecting",
) -> None:
    """Must run inside ``write_txn`` (caller provides the transaction)."""
    conn.execute(
        """
        UPDATE tasks
        SET issue_type = ?, workflow_template_id = ?, current_step_key = ?,
            assignee = ?, status = 'running'
        WHERE id = ?
        """,
        (ISSUE_TYPE_MEETING, MEETING_TEMPLATE_ID, step, moderator, task_id),
    )


def _upsert_participant(
    conn,
    task_id: str,
    profile: str,
    *,
    role: str,
    status: str = "invited",
    joined_at: Optional[int] = None,
) -> None:
    conn.execute(
        """
        INSERT INTO meeting_participants (task_id, profile, role, status, joined_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(task_id, profile) DO UPDATE SET
            role = excluded.role,
            status = excluded.status,
            joined_at = COALESCE(excluded.joined_at, meeting_participants.joined_at)
        """,
        (task_id, profile, role, status, joined_at),
    )


def list_participants(conn, task_id: str) -> list[MeetingParticipant]:
    rows = conn.execute(
        "SELECT profile, role, status, joined_at FROM meeting_participants "
        "WHERE task_id = ? ORDER BY role DESC, profile ASC",
        (task_id,),
    ).fetchall()
    return [
        MeetingParticipant(
            profile=r["profile"],
            role=r["role"],
            status=r["status"],
            joined_at=r["joined_at"],
        )
        for r in rows
    ]


def _participant_row(conn, task_id: str, profile: str):
    return conn.execute(
        "SELECT profile, role, status, joined_at FROM meeting_participants "
        "WHERE task_id = ? AND profile = ?",
        (task_id, profile),
    ).fetchone()


def list_utterances(conn, task_id: str) -> list[MeetingUtterance]:
    rows = conn.execute(
        "SELECT id, author, kind, body, round, metadata, created_at "
        "FROM meeting_utterances WHERE task_id = ? ORDER BY created_at ASC, id ASC",
        (task_id,),
    ).fetchall()
    out: list[MeetingUtterance] = []
    for r in rows:
        meta = None
        if r["metadata"]:
            try:
                parsed = json.loads(r["metadata"])
                if isinstance(parsed, dict):
                    meta = parsed
            except json.JSONDecodeError:
                meta = None
        out.append(
            MeetingUtterance(
                id=int(r["id"]),
                author=r["author"],
                kind=r["kind"],
                body=r["body"],
                round=int(r["round"] or 0),
                metadata=meta,
                created_at=int(r["created_at"]),
            )
        )
    return out


def create_meeting(
    conn,
    *,
    title: str,
    agenda: str,
    moderator: str,
    participants: Iterable[str] = (),
    observers: Iterable[str] = (),
    created_by: Optional[str] = None,
    tenant: Optional[str] = None,
    priority: int = 0,
    idempotency_key: Optional[str] = None,
) -> MeetingCreated:
    """Create a meeting task and seed the participant roster."""
    title = _require_text(title, "title")
    agenda = _require_text(agenda, "agenda")
    moderator = _canonical_profile(moderator)
    created_by = _canonical_profile(created_by or moderator)

    participant_profiles = [_canonical_profile(p) for p in participants if p]
    observer_profiles = [_canonical_profile(p) for p in observers if p]

    body = (
        "Kanban Meeting (async deliberation).\n\n"
        "## Agenda\n"
        f"{agenda}\n\n"
        "## Protocol\n"
        "- Moderator advances phases: collecting → deliberating → voting → decided.\n"
        "- Participants use meeting_join then meeting_speak (proposal, objection, "
        "amendment, vote, note).\n"
        "- Utterances are persisted on this card; read meeting_show for the transcript.\n"
    )

    meeting_id = kb.create_task(
        conn,
        title=title,
        body=body,
        assignee=moderator,
        created_by=created_by,
        tenant=tenant,
        priority=priority,
        idempotency_key=idempotency_key,
        initial_status="running",
        skills=["kanban-meeting", "kanban-worker"],
    )

    with kb.write_txn(conn):
        _stamp_meeting_row(conn, meeting_id, moderator=moderator, step="collecting")
        _upsert_participant(
            conn, meeting_id, moderator, role=ROLE_MODERATOR, status="active",
            joined_at=int(time.time()),
        )
        for profile in participant_profiles:
            if profile == moderator:
                continue
            _upsert_participant(conn, meeting_id, profile, role=ROLE_PARTICIPANT)
        for profile in observer_profiles:
            _upsert_participant(conn, meeting_id, profile, role=ROLE_OBSERVER)
        kb._append_event(
            conn,
            meeting_id,
            "meeting_created",
            {
                "moderator": moderator,
                "participants": participant_profiles,
                "observers": observer_profiles,
            },
        )

    return MeetingCreated(
        meeting_id=meeting_id,
        moderator=moderator,
        participants=participant_profiles,
    )


def join_meeting(conn, task_id: str, profile: str) -> dict[str, Any]:
    """Mark a profile as actively participating in the meeting."""
    task_id = _require_text(task_id, "meeting_id")
    profile = _canonical_profile(profile)
    _ensure_meeting_task(conn, task_id)
    row = _participant_row(conn, task_id, profile)
    if row is None:
        raise ValueError(
            f"profile {profile!r} is not on the meeting roster; ask the moderator "
            f"to meeting_invite first"
        )
    now = int(time.time())
    with kb.write_txn(conn):
        _upsert_participant(
            conn,
            task_id,
            profile,
            role=row["role"],
            status="active",
            joined_at=now,
        )
        kb._append_event(conn, task_id, "meeting_joined", {"profile": profile})
    return {"meeting_id": task_id, "profile": profile, "status": "active"}


def invite_participant(
    conn,
    task_id: str,
    *,
    profile: str,
    role: str = ROLE_PARTICIPANT,
    invited_by: str,
) -> dict[str, Any]:
    """Add a profile to the meeting roster (moderator only)."""
    task = _ensure_meeting_task(conn, task_id)
    invited_by = _canonical_profile(invited_by)
    profile = _canonical_profile(profile)
    _require_moderator(task, invited_by, conn)

    if role not in {ROLE_PARTICIPANT, ROLE_OBSERVER, ROLE_MODERATOR}:
        raise ValueError(f"invalid role {role!r}")

    with kb.write_txn(conn):
        _upsert_participant(conn, task_id, profile, role=role)
        kb._append_event(
            conn, task_id, "meeting_invited", {"profile": profile, "role": role}
        )
    return {"meeting_id": task_id, "profile": profile, "role": role}


def _require_moderator(task: kb.Task, profile: str, conn) -> None:
    if task.assignee and normalize_profile_name(task.assignee) == profile:
        return
    row = _participant_row(conn, task.id, profile)
    if row and row["role"] == ROLE_MODERATOR:
        return
    raise ValueError(f"profile {profile!r} is not the meeting moderator")


def _can_speak(conn, task: kb.Task, profile: str) -> bool:
    if task.assignee and normalize_profile_name(task.assignee) == profile:
        return True
    row = _participant_row(conn, task.id, profile)
    if not row:
        return False
    if row["role"] == ROLE_OBSERVER:
        return False
    return row["status"] in {"active", "invited"}


def speak_in_meeting(
    conn,
    task_id: str,
    *,
    author: str,
    kind: str,
    body: str,
    round: int = 0,
    metadata: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Record one utterance; mirrors to task_comments for dashboard visibility."""
    task_id = _require_text(task_id, "meeting_id")
    author = _canonical_profile(author)
    kind = _require_text(kind, "kind").lower()
    body = _require_text(body, "body")
    if kind not in VALID_UTTERANCE_KINDS:
        raise ValueError(
            f"kind must be one of {sorted(VALID_UTTERANCE_KINDS)}, got {kind!r}"
        )

    task = _ensure_meeting_task(conn, task_id)
    if task.status in {"done", "archived"}:
        raise ValueError(f"meeting {task_id} is closed ({task.status})")
    if not _can_speak(conn, task, author):
        raise ValueError(
            f"profile {author!r} cannot speak in meeting {task_id} "
            "(not on roster or observer-only)"
        )

    meta_json = json.dumps(metadata, ensure_ascii=False) if metadata else None
    now = int(time.time())
    utterance_id = 0
    with kb.write_txn(conn):
        cur = conn.execute(
            """
            INSERT INTO meeting_utterances
                (task_id, author, kind, body, round, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (task_id, author, kind, body, int(round), meta_json, now),
        )
        utterance_id = int(cur.lastrowid or 0)
        mirror = {
            "utterance_id": utterance_id,
            "kind": kind,
            "round": int(round),
            "body": body,
            "metadata": metadata,
        }
        conn.execute(
            "INSERT INTO task_comments (task_id, author, body, created_at) "
            "VALUES (?, ?, ?, ?)",
            (
                task_id,
                author,
                UTTERANCE_COMMENT_PREFIX
                + json.dumps(mirror, ensure_ascii=False),
                now,
            ),
        )
        kb._append_event(
            conn,
            task_id,
            "meeting_spoke",
            {"author": author, "kind": kind, "utterance_id": utterance_id},
        )

    return {
        "meeting_id": task_id,
        "utterance_id": utterance_id,
        "author": author,
        "kind": kind,
    }


def advance_meeting_step(
    conn,
    task_id: str,
    *,
    moderator: str,
    next_step: str,
) -> dict[str, Any]:
    """Moderator advances the meeting phase."""
    task = _ensure_meeting_task(conn, task_id)
    moderator = _canonical_profile(moderator)
    _require_moderator(task, moderator, conn)

    next_step = _require_text(next_step, "next_step").lower()
    if next_step not in MEETING_STEPS:
        raise ValueError(f"next_step must be one of {MEETING_STEPS}")

    current = (task.current_step_key or "collecting").lower()
    allowed = STEP_TRANSITIONS.get(current, ())
    if next_step not in allowed and next_step != current:
        raise ValueError(
            f"cannot transition from {current!r} to {next_step!r}; "
            f"allowed: {list(allowed)}"
        )

    with kb.write_txn(conn):
        conn.execute(
            "UPDATE tasks SET current_step_key = ? WHERE id = ?",
            (next_step, task_id),
        )
        kb._append_event(
            conn,
            task_id,
            "meeting_step",
            {"from": current, "to": next_step, "by": moderator},
        )
    return {"meeting_id": task_id, "step": next_step, "previous": current}


def close_meeting(
    conn,
    task_id: str,
    *,
    moderator: str,
    decision: str,
    metadata: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Close the meeting with a written decision; marks the task done."""
    task = _ensure_meeting_task(conn, task_id)
    moderator = _canonical_profile(moderator)
    _require_moderator(task, moderator, conn)
    decision = _require_text(decision, "decision")

    with kb.write_txn(conn):
        conn.execute(
            "UPDATE tasks SET current_step_key = 'decided' WHERE id = ?",
            (task_id,),
        )

    meta = dict(metadata or {})
    meta["meeting_decision"] = decision
    meta["kind"] = "kanban_meeting_v1"

    kb.complete_task(
        conn,
        task_id,
        summary=decision,
        metadata=meta,
    )
    return {"meeting_id": task_id, "status": "done", "decision": decision}


def get_meeting_context(conn, task_id: str) -> dict[str, Any]:
    """Structured meeting view for tools and CLI."""
    task = _ensure_meeting_task(conn, task_id)
    participants = [
        {
            "profile": p.profile,
            "role": p.role,
            "status": p.status,
            "joined_at": p.joined_at,
        }
        for p in list_participants(conn, task_id)
    ]
    utterances = [
        {
            "id": u.id,
            "author": u.author,
            "kind": u.kind,
            "body": u.body,
            "round": u.round,
            "metadata": u.metadata,
            "created_at": u.created_at,
        }
        for u in list_utterances(conn, task_id)
    ]
    return {
        "meeting_id": task.id,
        "title": task.title,
        "status": task.status,
        "step": task.current_step_key or "collecting",
        "moderator": task.assignee,
        "agenda": task.body,
        "participants": participants,
        "utterances": utterances,
    }


def format_meeting_transcript(ctx: dict[str, Any]) -> str:
    """Human-readable transcript for meeting_show."""
    lines = [
        f"# Meeting {ctx['meeting_id']}: {ctx['title']}",
        f"Step: {ctx['step']} | Status: {ctx['status']} | Moderator: {ctx['moderator']}",
        "",
        "## Participants",
    ]
    for p in ctx["participants"]:
        lines.append(
            f"- {p['profile']} ({p['role']}, {p['status']})"
            + (f" joined {_ts(p['joined_at'])}" if p.get("joined_at") else "")
        )
    lines.extend(["", "## Transcript"])
    if not ctx["utterances"]:
        lines.append("(no utterances yet)")
    else:
        for u in ctx["utterances"]:
            lines.append(
                f"[{u['kind']}] {u['author']} (round {u['round']}): {u['body']}"
            )
    return "\n".join(lines)


def _ts(ts: Optional[int]) -> str:
    if not ts:
        return ""
    return time.strftime("%Y-%m-%d %H:%M", time.localtime(ts))
