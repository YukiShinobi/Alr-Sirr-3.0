import 'dotenv/config';
import {
  ActivityType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes
} from 'discord.js';
import { commands } from './commands.js';
import {
  DOCTRINE,
  RINGS,
  chooseLeaderResponse,
  generateCodename,
  hasClearance,
  meritRank,
  questVisibleTo,
  sanitizeCodename
} from './core.js';
import { addAudit, readStore, updateStore } from './storage.js';

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID, ORDER_ADMIN_ROLE_ID, ORDER_BROADCAST_CHANNEL_ID } = process.env;
if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_GUILD_ID) throw new Error('DISCORD_TOKEN, DISCORD_CLIENT_ID and DISCORD_GUILD_ID are required.');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const now = () => new Date().toISOString();

function isAdmin(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return true;
  return ORDER_ADMIN_ROLE_ID ? interaction.member?.roles?.cache?.has(ORDER_ADMIN_ROLE_ID) ?? false : false;
}

function blankMember(userId) {
  return { userId, codename: null, ring: RINGS[0], joinedAt: now(), merit: 0, standing: 'active', circleId: null, acceptedQuests: [], completedQuests: 0 };
}

function member(store, userId) {
  return { ...blankMember(userId), ...(store.members[userId] ?? {}) };
}

function initiated(store, userId) {
  const record = store.members[userId];
  return record?.codename ? member(store, userId) : null;
}

function codename(store, userId) {
  return member(store, userId).codename ?? 'Unnamed Operative';
}

function embed(title, description, color = 0x151515) {
  return new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setFooter({ text: 'Alr-Sirr • The Order of Qamar • Minecraft roleplay' }).setTimestamp();
}

async function fail(interaction, text) {
  const payload = { content: `⟡ ${text}`, ephemeral: true };
  if (interaction.replied || interaction.deferred) return interaction.followUp(payload);
  return interaction.reply(payload);
}

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  await rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID), { body: commands });
}

async function handleInitiate(interaction) {
  const result = await updateStore(store => {
    const existing = initiated(store, interaction.user.id);
    if (existing) return { existing: true, record: existing };
    const names = Object.values(store.members).map(x => x.codename).filter(Boolean);
    const record = { ...blankMember(interaction.user.id), codename: generateCodename(names) };
    store.members[interaction.user.id] = record;
    addAudit(store, 'member.initiated', interaction.user.id, { codename: record.codename });
    return { existing: false, record };
  });
  const text = result.existing
    ? `You are already registered as **${result.record.codename}**.`
    : `Alr-Sirr records your Order persona as **${result.record.codename}** of the **${result.record.ring}**.\n\nCodenames are roleplay aliases; Discord moderators still retain normal platform visibility.`;
  return interaction.reply({ embeds: [embed('Initiation', text, 0x4b0f0f)], ephemeral: true });
}

async function handleOrder(interaction) {
  const store = await readStore();
  const me = initiated(store, interaction.user.id);
  if (!me) return fail(interaction, 'Use `/initiate` first.');
  const quests = store.quests.filter(q => questVisibleTo(me, q)).length;
  const total = Object.values(store.members).filter(x => x.codename).length;
  return interaction.reply({ embeds: [embed('Briefing from Alr-Sirr', `**${me.codename}**, your place in The Order is recognized.`).addFields(
    { name: 'Ring', value: me.ring, inline: true },
    { name: 'Available quests', value: String(quests), inline: true },
    { name: 'Operatives', value: String(total), inline: true },
    { name: 'Doctrine', value: DOCTRINE[(new Date().getUTCDate() - 1) % DOCTRINE.length] }
  )], ephemeral: true });
}

async function handleDossier(interaction) {
  const store = await readStore();
  const me = initiated(store, interaction.user.id);
  if (!me) return fail(interaction, 'Use `/initiate` first.');
  const circle = store.circles.find(c => c.id === me.circleId);
  const active = store.quests.filter(q => q.status === 'active' && q.assignees?.includes(interaction.user.id)).length;
  const sanctions = store.sanctions.filter(s => s.userId === interaction.user.id).length;
  return interaction.reply({ embeds: [embed('Operative Dossier', 'Your roleplay record inside The Order.').addFields(
    { name: 'Codename', value: me.codename, inline: true },
    { name: 'Ring', value: me.ring, inline: true },
    { name: 'Standing', value: me.standing, inline: true },
    { name: 'Merit', value: `${me.merit} • ${meritRank(me.merit)}`, inline: true },
    { name: 'Circle', value: circle?.name ?? 'Unassigned', inline: true },
    { name: 'Active quests', value: String(active), inline: true },
    { name: 'Completed quests', value: String(me.completedQuests ?? 0), inline: true },
    { name: 'Sanctions', value: String(sanctions), inline: true }
  )], ephemeral: true });
}

