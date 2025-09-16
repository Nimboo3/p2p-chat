<div align="center">

# P2P Encrypted Desktop Chat

Lightweight end‑to‑end encrypted peer‑to‑peer (P2P) chat client built with Rust (Tauri 2), QUIC (iroh), React, and Tokio. No accounts. Share a one‑time ticket, chat directly.

</div>

## Why it’s interesting
Most chat demos still depend on a central signaling or websocket server. This prototype uses iroh's QUIC-based node tickets to establish a direct, encrypted bi‑directional stream between two desktop clients, keeping all message traffic local to the peers after rendezvous.

## Core Features
* Direct peer‑to‑peer connection (no username/password, no persistent identity stored)
* One‑time “room ticket” bootstrap: creator shares a short token, joiner connects
* End‑to‑end encryption via iroh secret keys (ephemeral unless provided via env)
* Cross‑platform desktop (Tauri 2 + React 18)
* Minimal code surface: a few Rust async tasks manage QUIC streams & events

## Tech Stack
Rust (Tauri 2), iroh (QUIC), Tokio, React 18, Vite, TypeScript.

## High‑Level Architecture
1. Creator binds an iroh `Endpoint`, awaits a bi‑directional stream, and emits a ticket.
2. Joiner parses the ticket, dials, opens a QUIC bi‑stream, sends a fixed handshake.
3. Both sides spawn async readers piping bytes -> Tauri events -> React state.
4. Outgoing messages write directly to the QUIC send stream (no server hop).

## Quick Start (Dev)
Prereqs: Rust toolchain + Deno (used here to drive Tauri/Vite tasks).

```bash
git clone https://github.com/mav3ri3k/p2p-chat.git
cd p2p-chat
deno install       # installs deps defined by deno.lock / tasks
deno task tauri dev
```

Then:
1. In App UI click “Create Room” → copy ticket
2. Launch a second instance (or on another machine/network) → paste ticket → Join
3. Exchange messages (scrolling log updates in real time)

## Security & Limitations (Prototype)
* Fixed handshake constant; no replay protection yet.
* Single active session stored in shared state (no multi-room UI).
* Does not (yet) persist or verify long‑term identity keys.
* Message framing is naive (raw UTF‑8 chunks up to 1KB buffer slices).

Planned improvements could include: multiple simultaneous rooms, proper message framing, ticket expiration, richer E2E identity management.

## License
MIT (adjust if you choose a different license).

---
Minimal README intentionally focused for quick recruiter review.
