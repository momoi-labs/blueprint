// One browser suite per machine. Two suites at once starve Chromium and trip
// timeouts, so run-browser-checks and run-gallery-tests take this lock first.
// The lock is a directory under the OS temp dir with the holder's pid inside.
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const dir = join(tmpdir(), 'kiso-browser.lock');

function holder() {
  try { return Number(readFileSync(join(dir, 'pid'), 'utf8')); } catch { return NaN; }
}

function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (error) { return error.code === 'EPERM'; }
}

// Two waiters that both see a stale lock in the same 2s window can both take
// it. Rare enough to accept: the waiters sleep, the holder's pid is checked.
function stale() {
  const pid = holder();
  if (pid) return !alive(pid);
  // A holder writes its pid right after mkdir; a lock without one is a crash.
  try { return Date.now() - statSync(dir).mtimeMs > 10_000; } catch { return true; }
}

export async function lockBrowser() {
  let waited = false;
  for (;;) {
    try { mkdirSync(dir); break; } catch (error) { if (error.code !== 'EEXIST') throw error; }
    if (stale()) { rmSync(dir, { recursive: true, force: true }); continue; }
    if (!waited) {
      console.log(`Waiting for the browser suite in process ${holder() || '?'} to finish (${dir})`);
      waited = true;
    }
    await sleep(2000);
  }
  writeFileSync(join(dir, 'pid'), String(process.pid));
  // Released on exit only. Runners forward signals to their children and exit
  // once those are gone, so a killed suite never leaves Chromium behind the lock.
  const release = () => rmSync(dir, { recursive: true, force: true });
  process.on('exit', release);
  return release;
}
