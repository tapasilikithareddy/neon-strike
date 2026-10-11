import { IMultiplayerTransport } from './transport';
import { SocketTransport } from './socketTransport';
import { PeerTransport } from './peerTransport';

/**
 * Creates the active multiplayer transport.
 *
 * In production, defaults to `SocketTransport` which uses the unified Express/Socket.IO
 * server on the same public origin (`window.location.origin`). This eliminates cross-origin
 * issues, avoids public cloud signaling bottlenecks, and guarantees connectivity across
 * corporate, university, and mobile NAT firewalls.
 *
 * WebRTC P2P (`PeerTransport`) is preserved and can be activated via `VITE_MULTIPLAYER_TRANSPORT=webrtc`.
 */
export function createMultiplayerTransport(): IMultiplayerTransport {
  const preferred = import.meta.env.VITE_MULTIPLAYER_TRANSPORT;
  if (preferred === 'webrtc') {
    return new PeerTransport();
  }
  return new SocketTransport();
}
