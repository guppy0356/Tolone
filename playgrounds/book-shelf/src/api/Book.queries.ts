export const bookQueries = {
  // The root only, so far: registering writes books, and no page reads them yet.
  // The list and detail definitions nest under it when their pages arrive, and
  // the write already invalidates at this level.
  all: () => ["books"] as const,
};
