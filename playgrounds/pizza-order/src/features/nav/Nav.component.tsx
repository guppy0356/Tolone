import { Link } from "@tanstack/react-router";

const linkClass =
  "block rounded px-3 py-2 text-sm transition-colors hover:bg-gray-100";
const activeLinkClass =
  "block rounded px-3 py-2 text-sm bg-red-50 font-medium text-red-700";

export function NavComponent() {
  return (
    <nav className="w-56 shrink-0 border-r bg-white p-4">
      <h2 className="mb-4 px-3 text-lg font-bold">Pizza Order</h2>
      <ul className="space-y-1">
        <li>
          <Link
            to="/"
            className={linkClass}
            activeProps={{ className: activeLinkClass }}
            activeOptions={{ exact: true }}
          >
            New Order
          </Link>
        </li>
        <li>
          <Link
            to="/history"
            className={linkClass}
            activeProps={{ className: activeLinkClass }}
          >
            Order History
          </Link>
        </li>
      </ul>
    </nav>
  );
}
