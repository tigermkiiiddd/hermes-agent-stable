import { useCallback, useEffect, useState } from 'react'

import { PageLoader } from '@/components/page-loader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { Panel, PanelEmpty, PanelHeader } from '../overlays/panel'

/* ── Types ── */

interface TaskItem {
  id: string
  title: string
  status: string
  assignee: string | null
  tenant: string | null
  priority: number
  description: string | null
  created_at: number
  updated_at: number
  comment_count: number
  link_counts: { parents: number; children: number }
  warnings?: any
  diagnostics?: any[]
}

interface BoardColumn {
  name: string
  tasks: TaskItem[]
}

interface BoardData {
  columns: BoardColumn[]
  tenants: string[]
  assignees: string[]
  latest_event_id: number
  now: number
}

interface BoardInfo {
  slug: string
  display_name: string
  description?: string
}

const COLUMNS = ['triage', 'todo', 'scheduled', 'ready', 'running', 'blocked', 'review', 'done']

const COLUMN_LABELS: Record<string, string> = {
  triage: 'Triage',
  todo: 'Todo',
  scheduled: 'Scheduled',
  ready: 'Ready',
  running: 'Running',
  blocked: 'Blocked',
  review: 'Review',
  done: 'Done'
}

const COLUMN_COLORS: Record<string, string> = {
  triage: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  todo: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  scheduled: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  ready: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  running: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  blocked: 'bg-red-500/10 text-red-300 border-red-500/20',
  review: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  done: 'bg-green-500/10 text-green-300 border-green-500/20'
}

function ago(ts: number) {
  if (!ts) {
    return ''
  }
  const sec = Math.floor(Date.now() / 1000 - ts)

  if (sec < 60) {
    return `${sec}s`
  }

  if (sec < 3600) {
    return `${Math.floor(sec / 60)}m`
  }

  if (sec < 86400) {
    return `${Math.floor(sec / 3600)}h`
  }

  return `${Math.floor(sec / 86400)}d`
}

/* ── API helper ── */

async function api(path: string, options?: { method?: string; body?: unknown }) {
  const fn = (window as any).hermesDesktop?.api

  if (!fn) {
    throw new Error('Desktop API not available')
  }

  return fn({ path, method: options?.method || 'GET', body: options?.body ? JSON.stringify(options.body) : undefined })
}

/* ── Task Detail Panel ── */

