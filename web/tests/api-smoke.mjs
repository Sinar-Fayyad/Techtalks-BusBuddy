// API smoke test. Run on a FRESH seed (schema.sql + seed.sql): node tests/api-smoke.mjs
// Server must be running. Optional: BASE_URL=http://localhost:3001 node tests/api-smoke.mjs
// It creates users/trips/bookings, so re-import schema.sql + seed.sql afterwards.
const BASE = (process.env.BASE_URL || 'http://localhost:3000') + '/api';
let pass = 0, fail = 0; const failures = [];
async function call(method, path, token, body) {
  const res = await fetch(BASE + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = {}; try { data = await res.json(); } catch {}
  return { s: res.status, d: data };
}
function t(name, cond, extra) {
  if (cond) pass++; else { fail++; failures.push(name + (extra !== undefined ? ' -> ' + JSON.stringify(extra).slice(0, 300) : '')); }
  console.log((cond ? 'PASS ' : 'FAIL ') + name + (!cond && extra !== undefined ? '  ' + JSON.stringify(extra).slice(0, 200) : ''));
}
const login = async (id, pw) => (await call('POST', '/auth/login', null, { identifier: id, password: pw })).d.token;
const future = (h) => new Date(Date.now() + h * 3600e3).toISOString();

// ---------- AUTH ----------
const admin = await login('admin@busbuddy.test', 'Test1234!');
const d1 = await login('driver1@busbuddy.test', 'Test1234!');
const d2 = await login('driver2@busbuddy.test', 'Test1234!');
const s1 = await login('student1@busbuddy.test', 'Parent1234!');
const s2 = await login('student2@busbuddy.test', 'Parent1234!');
const p1 = await login('parent1@busbuddy.test', 'Parent1234!');
t('login all seed users', admin && d1 && d2 && s1 && s2 && p1);
let r = await call('POST', '/auth/login', null, { identifier: '+96171000001', password: 'Parent1234!' });
t('login by phone (normalized)', r.s === 200 && r.d.role === 'student', r);
r = await call('POST', '/auth/login', null, { identifier: '71 000 001'.replace(/^/, '+961 '), password: 'Parent1234!' });
t('login by phone with spaces', r.s === 200, r);
r = await call('POST', '/auth/login', null, { email: 'student1@busbuddy.test', password: 'Parent1234!' });
t('login legacy {email}', r.s === 200, r);
t('login wrong password 401', (await call('POST', '/auth/login', null, { identifier: 'student1@busbuddy.test', password: 'x' })).s === 401);
t('login unknown phone 401', (await call('POST', '/auth/login', null, { identifier: '+96100000000', password: 'x' })).s === 401);
t('login empty 400', (await call('POST', '/auth/login', null, {})).s === 400);

r = await call('POST', '/auth/signup', null, { name: 'New Student', email: 'new1@x.com', phone: '+96171555001', university: 'AUB', password: 'password1', role: 'student' });
t('signup student 201', r.s === 201, r);
t('signup duplicate email 409', (await call('POST', '/auth/signup', null, { name: 'Nn', email: 'NEW1@x.com', phone: '+96171555009', university: 'AUB', password: 'password1', role: 'student' })).s === 409);
t('signup duplicate phone 409', (await call('POST', '/auth/signup', null, { name: 'Nn', email: 'new2@x.com', phone: '+961 71 555 001', university: 'AUB', password: 'password1', role: 'student' })).s === 409);
t('signup missing phone 400', (await call('POST', '/auth/signup', null, { name: 'Nn', email: 'new3@x.com', password: 'password1', role: 'parent' })).s === 400);
t('signup student without university 400', (await call('POST', '/auth/signup', null, { name: 'Nn', email: 'new4@x.com', phone: '+96171555004', password: 'password1', role: 'student' })).s === 400);
t('signup short password 400', (await call('POST', '/auth/signup', null, { name: 'Nn', email: 'new5@x.com', phone: '+96171555005', password: 'short', role: 'parent' })).s === 400);
t('signup bad email 400', (await call('POST', '/auth/signup', null, { name: 'Nn', email: 'nope', phone: '+96171555006', password: 'password1', role: 'parent' })).s === 400);
t('signup admin 403', (await call('POST', '/auth/signup', null, { name: 'Nn', email: 'a@x.com', phone: '+96171555007', password: 'password1', role: 'admin' })).s === 403);
r = await call('POST', '/auth/signup', null, { name: 'New Parent', email: 'newp@x.com', phone: '+96171555008', password: 'password1', role: 'parent' });
t('signup parent 201 (no university needed)', r.s === 201, r);
r = await call('POST', '/auth/signup', null, { name: 'New Driver', email: 'newd@x.com', phone: '+96171555010', password: 'password1' });
t('signup omitted role -> driver 201', r.s === 201, r);

r = await call('GET', '/auth/me', s1);
t('GET /auth/me', r.s === 200 && r.d.user.university === 'AUB' && r.d.user.phone === '+96171000001', r);
t('GET /auth/me no token 401', (await call('GET', '/auth/me')).s === 401);
r = await call('PATCH', '/auth/me', s2, { name: 'Seed Student Two', university: 'LAU' });
t('PATCH /auth/me ok', r.s === 200, r);
t('PATCH /auth/me phone dup 409', (await call('PATCH', '/auth/me', s2, { phone: '+96171000001' })).s === 409);
t('PATCH /auth/me empty 400', (await call('PATCH', '/auth/me', s2, {})).s === 400);
t('PATCH /auth/me university as parent 400', (await call('PATCH', '/auth/me', p1, { university: 'X' })).s === 400);
t('change-password wrong current 400', (await call('POST', '/auth/change-password', s2, { currentPassword: 'bad', newPassword: 'newpassword1' })).s === 400);
t('change-password short new 400', (await call('POST', '/auth/change-password', s2, { currentPassword: 'Parent1234!', newPassword: 'x' })).s === 400);
t('change-password ok 200', (await call('POST', '/auth/change-password', s2, { currentPassword: 'Parent1234!', newPassword: 'Parent1234!' })).s === 200);

// ---------- DRIVER PROFILE ----------
r = await call('GET', '/driver/me', d1);
t('GET /driver/me complete profile', r.s === 200 && r.d.driver.profile_complete === true && r.d.driver.phone === '+96170000001', r.d);
r = await call('GET', '/driver/me', d2);
t('GET /driver/me incomplete -> missing_fields', r.s === 200 && r.d.driver.missing_fields.includes('vehicle_plate'), r.d);
t('driver/me as student 403', (await call('GET', '/driver/me', s1)).s === 403);
t('PATCH driver/me seats 0 -> 400', (await call('PATCH', '/driver/me', d2, { seats: 0 })).s === 400);
t('PATCH driver/me empty 400', (await call('PATCH', '/driver/me', d2, {})).s === 400);
t('PATCH driver/me bad license_url 400', (await call('PATCH', '/driver/me', d2, { license_url: 'http://evil/x.png' })).s === 400);
t('PATCH driver/me phone dup 409', (await call('PATCH', '/driver/me', d2, { phone: '+96170000001' })).s === 409);
r = await call('PATCH', '/driver/me', d2, { vehicle_plate: 'B 999999', seats: 20, price: 3, phone: '+96170000222' });
t('PATCH driver/me ok', r.s === 200 && r.d.driver.profile_complete === true && r.d.driver.phone === '+96170000222', r.d);

// ---------- SCHEDULED TRIPS (driver) ----------
t('create trip: pending driver cannot (403)', (await call('POST', '/driver/scheduled-trips', d2, { origin: 'A', destination: 'B', scheduled_at: future(5), seats: 5 })).s === 403);
t('create trip: missing origin 400', (await call('POST', '/driver/scheduled-trips', d1, { destination: 'B', scheduled_at: future(5), seats: 5 })).s === 400);
t('create trip: bad date 400', (await call('POST', '/driver/scheduled-trips', d1, { origin: 'A', destination: 'B', scheduled_at: 'nope', seats: 5 })).s === 400);
t('create trip: past date 400', (await call('POST', '/driver/scheduled-trips', d1, { origin: 'A', destination: 'B', scheduled_at: future(-5), seats: 5 })).s === 400);
t('create trip: seats 0 400', (await call('POST', '/driver/scheduled-trips', d1, { origin: 'A', destination: 'B', scheduled_at: future(5), seats: 0 })).s === 400);
t('create trip: as student 403', (await call('POST', '/driver/scheduled-trips', s1, { origin: 'A', destination: 'B', scheduled_at: future(5), seats: 5 })).s === 403);
r = await call('POST', '/driver/scheduled-trips', d1, { origin: 'Jounieh', destination: 'Campus', scheduled_at: future(30), seats: 1, price: 1.5, stops: 'Jounieh\nKaslik' });
t('create trip ok 201', r.s === 201, r); const tinyId = r.d.trip?.id;
r = await call('POST', '/driver/scheduled-trips', d1, { origin: 'Delete', destination: 'Me', scheduled_at: future(40), seats: 3 });
const delId = r.d.trip?.id; t('create second trip 201', r.s === 201, r);
r = await call('GET', '/driver/scheduled-trips', d1);
t('list driver trips with counts', r.s === 200 && r.d.counts.total === 7 && r.d.counts.cancelled === 1 && r.d.counts.completed === 1, r.d.counts);
t('driver trip statuses', ['in_progress','upcoming','completed','cancelled'].every(s => r.d.trips.some(x => x.status === s)), r.d.trips.map(x => x.status));
r = await call('PATCH', `/driver/scheduled-trips/${delId}`, d1, { origin: 'Edited', seats: 4, price: 2 });
t('edit trip ok', r.s === 200, r);
t('edit trip: other driver 404', (await call('PATCH', `/driver/scheduled-trips/${delId}`, d2, { origin: 'Hack' })).s === 404);
t('edit trip: nothing 400', (await call('PATCH', `/driver/scheduled-trips/${delId}`, d1, {})).s === 400);
t('edit started trip 409', (await call('PATCH', '/driver/scheduled-trips/1', d1, { origin: 'X' })).s === 409);
t('edit trip: cancelled:false 400', (await call('PATCH', `/driver/scheduled-trips/${delId}`, d1, { cancelled: false })).s === 400);
t('delete trip (no bookings) 200', (await call('DELETE', `/driver/scheduled-trips/${delId}`, d1)).s === 200);
t('delete trip gone -> 404', (await call('DELETE', `/driver/scheduled-trips/${delId}`, d1)).s === 404);
t('delete trip with bookings 409', (await call('DELETE', '/driver/scheduled-trips/2', d1)).s === 409);
t('shrink seats below bookings 409', await (async () => { await call('POST', '/bookings', s2, { scheduledTripId: 3 }); return (await call('PATCH', '/driver/scheduled-trips/3', d1, { seats: 0 })).s === 400; })());

// ---------- STUDENT: browse + book ----------
r = await call('GET', '/scheduled-trips', s1);
const ids = r.d.trips.map(x => x.id);
t('browse: only bookable (2,3,new) – not running/completed/cancelled', r.s === 200 && ids.includes(2) && ids.includes(3) && !ids.includes(1) && !ids.includes(4) && !ids.includes(5), ids);
t('browse: booked flag', r.d.trips.find(x => x.id === 2)?.booked === true && r.d.trips.find(x => x.id === 3)?.booked === false);
t('browse: seats_left', r.d.trips.find(x => x.id === 2)?.seats_left === 13, r.d.trips.find(x => x.id === 2));
r = await call('GET', '/scheduled-trips?q=Hadath', s1);
t('browse: search q (matches origin + stops)', r.d.trips.length === 2 && r.d.trips.some(x => x.id === 2), r.d.trips?.map(x => x.id));
r = await call('GET', '/scheduled-trips?q=Furn', s1);
t('browse: search matches stops, excludes completed', r.d.trips.length === 1 && r.d.trips[0].id === 2, r.d.trips?.map(x => x.id));
r = await call('GET', '/scheduled-trips?sort=price', s1);
t('browse: sort by price asc', r.d.trips[0].price <= r.d.trips[r.d.trips.length - 1].price && Number(r.d.trips[0].price) === 1.5, r.d.trips?.map(x => x.price));
t('browse as parent 403', (await call('GET', '/scheduled-trips', p1)).s === 403);

t('book: no id 400', (await call('POST', '/bookings', s2, {})).s === 400);
t('book: unknown trip 404', (await call('POST', '/bookings', s2, { scheduledTripId: 9999 })).s === 404);
t('book: cancelled trip 409', (await call('POST', '/bookings', s2, { scheduledTripId: 5 })).s === 409);
t('book: running trip 409', (await call('POST', '/bookings', s2, { scheduledTripId: 1 })).s === 409);
t('book: as driver 403', (await call('POST', '/bookings', d1, { scheduledTripId: 3 })).s === 403);
t('book: duplicate 409', (await call('POST', '/bookings', s2, { scheduledTripId: 3 })).s === 409);
r = await call('POST', '/bookings', s2, { scheduledTripId: 2, pickup: 'Hadath bridge' });
t('book trip 2 (student2) 201', r.s === 201, r);
r = await call('POST', '/bookings', s1, { scheduledTripId: tinyId });
t('book 1-seat trip (student1) 201', r.s === 201, r);
r = await call('POST', '/bookings', s2, { scheduledTripId: tinyId });
t('book full trip 409', r.s === 409 && /full/i.test(r.d.error), r);
t('book: student can book several trips (s1: trips 1,2,tiny)', (await call('GET', '/bookings/me', s1)).d.bookings.length === 3);
r = await call('GET', '/bookings/me', s2);
const b2 = r.d.bookings.find(b => b.scheduled_trip_id === 2);
t('bookings/me trip fields', r.s === 200 && b2 && b2.origin === 'Hadath' && b2.trip_status === 'upcoming' && b2.driver_name, r.d);
t('cancel booking: not own 404', (await call('DELETE', `/bookings/${b2.id}`, s1)).s === 404);
const s1running = (await call('GET', '/bookings/me', s1)).d.bookings.find(b => b.scheduled_trip_id === 1);
t('cancel booking on running trip 409', (await call('DELETE', `/bookings/${s1running.id}`, s1)).s === 409);
const b3 = r.d.bookings.find(b => b.scheduled_trip_id === 3);
t('cancel booking ok 200', (await call('DELETE', `/bookings/${b3.id}`, s2)).s === 200);
r = await call('GET', '/driver/bookings?tripId=1', d1);
t('driver bookings tripId=1 -> student on_board', r.s === 200 && r.d.bookings.length === 1 && r.d.bookings[0].status === 'on_board', r.d);
t('driver bookings bad tripId 400', (await call('GET', '/driver/bookings?tripId=abc', d1)).s === 400);
r = await call('GET', '/driver/bookings?tripId=2', d1);
t('driver bookings tripId=2 -> 2 students booked', r.d.bookings.length === 2 && r.d.bookings.every(b => b.status === 'booked'), r.d.bookings?.map(b => b.status));

// ---------- PARENT LINKING (secure) ----------
t('link: parent without code 400', (await call('POST', '/parents/me/children', p1, { email: 'student2@busbuddy.test' })).s === 400);
t('link: old studentId mode no longer works (400)', (await call('POST', '/parents/me/children', p1, { studentId: 5 })).s === 400);
t('link: student token 403', (await call('POST', '/parents/me/children', s1, { email: 'student2@busbuddy.test', code: '123456' })).s === 403);
t('link-code as parent 403', (await call('POST', '/students/me/link-code', p1)).s === 403);
r = await call('POST', '/students/me/link-code', s2);
const code = r.d.code; t('student generates 6-digit code', r.s === 201 && /^\d{6}$/.test(code), r);
const wrong = code === '000000' ? '111111' : '000000';
r = await call('POST', '/parents/me/children', p1, { email: 'student2@busbuddy.test', code: wrong });
t('link: wrong code 404', r.s === 404, r);
r = await call('POST', '/parents/me/children', p1, { email: 'student2@busbuddy.test', code });
t('link: correct email+code 201', r.s === 201 && r.d.child.email === 'student2@busbuddy.test', r);
t('link: code is single-use', (await call('POST', '/parents/me/children', p1, { email: 'student2@busbuddy.test', code })).s === 404);
r = await call('POST', '/students/me/link-code', s2); const code2 = r.d.code;
t('link: already linked 409', (await call('POST', '/parents/me/children', p1, { email: 'student2@busbuddy.test', code: code2 })).s === 409);
// brute force guard (use a fresh parent)
const np = await login('newp@x.com', 'password1');
let last; for (let i = 0; i < 6; i++) last = await call('POST', '/parents/me/children', np, { email: 'student1@busbuddy.test', code: '00000' + i });
t('link: 6th wrong attempt -> 429 rate limit', last.s === 429, last);
r = await call('GET', '/parents/me/children', p1);
t('parent children list (2)', r.d.children.length === 2, r.d);
r = await call('GET', '/students/me/parents', s2);
t('student sees linked parent', r.d.parents.length === 1 && r.d.parents[0].email === 'parent1@busbuddy.test', r.d);

// ---------- RUN A TRIP: stop seeded trip, start trip 2, board/exit, parent privacy ----------
r = await call('GET', '/driver/trips/active', d1);
t('active trip has plan info', r.d.trip?.scheduled_trip_id === 1 && r.d.trip.origin === 'Baabda', r.d);
r = await call('GET', '/students/4/trip-status', p1);
t('parent sees child ON BOARD with location (seeded)', r.s === 200 && r.d.trip?.phase === 'onboard', r.d);
t('start: while another trip active 409', (await call('POST', '/driver/trips/start', d1, { scheduledTripId: 2 })).s === 409);
t('stop trip 200', (await call('POST', '/driver/trips/stop', d1)).s === 200);
r = await call('GET', '/students/4/trip-status', p1);
t('after stop: phase done, no location for parent', r.d.trip?.phase === 'done' && r.d.trip.latitude === null, r.d);
t('start: unknown plan 404', (await call('POST', '/driver/trips/start', d1, { scheduledTripId: 9999 })).s === 404);
t('start: cancelled plan 409', (await call('POST', '/driver/trips/start', d1, { scheduledTripId: 5 })).s === 409);
t('start: already-run plan 409', (await call('POST', '/driver/trips/start', d1, { scheduledTripId: 1 })).s === 409);
t('start: bad id 400', (await call('POST', '/driver/trips/start', d1, { scheduledTripId: 'x' })).s === 400);
t('start: other driver plan -> 409/404 (driver2 pending = 403)', [403, 404].includes((await call('POST', '/driver/trips/start', d2, { scheduledTripId: 2 })).s));
r = await call('POST', '/driver/trips/start', d1, { scheduledTripId: 2 });
t('start planned trip 2 -> 201 with plan id', r.s === 201 && r.d.trip.scheduled_trip_id === 2, r);
t('students notified: trip started', (await call('GET', '/notifications', s2)).d.notifications.some(n => n.type === 'trip_started'));
r = await call('GET', '/students/5/trip-status', s2);
t('student2 sees WAITING + live location after ping', r.d.trip?.phase === 'waiting', r.d);
t('driver ping location 200', (await call('POST', '/driver/trips/location', d1, { latitude: 33.89, longitude: 35.50 })).s === 200);
r = await call('GET', '/students/5/trip-status', s2);
t('student2 (waiting) gets location', r.d.trip?.latitude !== null && r.d.trip.driver_name, r.d);
r = await call('GET', '/students/5/trip-status', p1);
t('PARENT must NOT see location while waiting', r.d.trip?.phase === 'waiting' && r.d.trip.latitude === null, r.d);
t('student1 view of student2 403', (await call('GET', '/students/5/trip-status', s1)).s === 403);
t('parent not linked to student1? linked yes; to new student no -> 403', (await call('GET', '/students/1/trip-status', p1)).s === 403);
const qr = (await call('GET', '/driver/qr', d1)).d;
t('driver qr: 2 different codes', qr.board_code && qr.exit_code && qr.board_code !== qr.exit_code, qr);
t('board with exit code -> 400', (await call('POST', '/trips/board', s2, { code: qr.exit_code })).s === 400);
t('board with garbage -> 400', (await call('POST', '/trips/board', s2, { code: 'abc' })).s === 400);
t('board by unbooked student -> 403', (await call('POST', '/trips/board', await login('new1@x.com', 'password1'), { code: qr.board_code })).s === 403);
r = await call('POST', '/trips/board', s2, { code: qr.board_code });
t('board student2 201', r.s === 201, r);
t('board again 409', (await call('POST', '/trips/board', s2, { code: qr.board_code })).s === 409);
r = await call('GET', '/students/5/trip-status', p1);
t('PARENT sees location once on board', r.d.trip?.phase === 'onboard' && r.d.trip.latitude !== null, r.d);
r = await call('GET', '/parents/me/children/live', p1);
const c5 = r.d.children.find(c => c.id === 5), c4 = r.d.children.find(c => c.id === 4);
t('live list: student2 on_board with location', c5?.status === 'on_board' && c5.trip.latitude !== null, c5);
t('live list: student1 (waiting on trip 2) has no location', c4?.status === 'waiting' && c4.trip.latitude === null, c4);
t('parent got boarded notification', (await call('GET', '/notifications', p1)).d.notifications.some(n => n.type === 'boarded' && /boarded/i.test(n.title)));
t('exit with board code -> 400', (await call('POST', '/trips/exit', s2, { code: qr.board_code })).s === 400);
t('exit without boarding -> 409', (await call('POST', '/trips/exit', s1, { code: qr.exit_code })).s === 409);
// ---- vehicle issue + nearby bus
t('verify driver2 (admin)', (await call('PATCH', '/admin/drivers/2', admin, { action: 'verify' })).s === 200);
t('driver2 notified of verification', (await call('GET', '/notifications', d2)).d.notifications.some(n => n.type === 'driver_status'));
t('driver2 starts ad-hoc trip', (await call('POST', '/driver/trips/start', d2)).s === 201);
t('driver2 ping 1 km away', (await call('POST', '/driver/trips/location', d2, { latitude: 33.895, longitude: 35.505 })).s === 200);
t('issue: bad category 400', (await call('POST', '/driver/issues', d1, { category: 'fire' })).s === 400);
t('issue as student 403', (await call('POST', '/driver/issues', s1, { category: 'delay' })).s === 403);
r = await call('POST', '/driver/issues', d1, { category: 'breakdown', message: 'Flat tire' });
t('report issue 201 – notified parents + nearby driver + admin', r.s === 201 && r.d.notified.parents === 1 && r.d.notified.drivers === 1 && r.d.notified.admins === 1, r.d);
t('issue spam guard 429', (await call('POST', '/driver/issues', d1, { category: 'delay' })).s === 429);
t('parent got issue notification', (await call('GET', '/notifications', p1)).d.notifications.some(n => n.type === 'issue'));
t('nearby driver2 got issue notification', (await call('GET', '/notifications', d2)).d.notifications.some(n => n.type === 'issue'));
t('exit student2 200', (await call('POST', '/trips/exit', s2, { code: qr.exit_code })).s === 200);
t('exit again 409', (await call('POST', '/trips/exit', s2, { code: qr.exit_code })).s === 409);
r = await call('GET', '/students/5/trip-status', p1);
t('after exit: parent sees done, NO location', r.d.trip?.phase === 'done' && r.d.trip.latitude === null, r.d);
r = await call('GET', '/parents/me/children/live', p1);
t('live list: student2 arrived', r.d.children.find(c => c.id === 5)?.status === 'arrived', r.d.children.map(c => c.status));
// ---- unlink
t('student removes parent 200', (await call('DELETE', `/students/me/parents/6`, s2)).s === 200);
t('parent no longer sees student2 (403)', (await call('GET', '/students/5/trip-status', p1)).s === 403);
t('parent unlink: not linked 404', (await call('DELETE', '/parents/me/children/5', p1)).s === 404);
t('parent unlink student1 200', (await call('DELETE', '/parents/me/children/4', p1)).s === 200);

// ---------- NOTIFICATIONS ----------
r = await call('GET', '/notifications', p1);
t('notifications list + unread count', r.s === 200 && r.d.unread_count > 0, r.d.unread_count);
const nid = r.d.notifications[0].id;
t('mark one read', (await call('POST', '/notifications/read', p1, { id: nid })).d.updated === 1);
t('mark all read', (await call('POST', '/notifications/read', p1, {})).s === 200 && (await call('GET', '/notifications', p1)).d.unread_count === 0);
t('mark read bad id 400', (await call('POST', '/notifications/read', p1, { id: 'x' })).s === 400);
t('cancel trip notifies booked students', await (async () => { const rr = await call('PATCH', '/driver/scheduled-trips/3', d1, { cancelled: true }); return rr.s === 200 && (await call('GET', '/notifications', s2)).d.notifications.some(n => n.type === 'cancelled') === false /* s2 cancelled own booking of 3 */; })());

// ---------- ADMIN ----------
r = await call('GET', '/admin/stats', admin);
t('admin stats', r.s === 200 && r.d.drivers.verified === 2 && r.d.users.students >= 3 && r.d.open_issues === 1, r.d);
t('admin stats as driver 403', (await call('GET', '/admin/stats', d1)).s === 403);
t('admin drivers default pending', (await call('GET', '/admin/drivers', admin)).d.drivers.every(d => d.status === 'pending'));
r = await call('GET', '/admin/drivers?status=all', admin);
t('admin drivers all', r.d.drivers.length === 2 && r.d.drivers[0].phone !== undefined, r.d.drivers.length);
t('admin drivers bad status 400', (await call('GET', '/admin/drivers?status=zzz', admin)).s === 400);
r = await call('GET', '/admin/users?role=student', admin);
t('admin users students', r.s === 200 && r.d.users.length >= 3 && r.d.users[0].university !== undefined, r.d.users?.length);
t('admin users search by q', (await call('GET', '/admin/users?role=student&q=LAU', admin)).d.users.length === 1);
t('admin users bad role 400', (await call('GET', '/admin/users?role=admin', admin)).s === 400);
r = await call('GET', '/admin/trips?status=cancelled', admin);
t('admin trips filter cancelled', r.s === 200 && r.d.trips.length >= 2 && r.d.trips.every(x => x.status === 'cancelled'), r.d.trips?.map(x=>x.status));
t('admin trips bad status 400', (await call('GET', '/admin/trips?status=nope', admin)).s === 400);
r = await call('GET', '/admin/issues', admin);
t('admin issues open', r.s === 200 && r.d.issues.length === 1 && r.d.issues[0].category === 'breakdown', r.d);
const iid = r.d.issues[0].id;
t('admin resolve issue 200', (await call('PATCH', `/admin/issues/${iid}`, admin, { status: 'resolved' })).s === 200);
t('admin resolve again 409', (await call('PATCH', `/admin/issues/${iid}`, admin, { status: 'resolved' })).s === 409);
t('admin resolve unknown 404', (await call('PATCH', '/admin/issues/9999', admin, { status: 'resolved' })).s === 404);
t('admin notified of issue', (await call('GET', '/notifications', admin)).d.notifications.some(n => n.type === 'issue'));
t('admin reject driver', (await call('PATCH', '/admin/drivers/2', admin, { action: 'reject' })).s === 200);
t('admin trips-of-driver (entry 11) still works', (await call('GET', '/admin/drivers/1/trips', admin)).s === 200);

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
if (failures.length) console.log('FAILURES:\n' + failures.join('\n'));
