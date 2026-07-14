import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import type { Photo } from "@api/Photo.api";
import { GalleryComponent } from "./Gallery.component";

// Deterministic offline placeholder — a solid-color SVG at the photo's size.
const photoUrl = (width: number, height: number, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${color}"/></svg>`,
  )}`;

const COLORS = [
  "#94a3b8",
  "#f9a8d4",
  "#86efac",
  "#fcd34d",
  "#93c5fd",
  "#c4b5fd",
];
const HEIGHTS = [300, 500, 420, 640, 360, 560, 480, 400];

const samplePhotos: Photo[] = Array.from({ length: 12 }, (_, i) => {
  const width = 400;
  const height = HEIGHTS[i % HEIGHTS.length];
  return {
    id: String(i + 1),
    title: `Photo ${i + 1}`,
    author: `Author ${(i % 4) + 1}`,
    url: photoUrl(width, height, COLORS[i % COLORS.length]),
    width,
    height,
  };
});

const meta = {
  title: "features/Gallery",
  component: GalleryComponent,
  args: {
    photos: [],
    isPending: false,
    isRefetching: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    loadMore: fn(),
  },
} satisfies Meta<typeof GalleryComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { photos: samplePhotos, hasNextPage: true },
};

export const Empty: Story = {};

export const Loading: Story = {
  args: { isPending: true },
};

export const LoadingMore: Story = {
  args: { photos: samplePhotos, hasNextPage: true, isFetchingNextPage: true },
};

export const Refetching: Story = {
  args: { photos: samplePhotos, hasNextPage: true, isRefetching: true },
};

export const EndReached: Story = {
  args: { photos: samplePhotos },
};

export const SinglePhoto: Story = {
  args: { photos: samplePhotos.slice(0, 1) },
};

export const ExtremeAspectRatios: Story = {
  args: {
    photos: [
      {
        id: "tall",
        title: "Very tall",
        author: "Author 1",
        url: photoUrl(200, 1200, COLORS[0]),
        width: 200,
        height: 1200,
      },
      {
        id: "wide",
        title: "Very wide",
        author: "Author 2",
        url: photoUrl(1600, 200, COLORS[1]),
        width: 1600,
        height: 200,
      },
      ...samplePhotos.slice(0, 4),
    ],
  },
};

export const LongText: Story = {
  args: {
    photos: [
      {
        id: "long",
        title: "A ".repeat(60) + "very long photo title that cannot fit",
        author:
          "An author with an improbably long display name that overflows the caption",
        url: photoUrl(400, 300, COLORS[2]),
        width: 400,
        height: 300,
      },
      ...samplePhotos.slice(0, 3),
    ],
  },
};
