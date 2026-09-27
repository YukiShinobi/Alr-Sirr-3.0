import { SlashCommandBuilder } from 'discord.js';
import { RINGS } from './core.js';

const ringChoices = RINGS.map(ring => ({ name: ring, value: ring }));

export const commands = [
  new SlashCommandBuilder().setName('order').setDescription('Receive a Minecraft-roleplay status briefing from Alr-Sirr.'),
  new SlashCommandBuilder().setName('initiate').setDescription('Join The Order roleplay and receive a codename.'),
  new SlashCommandBuilder().setName('dossier').setDescription('View your private roleplay dossier.'),
  new SlashCommandBuilder().setName('doctrine').setDescription('Receive one doctrine of The Order.'),
  new SlashCommandBuilder()
    .setName('leader').setDescription('Consult the fictional leader voice of The Order.')
    .addSubcommand(s => s.setName('counsel').setDescription('Ask Alr-Sirr for in-game roleplay counsel.').addStringOption(o => o.setName('question').setDescription('Roleplay question').setRequired(true).setMaxLength(300)))
    .addSubcommand(s => s.setName('decree').setDescription('Issue an official in-game decree as Order command.').addStringOption(o => o.setName('text').setDescription('Decree').setRequired(true).setMaxLength(1000))),
  new SlashCommandBuilder()
    .setName('codename').setDescription('Manage your roleplay codename.')
    .addSubcommand(s => s.setName('set').setDescription('Set your codename.').addStringOption(o => o.setName('name').setDescription('Codename').setRequired(true).setMaxLength(32)))
    .addSubcommand(s => s.setName('regenerate').setDescription('Request a fresh generated codename.')),
  new SlashCommandBuilder()
    .setName('ring').setDescription('Manage fictional Order ranks.')
    .addSubcommand(s => s.setName('assign').setDescription('Assign a member to a ring.').addUserOption(o => o.setName('member').setDescription('Discord member').setRequired(true)).addStringOption(o => o.setName('ring').setDescription('Ring').setRequired(true).addChoices(...ringChoices)))
    .addSubcommand(s => s.setName('roster').setDescription('View ring totals and codenames.')),
  new SlashCommandBuilder()
    .setName('quest').setDescription('Manage Minecraft roleplay quests.')
    .addSubcommand(s => s.setName('create').setDescription('Create an in-game quest.').addStringOption(o => o.setName('title').setDescription('Title').setRequired(true).setMaxLength(80)).addStringOption(o => o.setName('objective').setDescription('Minecraft roleplay objective').setRequired(true).setMaxLength(800)).addStringOption(o => o.setName('ring').setDescription('Minimum ring').setRequired(true).addChoices(...ringChoices)).addStringOption(o => o.setName('reward').setDescription('Optional in-game reward or recognition').setMaxLength(100)))
    .addSubcommand(s => s.setName('list').setDescription('List quests available to your ring.'))
    .addSubcommand(s => s.setName('accept').setDescription('Accept an in-game quest.').addIntegerOption(o => o.setName('id').setDescription('Quest ID').setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName('brief').setDescription('Read an in-game quest briefing.').addIntegerOption(o => o.setName('id').setDescription('Quest ID').setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName('report').setDescription('Submit an in-game quest report.').addIntegerOption(o => o.setName('id').setDescription('Quest ID').setRequired(true).setMinValue(1)).addStringOption(o => o.setName('report').setDescription('Roleplay report').setRequired(true).setMaxLength(1200)))
    .addSubcommand(s => s.setName('complete').setDescription('Close an in-game quest.').addIntegerOption(o => o.setName('id').setDescription('Quest ID').setRequired(true).setMinValue(1))),
  new SlashCommandBuilder()
    .setName('base').setDescription('Manage Minecraft Order bases and meeting locations.')
    .addSubcommand(s => s.setName('add').setDescription('Register an in-game base.').addStringOption(o => o.setName('name').setDescription('Base codename').setRequired(true).setMaxLength(50)).addStringOption(o => o.setName('location').setDescription('Minecraft region or coordinates').setRequired(true).setMaxLength(120)).addStringOption(o => o.setName('ring').setDescription('Minimum ring').setRequired(true).addChoices(...ringChoices)))
    .addSubcommand(s => s.setName('list').setDescription('List bases available to your ring.')),
  new SlashCommandBuilder()
    .setName('circle').setDescription('Manage roleplay teams inside The Order.')
    .addSubcommand(s => s.setName('create').setDescription('Create a roleplay circle.').addStringOption(o => o.setName('name').setDescription('Circle codename').setRequired(true).setMaxLength(40)).addStringOption(o => o.setName('purpose').setDescription('In-game purpose').setRequired(true).setMaxLength(300)))
    .addSubcommand(s => s.setName('assign').setDescription('Assign an operative to a circle.').addUserOption(o => o.setName('member').setDescription('Member').setRequired(true)).addIntegerOption(o => o.setName('id').setDescription('Circle ID').setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName('mine').setDescription('View your circle assignment.')),
  new SlashCommandBuilder()
    .setName('lore').setDescription('Store and retrieve Minecraft roleplay lore notes.')
    .addSubcommand(s => s.setName('add').setDescription('Submit a lore note.').addStringOption(o => o.setName('subject').setDescription('Subject').setRequired(true).setMaxLength(80)).addStringOption(o => o.setName('details').setDescription('Roleplay details').setRequired(true).setMaxLength(1200)).addStringOption(o => o.setName('ring').setDescription('Minimum ring').setRequired(true).addChoices(...ringChoices)))
    .addSubcommand(s => s.setName('list').setDescription('View lore notes available to your ring.')),
  new SlashCommandBuilder()
    .setName('merit').setDescription('Manage or view roleplay merit.')
    .addSubcommand(s => s.setName('view').setDescription('View your standing.'))
    .addSubcommand(s => s.setName('award').setDescription('Award or deduct roleplay merit.').addUserOption(o => o.setName('member').setDescription('Member').setRequired(true)).addIntegerOption(o => o.setName('points').setDescription('Positive or negative points').setRequired(true).setMinValue(-100).setMaxValue(100)).addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true).setMaxLength(200))),
  new SlashCommandBuilder()
    .setName('sanction').setDescription('Record in-game disciplinary action.')
    .addSubcommand(s => s.setName('issue').setDescription('Issue a roleplay sanction.').addUserOption(o => o.setName('member').setDescription('Member').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true).setMaxLength(300)))
    .addSubcommand(s => s.setName('mine').setDescription('View sanctions on your own dossier.')),
  new SlashCommandBuilder().setName('protocol').setDescription('View codename and Minecraft-roleplay safety protocol.'),
  new SlashCommandBuilder().setName('help').setDescription('View Alr-Sirr command groups and capabilities.')
].map(command => command.toJSON());
