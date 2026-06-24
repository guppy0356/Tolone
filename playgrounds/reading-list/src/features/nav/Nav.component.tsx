import { Link } from "@tanstack/react-router";

// App-shell chrome: a single top bar whose title links back to the list. No
// facade / presenter / container and no stories — it is not a feature.
export function NavComponent() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center px-6 py-3">
        <Link
          to="/reading-list"
          className="text-lg font-bold text-gray-900 hover:text-blue-600"
        >
          📚 Reading List
        </Link>
      </div>
    </header>
  );
}
