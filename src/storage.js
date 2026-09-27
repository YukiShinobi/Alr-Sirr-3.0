import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'order.json');

const defaults = {
  members: {},
  missions: [],
  sanctuaries: [],
  countersigns: [
    { challenge: 'When the moon is hidden?', response: 'Its light still remains.' },
    { challenge: 'Who judges the crown?', response: 'Those beyond its reach.' },
    { challenge: 'What survives the eclipse?', response: 'The Order.' },
    { challenge: 'What is given may be?', response: 'Taken.' },
    { challenge: 'Where does Qamar stand?', response: 'Between light and shadow.' }
  ]
};

let queue = Promise.resolve();

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(defaults, null, 2));
  }
}

export async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(dataFile, 'utf8');
  return { ...structuredClone(defaults), ...JSON.parse(raw) };
}

export function updateStore(mutator) {
  queue = queue.then(async () => {
    const store = await readStore();
    const result = await mutator(store);
    await fs.writeFile(dataFile, JSON.stringify(store, null, 2));
    return result;
  });
  return queue;
}
