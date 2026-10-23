import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Badge, Card, Navigation, NavigationItem, NavigationLink, NavigationList } from "@momoi-labs/kiso-react";
import galleryUrl from "./generated/tui-gallery.json?url";

// The tui-kiso gallery, written by `cargo run --manifest-path
// crates/tui-kiso/Cargo.toml --example gallery -- --json <file>`. Each
// state is drawn in every theme and names its colors by token, so the
// screen follows the site's accent and theme. The colors are the theme's
// own values, as a terminal shows them, whatever the page around it sets.

/** A token name, a share of the primary to chart-1 gradient, a color for
 *  each theme, a fixed color, or the terminal's own (null). */
type Paint = null | string | { mix: number } | (string | null)[];
/** Bold or underline, or one value for each theme. */
type Flag = boolean | boolean[];
type Style = { fg: Paint; bg: Paint; bold?: Flag; underline?: Flag };
/** Text, its style, and the cells it takes. */
type Run = [text: string, style: number, cells: number];
type State = {
  id: string;
  label: string;
  size: [number, number];
  /** The style of the terminal's own colors, as the state's theme sets them. */
  screen: number;
  rows: Run[][];
  /** Rows whose text changes with the theme, such as the accent's name. */
  variants?: Record<string, Record<string, Run[]>>;
  /** The page after each `j` that scrolls it: the rows that change. */
  scroll?: Frame[];
  /** The sidebar's component names: row, column, width, and page. */
  links?: [y: number, x: number, width: number, page: number][];
};
type Frame = { rows: Record<string, Run[]>; variants?: Record<string, Record<string, Run[]>> };
type Page = { id: string; name: string; about: string; states: State[] };
export type TuiData = { themes: string[]; tokens: Record<string, Record<string, string>>; styles: Style[]; pages: Page[] };

/** The gallery, fetched the first time the TUI page opens. */
export function useTuiGallery(active: boolean): TuiData | "failed" | null {
  const [data, setData] = useState<TuiData | "failed" | null>(null);
  const load = active && data === null;
  useEffect(() => {
    if (!load) return;
    let live = true;
    fetch(galleryUrl)
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((gallery: TuiData) => live && setData(gallery))
      .catch(() => live && setData("failed"));
    return () => {
      live = false;
    };
  }, [load]);
  return data;
}

