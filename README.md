# BAPPA'S CITY — A Ganesh Chaturthi Festival Adventure

A vibrant, competition-grade HTML5 Canvas festival runner and adventure game celebrating Ganesh Chaturthi. Built cleanly from scratch with zero external dependencies, procedural graphics, and synthesized Web Audio.

---

## 🪔 Overview

**BAPPA'S CITY** is an original festival adventure combining pseudo-3D perspective running, obstacle dodging, sacred Modak collecting, divine blessings, interactive moral and festival safety decisions, and a breathtaking **Visarjan Finale** at the sacred river ghat.

### Core Gameplay Loop
1. **Start**: Enter the decorated festival city streets.
2. **Run & Dodge**: Switch lanes to avoid barricades, dhol drums, flower crates, gift boxes, and auto-rickshaws.
3. **Collect**: Gather golden glowing Modaks to increase score, combo multipliers (up to 5x), and charge **Bappa's Blessing**.
4. **Bappa's Blessing**: Unleash divine golden auras, energy shields, and Modak magnets.
5. **Festival Events**: Make quick moral decisions in real-time festival situations (lost children, blocked processions, fallen torans, water service) affecting your **Festival Safety** and **Reputation**.
6. **Day-to-Night Progression**: Journey through morning golden sunlight, crimson sunset, evening streetlights, and starlit festive midnight.
7. **Visarjan Finale**: Reach 2,800 meters to celebrate with floating illuminated diyas, Lord Ganesha's royal chariot, and colorful night sky fireworks!
8. **Results**: Earn your **Festival Hero** honor and detailed reputation breakdown.

---

## 🎮 Controls

### Desktop Keyboard
| Key | Action |
| --- | --- |
| `←` or `A` | Move to Left Lane |
| `→` or `D` | Move to Right Lane |
| `Space` | Activate Bappa's Blessing (when meter is 100% full) |
| `P` or `Esc` | Pause / Resume Game |

### Mobile & Touch Screens
- **LEFT** (⮜) button: Move left
- **RIGHT** (⮞) button: Move right
- **POWER** (⚡) button: Activate Bappa's Blessing
- **PAUSE** (⏸) icon: Pause game
- Responsive layout with touch targets $\ge 48\text{px}$ optimized for thumb interaction.

---

## ⚡ Power-Ups & Sacred Items

- **🛡️ Divine Shield**: Protects from 1 obstacle collision without losing safety.
- **🧲 Modak Magnet**: Pulls sacred modaks from neighboring lanes automatically.
- **⏳ Slow Time**: Reduces street speed by 50% for easy maneuvering.
- **⭐ 2X Score**: Doubles all score earned from running and modaks.
- **❤️ Amrit Life**: Restores +25% Festival Safety.
- **🚀 Prasad Sprint**: Grants hyper-speed invulnerability dashing through all obstacles.

---

## 🏆 Festival Reputation Dimensions

Your actions, collisions, and event choices continuously influence 5 clamped reputation values:
1. **Devotion**: Raised by collecting Modaks, waiting respectfully for processions, and hanging fallen sacred torans.
2. **Safety**: Maintained through clean dodging, careful route choices, and pandal crowd safety.
3. **Cleanliness**: Boosted by picking up fallen decor, organizing water supply, and keeping streets pristine.
4. **Community**: Earned by reuniting lost children, sharing prasad and water, and helping devotees.
5. **Speed**: Maintained by rapid reaction times and swift running.

---

## 🛠️ Technical Specifications

- **Pure Web Standards**: HTML5, CSS3, Vanilla JavaScript, HTML5 Canvas, Web Audio API.
- **Zero External Dependencies**:
  - No React / Vue / Angular / Vite / Next.js
  - No Node.js / Express / `server.js`
  - No `package.json` / `node_modules`
  - No external fonts, CDNs, images, or remote audio files
- **Completely Procedural**:
  - All character sprites, buildings, temples, banners, diyas, modaks, obstacles, fireworks, and water reflections are generated procedurally on HTML5 Canvas.
  - All sound effects (bell chimes, dhol percussion beat, impact thuds, power-up arpeggios, fireworks booms) are generated procedurally via the Web Audio API.
- **In-Memory State**: Zero `localStorage` or cookies used. Clean session state for instant resets.

---

## 🚀 Deployment

This is a 100% static web application. Opening `index.html` directly in any web browser loads the complete game offline.

### GitHub Pages
1. Push repository files (`index.html`, `style.css`, `game.js`, `README.md`) to the `main` branch.
2. Navigate to **Settings > Pages**.
3. Set Source to `Deploy from a branch` (`main` / `/root`).
4. Your game will be live instantly!

### Vercel / Netlify
1. Connect your GitHub repository.
2. Build command: *(Leave empty)*
3. Output directory: *(Leave empty / root)*
4. Static deployment succeeds automatically in seconds without any build steps or server configurations.

---

## 🚩 Ganpati Bappa Morya!
Enjoy the festival adventure and guide the procession safely to the sacred Visarjan!