async function handleDoctrine(interaction) {
  const store = await readStore();
  if (!initiated(store, interaction.user.id)) return fail(interaction, 'Use `/initiate` first.');
  const line = DOCTRINE[Math.floor(Math.random() * DOCTRINE.length)];
  return interaction.reply({ embeds: [embed('Doctrine of Qamar', `> ${line}`)], ephemeral: true });
}

async function handleLeader(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'counsel') {
    const store = await readStore();
    const me = initiated(store, interaction.user.id);
    if (!me) return fail(interaction, 'Use `/initiate` first.');
    const question = interaction.options.getString('question', true);
    return interaction.reply({ embeds: [embed('Counsel from Alr-Sirr', `**Question:** ${question}\n\n> ${chooseLeaderResponse(`${me.codename}:${question}`)}`)], ephemeral: true });
  }
  if (!isAdmin(interaction)) return fail(interaction, 'Only Order command may issue a decree.');
  const text = interaction.options.getString('text', true);
  await updateStore(store => {
    store.decrees.push({ id: store.decrees.length + 1, text, at: now() });
    addAudit(store, 'leader.decree', interaction.user.id, { text });
  });
  return interaction.reply({ embeds: [embed('Decree of Alr-Sirr', `> ${text}`, 0x4b0f0f)] });
}

async function handleCodename(interaction) {
  const sub = interaction.options.getSubcommand();
  const result = await updateStore(store => {
    const me = initiated(store, interaction.user.id);
    if (!me) return { error: 'init' };
    const used = Object.values(store.members).filter(x => x.userId !== interaction.user.id && x.codename).map(x => x.codename.toLowerCase());
    const name = sub === 'regenerate' ? generateCodename(used) : sanitizeCodename(interaction.options.getString('name', true));
    if (name.length < 2) return { error: 'short' };
    if (used.includes(name.toLowerCase())) return { error: 'taken' };
    const old = me.codename;
    me.codename = name;
    store.members[interaction.user.id] = me;
    addAudit(store, 'member.codename_changed', interaction.user.id, { old, name });
    return { name };
  });
  if (result.error === 'init') return fail(interaction, 'Use `/initiate` first.');
  if (result.error === 'short') return fail(interaction, 'Codename is too short.');
  if (result.error === 'taken') return fail(interaction, 'That codename is already in use.');
  return interaction.reply({ content: `Your roleplay codename is now **${result.name}**.`, ephemeral: true });
}

async function handleRing(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'assign') {
    if (!isAdmin(interaction)) return fail(interaction, 'Only Order command may assign rings.');
    const user = interaction.options.getUser('member', true);
    const ring = interaction.options.getString('ring', true);
    const result = await updateStore(store => {
      const target = initiated(store, user.id);
      if (!target) return null;
      target.ring = ring;
      store.members[user.id] = target;
      addAudit(store, 'member.ring_assigned', interaction.user.id, { target: user.id, ring });
      return target.codename;
    });
    if (!result) return fail(interaction, 'That member is not initiated.');
    return interaction.reply({ content: `**${result}** is now in **${ring}**.`, ephemeral: true });
  }
  const store = await readStore();
  if (!initiated(store, interaction.user.id)) return fail(interaction, 'Use `/initiate` first.');
  const text = RINGS.map(ring => {
    const names = Object.values(store.members).filter(x => x.ring === ring && x.codename).map(x => x.codename);
    return `**${ring}** — ${names.length}\n${names.join(', ') || 'No operatives'}`;
  }).join('\n\n');
  return interaction.reply({ embeds: [embed('Order Roster', text)], ephemeral: true });
}

