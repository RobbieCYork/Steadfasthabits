import type { Profile } from '../lib/types';

export function Avatar({ profile, size = '' }: { profile?: Profile | null; size?: 'lg' | 'md' | '' }) {
  if (!profile) return <span className={'avatar ' + size} style={{ background: '#888' }}>?</span>;
  const initial = (profile.name || '?').trim().charAt(0).toUpperCase();
  return (
    <span className={'avatar ' + size} style={{ background: profile.color }}>
      {initial}
    </span>
  );
}

export function GrowthMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" stroke="var(--accent)" strokeWidth="2" opacity="0.25" />
      <circle cx="24" cy="24" r="15" stroke="var(--accent)" strokeWidth="2" opacity="0.45" />
      <circle cx="24" cy="24" r="8" fill="var(--accent)" />
    </svg>
  );
}
