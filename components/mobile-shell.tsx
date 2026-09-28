import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

type MobileShellProps = {
  children: ReactNode;
  className?: string;
};

export function MobileShell({ children, className = "" }: MobileShellProps) {
  return (
    <>
      <SiteHeader />
      <main className={`page-shell ${className}`.trim()}>{children}</main>
    </>
  );
}
