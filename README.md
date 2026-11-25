# NovaPay — Multi-chain Self-Custody Crypto Wallet

NovaPay is a **multi-chain self-custody crypto wallet** delivered as a
**Telegram Mini App**, with Lightning Swap, dynamic staking with real yield,
and an automated B2B gateway for developers.

> **Status:** in development (beta). This repository holds the app's
> frontend and backend built on Base44.
>
> **Live demo:** https://t.me/BINOVIQ_bot

## Features

- **Self-custody multi-chain wallet** — the user keeps their keys.
- **Lightning Swap** — fast swaps between supported chains.
- **Dynamic staking** — staking with real, variable yield.
- **B2B gateway** — automated API access for developers.
- **Telegram Mini App** — the wallet lives inside Telegram.

## Stack

- Frontend: React + Vite
- Backend: Base44 (entities, auth, integrations)
- Language: JavaScript

## Run locally

Prerequisites: Node.js, npm, and the Base44 CLI
(`npm install -g base44@latest`).

```bash
git clone https://github.com/airdropverificados-ship-it/novapay-backend.git
cd novapay-backend
npm install
base44 dev        # full local dev environment (backend + frontend)
```

To work on the frontend only against the hosted backend:

```bash
npm run dev       # open the local URL printed by Vite
```

With `.env.local` in the project root:

```bash
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=https://your-app.base44.app
```

After pushing changes, publish from the Base44 dashboard
(`base44 dashboard open`).

## Docs & support

- Base44 GitHub integration: <https://docs.base44.com/Integrations/Using-GitHub>
- Base44 CLI reference: <https://docs.base44.com/developers/references/cli/commands/introduction>

## Related

- Early Telegram bot prototype: [NovaPay-Wallet](https://github.com/airdropverificados-ship-it/NovaPay-Wallet)

---

© 2026 Julio Barallobre Verdecia. All rights reserved.
