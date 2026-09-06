import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.join(root, 'packages/kiso');
for (const directory of ['kiso', 'tokens']) {
  await rm(path.join(target, directory), { recursive: true, force: true });
}
await cp(path.join(root, 'kiso'), path.join(target, 'kiso'), {
  recursive: true,
  filter: source => source !== path.join(root, 'kiso/blocks'),
});
await mkdir(path.join(target, 'tokens'), { recursive: true });
await cp(path.join(root, 'tokens/build'), path.join(target, 'tokens/build'), { recursive: true });
await cp(path.join(root, 'LICENSE'), path.join(target, 'LICENSE'));
await cp(path.join(root, 'README.md'), path.join(target, 'README.md'));
