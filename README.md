<div align="center">

# Alr-Sirr 3.0
### Discord command system for The Order of Qamar.

**Alr-Sirr** is a Discord bot built for **The Order of Qamar**, a covert Minecraft roleplay faction organized around codenames, clearance rings, operations, sanctuaries, and controlled information flow.

![Status](https://img.shields.io/badge/status-working%20foundation-7a1f1f?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Discord-111827?style=for-the-badge&logo=discord)
![Runtime](https://img.shields.io/badge/runtime-Node.js-111827?style=for-the-badge&logo=nodedotjs)
![Library](https://img.shields.io/badge/library-discord.js-5865F2?style=for-the-badge&logo=discord)

</div>

---

## What it does

Alr-Sirr acts as the digital command layer behind **The Order of Qamar** rather than a generic moderation bot.

Implemented systems include:

- operational codenames
- five clearance rings
- member dossiers
- admin-controlled ring assignment
- roleplay mission creation / listing / completion
- sanctuary records
- rotating challenge-response countersigns
- persistent local JSON storage
- Discord slash-command registration
- optional Order-admin role gating

## Commands

```txt
/order
/codename set
/codename view
/ring assign
/ring list
/mission create
/mission list
/mission complete
/sanctuary add
/sanctuary list
/countersign
/dossier
```

Sensitive command functions such as ring assignment, mission creation, mission completion, and sanctuary registration require either Discord Administrator permission or the configured Order command role.

## The Order of Qamar

The Order is a covert Minecraft faction built around influence, compartmentalization, and a deliberately grey morality. Its lore centers on balancing power from the shadows rather than open conquest.

The moon represents the coexistence of light and darkness; the faction's black crescent and downward star symbolize restraint and swift judgement.

### Clearance structure

```txt
01  The Outer Veil
02  The Waxing Ring
03  The Waning Ring
04  The Eclipse
05  Inner Crescent
```

Members operate through codenames, need-to-know information, safe houses, authentication phrases, and mission records.

## Setup

Requirements:

- Node.js 20+
- a Discord application / bot
- a Discord server for command registration

```bash
npm install
cp .env.example .env
npm start
```

Configure `.env`:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_id
DISCORD_GUILD_ID=your_server_id
ORDER_ADMIN_ROLE_ID=optional_command_role_id
```

Never commit the real bot token.

## Storage

Runtime state is written to:

```txt
data/order.json
```

That file is intentionally ignored by Git so live member, mission, and sanctuary data is not committed to the repository.

## Structure

```txt
src/
  index.js       Discord client, handlers, command runtime
  commands.js    slash-command definitions + ring model
  storage.js     persistent JSON store
data/
  .gitkeep
.env.example
package.json
```

## Direction

This is a working foundation, not the final form. Future expansion can add Discord-role synchronization, richer mission assignment, audit logs, configurable doctrine, encrypted/external persistence, and optional Minecraft-server integration.

---

<div align="center">

### THE ORDER OF QAMAR

**Power is given. Power can be taken.**

</div>
