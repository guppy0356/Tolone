# novel

A novel preview & reader playground demonstrating the 4-layer architecture with auth-gated content, server-side bookmarks, and a shared sidebar.

## Getting started

```bash
pnpm --filter @tolone/novel dev   # http://localhost:5174
pnpm --filter @tolone/novel test
```

---

## Routes

```
/                        → Redirects based on auth state
                           Authenticated → /books/1
                           Guest         → /preview-books/1

/login                   → Login screen (no sidebar)

/preview-books/:id       → Book summary page (public)
                           Shows title, author, and summary
                           "Start reading →" transitions to the preview reader (same URL, state-driven)
                           Preview allows reading up to the first 3 pages
                           After page 3 a login CTA is shown

/books/:id               → Authenticated reader
                           Redirects to /preview-books/:id if not logged in
                           Shows summary first; "Start reading →" opens the page reader
                           Resumes from the server-side bookmark (currentPage)
```

---

## API endpoints (mocked with MSW)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/login` | No | `{ email, password }` → `{ token }` |
| GET | `/api/books` | No | Book list for the sidebar |
| GET | `/api/preview-books/:id` | No | Book metadata + first 3 pages |
| GET | `/api/books/:id` | Yes | Book metadata + current page number + page content |
| POST | `/api/books/:id/next` | Yes | Advance bookmark by one page → returns new page content |
| POST | `/api/books/:id/prev` | Yes | Go back one page → returns new page content |

`GET /api/books/:id` includes both `currentPage` and `pageContent` in its response, so a single request is enough to render the reader. `next` and `prev` also return page content, so no follow-up fetch is needed after navigation.

---

## Auth

A simple cookie-based scheme stored under the `novelAuth` key in `document.cookie` (playground-only).

- `src/lib/auth-cookie.ts` — read/write helpers with a subscriber set
- `src/lib/use-auth.ts` — wraps `useSyncExternalStore` to expose reactive `{ isLoggedIn }`
- Logout only clears the cookie — no API call needed

---

## Feature breakdown

### `book-preview/`

| File | Role |
|------|------|
| `BookPreviewContainer` | Owns `showSummary` state; switches between `BookPreviewSummaryComponent` and `BookPreviewComponent` |
| `BookPreviewSummaryComponent` | Title, author, summary + "Start reading" button |
| `BookPreviewComponent` | Paginated preview (pages 1–3) + login/reader CTA |
| `BookPreview.facade` | Fetches `GET /api/preview-books/:id` once; manages `currentPage` with `useState` |
| `BookPreview.presenter` | Derives prev/next availability and CTA visibility |

### `book-reader/`

| File | Role |
|------|------|
| `BookReaderContainer` | Calls the facade and spreads its return to `BookReaderComponent` |
| `BookReaderComponent` | Shows summary view when `showSummary=true`, page view otherwise |
| `BookReader.facade` | Fetches `GET /api/books/:id` for bookmark + page content; optimistically updates the cache on next/prev mutations |
| `BookReader.presenter` | Derives prev/next button visibility |

### `sidebar/`

The facade fetches the book list (`GET /api/books`). Logout only calls `clearAuthCookie()` — no query invalidation needed because `useSyncExternalStore` notifies all subscribers directly.

### `login/`

The facade's `onSuccess` calls `setAuthCookie(token)`. After login the index route's `beforeLoad` checks `isAuthenticated()` and redirects to `/books/1`.

---

## Notes

- Auth is client-side only. A real backend would use `Set-Cookie` and server-side guards.
- Bookmarks are stored in an in-memory `Map` inside MSW and reset on page reload.
- Book data is hardcoded in `src/mocks/books-seed.ts` (5 books).
