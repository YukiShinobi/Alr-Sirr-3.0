import 'dotenv/config';
import {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes
} from 'discord.js';
import { commands, rings } from './commands.js';
import { readStore, updateStore } from './storage.js';

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID, ORDER_ADMIN_ROLE_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_GUILD_ID) {
  throw new Error('DISCORD_TOKEN, DISCORD_CLIENT_ID and DISCORD_GUILD_ID are required.');
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function isOrderAdmin(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return true;
  if (!ORDER_ADMIN_ROLE_ID) return false;
  return interaction.member?.roles?.cache?.has(ORDER_ADMIN_ROLE_ID) ?? false;
}

function memberRecord(store, user) {
  return store.members[user.id] ?? {
    userId: user.id,
    username: user.username,
    codename: null,
    ring: 'Outer Veil',
    joinedAt: new Date().toISOString()
  };
}

function qamarEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0x141414)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: 'Alr-Sirr 3.0 • The Order of Qamar' })
    .setTimestamp();
}

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID),
    { body: commands }
  );
}

async function handleOrder(interaction) {
  const store = await readStore();
  const active = store.missions.filter(m => m.status === 'active').length;
  const members = Object.values(store.members);
  const ringCounts = rings
    .map(ring => `${ring}: ${members.filter(member => member.ring === ring).length}`)
    .join('\n');

  const embed = qamarEmbed(
    'The Order of Qamar',
    'A covert Minecraft roleplay organization built around secrecy, hierarchy, balance, and controlled influence.'
  )
    .addFields(
      { name: 'Known operatives', value: String(members.length), inline: true },
      { name: 'Active operations', value: String(active), inline: true },
      { name: 'Sanctuaries', value: String(store.sanctuaries.length), inline: true },
      { name: 'Clearance rings', value: ringCounts || 'No members registered.' }
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleCodename(interaction) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'set') {
    const codename = interaction.options.getString('name', true).trim();
    if (codename.length < 2) {
      return interaction.reply({ content: 'Codename must be at least 2 characters.', ephemeral: true });
    }

    await updateStore(store => {
      const record = memberRecord(store, interaction.user);
      store.members[interaction.user.id] = { ...record, codename, username: interaction.user.username };
    });

    return interaction.reply({
      content: `Operational identity confirmed: **${codename}**.`,
      ephemeral: true
    });
  }

  const user = interaction.options.getUser('member') ?? interaction.user;
  const store = await readStore();
  const record = memberRecord(store, user);

  const embed = qamarEmbed('Operative Dossier', `Record for <@${user.id}>`)
    .addFields(
      { name: 'Codename', value: record.codename ?? 'Unassigned', inline: true },
      { name: 'Ring', value: record.ring, inline: true }
    );

  return interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleRing(interaction) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'assign') {
    if (!isOrderAdmin(interaction)) {
      return interaction.reply({ content: 'Only Order command may change clearance.', ephemeral: true });
    }

    const user = interaction.options.getUser('member', true);
    const ring = interaction.options.getString('ring', true);

    await updateStore(store => {
      const record = memberRecord(store, user);
      store.members[user.id] = { ...record, ring, username: user.username };
    });

    return interaction.reply({ content: `<@${user.id}> assigned to **${ring}**.`, ephemeral: true });
  }

  const store = await readStore();
  const members = Object.values(store.members);
  const text = rings.map(ring => {
    const names = members
      .filter(member => member.ring === ring)
      .map(member => member.codename ?? member.username)
      .join(', ');
    return `**${ring}**\n${names || '—'}`;
  }).join('\n\n');

  return interaction.reply({ embeds: [qamarEmbed('Clearance Rings', text)], ephemeral: true });
}

