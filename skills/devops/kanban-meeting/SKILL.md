---
name: kanban-meeting
description: "Async Kanban meetings for multi-agent deliberation."
version: 1.0.0
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [kanban, meeting, multi-agent, deliberation]
    related_skills: [kanban-worker, kanban-orchestrator]
---

# Kanban Meeting Skill

Async **meeting** issues on the Kanban board: a moderator and participant profiles deliberate before a decision is recorded. This is **not** a real-time call — each agent joins and speaks from its own Hermes session.

## When to Use

- Brainstorm or debate before spawning a Swarm (meeting → decision → swarm).
- Cross-profile alignment on direction, veto, or tradeoffs.
- Human-visible transcript on one Kanban card.

## Prerequisites

- `kanban` in the active profile's `toolsets` in `config.yaml`.
- Participants exist as Hermes profiles.

## Tools (preferred)

| Action | Tool |
|--------|------|
| Create meeting | `meeting_create` |
| Join roster | `meeting_join` |
| Invite someone | `meeting_invite` (moderator) |
| Speak | `meeting_speak` |
| Read transcript | `meeting_show` |
| Next phase | `meeting_advance` (moderator) |
| Close with decision | `meeting_close` (moderator) |

Phases: `collecting` → `deliberating` → `voting` → `decided`.

Utterance kinds: `proposal`, `objection`, `amendment`, `vote`, `note`, `chair`, `summary`.

## CLI fallback

```bash
hermes kanban meeting create "选题脑暴" "是否采用东方克苏鲁？" \
  --moderator techlead --participant game-artist --participant game-writer
hermes kanban meeting join t_abc123
hermes kanban meeting speak t_abc123 "我倾向东方克苏鲁" --kind proposal
hermes kanban meeting show t_abc123
hermes kanban meeting advance t_abc123 deliberating
hermes kanban meeting close t_abc123 "决议：采用东方克苏鲁，_worker 3 需重做世界观"
```

## Procedure

1. **Moderator** creates the meeting with agenda and participant list.
2. Each **participant** calls `meeting_join`, then `meeting_speak` (proposals and objections).
3. **Moderator** advances phases and may `meeting_invite` late joiners.
4. **Moderator** `meeting_close` with a clear decision string.
5. Optionally `kanban_create` / `hermes kanban swarm` child work using the decision as input.

## Pitfalls

- Observers cannot speak — use `participant` role.
- Swarm workers do not auto-join meetings; invite profiles explicitly.
- `meeting_close` marks the card `done`; spawn follow-up tasks for execution.

## Verification

`meeting_show` lists all participants and utterances; decision appears in task summary after close.