async function handleQuest(interaction) {
  const sub = interaction.options.getSubcommand();
  const store = await readStore();
  const me = initiated(store, interaction.user.id);
  if (!me) return fail(interaction, 'Use `/initiate` first.');

  if (sub === 'create') {
    if (!isAdmin(interaction)) return fail(interaction, 'Only Order command may create quests.');
    const quest = await updateStore(s => {
      const id = s.quests.reduce((max, q) => Math.max(max, q.id ?? 0), 0) + 1;
      const q = {
        id,
        title: interaction.options.getString('title', true),
        objective: interaction.options.getString('objective', true),
        clearance: interaction.options.getString('ring', true),
        reward: interaction.options.getString('reward') ?? 'Order recognition',
        status: 'active', assignees: [], createdAt: now()
      };
      s.quests.push(q);
      addAudit(s, 'quest.created', interaction.user.id, { questId: id });
      return q;
    });
    return interaction.reply({ embeds: [embed(`Quest #${quest.id}: ${quest.title}`, quest.objective).addFields({ name: 'Minimum ring', value: quest.clearance }, { name: 'Reward', value: quest.reward })], ephemeral: true });
  }

  if (sub === 'list') {
    const list = store.quests.filter(q => questVisibleTo(me, q));
    const text = list.length ? list.map(q => `**#${q.id} — ${q.title}**\n${q.clearance} • ${q.assignees?.length ?? 0} accepted`).join('\n\n') : 'No quests available.';
    return interaction.reply({ embeds: [embed('Quest Board', text)], ephemeral: true });
  }

  const id = interaction.options.getInteger('id', true);
  const quest = store.quests.find(q => q.id === id);
  if (!quest) return fail(interaction, 'Quest not found.');
  if (!hasClearance(me, quest.clearance) && !isAdmin(interaction)) return fail(interaction, 'Your ring is too low for that quest.');

  if (sub === 'brief') return interaction.reply({ embeds: [embed(`Quest #${quest.id}: ${quest.title}`, quest.objective).addFields({ name: 'Ring', value: quest.clearance }, { name: 'Reward', value: quest.reward }, { name: 'Status', value: quest.status })], ephemeral: true });

  if (sub === 'accept') {
    if (quest.status !== 'active') return fail(interaction, 'That quest is closed.');
    const name = await updateStore(s => {
      const q = s.quests.find(x => x.id === id);
      q.assignees ??= [];
      if (!q.assignees.includes(interaction.user.id)) q.assignees.push(interaction.user.id);
      const record = member(s, interaction.user.id);
      record.acceptedQuests ??= [];
      if (!record.acceptedQuests.includes(id)) record.acceptedQuests.push(id);
      s.members[interaction.user.id] = record;
      addAudit(s, 'quest.accepted', interaction.user.id, { questId: id });
      return record.codename;
    });
    return interaction.reply({ content: `**${name}** accepted Quest #${id}.`, ephemeral: true });
  }

  if (sub === 'report') {
    if (!quest.assignees?.includes(interaction.user.id) && !isAdmin(interaction)) return fail(interaction, 'You are not assigned to that quest.');
    const report = interaction.options.getString('report', true);
    await updateStore(s => {
      s.reports.push({ id: s.reports.length + 1, questId: id, codename: codename(s, interaction.user.id), report, at: now() });
      addAudit(s, 'quest.reported', interaction.user.id, { questId: id });
    });
    return interaction.reply({ content: 'Quest report recorded.', ephemeral: true });
  }

  if (sub === 'complete') {
    if (!isAdmin(interaction)) return fail(interaction, 'Only Order command may close quests.');
    await updateStore(s => {
      const q = s.quests.find(x => x.id === id);
      q.status = 'complete';
      q.completedAt = now();
      for (const userId of q.assignees ?? []) {
        const record = member(s, userId);
        record.completedQuests = (record.completedQuests ?? 0) + 1;
        record.merit = (record.merit ?? 0) + 5;
        s.members[userId] = record;
      }
      addAudit(s, 'quest.completed', interaction.user.id, { questId: id });
    });
    return interaction.reply({ content: `Quest #${id} closed. Assigned operatives received +5 merit.`, ephemeral: true });
  }
}

async function handleBase(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'add') {
    if (!isAdmin(interaction)) return fail(interaction, 'Only Order command may register bases.');
    const base = await updateStore(store => {
      const item = { id: store.sanctuaries.length + 1, name: interaction.options.getString('name', true), location: interaction.options.getString('location', true), clearance: interaction.options.getString('ring', true) };
      store.sanctuaries.push(item);
      addAudit(store, 'base.added', interaction.user.id, { baseId: item.id });
      return item;
    });
    return interaction.reply({ content: `Base **${base.name}** registered.`, ephemeral: true });
  }
  const store = await readStore();
  const me = initiated(store, interaction.user.id);
  if (!me) return fail(interaction, 'Use `/initiate` first.');
  const list = store.sanctuaries.filter(x => hasClearance(me, x.clearance));
  const text = list.length ? list.map(x => `**${x.name}** — ${x.location}\n${x.clearance}`).join('\n\n') : 'No bases available to your ring.';
  return interaction.reply({ embeds: [embed('Order Bases', text)], ephemeral: true });
}

