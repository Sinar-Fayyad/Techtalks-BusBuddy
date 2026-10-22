// One place that decides the colour + label of every status in the app.
const MAP: Record<string, { label: string; cls: string }> = {
  upcoming: { label: 'Upcoming', cls: 'bb-chip-cyan' },
  in_progress: { label: 'In progress', cls: 'bb-chip-green' },
  completed: { label: 'Completed', cls: 'bb-chip-violet' },
  cancelled: { label: 'Cancelled', cls: 'bb-chip-pink' },
  booked: { label: 'Booked', cls: 'bb-chip-cyan' },
  waiting: { label: 'Waiting', cls: 'bb-chip-amber' },
  on_board: { label: 'On board', cls: 'bb-chip-green' },
  exited: { label: 'Arrived', cls: 'bb-chip-violet' },
  no_show: { label: 'No show', cls: 'bb-chip-pink' },
  idle: { label: 'Not travelling', cls: 'bb-chip-grey' },
  arrived: { label: 'Arrived', cls: 'bb-chip-violet' },
  pending: { label: 'Pending', cls: 'bb-chip-amber' },
  verified: { label: 'Verified', cls: 'bb-chip-green' },
  rejected: { label: 'Rejected', cls: 'bb-chip-pink' },
  open: { label: 'Open', cls: 'bb-chip-pink' },
  resolved: { label: 'Resolved', cls: 'bb-chip-green' },
};

export default function StatusChip({ status, label }: { status: string; label?: string }) {
  const m = MAP[status] ?? { label: status, cls: 'bb-chip-grey' };
  return <span className={`bb-chip ${m.cls}`}>{label ?? m.label}</span>;
}
