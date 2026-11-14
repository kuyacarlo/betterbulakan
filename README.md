# BetterBulakan

Community-powered civic portal for the **Municipality of Bulakan, Bulacan**.

Forked from [BetterLosBanos/betterlb](https://github.com/BetterLosBanos/betterlb) as part of the [BetterGov.ph](https://bettergov.ph) / [BetterLGU Directory](https://lgu.bettergov.ph/) initiative.

- **Portal:** https://betterbulakan.org
- **Repo:** https://github.com/kuyacarlo/betterbulakan
- **Official LGU (eLGU):** https://elgu-bulacan-bulacan-news.e.gov.ph/home

This portal complements eLGU. It does not replace permits or transactions. It makes public services, officials, ordinances, and transparency data easier to find.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + Kapwa
- pnpm
- Deploy: Cloudflare Pages (static site + Pages Functions in `functions/`)

## Develop

```bash
pnpm install
pnpm run dev
```

Configure LGU identity in [`config/lgu.config.json`](config/lgu.config.json).

Directory data lives under `src/data/directory/`.

## Contribute back upstream

Bug fixes and generic portal improvements: open a PR against [BetterLosBanos/betterlb](https://github.com/BetterLosBanos/betterlb).

Bulakan-only data and branding stay in this fork.

## License

Same as upstream BetterLB (see `LICENSE`).
