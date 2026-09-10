import {
  createEncoder,
  writeVarUint,
  writeVarString,
  toUint8Array,
} from "lib0/encoding";
import {
  applyAwarenessUpdate,
  removeAwarenessStates,
  type Awareness,
} from "y-protocols/awareness";
import type { Presence } from "@digipm/contracts/realtime";

export function applyPresence(awareness: Awareness, peers: Presence[]) {
  const remote = peers.filter((peer) => peer.clientId !== awareness.clientID);
  const encoder = createEncoder();
  writeVarUint(encoder, remote.length);
  for (const peer of remote) {
    writeVarUint(encoder, peer.clientId);
    writeVarUint(encoder, peer.clock);
    writeVarString(encoder, JSON.stringify(peer.state));
  }
  applyAwarenessUpdate(awareness, toUint8Array(encoder), "remote");
  const present = new Set(
    remote.filter((peer) => peer.state).map((peer) => peer.clientId),
  );
  removeAwarenessStates(
    awareness,
    [...awareness.getStates().keys()].filter(
      (id) => id !== awareness.clientID && !present.has(id),
    ),
    "remote",
  );
}
