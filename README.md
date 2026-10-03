# WEALTHIEST SNAKE CHALLENGE

A mobile-friendly Snake game wrapped in a fictional wealth-building journey. Collect cash, property, gold, investments, banking opportunities, and education rewards; make simulated decisions; compare beginner-friendly investment trade-offs; and track game-only net worth.

## Play

Open `index.html` in a browser, or start a local server in this folder:

```bash
python3 -m http.server 8000
```

Visit <http://localhost:8000>. Use arrow keys or WASD, swipe on a phone, or tap the direction controls. Sound, daily missions, current run, best score, wallet, assets, XP, achievements, and practice moves save in browser storage on that device.

The page is intentionally game-first: visitors reach the Snake board before the full dashboard, money moves, portfolio builder, and lessons. The play experience includes a live wealth command center, reward preview, selectable difficulty, pause/resume, mobile swipe controls, and immediate decision feedback.

## Quick smoke test

Run this after changing the HTML or JavaScript:

```bash
node smoke-test.js
```

It verifies that the page initializes, all educational cards render, the Start button opens the game, and the Snake loop advances without a startup exception.

## Wealth journey

Snake collectibles have different values and effects. A separate original journey track advances as rewards are collected. Players can hold, sell, rent, upgrade, trade, donate, or place eligible assets in a simulated trust category. Cash moves include saving, investing, learning, giving, planned spending, a practice rental purchase, and a luxury purchase. These simplified choices update the fictional dashboard.

Every third collectible now opens a short decision lesson inside the game. The eight-part curriculum covers cash flow, emergency funds, debt, diversification, compounding, productive ownership, protection, and giving/legacy. Players choose among realistic trade-offs, see the simulated consequence on their dashboard, and build principle mastery through repeated decisions. No option is reduced to a simplistic “good” or “bad” label; the outcome explains purpose, risk, opportunity cost, and constraints.

The portfolio builder lets players set a goal, allocate monthly simulated cash, compare a risk mix, estimate annual income, and view hypothetical 1-, 5-, 10-, or 20-year scenarios. Rate assumptions are centralized in `RATE_ASSUMPTIONS` in `game.js` and labeled as educational estimates, not live quotes or forecasts.

## Important

All balances, assets, returns, debts, and transactions are fictional and stored only in the browser. The game does not connect to banks, brokerages, real estate, trusts, crypto, or real money. Projections are hypothetical, actual returns vary, and losses are possible. This is general financial education, not personalized advice.
