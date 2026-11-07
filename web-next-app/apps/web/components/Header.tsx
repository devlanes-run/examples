import logo from "@/brand/logo.svg";

/** The devlanes header with the logo, the wordmark and the example's folder on GitHub. */
export function Header({ example }: { example: string }) {
  return (
    <header className="dl-header">
      <a className="dl-brand" href="https://devlanes.run">
        <img src={logo.src} alt="" width={32} height={32} />
        devlanes
      </a>
      <nav className="dl-nav">
        <a href={`https://github.com/devlanes-run/examples/tree/main/${example}`}>
          {example} on GitHub
        </a>
      </nav>
    </header>
  );
}
