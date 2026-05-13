import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ReportDetailComponent } from "./ReportDetail.component";
import type { ReportDetailFacade } from "./ReportDetail.facade";

// Recharts uses ResponsiveContainer which needs measured dimensions in jsdom;
// stub it so tests can assert against the chart's rendered DOM regardless.
vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 360 }}>{children}</div>
    ),
  };
});

const baseFacade: ReportDetailFacade = {
  detail: {
    id: "r1",
    name: "Q1 2026 Cost",
    teams: [
      {
        id: "t1",
        name: "Platform",
        members: [{ memberId: "m1", name: "Ada", hourlyRate: 120 }],
      },
      {
        id: "t2",
        name: "Mobile",
        members: [{ memberId: "m3", name: "Grace", hourlyRate: 105 }],
      },
    ],
    totalPayment: 12345,
    monthly: [
      { month: "2026-01", Platform: 5000, Mobile: 3000 },
      { month: "2026-02", Platform: 2500, Mobile: 1845 },
    ],
  },
  isPending: false,
  isFetching: false,
  isNotFound: false,
};

describe("ReportDetailComponent", () => {
  it("renders title, total, team list", () => {
    render(<ReportDetailComponent {...baseFacade} />);
    expect(screen.getByText("Q1 2026 Cost")).toBeInTheDocument();
    expect(screen.getByText("$12,345")).toBeInTheDocument();
    expect(screen.getByText("Platform")).toBeInTheDocument();
    expect(screen.getByText("Mobile")).toBeInTheDocument();
  });

  it("shows skeleton when pending", () => {
    const { container } = render(
      <ReportDetailComponent {...baseFacade} isPending={true} detail={undefined} />,
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("shows not-found message when isNotFound", () => {
    render(
      <ReportDetailComponent
        {...baseFacade}
        isNotFound={true}
        detail={undefined}
      />,
    );
    expect(screen.getByText(/Report not found/)).toBeInTheDocument();
  });

  it("shows empty-data fallback when no monthly data", () => {
    render(
      <ReportDetailComponent
        {...baseFacade}
        detail={{ ...baseFacade.detail!, monthly: [], teams: [] }}
      />,
    );
    expect(screen.getByText(/No data to display/)).toBeInTheDocument();
  });
});
