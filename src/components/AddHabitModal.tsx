import { useState } from 'react';
import { Modal } from './Modal';
import { HABIT_CATALOG, CUSTOM_ICONS } from '../lib/constants';
import type { CatalogHabit } from '../lib/constants';
import type { Category, Frequency, ScopeType } from '../lib/types';
import { FREQ_LABEL } from '../lib/constants';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

export function AddHabitModal({ scopeType, scopeId, onClose }: { scopeType: ScopeType; scopeId: string; onClose: () => void }) {
  const { addHabit } = useData();
  const toast = useToast();

  const [mode, setMode] = useState<'catalog' | 'custom'>('catalog');
  const [catalogPick, setCatalogPick] = useState<CatalogHabit | null>(null);
  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState('⭐');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    let name: string;
    let icon: string;
    let category: Category;
    if (mode === 'catalog') {
      if (!catalogPick) return toast('Pick a habit from the catalog');
      name = catalogPick.name;
      icon = catalogPick.icon;
      category = catalogPick.category;
    } else {
      if (!customName.trim()) return toast('Name your habit');
      name = customName.trim();
      icon = customIcon;
      category = 'custom';
    }
    setSubmitting(true);
    await addHabit(scopeType, scopeId, name, icon, category, frequency);
    setSubmitting(false);
    toast('Added ' + name);
    onClose();
  }

  return (
    <Modal title="Add a Habit" onClose={onClose}>
      <div className="seg">
        <button className={mode === 'catalog' ? 'sel' : ''} onClick={() => setMode('catalog')} type="button">
          📋 From Catalog
        </button>
        <button className={mode === 'custom' ? 'sel' : ''} onClick={() => setMode('custom')} type="button">
          ✨ Custom
        </button>
      </div>

      {mode === 'catalog' ? (
        <div className="field">
          <label>Choose a Habit</label>
          <div className="catalog-grid">
            {HABIT_CATALOG.map((hc) => (
              <button
                key={hc.name}
                type="button"
                className={'catalog-item' + (catalogPick?.name === hc.name ? ' sel' : '')}
                onClick={() => setCatalogPick(hc)}
              >
                <span style={{ fontSize: 17 }}>{hc.icon}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, textAlign: 'left' }}>{hc.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="field">
            <label>Habit Name</label>
            <input type="text" placeholder="e.g. Practice Guitar" value={customName} onChange={(e) => setCustomName(e.target.value)} />
          </div>
          <div className="field">
            <label>Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CUSTOM_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  className="pill"
                  style={customIcon === ic ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : {}}
                  onClick={() => setCustomIcon(ic)}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="field">
        <label>Frequency</label>
        <div className="seg">
          {(['daily', 'weekly', 'monthly'] as Frequency[]).map((f) => (
            <button key={f} type="button" className={frequency === f ? 'sel' : ''} onClick={() => setFrequency(f)}>
              {FREQ_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary btn-block" onClick={submit} disabled={submitting}>
        {submitting ? 'Adding…' : 'Add Habit'}
      </button>
    </Modal>
  );
}
