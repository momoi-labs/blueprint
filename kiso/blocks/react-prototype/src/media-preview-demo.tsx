import { useId, useState } from "react"
import { AudioPreview, DetailOption, DetailSelect, ImagePreview, isPlayPreviewKey, toggleAudioPreview } from "@momoi-labs/kiso-react"

// A short tone as a WAV data URL, so the demo ships no audio files.
function tone(frequency: number) {
  const rate = 8000, samples = rate * 0.6
  const bytes = new Uint8Array(44 + samples)
  const view = new DataView(bytes.buffer)
  const text = (at: number, value: string) => [...value].forEach((char, i) => view.setUint8(at + i, char.charCodeAt(0)))
  text(0, "RIFF"); view.setUint32(4, 36 + samples, true); text(8, "WAVEfmt ")
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, rate, true); view.setUint32(28, rate, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true)
  text(36, "data"); view.setUint32(40, samples, true)
  for (let i = 0; i < samples; i++) {
    const fade = Math.min(1, i / 200, (samples - i) / 800)
    bytes[44 + i] = 128 + Math.round(40 * fade * Math.sin(2 * Math.PI * frequency * i / rate))
  }
  return `data:audio/wav;base64,${btoa(String.fromCharCode(...bytes))}`
}

// A two-colour gradient as an SVG data URL, standing in for a photo.
function picture(from: string, to: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="160" height="90" fill="url(#g)"/><circle cx="118" cy="30" r="14" fill="#fff" opacity=".7"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const voices = [
  { value: "aiko", label: "Aiko", frequency: 440, description: <p>A calm, low narrator for long explanations.</p> },
  { value: "ren", label: "Ren", frequency: 554, description: <p>A bright, quick voice for short clips.</p> },
  { value: "sora", label: "Sora", frequency: 659, description: <p>A warm voice with a slower pace.</p> },
].map(voice => ({ ...voice, src: tone(voice.frequency) }))

const items = [
  { name: "dawn", kind: "image", src: picture("#f6a6b2", "#7b5ea7") },
  { name: "harbor", kind: "image", src: picture("#5fa8d3", "#1b4965") },
  ...voices.map(voice => ({ name: voice.value, kind: "audio", src: voice.src })),
]

export function MediaPreviewDemo() {
  const [voice, setVoice] = useState("aiko")
  const [active, setActive] = useState(0)
  const list = useId()
  return <div className="stack">
    <DetailSelect label="Voice" value={voice} onValueChange={setVoice} options={voices.map(voice => ({
      value: voice.value, label: voice.label, description: voice.description,
      illustration: <AudioPreview src={voice.src} label={voice.label} />,
    }))} />
    <p className="muted t-label">In the open list, Ctrl+Enter or Cmd+Enter plays the focused voice. Arrows still choose.</p>
    <div role="listbox" tabIndex={0} aria-label="Library" aria-activedescendant={`${list}-${active}`}
      aria-describedby={`${list}-hint`} className="media-preview-demo-list"
      onKeyDown={event => {
        const move = { ArrowDown: 1, ArrowUp: -1 }[event.key]
        if (move) {
          event.preventDefault()
          setActive((active + move + items.length) % items.length)
        } else if (isPlayPreviewKey(event)) {
          event.preventDefault()
          toggleAudioPreview(document.getElementById(`${list}-${active}`))
        }
      }}>
      {items.map((item, index) => <DetailOption key={item.name} id={`${list}-${index}`} role="option" size="sm"
        aria-selected={index === active} label={item.name} onClick={() => setActive(index)}
        illustration={item.kind === "image" ? <ImagePreview src={item.src} alt="" />
          : <AudioPreview src={item.src} label={item.name} tabIndex={-1} />} />)}
    </div>
    <p id={`${list}-hint`} className="muted t-label">A list the product owns, as in an autocomplete. Arrows move; Ctrl+Enter or Cmd+Enter plays.</p>
  </div>
}
