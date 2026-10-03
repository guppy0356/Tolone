import { Link } from "@tanstack/react-router";

// App-shell chrome: no container, no hooks, no stories. Imports nothing routable.
export function Nav() {
  return (
    <nav className="flex items-center gap-4 border-b px-6 py-3">
      <span className="font-semibold">Job Tracker</span>
      <Link to="/applications" className="text-sm text-blue-600 hover:underline">
        Applications
      </Link>
      <Link to="/applications/new" className="text-sm text-blue-600 hover:underline">
        New application
      </Link>
    </nav>
  );
}
