import type { ReactNode } from "react";
import logo from "../../../brand/logo.svg";

type LayoutProps = {
  /** The example's folder in the repository, for the GitHub link. */
  example: string;
  children: ReactNode;
};

/** The devlanes page shell: header with the logo and the GitHub link, then the content. */
export function Layout({ example, children }: LayoutProps) {
  return (
    <div className="dl-page">
      <header className="dl-header">
        <a className="dl-brand" href="https://devlanes.run">
          <img src={logo} alt="" width="32" height="32" />
          devlanes
        </a>
        <nav className="dl-nav">
          <a href={`https://github.com/devlanes-run/examples/tree/main/${example}`}>
            {example} on GitHub
          </a>
        </nav>
      </header>
      <main className="dl-main">{children}</main>
    </div>
  );
}
