export function CollaborationPresence({
  peers,
}: {
  peers: { clientId: number; name: string; color: string }[];
}) {
  return (
    <div
      className="collaboration-presence"
      aria-label={`${peers.length} autre${peers.length > 1 ? "s" : ""} participant${peers.length > 1 ? "s" : ""}`}
    >
      {peers.slice(0, 5).map((peer) => (
        <span
          key={peer.clientId}
          className="collaboration-avatar"
          style={{ backgroundColor: peer.color }}
          title={peer.name}
          aria-label={`${peer.name} consulte cette page`}
        >
          {peer.name.slice(0, 1).toUpperCase()}
        </span>
      ))}
      {peers.length > 5 && <span>+{peers.length - 5}</span>}
    </div>
  );
}
