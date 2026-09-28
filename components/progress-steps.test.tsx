import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressSteps } from "@/components/progress-steps";

describe("ProgressSteps", () => {
  it("marks prior, current, and upcoming steps", () => {
    const { container } = render(<ProgressSteps current={1} />);

    expect(screen.getByText("Background").parentElement).toHaveClass("progress-step--complete");
    expect(screen.getByText("Experience").parentElement).toHaveClass("progress-step--current");
    expect(screen.getByText("Results").parentElement).toHaveClass("progress-step--upcoming");
    expect(container.querySelectorAll("li")).toHaveLength(3);
  });
});
