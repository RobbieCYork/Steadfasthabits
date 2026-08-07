import { useState } from 'react';
import { Modal } from './Modal';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useRouter } from '../lib/router';

export function JoinModal({ onClose }: { onClose: () => void }) {
  const { joinByCode } = useData();
  const toast = useToast();
  const { navigate } = useRouter();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!code.trim()) return;
    setSubmitting(true);
    const { error, compId } = await joinByCode(code);
    setSubmitting(false);
    if (error || !compId) return toast('No competition found with that code');
    onClose();
    navigate(`/c/${compId}/scoreboard`);
  }

  return (
    <Modal title="Join a Competition" onClose={onClose}>
      <div className="field">
        <label>Invite Code</label>
        <input
          type="text"
          placeholder="e.g. AB3XQ9"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          style={{ textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'var(--font-mono)', fontWeight: 700 }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      <button className="btn btn-primary btn-block" onClick={submit} disabled={submitting}>
        {submitting ? 'Joining…' : 'Join'}
      </button>
    </Modal>
  );
}
