import { useState, type CSSProperties } from "react";
import { Badge, Button, Input } from "@momoi-labs/kiso-react";
import { Moon, Sun } from "lucide-react";

export function FoundationLab() {
  const [light, setLight] = useState(50);
  return <div className="studio-live-example foundation-lab">
    <div className="foundation-world" style={{ "--foundation-light": `${light}%` } as CSSProperties}>
      {(["dark", "light"] as const).map(theme => <div key={theme} data-theme={theme} className={`foundation-universe foundation-${theme}`} aria-hidden inert>
        <span className="foundation-orbit" /><span className="foundation-orbit foundation-orbit-outer" />
        {theme === "light" ? <Sun className="foundation-celestial foundation-sun" /> : <Moon className="foundation-celestial foundation-moon" />}
        <span className="foundation-type">Aa</span>
        <div className="foundation-button"><Button tabIndex={-1} variant="primary" size="sm">Continue →</Button></div>
        <div className="foundation-badges"><Badge variant="success">Ready</Badge><Badge variant="info">In sync</Badge></div>
        <div className="foundation-input"><Input value="Your next idea" readOnly tabIndex={-1} aria-label="Theme sample" /></div>
        <span className="foundation-coordinate">{theme === "light" ? "LIGHT / 01" : "DARK / 02"}</span>
      </div>)}
      <span className="foundation-boundary" aria-hidden><span>↔</span></span>
      <input className="foundation-slider" type="range" min={0} max={100} value={light}
        aria-label="Compare light and dark themes" aria-valuetext={`${light}% light, ${100 - light}% dark`}
        onChange={event => setLight(Number(event.target.value))} />
    </div>
    <p className="foundation-caption">One language. Two lights. <span aria-hidden>↔</span></p>
  </div>;
}
