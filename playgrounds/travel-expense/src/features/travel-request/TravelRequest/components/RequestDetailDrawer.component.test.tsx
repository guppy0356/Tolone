import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import {
  RequestDetailDrawer,
  type RequestDetailDrawerProps,
} from "./RequestDetailDrawer.component";
import type { RequestDetailView } from "../TravelRequest.component.hook";

const detailView: RequestDetailView = {
  id: "tr-1",
  purpose: "Client visit in Osaka",
  period: "2026-07-01 – 2026-07-02",
  totalAmount: "¥45,800",
  statusLabel: "Pending",
  status: "pending",
  approvalCount: 1,
  canJudge: true,
  items: [
    { id: "i-1", label: "Shinkansen (round trip)", amount: "¥29,000" },
    { id: "i-2", label: "Hotel (1 night)", amount: "¥12,000" },
    { id: "i-3", label: "Per diem", amount: "¥4,800" },
  ],
};

function makeProps(
  overrides: Partial<RequestDetailDrawerProps> = {},
): RequestDetailDrawerProps {
  return {
    isOpen: true,
    detailView,
    isDetailPending: false,
    hasPrev: true,
    hasNext: true,
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onClose: vi.fn(),
    onApproveClick: vi.fn(),
    onReject: vi.fn(),
    ...overrides,
  };
}

test("shows the purpose as title, the period, and the breakdown with total", async () => {
  const props = makeProps();
  const screen = await render(<RequestDetailDrawer {...props} />);

  await expect
    .element(screen.getByRole("heading", { name: "Client visit in Osaka" }))
    .toBeVisible();
  await expect
    .element(screen.getByText("2026-07-01 – 2026-07-02"))
    .toBeVisible();
  await expect.element(screen.getByText("Hotel (1 night)")).toBeVisible();
  await expect.element(screen.getByText("¥12,000")).toBeVisible();
  await expect.element(screen.getByText("¥45,800")).toBeVisible();
});

test("shows a skeleton without title while the detail is loading", async () => {
  const props = makeProps({ detailView: undefined, isDetailPending: true });
  const screen = await render(<RequestDetailDrawer {...props} />);

  await expect
    .element(screen.getByRole("dialog", { name: "Travel expense detail" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("heading", { name: "Client visit in Osaka" }))
    .not.toBeInTheDocument();
});

test("footer navigation fires the prev/next callbacks and honors the flags", async () => {
  const props = makeProps({ hasPrev: false });
  const screen = await render(<RequestDetailDrawer {...props} />);

  await expect
    .element(screen.getByRole("button", { name: "Previous" }))
    .toBeDisabled();

  await screen.getByRole("button", { name: "Next" }).click();
  expect(props.onNext).toHaveBeenCalled();
  expect(props.onPrev).not.toHaveBeenCalled();
});

test("approve and reject delegate to their callbacks", async () => {
  const props = makeProps();
  const screen = await render(<RequestDetailDrawer {...props} />);

  await screen.getByRole("button", { name: "Approve" }).click();
  expect(props.onApproveClick).toHaveBeenCalled();

  await screen.getByRole("button", { name: "Reject" }).click();
  expect(props.onReject).toHaveBeenCalled();
});

test("a judged request shows a note instead of actions", async () => {
  const props = makeProps({
    detailView: {
      ...detailView,
      status: "rejected",
      statusLabel: "Rejected",
      canJudge: false,
    },
  });
  const screen = await render(<RequestDetailDrawer {...props} />);

  await expect
    .element(screen.getByText("This request has been rejected."))
    .toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "Approve" }))
    .not.toBeInTheDocument();
});

test("the close button closes the drawer", async () => {
  const props = makeProps();
  const screen = await render(<RequestDetailDrawer {...props} />);

  await screen.getByRole("button", { name: "Close" }).click();
  expect(props.onClose).toHaveBeenCalled();
});

test("while closed it is inert and keeps the last view for the exit slide", async () => {
  const screen = await render(<RequestDetailDrawer {...makeProps()} />);
  await expect
    .element(screen.getByRole("heading", { name: "Client visit in Osaka" }))
    .toBeVisible();

  // Closing clears the selection upstream: isOpen drops with detailView.
  await screen.rerender(
    <RequestDetailDrawer
      {...makeProps({
        isOpen: false,
        detailView: undefined,
        isDetailPending: true,
      })}
    />,
  );

  const aside = screen.container.querySelector<HTMLElement>("aside");
  expect(aside?.inert).toBe(true);
  expect(screen.container.textContent).toContain("Client visit in Osaka");
});
