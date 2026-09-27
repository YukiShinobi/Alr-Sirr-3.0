export const RINGS = [
  'Outer Veil',
  'Waxing Ring',
  'Waning Ring',
  'The Eclipse',
  'Inner Crescent'
];

export const RING_LEVEL = Object.fromEntries(RINGS.map((ring, index) => [ring, index + 1]));

const ADJECTIVES = ['Ashen','Silent','Pale','Veiled','Iron','Ivory','Obsidian','Crimson','Hollow','Silver','Night','Dusk'];
const NOUNS = ['Fox','Crescent','Raven','Viper','Lotus','Warden','Specter','Falcon','Wolf','Oracle','Sable','Shade'];

export const DOCTRINE = [
  'Power is borrowed. The Order remembers who forgets that.',
  'A visible blade frightens one room. An unseen hand moves a kingdom.',
  'Balance is not peace. Balance is consequence.',
  'Names are liabilities. Deeds are records.',
  'Do not seek chaos for spectacle. Use disruption only when it changes the board.',
  'Information outranks force. Position outranks noise.',
  'The Order survives because no one operative is the Order.',
  'Mercy and severity are tools. Neither is a virtue by itself.'
];

export const LEADER_RESPONSES = [
  'Observe longer. The first answer is rarely the useful one.',
  'If the move exposes more than it gains, reject it.',
  'Choose the path that preserves the Order after the objective is gone.',
  'Do not confuse urgency with importance.',
  'A crown may be confronted directly. Influence is usually cheaper.',
  'The Order does not need applause. It needs leverage.',
  'Proceed only if you can explain what balance this restores.',
  'Withdraw. A failed operation that remains secret is not always a failure.'
];

export function levelFor(ring) {
  return RING_LEVEL[ring] ?? 1;
}

export function hasClearance(member, requiredRing) {
  return levelFor(member?.ring) >= levelFor(requiredRing);
}

export function generateCodename(existing = []) {
  const used = new Set(existing.map(v => String(v).toLowerCase()));
  for (const adjective of ADJECTIVES) {
    for (const noun of NOUNS) {
      const candidate = `${adjective} ${noun}`;
      if (!used.has(candidate.toLowerCase())) return candidate;
    }
  }
  return `Qamar-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function chooseLeaderResponse(seed = '') {
  const text = String(seed);
  let hash = 0;
  for (const char of text) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return LEADER_RESPONSES[Math.abs(hash) % LEADER_RESPONSES.length];
}

export function meritRank(points = 0) {
  if (points >= 100) return 'Exemplary';
  if (points >= 60) return 'Trusted';
  if (points >= 30) return 'Proven';
  if (points >= 10) return 'Tested';
  return 'Unproven';
}

export function sanitizeCodename(value) {
  return String(value ?? '').replace(/[@#`*_~|<>]/g, '').trim().slice(0, 32);
}

export function missionVisibleTo(member, mission) {
  return mission.status === 'active' && hasClearance(member, mission.clearance);
}

export function publicOperative(member) {
  return {
    codename: member?.codename ?? 'Unnamed Operative',
    ring: member?.ring ?? RINGS[0],
    merit: member?.merit ?? 0,
    standing: member?.standing ?? 'active'
  };
}
