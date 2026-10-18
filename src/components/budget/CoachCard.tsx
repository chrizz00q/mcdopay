import { Check, ChevronDown, ChevronUp, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import type { CoachAction, CoachStep } from '../../utils/budget';

interface CoachCardProps {
  steps: CoachStep[];
  onAction: (action: Exclude<CoachAction, null>) => void;
}

const ACTION_LABEL: Record<Exclude<CoachAction, null>, string> = {
  'estimate-deductions': 'Estimate deductions',
  'assign-rest': 'Add the rest to savings',
};

export function CoachCard({ steps, onAction }: CoachCardProps) {
  const [expanded, setExpanded] = useState(
    () => typeof window === 'undefined' || !window.matchMedia || window.matchMedia('(min-width: 981px)').matches,
  );

  const doneCount = steps.filter((s) => s.state === 'done').length;
  const nextIndex = steps.findIndex((s) => s.state !== 'done');
  const visible = expanded ? steps : nextIndex === -1 ? [] : [steps[nextIndex]];

  return (
    <section className="card card--tight coach" aria-label="Budget guide">
      <div className="section-heading">
        <h2>{nextIndex === -1 ? 'Your plan is ready' : 'Next up'}</h2>
        <span className="section-heading__hint">
          {doneCount} of {steps.length} done
        </span>
      </div>

      <ol className="coach__list">
        {visible.map((step) => {
          const index = steps.indexOf(step) + 1;
          return (
            <li className={`coach__step coach__step--${step.state}`} key={step.key}>
              <span className="coach__mark" aria-hidden="true">
                {step.state === 'done' ? <Check size={14} /> : step.state === 'warn' ? <TriangleAlert size={14} /> : index}
              </span>
              <div>
                <div className="coach__title">{step.title}</div>
                <p className="coach__detail">{step.detail}</p>
                {step.action && (
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => onAction(step.action!)}>
                    {ACTION_LABEL[step.action]}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <button type="button" className="btn btn--ghost btn--sm btn--block" onClick={() => setExpanded((v) => !v)}>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? 'Show only the next step' : 'Show all steps'}
      </button>
    </section>
  );
}
