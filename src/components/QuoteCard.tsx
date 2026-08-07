import { useMemo } from 'react';
import { randomQuote } from '../lib/constants';

export function QuoteCard({ style }: { style?: React.CSSProperties }) {
  const q = useMemo(() => randomQuote(), []);
  return (
    <div className="quote-card" style={style}>
      <blockquote>&ldquo;{q.text}&rdquo;</blockquote>
      <cite>— {q.by}</cite>
    </div>
  );
}
