import { ChevronLeft, ChevronRight } from 'lucide-react';
import { currentCutoffId, cutoffRangeLabel, shiftCutoff } from '../../utils/budget';

interface CutoffPickerProps {
  cutoffId: string;
  onChange: (id: string) => void;
}

export function CutoffPicker({ cutoffId, onChange }: CutoffPickerProps) {
  const current = currentCutoffId();
  return (
    <div className="card card--tight cutoff-picker">
      <button
        type="button"
        className="btn btn--secondary btn--icon"
        aria-label="Previous cutoff"
        onClick={() => onChange(shiftCutoff(cutoffId, -1))}
      >
        <ChevronLeft size={18} />
      </button>
      <div className="cutoff-picker__label">
        <strong>{cutoffRangeLabel(cutoffId)}</strong>
        {cutoffId !== current ? (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => onChange(current)}>
            Go to current cutoff
          </button>
        ) : (
          <span>Current cutoff</span>
        )}
      </div>
      <button
        type="button"
        className="btn btn--secondary btn--icon"
        aria-label="Next cutoff"
        onClick={() => onChange(shiftCutoff(cutoffId, 1))}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
