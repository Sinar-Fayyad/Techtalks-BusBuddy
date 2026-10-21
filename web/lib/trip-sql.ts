// SQL fragment: status of a scheduled trip `st` LEFT JOINed with its run `t` (trips row).
//   cancelled   = driver cancelled it
//   upcoming    = not started yet
//   in_progress = started, not stopped
//   completed   = started and stopped
export const PLAN_STATUS_SQL = `
  CASE
    WHEN st.cancelled = 1 THEN 'cancelled'
    WHEN t.id IS NULL THEN 'upcoming'
    WHEN t.end_time IS NULL THEN 'in_progress'
    ELSE 'completed'
  END
`;
