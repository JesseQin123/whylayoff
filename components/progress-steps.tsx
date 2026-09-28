import { stages } from "@/lib/content";

type ProgressStepsProps = {
  current: number;
};

export function ProgressSteps({ current }: ProgressStepsProps) {
  return (
    <ol className="progress-steps" aria-label="Interview progress">
      {stages.map((stage, index) => {
        const state = index < current ? "complete" : index === current ? "current" : "upcoming";
        return (
          <li className={`progress-step progress-step--${state}`} key={stage.label}>
            <span className="progress-step__dot" aria-hidden="true">
              {index < current ? "✓" : index + 1}
            </span>
            <span className="progress-step__label">{stage.shortLabel}</span>
          </li>
        );
      })}
    </ol>
  );
}
