import { appendFileSync, closeSync, mkdtempSync, openSync, readSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { StringDecoder } from 'node:string_decoder';
import { join, relative, resolve } from 'node:path';

const firstLine = error => String(error?.cause?.message ?? error?.message ?? error ?? '').split('\n')[0];

export default async function* reporter(source) {
  for await (const { type, data } of source) {
    if (type === 'test:diagnostic' && data.file && data.message.startsWith('Error: ')) yield `${JSON.stringify({ type, file: data.file, error: firstLine(data.message) })}\n`;
    if (type !== 'test:dequeue' && type !== 'test:pass' && type !== 'test:fail') continue;
    const event = { type, name: data.name, file: data.file, nesting: data.nesting };
    if (data.skip || data.todo) event.skipped = true;
    if (type === 'test:fail') Object.assign(event, { error: firstLine(data.details?.error), kind: data.details?.error?.failureType });
    yield `${JSON.stringify(event)}\n`;
  }
}

export function track(root) {
  const dir = mkdtempSync(join(tmpdir(), 'kiso-test-events-'));
  const path = join(dir, 'events.jsonl');
  closeSync(openSync(path, 'w'));
  let offset = 0;
  let rest = '';
  const decoder = new StringDecoder('utf8');
  const running = new Map();
  const failed = [];
  const notes = new Map();
  const state = {
    passed: 0,
    last: Date.now(),
    args: ['--test-reporter=spec', '--test-reporter-destination=stdout', `--test-reporter=${new URL(import.meta.url).pathname}`, `--test-reporter-destination=${path}`],
  };
  const isFile = event => event.nesting === 0 && event.file && resolve(root, event.name) === event.file;
  const where = event => (event.file ? relative(root, event.file) : '?');
  const label = event => (isFile(event) ? where(event) : `${where(event)} › ${event.name}`);
  const key = event => `${event.file}\0${event.nesting}\0${event.name}`;
  const take = line => {
    let event;
    try { event = JSON.parse(line); } catch { return; }
    state.last = Date.now();
    if (event.type === 'test:diagnostic') { notes.set(event.file, event.error); return; }
    if (event.type === 'test:dequeue') { running.set(key(event), event); return; }
    running.delete(key(event));
    if (event.type === 'test:pass' && !isFile(event) && !event.skipped) state.passed++;
    if (event.type === 'test:fail' && event.kind !== 'subtestsFailed') failed.push(event);
  };
  state.read = () => {
    const fd = openSync(path, 'r');
    const buffer = Buffer.alloc(65536);
    for (let size; (size = readSync(fd, buffer, 0, buffer.length, offset)) > 0; offset += size) {
      const lines = (rest + decoder.write(buffer.subarray(0, size))).split('\n');
      rest = lines.pop();
      lines.forEach(take);
    }
    closeSync(fd);
  };
  state.close = () => {
    state.read();
    rmSync(dir, { recursive: true, force: true });
  };
  state.failures = () => failed
    .filter(event => !isFile(event) || !failed.some(other => other.file === event.file && !isFile(other)))
    .map(event => `${label(event)}: ${isFile(event) ? notes.get(event.file) ?? `${event.error} outside any test, see its output` : event.error}`);
  state.stuck = () => [...running.values()]
    .filter(event => !isFile(event) || ![...running.values()].some(other => other.file === event.file && !isFile(other)))
    .map(event => (isFile(event) ? `${where(event)}: hung outside any test` : label(event)));
  return state;
}

export function report(title, lines) {
  if (!lines.length) return;
  console.error(`\n${title}:\n${lines.map(line => `  ${line}`).join('\n')}`);
  if (process.env.GITHUB_ACTIONS !== 'true') return;
  const escape = text => text.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  for (const line of lines.slice(0, 10)) console.log(`::error title=${escape(title)}::${escape(line)}`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### ${title}\n\n${lines.map(line => `- ${line}`).join('\n')}\n\n`);
}
