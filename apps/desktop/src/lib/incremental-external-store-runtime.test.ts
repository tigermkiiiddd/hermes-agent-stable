import { fromThreadMessageLike, getAutoStatus, MessageRepository } from '@assistant-ui/core/internal'
import type { ExportedMessageRepository, ThreadMessage } from '@assistant-ui/react'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { syncRepositoryIncrementally, useIncrementalExternalStoreRuntime } from './incremental-external-store-runtime'

const STATUS = getAutoStatus(false, false, false, false, undefined)

function message(id: string, text: string): ThreadMessage {
  return fromThreadMessageLike({ role: 'assistant', content: [{ type: 'text', text }] }, id, STATUS)
}

function userMessage(id: string, text: string): ThreadMessage {
  return fromThreadMessageLike({ role: 'user', content: [{ type: 'text', text }] }, id, STATUS)
}

/** A real MessageRepository behind the same shape syncRepositoryIncrementally drives. */
function runtimeWith(items: { message: ThreadMessage; parentId: string | null }[]) {
  const repository = new MessageRepository()

  for (const { message: item, parentId } of items) {
    repository.addOrUpdateMessage(parentId, item)
  }

  if (items.length > 0) {
    repository.resetHead(items.at(-1)?.message.id ?? null)
  }

  return { repository } as unknown as Parameters<typeof syncRepositoryIncrementally>[0]
}

function chain(messages: ThreadMessage[]) {
  return messages.map((item, index) => ({
    message: item,
    parentId: index === 0 ? null : messages[index - 1].id
  }))
}

function exported(items: { message: ThreadMessage; parentId: string | null }[]): ExportedMessageRepository {
  return { headId: items.at(-1)?.message.id ?? null, messages: items }
}

describe('syncRepositoryIncrementally', () => {
  it('writes only the changed tail instead of the whole transcript', () => {
    const settled = Array.from({ length: 200 }, (_, index) => message(`m-${index}`, `body ${index}`))
    const items = chain(settled)
    const runtime = runtimeWith(items)
    const repository = (runtime as unknown as { repository: MessageRepository }).repository

    const addOrUpdate = vi.spyOn(repository, 'addOrUpdateMessage')
    const resetHead = vi.spyOn(repository, 'resetHead')

    // One streamed delta: the tail grows, every settled message keeps identity.
    const nextTail = message('m-199', 'body 199 + delta')
    const nextItems = [...items.slice(0, -1), { message: nextTail, parentId: 'm-198' }]

    const result = syncRepositoryIncrementally(runtime, exported(nextItems))

    expect(addOrUpdate).toHaveBeenCalledTimes(1)
    expect(addOrUpdate).toHaveBeenCalledWith('m-198', nextTail)
    // The head did not move, so the descendant-pruning reset is skipped.
    expect(resetHead).not.toHaveBeenCalled()
    expect(result).toHaveLength(200)
    expect(result.at(-1)).toBe(nextTail)
  })

  it('does nothing at all when the transcript is unchanged', () => {
    const items = chain([message('a', 'one'), message('b', 'two')])
    const runtime = runtimeWith(items)
    const repository = (runtime as unknown as { repository: MessageRepository }).repository

    const addOrUpdate = vi.spyOn(repository, 'addOrUpdateMessage')
    const deleteMessage = vi.spyOn(repository, 'deleteMessage')

    syncRepositoryIncrementally(runtime, exported(items))

    expect(addOrUpdate).not.toHaveBeenCalled()
    expect(deleteMessage).not.toHaveBeenCalled()
  })

  it('appends a new message through the full path', () => {
    const first = message('a', 'one')
    const items = chain([first])
    const runtime = runtimeWith(items)

    const second = message('b', 'two')
    const result = syncRepositoryIncrementally(runtime, exported(chain([first, second])))

    expect(result.map(item => item.id)).toEqual(['a', 'b'])
  })

  it('honours an authoritative deletion', () => {
    const a = message('a', 'one')
    const b = message('b', 'two')
    const c = message('c', 'three')
    const runtime = runtimeWith(chain([a, b, c]))

    const result = syncRepositoryIncrementally(runtime, exported(chain([a, b])))

    expect(result.map(item => item.id)).toEqual(['a', 'b'])
  })

  it('rebuilds cleanly when a disjoint transcript is swapped in', () => {
    const runtime = runtimeWith(chain([message('old-1', 'one'), message('old-2', 'two')]))

    const next = chain([message('new-1', 'alpha'), message('new-2', 'beta')])
    const result = syncRepositoryIncrementally(runtime, exported(next))

    expect(result.map(item => item.id)).toEqual(['new-1', 'new-2'])
  })

  it('re-parents a message when its branch parent changes', () => {
    const root = message('root', 'root')
    const a = message('a', 'a')
    const b = message('b', 'b')

    const runtime = runtimeWith([
      { message: root, parentId: null },
      { message: a, parentId: 'root' },
      { message: b, parentId: 'a' }
    ])

    // Same ids and same message objects, but `b` moves onto a sibling branch.
    const result = syncRepositoryIncrementally(runtime, {
      headId: 'b',
      messages: [
        { message: root, parentId: null },
        { message: a, parentId: 'root' },
        { message: b, parentId: 'root' }
      ]
    })

    expect(result.map(item => item.id)).toEqual(['root', 'b'])
  })

  it('moves the head when an explicit headId rewinds the branch', () => {
    const a = message('a', 'one')
    const b = message('b', 'two')
    const runtime = runtimeWith(chain([a, b]))

    const result = syncRepositoryIncrementally(runtime, {
      headId: 'a',
      messages: chain([a, b])
    })

    expect(result.map(item => item.id)).toEqual(['a'])
  })
})

