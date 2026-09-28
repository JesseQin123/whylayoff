import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MobileShell } from "@/components/mobile-shell";

describe("MobileShell accessibility", () => {
  it("provides a named skip link and focusable main landmark", () => {
    render(<MobileShell><h1>Pilot page</h1></MobileShell>);

    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  });
});