/** Light or dark, with "system" read from the browser. */
function useMode(theme: string): "light" | "dark" {
  const query = "(prefers-color-scheme: dark)";
  const [system, setSystem] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const media = matchMedia(query);
    const update = () => setSystem(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  if (theme === "light" || theme === "dark") return theme;
  return system ? "dark" : "light";
}

function color(paint: Paint, theme: number, tokens: Record<string, string>): string | undefined {
  if (paint === null) return undefined;
  if (typeof paint === "string") return paint.startsWith("#") ? paint : tokens[paint];
  if (Array.isArray(paint)) return paint[theme] ?? undefined;
  return `color-mix(in oklab, ${tokens.primary}, ${tokens["chart-1"]} ${(paint.mix * 100).toFixed(1)}%)`;
}

function on(flag: Flag | undefined, theme: number): boolean {
  return Array.isArray(flag) ? flag[theme] : flag === true;
}

// Box drawing and block characters are drawn with CSS, as modern terminals
// draw them, so lines meet across cells whatever the font has. A run of one
// of these that repeats is one element.
const DRAWN = "─━│└├╭╮╯╰╱╲╳▀▄█▌░";
const REPEATS = "─━│╱╲╳▀▄█▌░";

/** The text of a run, with each drawn character apart. */
function parts(text: string, cells: number): (string | [string, number])[] {
  const chars = [...text];
  // A wide character takes two cells; such a run stays text.
  if (chars.length !== cells) return [text];
  const out: (string | [string, number])[] = [];
  for (const char of chars) {
    const last = out[out.length - 1];
    if (!DRAWN.includes(char)) {
      if (typeof last === "string") out[out.length - 1] = last + char;
      else out.push(char);
    } else if (Array.isArray(last) && last[0] === char && REPEATS.includes(char)) last[1] += 1;
    else out.push([char, 1]);
  }
  return out;
}

export function TuiGallery({
  route,
  data,
  accent,
  theme,
}: {
  route: string;
  data: TuiData | "failed" | null;
  accent: string;
  theme: string;
}) {
  const mode = useMode(theme);
  const name = `${accent}-${mode}`;
  const themeIndex = data && data !== "failed" ? Math.max(0, data.themes.indexOf(name)) : 0;
  const tokens = data && data !== "failed" ? data.tokens[data.themes[themeIndex]] : {};
  const styles = useMemo(
    () =>
      data && data !== "failed"
        ? data.styles.map(
            (style): CSSProperties => ({
              color: color(style.fg, themeIndex, tokens),
              backgroundColor: color(style.bg, themeIndex, tokens),
              fontWeight: on(style.bold, themeIndex) ? 700 : undefined,
              textDecoration: on(style.underline, themeIndex) ? "underline" : undefined,
            }),
          )
        : [],
    [data, themeIndex, tokens],
  );
  // The screen takes the focus whenever a TUI page opens, so its keys work
  // at once. It runs before the shell's own focus move, which then leaves
  // it, as the screen keeps focus.
  const screenRef = useRef<HTMLDivElement>(null);
  const shown = (route === "tui" || route.startsWith("tui/")) && data !== null && data !== "failed";
  useEffect(() => {
    if (shown) screenRef.current?.focus({ preventScroll: true });
  }, [shown, route]);
  // How far the page on the screen is scrolled, for the state it was
  // scrolled in; another state starts at the top.
  const [scrolled, setScrolled] = useState({ at: "", top: 0 });
  // The wheel over the screen scrolls its page, as a terminal does, until
  // the page ends; then it scrolls the site. React's wheel handler is
  // passive, so it is added here, and reads the screen from a ref.
  const wheel = useRef<{ can: (direction: number) => boolean; by: (lines: number) => void }>({ can: () => false, by: () => {} });
  useEffect(() => {
    const element = screenRef.current;
    if (!element) return;
    // About three lines for a notch of the wheel, as in a terminal.
    const line = 30;
    let rest = 0;
    const onWheel = (event: WheelEvent) => {
      const delta = event.deltaMode === 0 ? event.deltaY : event.deltaY * line;
      if (!wheel.current.can(Math.sign(delta))) {
        rest = 0;
        return;
      }
      event.preventDefault();
      rest += delta;
      const lines = Math.trunc(rest / line);
      if (lines === 0) return;
      rest -= lines * line;
      wheel.current.by(lines);
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [shown]);
  if (data === "failed") return <p className="muted">The terminal gallery did not load. Reload the page to try again.</p>;
  if (data === null) return <p className="muted" role="status">Loading the terminal gallery...</p>;

  const pages = data.pages;
  const [, pageId, stateId] = route.split("/");
  const pageIndex = Math.max(0, pages.findIndex((page) => page.id === pageId));
  const page = pages[pageIndex];
  const stateIndex = Math.max(0, page.states.findIndex((state) => state.id === stateId));
  const state = page.states[stateIndex];
  const href = (p: number, s: number) => {
    const target = pages[p];
    return s === 0 ? `#tui/${target.id}` : `#tui/${target.id}/${target.states[s].id}`;
  };

  const key = `${page.id}/${state.id}`;
  const frames = state.scroll ?? [];
  const top = scrolled.at === key ? scrolled.top : 0;
  /** Scrolls the page on the screen by `lines`, within its ends. */
  const scrollBy = (lines: number) => setScrolled({ at: key, top: Math.min(frames.length, Math.max(0, top + lines)) });
  wheel.current = { can: (direction) => (direction > 0 ? top < frames.length : direction < 0 && top > 0), by: scrollBy };

  // As in the gallery itself: j/k scroll the page, ↑↓ go through the
  // components, and ←→ or h/l through the states of one.
  function onKeyDown(event: KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "j" || event.key === "k") {
      event.preventDefault();
      scrollBy(event.key === "j" ? 1 : -1);
      return;
    }
    const up: [number, number] = [Math.max(0, pageIndex - 1), 0];
    const down: [number, number] = [Math.min(pages.length - 1, pageIndex + 1), 0];
    const left: [number, number] = [pageIndex, Math.max(0, stateIndex - 1)];
    const right: [number, number] = [pageIndex, Math.min(page.states.length - 1, stateIndex + 1)];
    const keys: Record<string, [number, number]> = { ArrowUp: up, ArrowDown: down, ArrowLeft: left, h: left, ArrowRight: right, l: right };
    const to = keys[event.key];
    if (!to) return;
    event.preventDefault();
    window.location.replace(href(...to));
  }

  const [width, height] = state.size;
  const frame = top > 0 ? frames[top - 1] : undefined;
  const rows = state.rows.map(
    (row, y) => frame?.variants?.[name]?.[y] ?? frame?.rows[y] ?? state.variants?.[name]?.[y] ?? row,
  );
  // What a screen reader reads: the screen's text, line by line, without
  // the lines and blocks drawn around it.
  const drawnChars = new RegExp(`[${DRAWN}]`, "g");
  const text = rows
    .map((row) => row.map(([text]) => text).join("").replace(drawnChars, " ").replace(/ {3,}/g, "  ").trim())
    .filter(Boolean)
    .join("\n");
  const screen = (
    <div
      ref={screenRef}
      className="tui-screen"
      role="group"
      aria-roledescription="terminal screen"
      tabIndex={0}
      data-keeps-focus
      aria-label={`${page.name}, ${state.label}: the tui-kiso gallery at ${width} by ${height}`}
      aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight j k"
      onKeyDown={onKeyDown}
    >
      <div
        className="tui-term"
        style={{ "--tui-cols": width, ...styles[state.screen] } as CSSProperties}
        aria-hidden="true"
      >
        {rows.map((row, y) => (
          <div className="tui-row" key={y}>
            {row.map(([text, style, cells], i) => (
              <span key={i} style={{ ...styles[style], width: `${cells}ch` }}>
                {parts(text, cells).map((part, j) =>
                  typeof part === "string" ? (
                    part
                  ) : (
                    <span key={j} className="tui-drawn" data-char={part[0]} style={{ width: `${part[1]}ch` }} />
                  ),
                )}
              </span>
            ))}
          </div>
        ))}
        {/* A click on a name in the screen's sidebar opens it, as the site's
            navigation does. The keys and the site's navigation already
            reach them, so these stay out of the tab order. */}
        {state.links?.map(([y, x, cells, target]) => (
          <a
            key={y}
            className="tui-link"
            href={href(target, 0)}
            tabIndex={-1}
            data-page={pages[target].id}
            style={{ top: `calc(0.65em + ${y * 1.3}em)`, left: `calc(1ch + ${x}ch)`, width: `${cells}ch` }}
          />
        ))}
      </div>
      <pre className="tui-text">{text}</pre>
    </div>
  );

  return (
    <section className="tui-gallery" aria-label={page.name}>
      <div className="layout-preview-caption">
        <p className="muted t-label">
          <strong>{page.name}</strong>. {page.about}
        </p>
        <Badge variant="neutral">Snapshot</Badge>
      </div>
      {page.states.length > 1 && (
        <Navigation aria-label={`${page.name} states`}>
          <NavigationList className="nav-row">
            {page.states.map((s, i) => (
              <NavigationItem key={s.id}>
                <NavigationLink href={href(pageIndex, i)} active={i === stateIndex} data-keeps-focus>
                  {s.label}
                </NavigationLink>
              </NavigationItem>
            ))}
          </NavigationList>
        </Navigation>
      )}
      <Card className="tui-frame">
        <div className="tui-stage hatch">{screen}</div>
      </Card>
      <p className="muted t-label">
        On the screen, <kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> change the component,{" "}
        <kbd className="kbd">←</kbd> <kbd className="kbd">→</kbd> its state, and <kbd className="kbd">j</kbd>{" "}
        <kbd className="kbd">k</kbd> or the wheel scroll its page. To run it:
      </p>
      <pre className="tui-run">
        <code>cargo run --manifest-path crates/tui-kiso/Cargo.toml --example gallery</code>
      </pre>
    </section>
  );
}