async function handleCircle(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'create') {
    if (!isAdmin(interaction)) return fail(interaction, 'Only Order command may create circles.');
    const circle = await updateStore(store => {
      const item = { id: store.circles.length + 1, name: interaction.options.getString('name', true), purpose: interaction.options.getString('purpose', true), members: [] };
      store.circles.push(item);
      addAudit(store, 'circle.created', interaction.user.id, { circleId: item.id });
      return item;
    });
    return interaction.reply({ content: `Circle **${circle.name}** created.`, ephemeral: true });
  }
  if (sub === 'assign') {
    if (!isAdmin(interaction)) return fail(interaction, 'Only Order command may assign circles.');
    const user = interaction.options.getUser('member', true);
    const id = interaction.options.getInteger('id', true);
    const result = await updateStore(store => {
      const circle = store.circles.find(x => x.id === id);
      const target = initiated(store, user.id);
      if (!circle || !target) return null;
      for (const c of store.circles) c.members = (c.members ?? []).filter(uid => uid !== user.id);
      circle.members.push(user.id);
      target.circleId = id;
      store.members[user.id] = target;
      addAudit(store, 'circle.assigned', interaction.user.id, { target: user.id, circleId: id });
      return { name: target.codename, circle: circle.name };
    });
    if (!result) return fail(interaction, 'Circle or initiated member not found.');
    return interaction.reply({ content: `**${result.name}** assigned to **${result.circle}**.`, ephemeral: true });
  }
  const store = await readStore();
  const me = initiated(store, interaction.user.id);
  if (!me) return fail(interaction, 'Use `/initiate` first.');
  const circle = store.circles.find(x => x.id === me.circleId);
  if (!circle) return interaction.reply({ content: 'You are not assigned to a circle.', ephemeral: true });
  const names = circle.members.map(id => codename(store, id));
  return interaction.reply({ embeds: [embed(`Circle ${circle.name}`, `${circle.purpose}\n\n${names.join(', ')}`)], ephemeral: true });
}

async function handleLore(interaction) {
  const sub = interaction.options.getSubcommand();
  const store = await readStore();
  const me = initiated(store, interaction.user.id);
  if (!me) return fail(interaction, 'Use `/initiate` first.');
  if (sub === 'add') {
    const ring = interaction.options.getString('ring', true);
    if (!hasClearance(me, ring) && !isAdmin(interaction)) return fail(interaction, 'You cannot post lore above your own ring.');
    await updateStore(s => {
      s.lore.push({ id: s.lore.length + 1, subject: interaction.options.getString('subject', true), details: interaction.options.getString('details', true), clearance: ring, sourceCodename: codename(s, interaction.user.id), at: now() });
      addAudit(s, 'lore.added', interaction.user.id, { ring });
    });
    return interaction.reply({ content: 'Lore note added.', ephemeral: true });
  }
  const list = store.lore.filter(x => hasClearance(me, x.clearance)).slice(-10).reverse();
  const text = list.length ? list.map(x => `**#${x.id} ${x.subject}**\n${x.details}\n_${x.clearance} • ${x.sourceCodename}_`).join('\n\n') : 'No lore notes available.';
  return interaction.reply({ embeds: [embed('Lore Archive', text)], ephemeral: true });
}

async function handleMerit(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'award') {
    if (!isAdmin(interaction)) return fail(interaction, 'Only Order command may change merit.');
    const user = interaction.options.getUser('member', true);
    const points = interaction.options.getInteger('points', true);
    const reason = interaction.options.getString('reason', true);
    const result = await updateStore(store => {
      const target = initiated(store, user.id);
      if (!target) return null;
      target.merit = (target.merit ?? 0) + points;
      store.members[user.id] = target;
      addAudit(store, 'merit.changed', interaction.user.id, { target: user.id, points, reason });
      return target;
    });
    if (!result) return fail(interaction, 'That member is not initiated.');
    return interaction.reply({ content: `**${result.codename}** now has ${result.merit} merit (${meritRank(result.merit)}).`, ephemeral: true });
  }
  const store = await readStore();
  const me = initiated(store, interaction.user.id);
  if (!me) return fail(interaction, 'Use `/initiate` first.');
  return interaction.reply({ content: `**${me.codename}** — ${me.merit} merit • ${meritRank(me.merit)}.`, ephemeral: true });
}

