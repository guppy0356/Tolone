interface SeedBook {
  id: string;
  title: string;
  author: string;
  summary: string;
  pages: string[];
}

function makePages(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return [
      `${prefix} — Page ${n}.`,
      `The morning fog still clung to the rooftops as the chapter began.`,
      `Paragraphs accumulated, sentences stretched, and the reader followed along page after page.`,
      `By the end of page ${n}, the narrator paused — and the next page beckoned.`,
    ].join(" ");
  });
}

export const books: SeedBook[] = [
  {
    id: "1",
    title: "The Lantern Keeper",
    author: "Mira Halloway",
    summary:
      "A coastal town tends a single lantern that has burned for two centuries. When it begins to flicker, the keepers must decide what they are really protecting.",
    pages: makePages("The Lantern Keeper", 6),
  },
  {
    id: "2",
    title: "Threads of the Northern Loom",
    author: "Ivar Beska",
    summary:
      "Three weavers, three winters, and one tapestry that refuses to be finished. A quiet meditation on craft, patience, and impermanence.",
    pages: makePages("Threads of the Northern Loom", 7),
  },
  {
    id: "3",
    title: "Quiet Cities",
    author: "Ren Tanaka",
    summary:
      "Walking essays from five emptied capitals. The author asks what a city remembers when no one is left to tell it.",
    pages: makePages("Quiet Cities", 5),
  },
  {
    id: "4",
    title: "The Cartographer's Apology",
    author: "Selena Marquez",
    summary:
      "A retired mapmaker returns to every place she ever drew incorrectly. Some welcome her back; others have moved on.",
    pages: makePages("The Cartographer's Apology", 8),
  },
  {
    id: "5",
    title: "Almost Spring",
    author: "Jonas Reyer",
    summary:
      "A novella about the week before the thaw, told through the unsent letters of a country doctor.",
    pages: makePages("Almost Spring", 5),
  },
];
