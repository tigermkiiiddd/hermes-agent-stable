/**
 * TEMP diagnostics — chat "Maximum update depth exceeded" hunt (2026-08-24).
 *
 * Only console.error (level 3) reaches desktop.log from the renderer — see
 * electron/renderer-log.ts — so burst reports are emitted as errors with the
 * [chat-loop-diag] tag. Counters are module-global (one window = one module
 * instance). A report fires when the runtime-boundary render effect crossed
 * 25 renders inside a sliding 1s window, at most once per 2s.
 *
 * The counters discriminate between the loop drivers:
 * - renders ≈ messagesEmit, renderMessagesSameContent high → a store writer
 *   keeps republishing the transcript with fresh arrays/objects;
 * - renders high, guardHit high, messages unchanged → renders driven from
 *   outside the external-store runtime (parent props / assistant-ui scopes);
 * - renders high + miss.items high → adapter input churn (new ThreadMessages).
 *
 * DELETE once the driver is identified.
 */

type DiagMessages = readonly unknown[] | undefined

/** Works on both shapes we instrument: repository items ({message:{id}}) and
 *  raw ChatMessages ({id}) — defensive so diagnostics can never crash the
 *  surface they observe. */
const signature = (messages: DiagMessages): string => {
  if (!messages) {
    return 'none'
  }

  const idOf = (item: unknown): string => {
    if (!item || typeof item !== 'object') {
      return ''
    }

    const raw = item as { id?: unknown; message?: { id?: unknown } }

    if (typeof raw.id === 'string') {
      return raw.id
    }

    return typeof raw.message?.id === 'string' ? raw.message.id : ''
  }

  return `${messages.length}:${idOf(messages[0])}..${idOf(messages[messages.length - 1])}`
}

const counts = {
  renders: 0,
  renderMessagesChanged: 0,
  renderMessagesSameContent: 0,
  messagesEmit: 0,
  messagesEmitSameContent: 0,
  setAdapter: 0,
  guardHit: 0,
  missNoCache: 0,
  missHead: 0,
  missItems: 0,
  missRunning: 0,
  missObservers: 0,
  tailSync: 0,
  notify: 0
}

let lastSeen: DiagMessages
let lastSignature = ''
let lastEmitSignature = ''
const renderTimes: number[] = []
let lastReportAt = 0

const report = (now: number): void => {
  console.error(
    `[chat-loop-diag] burst renders=${renderTimes.length}/1s ${JSON.stringify(counts)}`
  )
  lastReportAt = now
}

export const chatLoopDiag = {
  /** Called from the runtime hook's setAdapter effect — runs once per
   *  ChatRuntimeBoundary render (the store literal is fresh every render). */
  render(messages: DiagMessages): void {
    counts.renders++

    const now = performance.now()

    renderTimes.push(now)

    while (renderTimes.length > 0 && now - renderTimes[0] > 1000) {
      renderTimes.shift()
    }

    const identityChanged = lastSeen !== messages
    const sig = signature(messages)
    const contentChanged = sig !== lastSignature

    if (identityChanged) {
      counts.renderMessagesChanged++
    }

    if (identityChanged && !contentChanged) {
      counts.renderMessagesSameContent++
    }

    lastSeen = messages
    lastSignature = sig

    if (renderTimes.length >= 25 && now - lastReportAt > 2000) {
      report(now)
    }
  },

  /** Called from the $messages subscription in useMessagesWhileVisible. */
  messagesEmit(messages: DiagMessages): void {
    counts.messagesEmit++

    const sig = signature(messages)

    if (sig === lastEmitSignature) {
      counts.messagesEmitSameContent++
    }

    lastEmitSignature = sig
  },

  setAdapter(): void {
    counts.setAdapter++
  },

  guardHit(): void {
    counts.guardHit++
  },

  guardMiss(reason: 'head' | 'items' | 'noCache' | 'observers' | 'running'): void {
    if (reason === 'head') counts.missHead++
    else if (reason === 'items') counts.missItems++
    else if (reason === 'noCache') counts.missNoCache++
    else if (reason === 'observers') counts.missObservers++
    else counts.missRunning++
  },

  tailSync(): void {
    counts.tailSync++
  },

  notify(): void {
    counts.notify++
  }
}
