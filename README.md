<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=220&text=ALR-SIRR%203.1&fontAlignY=38&desc=THE%20VOICE%20OF%20THE%20ORDER%20OF%20QAMAR&descAlignY=58&color=0:050505,55:202020,100:5a1616&fontColor=f5f5f5&descColor=d4d4d4" width="100%" />

![Status](https://img.shields.io/badge/status-working%20foundation-7a1f1f?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Discord-111111?style=for-the-badge&logo=discord)
![Runtime](https://img.shields.io/badge/runtime-Node.js-2b2b2b?style=for-the-badge&logo=nodedotjs)
![Tests](https://img.shields.io/badge/core%20tests-passing-4b5563?style=for-the-badge)

**A Discord roleplay command system built for The Order of Qamar on a Minecraft server.**

</div>

---

## Role in The Order

Alr-Sirr is designed to feel like **the leader / voice of The Order**, not a generic utility bot.

Members use roleplay codenames while Discord staff retain normal moderation visibility. The bot issues briefings, doctrine, decrees, quest assignments, rank decisions and progression feedback while maintaining the faction's atmosphere.

## Implemented systems

```txt
LEADER
  counsel responses
  official decrees
  daily doctrine broadcasts
  Order-themed presence

IDENTITY
  initiation
  generated codenames
  custom codenames
  private dossiers

STRUCTURE
  five Order rings
  ring roster
  roleplay circles / teams
  merit and standing
  disciplinary sanctions

MINECRAFT RP
  quest creation
  quest acceptance
  quest briefings
  quest reports
  quest completion + merit rewards
  base / meeting-location registry
  ring-gated lore archive

ENGINEERING
  slash-command registration
  persistent JSON state
  migration from the earlier data model
  audit history
  queued writes
  optional daily broadcast channel
  Node test suite
```

## Main commands

```txt
/initiate
/order
/dossier
/doctrine
/leader counsel
/leader decree
/codename set
/codename regenerate
/ring assign
/ring roster
/quest create
/quest list
/quest accept
/quest brief
/quest report
/quest complete
/base add
/base list
/circle create
/circle assign
/circle mine
/lore add
/lore list
/merit view
/merit award
/sanction issue
/sanction mine
/protocol
/help
```

## Rings

```txt
01  Outer Veil
02  Waxing Ring
03  Waning Ring
04  The Eclipse
05  Inner Crescent
```

Higher rings can access quests, lore and bases intended for lower rings as well as their own level.

## Identity model

Codenames are **roleplay aliases**, not a way to evade moderation. The bot keeps the Discord user ID internally so staff actions, progression and dossiers remain connected to the correct account.

The bot treats quests, bases, circles and lore as Minecraft-roleplay systems and rejects the idea of using the system to hide real-world abuse, threats or illegal activity.

## Setup

Requirements:

- Node.js 20+
- a Discord application / bot
- a Discord server for guild command registration

```bash
npm install
cp .env.example .env
npm test
npm run check
npm start
```

Environment:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_id
DISCORD_GUILD_ID=your_server_id
ORDER_ADMIN_ROLE_ID=optional_order_command_role
ORDER_BROADCAST_CHANNEL_ID=optional_daily_directive_channel
```

Never commit the real bot token.

## Testing

Current tests cover:

- ring hierarchy
- ring access checks
- unique codename generation
- codename sanitization
- quest visibility
- merit thresholds

```bash
npm test
npm run check
```

A live Discord integration test still requires valid Discord credentials and an actual test server.

## Storage

Live state is stored in:

```txt
data/order.json
```

The runtime supports migration from the earlier Alr-Sirr data shape so older mission/cell records can be carried into the quest/circle model.

## Structure

```txt
src/
  index.js       Discord runtime and leader behavior
  commands.js    slash-command definitions
  core.js        rings, codenames, merit and access logic
  storage.js     persistent state, migration and audit history

test/
  core.test.js   core behavior tests

data/
  .gitkeep
```

---

<div align="center">

### THE ORDER OF QAMAR

**Power is given. Power can be taken.**

</div>
