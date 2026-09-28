import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

type MobileShellProps = {
  children: ReactNode;
  className?: string;
};

export function MobileShell({ children, className = "" }: MobileShellProps) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <SiteHeader />
      <main className={`page-shell ${className}`.trim()} id="main-content" tabIndex={-1}>{children}</main>
    </>
  );
}
