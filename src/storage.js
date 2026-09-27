import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'order.json');

export const defaults = {
  members: {},
  quests: [],
  sanctuaries: [],
  circles: [],
  lore: [],
  messages: [],
  decrees: [],
  reports: [],
  sanctions: [],
  audit: [],
  phrases: [
    { challenge: 'When the moon is hidden?', response: 'Its light still remains.' },
    { challenge: 'Who judges the crown?', response: 'Those beyond its reach.' },
    { challenge: 'What survives the eclipse?', response: 'The Order.' },
    { challenge: 'What is given may be?', response: 'Taken.' },
    { challenge: 'Where does Qamar stand?', response: 'Between light and shadow.' }
  ],
  settings: { directiveIndex: 0 }
};

let queue = Promise.resolve();

function migrate(raw = {}) {
  return {
    ...structuredClone(defaults),
    ...raw,
    quests: raw.quests ?? raw.missions ?? [],
    circles: raw.circles ?? raw.cells ?? [],
    lore: raw.lore ?? raw.intel ?? [],
    messages: raw.messages ?? raw.deadDrops ?? [],
    phrases: raw.phrases ?? raw.countersigns ?? defaults.phrases,
    settings: { ...defaults.settings, ...(raw.settings ?? {}) }
  };
}

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
  return migrate(JSON.parse(raw));
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

export function addAudit(store, action, actorId, details = {}) {
  store.audit.push({ id: store.audit.length + 1, action, actorId, details, at: new Date().toISOString() });
  if (store.audit.length > 1000) store.audit = store.audit.slice(-1000);
}