async function handleMission(interaction) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'create') {
    if (!isOrderAdmin(interaction)) {
      return interaction.reply({ content: 'Only Order command may create operations.', ephemeral: true });
    }

    const title = interaction.options.getString('title', true);
    const objective = interaction.options.getString('objective', true);
    const clearance = interaction.options.getString('clearance', true);

    const mission = await updateStore(store => {
      const nextId = store.missions.reduce((max, item) => Math.max(max, item.id), 0) + 1;
      const created = {
        id: nextId,
        title,
        objective,
        clearance,
        status: 'active',
        createdBy: interaction.user.id,
        createdAt: new Date().toISOString()
      };
      store.missions.push(created);
      return created;
    });

    const embed = qamarEmbed(`Operation #${mission.id}: ${mission.title}`, mission.objective)
      .addFields({ name: 'Minimum clearance', value: mission.clearance });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (sub === 'complete') {
    if (!isOrderAdmin(interaction)) {
      return interaction.reply({ content: 'Only Order command may close operations.', ephemeral: true });
    }

    const id = interaction.options.getInteger('id', true);
    const changed = await updateStore(store => {
      const mission = store.missions.find(item => item.id === id);
      if (!mission) return false;
      mission.status = 'complete';
      mission.completedAt = new Date().toISOString();
      return true;
    });

    return interaction.reply({
      content: changed ? `Operation #${id} marked complete.` : `Operation #${id} was not found.`,
      ephemeral: true
    });
  }

  const store = await readStore();
  const active = store.missions.filter(mission => mission.status === 'active');
  const body = active.length
    ? active.map(mission => `**#${mission.id} — ${mission.title}**\n${mission.objective}\nClearance: ${mission.clearance}`).join('\n\n')
    : 'No active operations.';

  return interaction.reply({ embeds: [qamarEmbed('Active Operations', body)], ephemeral: true });
}

async function handleSanctuary(interaction) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'add') {
    if (!isOrderAdmin(interaction)) {
      return interaction.reply({ content: 'Only Order command may register sanctuaries.', ephemeral: true });
    }

    const name = interaction.options.getString('name', true);
    const location = interaction.options.getString('location', true);

    await updateStore(store => {
      store.sanctuaries.push({
        id: store.sanctuaries.length + 1,
        name,
        location,
        createdBy: interaction.user.id,
        createdAt: new Date().toISOString()
      });
    });

    return interaction.reply({ content: `Sanctuary **${name}** registered.`, ephemeral: true });
  }

  const store = await readStore();
  const body = store.sanctuaries.length
    ? store.sanctuaries.map(place => `**${place.name}** — ${place.location}`).join('\n')
    : 'No sanctuaries registered.';

  return interaction.reply({ embeds: [qamarEmbed('Neutral Sanctuaries', body)], ephemeral: true });
}

async function handleCountersign(interaction) {
  const store = await readStore();
  const pair = store.countersigns[Math.floor(Math.random() * store.countersigns.length)];
  return interaction.reply({
    embeds: [qamarEmbed('Countersign Challenge', `**Challenge:** ${pair.challenge}\n**Response:** ||${pair.response}||`)],
    ephemeral: true
  });
}

async function handleDossier(interaction) {
  const store = await readStore();
  const record = memberRecord(store, interaction.user);
  const missionCount = store.missions.filter(mission => mission.status === 'active').length;

  const embed = qamarEmbed('Your Qamar Dossier', `<@${interaction.user.id}>`)
    .addFields(
      { name: 'Codename', value: record.codename ?? 'Unassigned', inline: true },
      { name: 'Ring', value: record.ring, inline: true },
      { name: 'Active operations', value: String(missionCount), inline: true }
    );

  return interaction.reply({ embeds: [embed], ephemeral: true });
}

client.once('ready', readyClient => {
  console.log(`Alr-Sirr online as ${readyClient.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {
      case 'order': return await handleOrder(interaction);
      case 'codename': return await handleCodename(interaction);
      case 'ring': return await handleRing(interaction);
      case 'mission': return await handleMission(interaction);
      case 'sanctuary': return await handleSanctuary(interaction);
      case 'countersign': return await handleCountersign(interaction);
      case 'dossier': return await handleDossier(interaction);
      default: return interaction.reply({ content: 'Unknown command.', ephemeral: true });
    }
  } catch (error) {
    console.error(error);
    const payload = { content: 'Alr-Sirr encountered an internal error.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
});

await registerCommands();
await client.login(DISCORD_TOKEN);
