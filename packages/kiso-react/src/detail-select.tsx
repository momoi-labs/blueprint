"use client"

import * as React from "react"
import { clsx as cn } from "clsx"
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js"

export type DetailSelectOption = {
  value: string
  label: string
  icon?: React.ReactNode
  illustration: React.ReactNode
  description: React.ReactNode
  disabled?: boolean
}

export type DetailSelectProps = {
  label: string
  options: readonly DetailSelectOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  controlSize?: "sm" | "md" | "lg" | "xl"
  id?: string
  className?: string
  "aria-describedby"?: string
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
}

export function DetailSelect({ label, options, value, defaultValue, onValueChange,
  placeholder = "Choose an option", disabled, controlSize, id, className,
  "aria-describedby": describedBy, "aria-invalid": invalid }: DetailSelectProps) {
  const generatedId = React.useId()
  const triggerId = id ?? generatedId
  const [localValue, setLocalValue] = React.useState(defaultValue)
  const [open, setOpen] = React.useState(false)
  const selected = value === undefined ? localValue : value
  const current = options.find(option => option.value === selected)
  const buttons = React.useRef<(HTMLButtonElement | null)[]>([])
  const choose = (option: DetailSelectOption, close = true) => {
    if (value === undefined) setLocalValue(option.value)
    if (option.value !== selected) onValueChange?.(option.value)
    if (close) setOpen(false)
  }
  return <div data-slot="detail-select" className={cn("detail-select", className)}>
    <label id={`${triggerId}-label`} htmlFor={triggerId} className="t-label">{label}</label>
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id={triggerId} type="button" disabled={disabled} data-control-size={controlSize}
          className="select detail-select-trigger" aria-labelledby={`${triggerId}-label ${triggerId}-value`}
          aria-describedby={describedBy} aria-invalid={invalid} onKeyDown={event => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
            event.preventDefault()
            setOpen(true)
          }}>
          {current?.icon && <span className="detail-select-icon" aria-hidden="true">{current.icon}</span>}
          <span id={`${triggerId}-value`}>{current?.label ?? placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="detail-select-content" aria-label={`${label}: options`} collisionPadding={16}
        onOpenAutoFocus={event => {
          const index = options.findIndex(option => option.value === selected && !option.disabled)
          const target = buttons.current[index] ?? buttons.current.find(button => button && !button.disabled)
          if (target) { event.preventDefault(); target.focus() }
        }}>
        {options.length ? options.map((option, index) => <section key={option.value}
          className="detail-select-option" data-selected={option.value === selected || undefined}
          data-disabled={option.disabled || undefined}
          onClick={event => {
            if (option.disabled || event.defaultPrevented || !(event.target instanceof Element)) return
            const interactive = event.target.closest("a, button, input, select, textarea, summary, label, [contenteditable], [role=button], [role=link], [role=checkbox], [role=radio], [role=switch], [role=slider], [role=combobox]")
            if (!interactive || !event.currentTarget.contains(interactive)) choose(option)
          }}
          aria-labelledby={`${triggerId}-option-${index}`}>
          <div className="detail-select-illustration">{option.illustration}</div>
          <div className="detail-select-body">
            <h3 className="detail-select-heading">
              <button id={`${triggerId}-option-${index}`} type="button" className="detail-select-choice"
                ref={element => { buttons.current[index] = element }} disabled={option.disabled}
                aria-pressed={option.value === selected} aria-describedby={`${triggerId}-description-${index}`}
                onClick={() => choose(option)} onKeyDown={event => {
                  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return
                  const enabled = options.map((option, index) => ({ option, button: buttons.current[index] }))
                    .filter(item => item.button && !item.option.disabled)
                  const position = enabled.findIndex(item => item.button === event.currentTarget)
                  const next = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1
                    : (position + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length
                  const target = enabled[next]
                  if (target) {
                    target.button?.focus()
                    choose(target.option, false)
                  }
                  event.preventDefault()
                }}>
                <span>{option.label}</span>
                {option.value === selected && <svg className="icon icon-sm" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3.5 3.5L13 5" /></svg>}
              </button>
            </h3>
            <div id={`${triggerId}-description-${index}`} className="detail-select-description">{option.description}</div>
          </div>
        </section>) : <p className="detail-select-empty">No available options.</p>}
      </PopoverContent>
    </Popover>
  </div>
}
