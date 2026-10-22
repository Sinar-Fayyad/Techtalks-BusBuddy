import { ReactNode } from 'react';
import Icon from '@/components/ui/Icon';

// Big page title with an icon, a cyan highlighted word and an optional right-hand action.
export default function PageHead({
  icon, title, highlight, subtitle, action,
}: { icon: string; title?: string; highlight: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="bb-page-head">
      <span className="bb-page-icon"><Icon name={icon} size={26} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1>{title} <em>{highlight}</em></h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
