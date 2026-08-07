import { useState } from 'react';
import { Modal } from './Modal';
import { HABIT_CATALOG } from '../lib/constants';
import type { CatalogHabit } from '../lib/constants';
import type { Visibility } from '../lib/types';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useRouter } from '../lib/router';

export function NewCompetitionModal({ onClose }: { onClose: () => void }) {
  const { createCompetition } = useData();
  const toast = useToast();
  const { navigate } = useRouter();

  const [name, setName] = useState('');
  const [goal, setGoal] = useState(150);
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [picks, setPicks] = useState<CatalogHabit[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function togglePick(h: CatalogHabit) {
    setPicks((prev) => (prev.some((p) => p.name === h.name) ? prev.filter((p) => p.name !== h.name) : [...prev, h]));
  }

  async function submit() {
    if (!name.trim()) return toast('Give your competition a name');
    if (picks.length === 0) return toast('Pick at least one habit');
    setSubmitting(true);
    const id = await createCompetition(name.trim(), goal || 150, visibility, picks);
    setSubmitting(false);
    if (!id) return toast('Something went wrong — try again');
    onClose();
    navigate(`/c/${id}/scoreboard`);
  }

  return (
    <Modal title="Start a Competition" onClose={onClose}>
      <div className="field">
        <label>Competition Name</label>
        <input type="text" placeholder="e.g. Bible Time with Dad" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="field">
        <label>Goal Points to Win</label>
        <input type="number" min={10} value={goal} onChange={(e) => setGoal(parseInt(e.target.value || '0', 10))} />
      </div>

      <div className="field">
        <label>Visibility</label>
        <div className="seg">
          <button className={visibility === 'private' ? 'sel' : ''} onClick={() => setVisibility('private')} type="button">
            🔒 Private (invite code)
          </button>
          <button className={visibility === 'public' ? 'sel' : ''} onClick={() => setVisibility('public')} type="button">
            🌐 Public (listed)
          </button>
        </div>
      </div>

      <div className="field">
        <label>Habits to Compete On (pick at least one)</label>
        <div className="catalog-grid">
          {HABIT_CATALOG.map((hc) => (
            <button
              key={hc.name}
              type="button"
              className={'catalog-item' + (picks.some((p) => p.name === hc.name) ? ' sel' : '')}
              onClick={() => togglePick(hc)}
            >
              <span style={{ fontSize: 17 }}>{hc.icon}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, textAlign: 'left' }}>{hc.name}</span>
            </button>
          ))}
        </div>
        <p className="faint" style={{ fontSize: 12, margin: '6px 0 0' }}>
          You can add custom habits (and set their frequency) after creating the competition.
        </p>
      </div>

      <button className="btn btn-primary btn-block" onClick={submit} disabled={submitting}>
        {submitting ? 'Creating…' : 'Create Competition'}
      </button>
    </Modal>
  );
}