async function handleSanction(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'issue') {
    if (!isAdmin(interaction)) return fail(interaction, 'Only Order command may issue sanctions.');
    const user = interaction.options.getUser('member', true);
    const reason = interaction.options.getString('reason', true);
    const name = await updateStore(store => {
      const target = initiated(store, user.id);
      if (!target) return null;
      store.sanctions.push({ id: store.sanctions.length + 1, userId: user.id, codename: target.codename, reason, at: now() });
      addAudit(store, 'sanction.issued', interaction.user.id, { target: user.id, reason });
      return target.codename;
    });
    if (!name) return fail(interaction, 'That member is not initiated.');
    return interaction.reply({ content: `A roleplay sanction was recorded for **${name}**.`, ephemeral: true });
  }
  const store = await readStore();
  const me = initiated(store, interaction.user.id);
  if (!me) return fail(interaction, 'Use `/initiate` first.');
  const list = store.sanctions.filter(x => x.userId === interaction.user.id);
  const text = list.length ? list.map(x => `#${x.id} — ${x.reason}`).join('\n') : 'No sanctions recorded.';
  return interaction.reply({ embeds: [embed('Disciplinary Record', text)], ephemeral: true });
}

async function handleProtocol(interaction) {
  const text = [
    '**1.** Codenames are roleplay aliases, not a way to evade Discord moderation.',
    '**2.** Server staff can still identify users through normal Discord tools and internal audit records.',
    '**3.** Quests, bases, circles and lore are Minecraft-only roleplay systems.',
    '**4.** Never store passwords, personal data, doxxing, threats, or real-world illegal plans in the bot.',
    '**5.** Follow the Minecraft server rules and Discord Terms of Service.'
  ].join('\n');
  return interaction.reply({ embeds: [embed('Order Protocol', text)], ephemeral: true });
}

async function handleHelp(interaction) {
  const text = [
    '`/initiate` get a roleplay codename',
    '`/order` status briefing',
    '`/leader counsel` consult Alr-Sirr',
    '`/leader decree` publish an in-game decree',
    '`/dossier` view your profile',
    '`/codename` change alias',
    '`/ring` ranks and roster',
    '`/quest` quest board and reports',
    '`/base` Minecraft bases',
    '`/circle` roleplay teams',
    '`/lore` lore archive',
    '`/merit` reputation system',
    '`/sanction` roleplay discipline',
    '`/doctrine` Order philosophy',
    '`/protocol` safety and identity rules'
  ].join('\n');
  return interaction.reply({ embeds: [embed('Alr-Sirr Systems', text)], ephemeral: true });
}

async function broadcastDailyDirective() {
  if (!ORDER_BROADCAST_CHANNEL_ID) return;
  const channel = await client.channels.fetch(ORDER_BROADCAST_CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased()) return;
  const state = await updateStore(store => {
    const i = store.settings.directiveIndex % DOCTRINE.length;
    store.settings.directiveIndex = i + 1;
    return { doctrine: DOCTRINE[i], decree: store.decrees.at(-1)?.text };
  });
  const text = state.decree ? `${state.doctrine}\n\n**Standing decree:** ${state.decree}` : state.doctrine;
  await channel.send({ embeds: [embed('Daily Directive from Alr-Sirr', `> ${text}`, 0x4b0f0f)] }).catch(() => {});
}

client.once('ready', readyClient => {
  console.log(`Alr-Sirr online as ${readyClient.user.tag}`);
  readyClient.user.setPresence({ activities: [{ name: 'The Order of Qamar', type: ActivityType.Watching }], status: 'dnd' });
  if (ORDER_BROADCAST_CHANNEL_ID) {
    setTimeout(broadcastDailyDirective, 10_000);
    setInterval(broadcastDailyDirective, 24 * 60 * 60 * 1000);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  try {
    switch (interaction.commandName) {
      case 'initiate': return await handleInitiate(interaction);
      case 'order': return await handleOrder(interaction);
      case 'dossier': return await handleDossier(interaction);
      case 'doctrine': return await handleDoctrine(interaction);
      case 'leader': return await handleLeader(interaction);
      case 'codename': return await handleCodename(interaction);
      case 'ring': return await handleRing(interaction);
      case 'quest': return await handleQuest(interaction);
      case 'base': return await handleBase(interaction);
      case 'circle': return await handleCircle(interaction);
      case 'lore': return await handleLore(interaction);
      case 'merit': return await handleMerit(interaction);
      case 'sanction': return await handleSanction(interaction);
      case 'protocol': return await handleProtocol(interaction);
      case 'help': return await handleHelp(interaction);
      default: return fail(interaction, 'Unknown command.');
    }
  } catch (error) {
    console.error(error);
    return fail(interaction, 'An internal error occurred.').catch(() => {});
  }
});

await registerCommands();
await client.login(DISCORD_TOKEN);
