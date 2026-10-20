"use client"

import * as React from "react"

/* The timestamp a group of Charts inspects. Only the hovered Chart runs
   Recharts' tooltip; the others draw a light marker from this store. Routing
   hover through Recharts' syncId made every Chart in the group update its
   own tooltip state on each pointer frame. Not exported. */
export type ChartSyncState = {
  /** The inspected timestamp and the Chart that inspects it. */
  hover: number | null
  source: object | null
  /** A timestamp a click, Enter or Space keeps marked across the group. */
  pinned: number | null
}

type Group = { state: ChartSyncState; listeners: Set<() => void> }
const groups = new Map<string, Group>()
const idle: ChartSyncState = { hover: null, source: null, pinned: null }

function group(id: string) {
  let found = groups.get(id)
  if (!found) groups.set(id, found = { state: idle, listeners: new Set() })
  return found
}

function update(id: string, next: (state: ChartSyncState) => ChartSyncState) {
  const found = group(id)
  const state = next(found.state)
  if (state === found.state) return
  found.state = state
  found.listeners.forEach(listener => listener())
}

export function setChartHover(id: string, source: object, timestamp: number | null) {
  update(id, state => timestamp === null
    ? state.source === source ? { ...state, hover: null, source: null } : state
    : state.source === source && state.hover === timestamp ? state : { ...state, hover: timestamp, source })
}

/* A click while a timestamp is pinned clears it, so the same gesture undoes
   itself without aiming at the same sample again. */
export function toggleChartPin(id: string, timestamp: number) {
  update(id, state => ({ ...state, pinned: state.pinned === null ? timestamp : null }))
}

export function clearChartPin(id: string) {
  update(id, state => state.pinned === null ? state : { ...state, pinned: null })
}

export function chartPinned(id: string) {
  return groups.get(id)?.state.pinned ?? null
}

export function useChartSync(id: string) {
  const subscribe = React.useCallback((listener: () => void) => {
    const found = group(id)
    found.listeners.add(listener)
    return () => {
      found.listeners.delete(listener)
      // A group that no Chart shows forgets its pin.
      if (!found.listeners.size && groups.get(id) === found) groups.delete(id)
    }
  }, [id])
  const snapshot = React.useCallback(() => groups.get(id)?.state ?? idle, [id])
  return React.useSyncExternalStore(subscribe, snapshot, () => idle)
}
