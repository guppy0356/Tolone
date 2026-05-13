import { Link } from "@tanstack/react-router";

const linkClass =
  "block rounded px-3 py-2 text-sm transition-colors hover:bg-gray-100";
const activeLinkClass =
  "block rounded px-3 py-2 text-sm bg-blue-50 font-medium text-blue-700";

export function NavComponent() {
  return (
    <nav className="w-56 shrink-0 border-r bg-white p-4">
      <h2 className="mb-4 px-3 text-lg font-bold">Team Cost</h2>
      <ul className="space-y-1">
        <li>
          <Link
            to="/teams"
            className={linkClass}
            activeProps={{ className: activeLinkClass }}
          >
            Teams
          </Link>
        </li>
        <li>
          <Link
            to="/reports"
            className={linkClass}
            activeProps={{ className: activeLinkClass }}
          >
            Reports
          </Link>
        </li>
      </ul>
    </nav>
  );
}
