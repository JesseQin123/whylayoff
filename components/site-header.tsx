import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/" aria-label="Next Chapter home">
          <span className="brand__mark" aria-hidden="true">
            N
          </span>
          <span>Next Chapter</span>
        </Link>
        <nav className="site-nav" aria-label="Primary navigation">
          <Link href="/start">Start</Link>
          <Link href="/results">My results</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
