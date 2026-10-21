import pool from '@/lib/db';

// Creates in-app notifications. NEVER throws: a failed notification must not break the main action.
export async function notify(
  userIds: number[],
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const ids = [...new Set(userIds)].filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length === 0) return;
  try {
    const values = ids.map(() => '(?, ?, ?, ?, ?, UTC_TIMESTAMP(3))').join(', ');
    const params = ids.flatMap((id) => [
      id,
      type,
      title.slice(0, 150),
      body.slice(0, 500),
      data ? JSON.stringify(data) : null,
    ]);
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, data, created_at) VALUES ${values}`,
      params
    );
  } catch (err) {
    console.error('notify failed:', err);
  }
}

export async function parentIdsOf(studentId: number): Promise<number[]> {
  const [rows] = await pool.query(
    'SELECT parent_user_id FROM parent_student WHERE student_user_id = ?',
    [studentId]
  );
  return (rows as any[]).map((r) => r.parent_user_id);
}

export async function adminIds(): Promise<number[]> {
  const [rows] = await pool.query("SELECT id FROM users WHERE role = 'admin'");
  return (rows as any[]).map((r) => r.id);
}