describe('useIncrementalExternalStoreRuntime adapter resets', () => {
  it('keeps the messages snapshot identity across a no-op adapter swap', () => {
    const items = chain([message('a', 'one'), message('b', 'two')])

    const { result, rerender } = renderHook(
      ({ repository }) =>
        useIncrementalExternalStoreRuntime({ messageRepository: repository, isRunning: false, onNew: async () => {} }),
      { initialProps: { repository: exported(items) } }
    )

    const runtime = result.current
    const before = runtime.threads.main.getState().messages

    expect(before.map(item => item.id)).toEqual(['a', 'b'])

    // An idle re-render of the chat surface: a brand-new store literal wrapping
    // a brand-new repository container whose messages are the SAME objects.
    // The snapshot must not move — a fresh array here re-renders the surface,
    // which rebuilds the literal again and loops to "Maximum update depth
    // exceeded" (#chat pane crash).
    const rebuiltContainer = exported(items.map(({ message: msg, parentId }) => ({ message: msg, parentId })))

    rerender({ repository: rebuiltContainer })

    expect(runtime.threads.main.getState().messages).toBe(before)
  })

  it('lands a quiet append that arrives without a run-state change', () => {
    const a = message('a', 'one')
    const b = message('b', 'two')
    const c = message('c', 'three')

    const { result, rerender } = renderHook(
      ({ repository }) =>
        useIncrementalExternalStoreRuntime({ messageRepository: repository, isRunning: false, onNew: async () => {} }),
      { initialProps: { repository: exported(chain([a, b])) } }
    )

    // e.g. a backfilled older page or a background delegation result: the
    // transcript grows while isRunning and the adapter observers stand still.
    rerender({ repository: exported(chain([a, b, c])) })

    expect(result.current.threads.main.getState().messages.map(item => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('renders a streamed tail delta and preserves settled message identity', () => {
    const a = message('a', 'one')
    const b1 = message('b', 'two')

    const { result, rerender } = renderHook(
      ({ repository }) =>
        useIncrementalExternalStoreRuntime({ messageRepository: repository, isRunning: false, onNew: async () => {} }),
      { initialProps: { repository: exported(chain([a, b1])) } }
    )

    const b2 = message('b', 'two and a half')

    rerender({ repository: exported(chain([a, b2])) })

    const messages = result.current.threads.main.getState().messages

    expect(messages[0]).toBe(a)

    const tail = messages.at(-1)?.content[0]

    expect(tail).toMatchObject({ type: 'text', text: 'two and a half' })
  })

  it('does not churn when the transcript ends with hidden (rewound) messages', () => {
    const question = userMessage('u-1', 'question')
    const rewoundAnswer = message('a-1', 'rewound answer')

    // rewind.ts marks a rewound assistant answer hidden: true but keeps it in
    // the transcript; useRuntimeMessageRepository anchors it under the last
    // VISIBLE message and reports headId = that visible message.
    const incoming = () => ({
      headId: 'u-1' as const,
      messages: [
        { message: question, parentId: null },
        { message: rewoundAnswer, parentId: 'u-1' }
      ] as { message: ThreadMessage; parentId: string | null }[]
    })

    const { result, rerender } = renderHook(
      ({ repository }) =>
        useIncrementalExternalStoreRuntime({ messageRepository: repository, isRunning: false, onNew: async () => {} }),
      { initialProps: { repository: incoming() } }
    )

    const runtime = result.current
    const before = runtime.threads.main.getState().messages

    expect(before.map(item => item.id)).toEqual(['u-1'])

    // Idle re-render: fresh container, same content. resetHead('u-1') evicts
    // the hidden child every sync, so reconcile goes 'stale' and the snapshot
    // must NOT move — a fresh array here re-renders the chat surface, rebuilds
    // the literal, and loops to "Maximum update depth exceeded".
    rerender({ repository: incoming() })

    expect(runtime.threads.main.getState().messages).toBe(before)
  })

  it('survives a cancel that deleted the optimistic placeholder before the adapter reset', () => {
    const a = message('a', 'answer')
    const question = userMessage('u-1', 'question')
    const repository = exported(chain([a, question]))

    const { result, rerender } = renderHook(
      ({ isRunning }) =>
        useIncrementalExternalStoreRuntime({
          messageRepository: repository,
          isRunning,
          onNew: async () => {},
          onCancel: async () => {}
        }),
      { initialProps: { isRunning: true } }
    )

    const runtime = result.current

    // Mid-run with a user tail: the runtime appends an optimistic assistant.
    expect(runtime.threads.main.getState().messages.at(-1)).toMatchObject({ role: 'assistant' })

    // cancelRun deletes the empty optimistic head synchronously — the stored
    // placeholder id becomes a ghost that the next adapter reset must not try
    // to delete ("Message not found" crash on the re-render after cancel).
    vi.useFakeTimers()

    act(() => {
      runtime.threads.main.cancelRun()
      vi.runAllTimers()
    })

    vi.useRealTimers()

    expect(() => rerender({ isRunning: false })).not.toThrow()
    expect(result.current.threads.main.getState().messages.map(item => item.id)).toEqual(['a', 'u-1'])
  })
})
