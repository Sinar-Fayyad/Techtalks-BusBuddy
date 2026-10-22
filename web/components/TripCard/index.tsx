'use client';
import styles from './TripCard.module.css';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { fmtDay, fmtTime, money, parseStops } from '@/lib/format';

export type AvailableTrip = {
  id: number; driver_id: number; driver_name: string; driver_phone: string | null; vehicle_plate: string | null;
  origin: string; destination: string; scheduled_at: string; seats: number; seats_left: number;
  price: string | number; stops: string | null; booked: boolean;
};

// One bookable trip (used on the student home and on the Book a Ride list).
export default function TripCard({ trip, onBook }: { trip: AvailableTrip; onBook: (t: AvailableTrip) => void }) {
  const stops = parseStops(trip.stops);
  const full = trip.seats_left <= 0;
  return (
    <article className={`bb-card ${styles.card}`}>
      <div className={styles.driver}>
        <Avatar name={trip.driver_name} size={52} />
        <div>
          <b>{trip.driver_name}</b>
          {trip.vehicle_plate && <div className="bb-small bb-muted">Bus {trip.vehicle_plate}</div>}
        </div>
      </div>

      <div className={styles.route}>
        <div className={styles.when}>
          <Icon name="clock" size={16} /> {fmtDay(trip.scheduled_at)} · {fmtTime(trip.scheduled_at)}
        </div>
        <div className={styles.od}>
          {trip.origin} <Icon name="chevron" size={16} /> {trip.destination}
        </div>
        {stops.length > 0 && (
          <ul className="bb-timeline" style={{ marginTop: 8 }}>
            {stops.slice(0, 4).map((s, i) => (
              <li key={i}>
                {s.name} {s.time && <span className="bb-muted">· {s.time}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.side}>
        <div className={styles.price}>{money(trip.price)} <small>per ride</small></div>
        <div className="bb-small bb-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="seat" size={15} /> {full ? 'Full' : `${trip.seats_left} seat${trip.seats_left === 1 ? '' : 's'} left`}
        </div>
        {trip.booked ? (
          <span className="bb-chip bb-chip-green"><Icon name="check" size={14} /> Booked</span>
        ) : (
          <button className="bb-btn bb-btn-sm" disabled={full} onClick={() => onBook(trip)}>
            {full ? 'Full' : <>Book Ride <Icon name="chevron" size={15} /></>}
          </button>
        )}
      </div>
    </article>
  );
}
