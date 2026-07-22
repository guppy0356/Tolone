import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { TravelRequestComponent } from "./TravelRequest.component";
import type { TravelRequestContainerState } from "./TravelRequest.container.hook";
import type {
  TravelRequest,
  TravelRequestDetail,
} from "@api/TravelRequest.api";
import type { Superior } from "@api/Superior.api";

const requests: TravelRequest[] = [
  {
    id: "tr-1",
    purpose: "Client visit in Osaka",
    startDate: "2026-07-01",
    endDate: "2026-07-02",
    totalAmount: 45800,
    status: "pending",
    approvalCount: 1,
  },
  {
    id: "tr-2",
    purpose: "Tech conference in Fukuoka",
    startDate: "2026-07-15",
    endDate: "2026-07-17",
    totalAmount: 128400,
    status: "pending",
    approvalCount: 0,
  },
  {
    id: "tr-3",
    purpose: "Factory audit in Nagoya",
    startDate: "2026-06-20",
    endDate: "2026-06-20",
    totalAmount: 21300,
    status: "completed",
    approvalCount: 2,
  },
];

const detail: TravelRequestDetail = {
  ...requests[0],
  items: [
    { id: "i-1", label: "Shinkansen (round trip)", amount: 29000 },
    { id: "i-2", label: "Hotel (1 night)", amount: 12000 },
    { id: "i-3", label: "Per diem", amount: 4800 },
  ],
};

const superiors: Superior[] = [
  { id: "sup-1", name: "Aiko Tanaka", title: "Engineering Manager" },
  { id: "sup-2", name: "Kenji Sato", title: "Director of Sales" },
];

function makeState(
  overrides: Partial<TravelRequestContainerState> = {},
): TravelRequestContainerState {
  return {
    requests,
    isRequestsPending: false,
    isRequestsRefetching: false,
    selectedRequestId: null,
    selectRequest: vi.fn(),
    detail: undefined,
    isDetailPending: false,
    superiors,
    isSuperiorsPending: false,
    approve: vi.fn(async () => {}),
    reject: vi.fn(async () => {}),
    ...overrides,
  };
}

test("clicking a row selects the request", async () => {
  const state = makeState();
  const screen = await render(<TravelRequestComponent {...state} />);

  await screen.getByText("Tech conference in Fukuoka").click();

  expect(state.selectRequest).toHaveBeenCalledWith("tr-2");
});

test("the drawer titles with the purpose and shows the amount breakdown", async () => {
  const state = makeState({ selectedRequestId: "tr-1", detail });
  const screen = await render(<TravelRequestComponent {...state} />);

  const drawer = screen.getByRole("dialog", { name: "Travel expense detail" });
  await expect
    .element(drawer.getByRole("heading", { name: "Client visit in Osaka" }))
    .toBeVisible();
  await expect
    .element(drawer.getByText("Shinkansen (round trip)"))
    .toBeVisible();
  await expect.element(drawer.getByText("¥29,000")).toBeVisible();
  await expect.element(drawer.getByText("¥45,800")).toBeVisible();
  await expect.element(drawer.getByText("1 / 2 approvals")).toBeVisible();
});

test("approving asks for the next superior, then approves with the chosen one", async () => {
  const state = makeState({ selectedRequestId: "tr-1", detail });
  const screen = await render(<TravelRequestComponent {...state} />);

  const drawer = screen.getByRole("dialog", { name: "Travel expense detail" });
  await drawer.getByRole("button", { name: "Approve" }).click();

  const superiorDrawer = screen.getByRole("dialog", {
    name: "Select next approver",
  });
  await expect.element(superiorDrawer.getByText("Aiko Tanaka")).toBeVisible();
  await expect
    .element(superiorDrawer.getByText("Engineering Manager"))
    .toBeVisible();

  await superiorDrawer.getByText("Aiko Tanaka").click();

  expect(state.approve).toHaveBeenCalledWith("tr-1", "sup-1");
  await expect.element(superiorDrawer).not.toBeInTheDocument();
});

test("rejecting from the drawer rejects the selected request", async () => {
  const state = makeState({ selectedRequestId: "tr-1", detail });
  const screen = await render(<TravelRequestComponent {...state} />);

  const drawer = screen.getByRole("dialog", { name: "Travel expense detail" });
  await drawer.getByRole("button", { name: "Reject" }).click();

  expect(state.reject).toHaveBeenCalledWith("tr-1");
});

test("next and previous move between requests", async () => {
  const state = makeState({
    selectedRequestId: "tr-2",
    detail: { ...detail, ...requests[1] },
  });
  const screen = await render(<TravelRequestComponent {...state} />);

  await screen.getByRole("button", { name: "Next" }).click();
  expect(state.selectRequest).toHaveBeenCalledWith("tr-3");

  await screen.getByRole("button", { name: "Previous" }).click();
  expect(state.selectRequest).toHaveBeenCalledWith("tr-1");
});

test("previous is disabled on the first request", async () => {
  const state = makeState({ selectedRequestId: "tr-1", detail });
  const screen = await render(<TravelRequestComponent {...state} />);

  await expect
    .element(screen.getByRole("button", { name: "Previous" }))
    .toBeDisabled();
  await expect
    .element(screen.getByRole("button", { name: "Next" }))
    .toBeEnabled();
});

test("next is disabled on the last request", async () => {
  const state = makeState({
    selectedRequestId: "tr-3",
    detail: { ...detail, ...requests[2] },
  });
  const screen = await render(<TravelRequestComponent {...state} />);

  await expect
    .element(screen.getByRole("button", { name: "Next" }))
    .toBeDisabled();
  await expect
    .element(screen.getByRole("button", { name: "Previous" }))
    .toBeEnabled();
});

test("a completed request offers no approve or reject actions", async () => {
  const state = makeState({
    selectedRequestId: "tr-3",
    detail: { ...detail, ...requests[2] },
  });
  const screen = await render(<TravelRequestComponent {...state} />);

  const drawer = screen.getByRole("dialog", { name: "Travel expense detail" });
  await expect
    .element(drawer.getByText("This request has been completed."))
    .toBeVisible();
  await expect
    .element(drawer.getByRole("button", { name: "Approve" }))
    .not.toBeInTheDocument();
  await expect
    .element(drawer.getByRole("button", { name: "Reject" }))
    .not.toBeInTheDocument();
});
