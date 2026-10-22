'use client';
import { QRCodeSVG } from 'qrcode.react';

// White square so phone cameras read it easily, on any background.
export default function QrBox({ value, size = 250 }: { value: string; size?: number }) {
  return (
    <div style={{ background: '#fff', padding: 14, borderRadius: 18, display: 'inline-block', boxShadow: '0 0 28px rgba(0,229,255,0.35)' }}>
      <QRCodeSVG value={value} size={size} level="L" />
    </div>
  );
}
