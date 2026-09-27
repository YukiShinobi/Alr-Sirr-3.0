import { SlashCommandBuilder } from 'discord.js';

export const rings = [
  'Outer Veil',
  'Waxing Ring',
  'Waning Ring',
  'The Eclipse',
  'Inner Crescent'
];

export const commands = [
  new SlashCommandBuilder()
    .setName('order')
    .setDescription('View the current state of The Order of Qamar.'),

  new SlashCommandBuilder()
    .setName('codename')
    .setDescription('Manage an Order codename.')
    .addSubcommand(sub => sub
      .setName('set')
      .setDescription('Set your operational codename.')
      .addStringOption(opt => opt.setName('name').setDescription('Operational codename').setRequired(true).setMaxLength(32)))
    .addSubcommand(sub => sub
      .setName('view')
      .setDescription('View an Order member dossier.')
      .addUserOption(opt => opt.setName('member').setDescription('Member to inspect'))),

  new SlashCommandBuilder()
    .setName('ring')
    .setDescription('Manage Order clearance rings.')
    .addSubcommand(sub => sub
      .setName('assign')
      .setDescription('Assign a member to a clearance ring.')
      .addUserOption(opt => opt.setName('member').setDescription('Member').setRequired(true))
      .addStringOption(opt => opt
        .setName('ring')
        .setDescription('Clearance ring')
        .setRequired(true)
        .addChoices(...rings.map(ring => ({ name: ring, value: ring })))))
    .addSubcommand(sub => sub
      .setName('list')
      .setDescription('List known Order members by ring.')),

  new SlashCommandBuilder()
    .setName('mission')
    .setDescription('Manage Order operations.')
    .addSubcommand(sub => sub
      .setName('create')
      .setDescription('Create an operation.')
      .addStringOption(opt => opt.setName('title').setDescription('Mission title').setRequired(true).setMaxLength(80))
      .addStringOption(opt => opt.setName('objective').setDescription('Roleplay objective').setRequired(true).setMaxLength(500))
      .addStringOption(opt => opt.setName('clearance').setDescription('Minimum clearance ring').setRequired(true).addChoices(...rings.map(ring => ({ name: ring, value: ring })))))
    .addSubcommand(sub => sub.setName('list').setDescription('List active operations.'))
    .addSubcommand(sub => sub
      .setName('complete')
      .setDescription('Mark an operation complete.')
      .addIntegerOption(opt => opt.setName('id').setDescription('Mission ID').setRequired(true).setMinValue(1))),

  new SlashCommandBuilder()
    .setName('sanctuary')
    .setDescription('Manage safe-house locations for roleplay.')
    .addSubcommand(sub => sub
      .setName('add')
      .setDescription('Register a sanctuary.')
      .addStringOption(opt => opt.setName('name').setDescription('Sanctuary codename').setRequired(true).setMaxLength(50))
      .addStringOption(opt => opt.setName('location').setDescription('In-game location or region').setRequired(true).setMaxLength(120)))
    .addSubcommand(sub => sub.setName('list').setDescription('List registered sanctuaries.')),

  new SlashCommandBuilder()
    .setName('countersign')
    .setDescription('Issue one of The Order’s challenge-response phrases.'),

  new SlashCommandBuilder()
    .setName('dossier')
    .setDescription('View your operational dossier.')
].map(command => command.toJSON());
