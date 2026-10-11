# NEON STRIKE — Air Hockey Arena ⚡🏒

> High-velocity, cyberpunk multiplayer air hockey arena built for competitive esports play across separate devices and networks.

[🎮 Play NEON STRIKE](https://neon-strike-9o2f.onrender.com/) · [GitHub Repository](https://github.com/tapasilikithareddy/neon-strike)

![Temporary Illustrative Banner](https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80)
*Note: The image above is a temporary illustrative banner. Replacing it with an actual in-game screenshot of the NEON STRIKE arena would better represent the live project.*

---

## 🌟 Overview & Architecture

**NEON STRIKE** delivers an arcade air hockey experience targeting 60 FPS in modern web browsers. It is architected as a **unified Node.js service** that builds the Vite frontend and serves the production bundle (`dist/`) alongside an Express and Socket.IO real-time multiplayer backend on the **same public origin**.

### Key Capabilities
- **Unified Single-Origin Deployment**: Serves the React/Vite single-page application and the Socket.IO backend from a single host and port. Serving both from the same origin simplifies connection configuration, reduces cross-origin complexities, and avoids relying on third-party signaling services. Connection reliability remains dependent on local network conditions and firewalls.
- **Cross-Network Multiplayer**: Two players can duel from different phones, tablets, or computers across cellular and Wi-Fi networks.
- **Multiplayer Transport Architecture**:
  - **Production Default (Socket.IO)**: Designed for reliable cross-network multiplayer using Socket.IO, WebSocket upgrades, and HTTP long-polling fallback.
  - **Preserved WebRTC P2P (PeerJS + STUN)**: Can be activated with `VITE_MULTIPLAYER_TRANSPORT=webrtc` for direct peer-to-peer data channels when network environments support it.
- **Instant Room Codes & Battle Links**: Unique 6-character room codes (e.g., `NS-9482`) with one-click URL invitations (`https://.../?room=NS-9482`). Features a high-contrast dark navy Copy Link button with clipboard fallback and error feedback.
- **Host-Authoritative Simulation & Boundary Validation**: Clamped half-court boundary enforcement, 2D circle-circle elastic collision resolution with sub-stepped position integration to mitigate high-speed tunneling, server-side coordinate validation, and goal line detection.
- **First to 5 Scoring**: Real-time scoreboards, 2-second goal replay banners, goal particle effects, and instant rematch triggers.
- **Solo Drill AI Mode with 3 Difficulties**:
  - **Easy (Casual Drill - Default)**: Relaxed 280 px/s speed cap, 320ms reaction delay, 35px aim variance, 25% miss probability on fast bank shots.
  - **Medium (Pro Circuit)**: Balanced 480 px/s speed, 160ms reaction delay, active defensive shadowing.
  - **Cyber-Elite**: Challenging 680 px/s speed, 70ms reaction delay, agile bank shot counter-striking.
- **Procedural Audio Synthesizer**: Zero-asset procedural Web Audio API synthesizer generating tactile mallet thumps, metallic wall chimes, goal horns, and victory fanfares.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite 6
- **Server**: Node.js, Express, Socket.IO 4
- **Rendering**: Canvas 2D with offscreen rink pre-rendering and additive particle shaders
- **Styling**: Vanilla CSS Design System with dark cyberpunk glassmorphism, esports typography (`Orbitron`, `Rajdhani`, `Inter`)
- **Icons**: Lucide React
- **Testing**: Vitest with 23 automated unit tests and an end-to-end two-client multiplayer simulation

---

## 🚀 Local Development & Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Frontend Dev Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Start the Unified Production Server
```bash
# Build the production bundle
npm run build

# Start the unified Express & Socket.IO server (serves dist/ on same origin)
npm start
```
Server runs on [http://localhost:3001](http://localhost:3001).

### 4. Health Check Endpoint
```bash
curl http://localhost:3001/health
```
Response:
```json
{
  "status": "online",
  "service": "NEON STRIKE Game Server",
  "roomsActive": 0,
  "uptimeSeconds": 42,
  "timestamp": 1791716300000
}
```

---

## 🧪 Automated Testing

### Run Vitest Unit Tests (23 Tests)
```bash
npm test
```

Test Suites:
- **`test/physics.test.ts`**: Legal paddle clamping, circle-circle collision resolution, speed caps, and wall bounce reflections.
- **`test/scoring.test.ts`**: Goal detection, wall reflections outside goal mouth, first-to-5 victory rules, and reset puck placement.
- **`test/ai.test.ts`**: Default difficulty is Easy, speed caps (Easy <= 280 px/s, Medium <= 480 px/s, Elite <= 680 px/s), boundary clamping, and time-based delta-time physics.
- **`test/room-protocol.test.ts`**: Room creation, 2-player capacity enforcement (rejects 3rd intruders), server-side paddle clamping, and clean disconnection cleanup.
- **`test/server-transport.test.ts`**: Production SocketTransport instantiation by default, PeerTransport preservation, and room lifecycle.

### Run Two-Client E2E Multiplayer Simulation
With the server running on port 3001:
```bash
npx tsx test/e2e-multiplayer.ts
```
Verifies mutual discovery, room creation, joining, ready toggles, paddle coordinate synchronization, game state broadcast, goal alerts, and clean disconnect handling.

---

## 📦 Production Deployment to Render (Recommended)

Render offers a Free Tier Web Service for Node.js applications that supports WebSockets natively.

### Step-by-Step Deployment Instructions:

1. **Push your code to GitHub / GitLab**:
   Ensure all changes are committed and pushed to your repository:
   `https://github.com/tapasilikithareddy/neon-strike`

2. **Log in to Render**:
   Go to [https://dashboard.render.com](https://dashboard.render.com) and sign in.

3. **Create a New Web Service**:
   - Click **New +** > **Web Service**.
   - Connect your GitHub repository (`neon-strike`).

4. **Configure the Service**:
   - **Name**: `neon-strike` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Choose the region closest to your players (e.g., Oregon / Frankfurt / Singapore)
   - **Branch**: `main` (or your default branch)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**

5. **Advanced Settings**:
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: `Yes` (deploys automatically on git push)

6. **Environment Variables**:
   No custom environment variables are required. The server automatically detects `process.env.PORT` assigned by Render and binds to `0.0.0.0`.
   *(Optional)*: Set `NODE_ENV=production`.

7. **Deploy**:
   - Click **Create Web Service**.
   - Render will execute `npm install && npm run build` and launch `npm start`.
   - Your publicly accessible game URL will be: `https://neon-strike-9o2f.onrender.com` (or your configured custom name).

### Free Tier Limitations & Expectations:
- **Spin-down on Inactivity**: Free instances on Render spin down after 15 minutes of inactivity. When a player visits the URL after spin-down, the first HTTP request may take 30–50 seconds while the container boots. Once awake, the service resumes handling game traffic. Actual latency depends on the hosting region, network conditions, and player locations.
- **Bandwidth**: Includes 100 GB/month of free egress bandwidth.

---

## 🎮 How to Play

1. **Host a Match**:
   - Click **CREATE ARENA**, enter your call-sign, and copy the room invitation link using the high-contrast **COPY LINK** button.
2. **Join a Match**:
   - Open the battle link directly on a second device, or click **ENTER ARENA** and type the 6-character room code.
3. **Controls**:
   - **Touch / Mobile**: Drag your glowing mallet across your defensive half of the rink.
   - **Mouse**: Move your cursor inside your table half.
   - **Keyboard**: Use `W`, `A`, `S`, `D` or Arrow keys.
4. **Win Condition**:
   - First striker to score 5 goals wins the match!

