import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticate } from '@/lib/api-auth';
import { notify } from '@/lib/notify';

// PATCH /api/admin/drivers/{id}   (API_CONTRACT entry 5, v13: notifies the driver)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const a = authenticate(req, ['admin']);
    if ('error' in a) return a.error;

    const { id } = await params;
    const driverId = Number(id);
    if (!Number.isInteger(driverId) || driverId <= 0) {
      return NextResponse.json({ error: 'Invalid driver id' }, { status: 400 });
    }
    const body = await req.json().catch(() => null);
    const action = body?.action; // "verify" or "reject"
    if (!['verify', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be verify or reject' }, { status: 400 });
    }

    const status = action === 'verify' ? 'verified' : 'rejected';
    const [rows] = await pool.query('SELECT user_id FROM drivers WHERE id = ?', [driverId]);
    const driver = (rows as any[])[0];
    if (!driver) return NextResponse.json({ error: 'Driver not found' }, { status: 404 });

    await pool.query('UPDATE drivers SET status = ? WHERE id = ?', [status, driverId]);
    await notify(
      [driver.user_id],
      'driver_status',
      status === 'verified' ? 'You are verified' : 'License rejected',
      status === 'verified'
        ? 'Your license was verified. You can now create trips and appear to students.'
        : 'Your license was rejected. Upload a clearer license from your profile.',
      { status }
    );
    return NextResponse.json({ message: `Driver ${status}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
