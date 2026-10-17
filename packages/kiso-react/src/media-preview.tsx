"use client"

import * as React from "react"
import { clsx as cn } from "clsx"
import { Pause, Play } from "lucide-react"

export type ImagePreviewProps = Omit<React.ComponentProps<"img">, "src" | "alt"> & {
  src: string
  /** Describes the image, or "" when the text beside it already names it. */
  alt: string
}

/** A thumbnail that crops the image to fill its box. */
export function ImagePreview({ className, loading = "lazy", decoding = "async", ...props }: ImagePreviewProps) {
  return <img data-slot="image-preview" className={cn("media-preview", className)}
    loading={loading} decoding={decoding} {...props} />
}

export type AudioPreviewProps = Omit<React.ComponentProps<"button">, "children" | "type"> & {
  src: string
  /** What plays. The button is named "Play {label}" or "Pause {label}". */
  label: string
}

// One preview plays at a time: starting one pauses the one before.
let playing: { audio: HTMLAudioElement; stop: () => void } | null = null

/**
 * A button that plays and pauses a short sound. It loads nothing until it is
 * pressed and never starts by itself.
 */
export function AudioPreview({ src, label, className, onClick, ref, ...props }: AudioPreviewProps) {
  const audio = React.useRef<HTMLAudioElement | null>(null)
  const [on, setOn] = React.useState(false)

  const stop = React.useCallback(() => {
    const current = audio.current
    if (current) current.pause()
    if (playing?.audio === current) playing = null
    setOn(false)
  }, [])

  // A new source, or leaving the page, stops the old sound.
  React.useEffect(() => () => {
    stop()
    audio.current = null
  }, [src, stop])

  const toggle = () => {
    // The player, not the last render, says whether this one plays, so a
    // quick second press pauses.
    if (audio.current && playing?.audio === audio.current) return stop()
    if (!audio.current) {
      const element = new Audio(src)
      element.addEventListener("ended", () => {
        element.currentTime = 0
        if (playing?.audio === element) playing = null
        setOn(false)
      })
      element.addEventListener("error", stop)
      audio.current = element
    }
    const element = audio.current
    if (playing && playing.audio !== element) playing.stop()
    playing = { audio: element, stop }
    setOn(true)
    element.play().catch(error => {
      // A pause before playback starts rejects too; that is not a failure.
      if (error?.name !== "AbortError") stop()
    })
  }

  return <button ref={ref} type="button" data-slot="audio-preview" data-state={on ? "playing" : "paused"}
    aria-label={`${on ? "Pause" : "Play"} ${label}`}
    className={cn("btn btn-outline btn-sm btn-icon audio-preview", className)} {...props}
    onClick={event => {
      onClick?.(event)
      if (!event.defaultPrevented) toggle()
    }}>
    {on ? <Pause className="icon icon-sm" aria-hidden="true" /> : <Play className="icon icon-sm" aria-hidden="true" />}
  </button>
}

/**
 * Ctrl+Enter, or Cmd+Enter on macOS, plays or pauses the audio preview of the
 * highlighted option while the focus stays on the selection.
 */
export function isPlayPreviewKey(event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey">) {
  return event.key === "Enter" && (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey
}

/** Plays or pauses the first audio preview inside `element`. False when it has none. */
export function toggleAudioPreview(element: Element | null | undefined) {
  const button = element?.querySelector<HTMLButtonElement>('[data-slot="audio-preview"]:not(:disabled)')
  button?.click()
  return !!button
}

export type DetailOptionProps = Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode
  illustration?: React.ReactNode
  description?: React.ReactNode
  /** `sm` fits a row in a compact list, such as an autocomplete. */
  size?: "sm" | "md"
}

/**
 * DetailSelect's option layout, for lists it does not own: an illustration
 * beside a title and its description. Pass `role="option"` and
 * `aria-selected` to use it in a listbox. The title names the option and the
 * description describes it, so controls in the illustration stay out of its
 * name.
 */
export function DetailOption({ label, illustration, description, size = "md", className, id, ...props }: DetailOptionProps) {
  const generated = React.useId()
  const base = id ?? generated
  return <div id={id} data-slot="detail-option" data-size={size} className={cn("detail-option", className)}
    aria-labelledby={`${base}-label`} aria-describedby={description != null ? `${base}-description` : undefined} {...props}>
    {illustration != null && <div className="detail-option-illustration">{illustration}</div>}
    <div className="detail-option-body">
      <div id={`${base}-label`} className="detail-option-label">{label}</div>
      {description != null && <div id={`${base}-description`} className="detail-option-description">{description}</div>}
    </div>
  </div>
}