function TaskDetailPanel({
  task,
  board,
  onClose,
  onUpdate,
  onDelete
}: {
  task: TaskItem
  board: string | null
  onClose: () => void
  onUpdate: () => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [status, setStatus] = useState(task.status)
  const [assignee, setAssignee] = useState(task.assignee || '')
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async () => {
    setSaving(true)

    try {
      await api(`/api/plugins/kanban/tasks/${task.id}`, {
        method: 'PATCH',
        body: {
          title: title.trim(),
          description: description.trim() || null,
          status,
          assignee: assignee.trim() || null
        }
      })
      setEditing(false)
      onUpdate()
    } catch (e) {
      console.error(e)
    }

    setSaving(false)
  }, [task.id, title, description, status, assignee, onUpdate])

  const handleDelete = useCallback(async () => {
    if (!confirm(`Delete "${task.title}"?`)) {
      return
    }

    try {
      await api(`/api/plugins/kanban/tasks/${task.id}`, { method: 'DELETE' })
      onDelete()
    } catch (e) {
      console.error(e)
    }
  }, [task.id, task.title, onDelete])

  return (
    <div className="flex w-96 shrink-0 flex-col border-l bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-medium">Task Detail</span>
        <Button onClick={onClose} size="sm" variant="ghost">
          ✕
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Title</span>
          {editing ? (
            <Input onChange={e => setTitle(e.target.value)} value={title} />
          ) : (
            <span className="text-sm font-medium">{task.title}</span>
          )}
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Status</span>
          {editing ? (
            <select
              className="rounded border bg-transparent px-2 py-1 text-sm"
              onChange={e => setStatus(e.target.value)}
              value={status}
            >
              {COLUMNS.map(c => (
                <option key={c} value={c}>
                  {COLUMN_LABELS[c] || c}
                </option>
              ))}
            </select>
          ) : (
            <Badge className={cn('w-fit', COLUMN_COLORS[task.status])} variant="outline">
              {COLUMN_LABELS[task.status] || task.status}
            </Badge>
          )}
        </div>

        {/* Assignee */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Assignee</span>
          {editing ? (
            <Input onChange={e => setAssignee(e.target.value)} placeholder="profile name" value={assignee} />
          ) : (
            <span className="text-sm">{task.assignee || <span className="text-muted-foreground/50">—</span>}</span>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Description</span>
          {editing ? (
            <Textarea
              onChange={e => setDescription(e.target.value)}
              placeholder="Task description..."
              rows={4}
              value={description}
            />
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground/80">
              {task.description || <span className="italic text-muted-foreground/40">No description</span>}
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="flex gap-3 text-[11px] text-muted-foreground">
          <span>Created {ago(task.created_at)} ago</span>
          {task.comment_count > 0 && <span>💬 {task.comment_count}</span>}
          {task.link_counts.children > 0 && <span>🔗 {task.link_counts.children} children</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t px-4 py-3">
        {editing ? (
          <>
            <Button disabled={saving || !title.trim()} onClick={handleSave} size="sm">
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              onClick={() => {
                setEditing(false)
                setTitle(task.title)
                setDescription(task.description || '')
                setStatus(task.status)
                setAssignee(task.assignee || '')
              }}
              size="sm"
              variant="ghost"
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setEditing(true)} size="sm" variant="secondary">
              Edit
            </Button>
            <Button className="text-red-500 hover:text-red-600" onClick={handleDelete} size="sm" variant="ghost">
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Create Task Form ── */

function CreateTaskForm({ board, onDone }: { board: string | null; onDone: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('todo')
  const [assignee, setAssignee] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = useCallback(async () => {
    if (!title.trim()) {
      return
    }
    setCreating(true)

    try {
      await api('/api/plugins/kanban/tasks', {
        method: 'POST',
        body: {
          title: title.trim(),
          description: description.trim() || null,
          status,
          assignee: assignee.trim() || null
        }
      })
      onDone()
    } catch (e) {
      console.error(e)
    }

    setCreating(false)
  }, [title, description, status, assignee, onDone])

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <span className="text-sm font-medium">New Task</span>
      <Input autoFocus onChange={e => setTitle(e.target.value)} placeholder="Title" value={title} />
      <Textarea
        onChange={e => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        value={description}
      />
      <div className="flex gap-2">
        <select
          className="rounded border bg-transparent px-2 py-1 text-sm"
          onChange={e => setStatus(e.target.value)}
          value={status}
        >
          {COLUMNS.map(c => (
            <option key={c} value={c}>
              {COLUMN_LABELS[c] || c}
            </option>
          ))}
        </select>
        <Input
          className="flex-1"
          onChange={e => setAssignee(e.target.value)}
          placeholder="Assignee (optional)"
          value={assignee}
        />
      </div>
      <div className="flex gap-2">
        <Button disabled={creating || !title.trim()} onClick={handleCreate} size="sm">
          {creating ? 'Creating...' : 'Create'}
        </Button>
        <Button onClick={onDone} size="sm" variant="ghost">
          Cancel
        </Button>
      </div>
    </div>
  )
}

/* ── Task Card ── */

function TaskCard({
  task,
  onClick,
  onStatusChange
}: {
  task: TaskItem
  onClick: () => void
  onStatusChange: (status: string) => void
}) {
  const colIdx = COLUMNS.indexOf(task.status)
  const canMoveLeft = colIdx > 0
  const canMoveRight = colIdx < COLUMNS.length - 1

  return (
    <div
      className="flex flex-col gap-1.5 rounded-lg border bg-card p-3 text-sm shadow-sm transition-colors hover:bg-accent/30 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium leading-snug text-foreground/90">{task.title}</span>
        <span className="shrink-0 text-[10px] text-muted-foreground">{ago(task.created_at)}</span>
      </div>
      {task.description && (
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/70">{task.description}</p>
      )}
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {task.assignee && (
          <Badge className="text-[10px]" variant="secondary">
            {task.assignee}
          </Badge>
        )}
        {task.comment_count > 0 && <span className="text-[10px] text-muted-foreground">💬 {task.comment_count}</span>}
        {task.warnings && <span className="text-[10px] text-amber-500">⚠</span>}
      </div>

      {/* Quick status move (visible on hover) */}
      <div className="hidden group-hover:flex items-center gap-1 pt-1 border-t border-border/50 mt-1">
        <button
          className={cn('text-[10px] px-1.5 py-0.5 rounded hover:bg-accent', !canMoveLeft && 'opacity-20')}
          disabled={!canMoveLeft}
          onClick={e => {
            e.stopPropagation()

            if (canMoveLeft) {
              onStatusChange(COLUMNS[colIdx - 1])
            }
          }}
        >
          ◀
        </button>
        <span className="text-[10px] text-muted-foreground flex-1 text-center">{COLUMN_LABELS[task.status]}</span>
        <button
          className={cn('text-[10px] px-1.5 py-0.5 rounded hover:bg-accent', !canMoveRight && 'opacity-20')}
          disabled={!canMoveRight}
          onClick={e => {
            e.stopPropagation()

            if (canMoveRight) {
              onStatusChange(COLUMNS[colIdx + 1])
            }
          }}
        >
          ▶
        </button>
      </div>
    </div>
  )
}

/* ── Column ── */

function KanbanColumn({
  name,
  tasks,
  onTaskClick,
  onStatusChange
}: {
  name: string
  tasks: TaskItem[]
  onTaskClick: (task: TaskItem) => void
  onStatusChange: (task: TaskItem, newStatus: string) => void
}) {
  const label = COLUMN_LABELS[name] || name
  const color = COLUMN_COLORS[name] || 'bg-gray-500/10 text-gray-300'

  return (
    <div className="flex w-72 shrink-0 flex-col gap-3">
      <div className={cn('flex items-center gap-2 rounded-md border px-3 py-2', color)}>
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        <Badge className="ml-auto text-[10px]" variant="outline">
          {tasks.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-2 min-h-16">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            onClick={() => onTaskClick(task)}
            onStatusChange={s => onStatusChange(task, s)}
            task={task}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Main View ── */

export function KanbanView({ onClose, setStatusbarItemGroup }: { onClose?: () => void; setStatusbarItemGroup?: any }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [board, setBoard] = useState<BoardData | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [boardList, setBoardList] = useState<BoardInfo[]>([])
  const [currentBoard, setCurrentBoard] = useState<string | null>(null)
  const [showNewBoard, setShowNewBoard] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [sidebarNavOpen, setSidebarNavOpen] = useState(false)

  const loadBoard = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const qs = new URLSearchParams()

      if (tenantFilter) {
        qs.set('tenant', tenantFilter)
      }
      const path = `/api/plugins/kanban/board${qs.toString() ? '?' + qs.toString() : ''}`
      const result = await api(path)
      setBoard(result as BoardData)
    } catch (err: any) {
      setError(err?.message || String(err))
    }

    setLoading(false)
  }, [tenantFilter])

  const loadBoardList = useCallback(async () => {
    try {
      const result = await api('/api/plugins/kanban/boards')
      const data = result as { boards: BoardInfo[]; current?: string }
      setBoardList(data.boards || [])

      if (data.current && !currentBoard) {
        setCurrentBoard(data.current)
      }

      // If no boards exist, show create form
      if (!data.boards || data.boards.length === 0) {
        setShowNewBoard(true)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void loadBoard()
    void loadBoardList()
  }, [loadBoard, loadBoardList])

  const handleStatusChange = useCallback(async (task: TaskItem, newStatus: string) => {
    try {
      await api(`/api/plugins/kanban/tasks/${task.id}`, { method: 'PATCH', body: { status: newStatus } })
      // Optimistic update
      setBoard(prev => {
        if (!prev) {
          return prev
        }

        const cols = prev.columns.map(col => ({
          ...col,
          tasks:
            col.name === task.status
              ? col.tasks.filter(t => t.id !== task.id)
              : col.name === newStatus
                ? [...col.tasks, { ...task, status: newStatus, updated_at: Math.floor(Date.now() / 1000) }]
                : col.tasks
        }))

        return { ...prev, columns: cols }
      })
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleCreateDone = useCallback(() => {
    setShowCreate(false)
    void loadBoard()
  }, [loadBoard])

  const handleUpdate = useCallback(() => {
    setSelectedTask(null)
    void loadBoard()
  }, [loadBoard])

  const handleDelete = useCallback(() => {
    setSelectedTask(null)
    void loadBoard()
  }, [loadBoard])

  const handleCreateBoard = useCallback(async () => {
    const slug = newBoardName.trim().toLowerCase().replace(/\s+/g, '-')

    if (!slug) {
      return
    }

    try {
      await api('/api/plugins/kanban/boards', {
        method: 'POST',
        body: { slug, display_name: newBoardName.trim() }
      })
      setShowNewBoard(false)
      setNewBoardName('')
      setCurrentBoard(slug)
      await loadBoardList()
      await loadBoard()
    } catch (e) {
      console.error(e)
    }
  }, [newBoardName, loadBoard, loadBoardList])

  // Filtered tasks per column
  const filteredColumns =
    board?.columns.map(col => ({
      ...col,
      tasks: col.tasks.filter(t => {
        if (
          searchFilter &&
          !t.title.toLowerCase().includes(searchFilter.toLowerCase()) &&
          !t.description?.toLowerCase().includes(searchFilter.toLowerCase())
        ) {
          return false
        }

        return true
      })
    })) ?? []

  const totalTasks = filteredColumns.reduce((s, c) => s + c.tasks.length, 0)

  // ── Loading ──
  if (loading && !board) {
    return (
      <Panel onClose={onClose}>
        <PanelHeader title="Kanban Board" />
        <PageLoader />
      </Panel>
    )
  }

  // ── Error ──
  if (error && !board) {
    return (
      <Panel onClose={onClose}>
        <PanelHeader subtitle="Error" title="Kanban Board" />
        <PanelEmpty
          action={
            <Button onClick={loadBoard} size="sm" variant="secondary">
              Retry
            </Button>
          }
          description={error}
          icon="warning"
          title="Failed to load board"
        />
      </Panel>
    )
  }

  // ── Empty / no board ──
  if (!board || totalTasks === 0) {
    return (
      <Panel onClose={onClose}>
        <PanelHeader
          actions={
            boardList.length > 0 && !showNewBoard ? (
              <Button onClick={() => setShowCreate(true)} size="sm" variant="secondary">
                + New Task
              </Button>
            ) : undefined
          }
          subtitle={showNewBoard ? 'Create your first board' : boardList.length === 0 ? 'No board yet' : 'No tasks yet'}
          title="Kanban Board"
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          {showNewBoard && (
            <div className="mx-auto flex w-full max-w-sm flex-col gap-4 pt-12">
              <PanelEmpty
                description="Create a board to start tracking tasks."
                icon="project"
                title="No kanban board yet"
              />
              <form
                className="flex flex-col gap-3 rounded-lg border bg-card p-4"
                onSubmit={e => {
                  e.preventDefault()
                  void handleCreateBoard()
                }}
              >
                <span className="text-sm font-medium">New Board</span>
                <Input
                  autoFocus
                  onChange={e => setNewBoardName(e.target.value)}
                  placeholder="Board name (e.g. Sprint 42)"
                  value={newBoardName}
                />
                <div className="flex gap-2">
                  <Button disabled={!newBoardName.trim()} type="submit">
                    Create
                  </Button>
                </div>
              </form>
            </div>
          )}
          {!showNewBoard && boardList.length > 0 && showCreate && (
            <CreateTaskForm board={currentBoard} onDone={handleCreateDone} />
          )}
          {!showNewBoard && boardList.length > 0 && !showCreate && (
            <PanelEmpty
              action={
                <Button onClick={() => setShowCreate(true)} size="sm" variant="secondary">
                  + New Task
                </Button>
              }
              icon="inbox"
              title="No tasks yet"
            />
          )}
        </div>
      </Panel>
    )
  }

  // ── Board ──
  return (
    <Panel onClose={onClose}>
      <PanelHeader
        actions={
          <div className="flex items-center gap-2">
            {boardList.length > 0 && (
              <select
                className="rounded border bg-transparent px-1.5 py-0.5 text-xs"
                onChange={async e => {
                  const slug = e.target.value

                  if (slug === '__new__') {
                    setShowNewBoard(true)

                    return
                  }

                  if (slug) {
                    setCurrentBoard(slug)
                    await api(`/api/plugins/kanban/boards/${slug}/switch`, { method: 'POST' })
                    void loadBoard()
                    void loadBoardList()
                  }
                }}
                value={currentBoard || ''}
              >
                {boardList.map(b => (
                  <option key={b.slug} value={b.slug}>
                    {b.display_name || b.slug}
                  </option>
                ))}
                <option disabled>───</option>
                <option value="__new__">+ Create new...</option>
              </select>
            )}
            <Button onClick={() => setShowCreate(true)} size="sm" variant="secondary">
              + New Task
            </Button>
            <Button onClick={loadBoard} size="sm" variant="ghost">
              ↻
            </Button>
          </div>
        }
        subtitle={
          <div className="flex items-center gap-2">
            {/* Tenant filter */}
            {board.tenants.length > 1 && (
              <select
                className="rounded border bg-transparent px-1.5 py-0.5 text-xs"
                onChange={e => setTenantFilter(e.target.value)}
                value={tenantFilter}
              >
                <option value="">All tenants</option>
                {board.tenants.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
            {/* Search */}
            <Input
              className="h-6 w-28 text-xs"
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Search..."
              value={searchFilter}
            />
            <span className="text-xs text-muted-foreground">{totalTasks} tasks</span>
          </div>
        }
        title={
          <div className="flex items-center gap-2">
            <span>Kanban Board</span>
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Columns */}
        <div className={cn('flex flex-1 gap-4 overflow-x-auto p-4', showNewBoard && 'opacity-30 pointer-events-none')}>
          {filteredColumns.map(col => (
            <KanbanColumn
              key={col.name}
              name={col.name}
              onStatusChange={handleStatusChange}
              onTaskClick={setSelectedTask}
              tasks={col.tasks}
            />
          ))}
        </div>

        {/* Create board overlay */}
        {showNewBoard && (
          <div className="absolute inset-0 z-50 flex items-start justify-center bg-background/60 pt-24">
            <form
              className="flex w-full max-w-sm flex-col gap-3 rounded-lg border bg-card p-4 shadow-lg"
              onSubmit={e => {
                e.preventDefault()
                void handleCreateBoard()
              }}
            >
              <span className="text-sm font-medium">New Board</span>
              <Input
                autoFocus
                onChange={e => setNewBoardName(e.target.value)}
                placeholder="Board name (e.g. Sprint 42)"
                value={newBoardName}
              />
              <div className="flex gap-2">
                <Button disabled={!newBoardName.trim()} type="submit">
                  Create
                </Button>
                <Button
                  onClick={() => {
                    setShowNewBoard(false)
                    setNewBoardName('')
                  }}
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Create task form (inline when showCreate) */}
        {showCreate && (
          <div className="w-80 shrink-0 border-l p-4">
            <CreateTaskForm board={currentBoard} onDone={handleCreateDone} />
          </div>
        )}

        {/* Task detail panel */}
        {selectedTask && !showCreate && (
          <TaskDetailPanel
            board={currentBoard}
            onClose={() => setSelectedTask(null)}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            task={selectedTask}
          />
        )}
      </div>
    </Panel>
  )
}
