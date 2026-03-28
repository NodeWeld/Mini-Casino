# Mini Casino

A browser-based mini casino built with React: four games, a shared chip bank, sound, and a neon Vegas-style UI. Play is for fun only—no real money.

## Games

| Game | What you get |
|------|----------------|
| **Slots** | Three reels, paylines, and animated spins. |
| **Blackjack** | Hit, stand, double; standard deck logic against the house. |
| **Roulette** | European-style wheel, outside/inside bets, animated spin with the ball thrown onto the track; the winning number is where the ball settles. |
| **Video Poker** | Draw poker with standard hand rankings and payouts. |

Pick a chip value ($5–$100), place bets per game, and watch your balance update with wins and losses.

## Tech stack

- [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- [React Router](https://reactrouter.com/) for game navigation
- [Tailwind CSS](https://tailwindcss.com/) for styling

## Getting started

**Requirements:** Node.js 18+ (20+ recommended) and npm.

```bash
# install dependencies
npm install

# dev server (opens at http://localhost:5173 by default)
npm run dev

# production build → dist/
npm run build

# preview the production build locally
npm run preview
```

## Data on your machine

- **Balance** starts at **$1,000** and is saved in **localStorage** (`mini-casino-balance-v1`). Clearing site data resets it.
- A short **transaction history** is also stored locally (`mini-casino-tx-v1`).

## Project layout

```
src/
├── App.jsx                 # Shell: nav, balance, bet chips, routes
├── main.jsx
├── index.css
├── components/
│   ├── Blackjack/
│   ├── Poker/              # Video poker
│   ├── Roulette/
│   └── SlotMachine/
├── hooks/                  # useBalance, useDeck, useSound
└── utils/                  # roulette math, poker evaluation
```

## License

This project is provided as-is for learning and entertainment. Gambling laws vary by region; this software does not facilitate real wagering.
