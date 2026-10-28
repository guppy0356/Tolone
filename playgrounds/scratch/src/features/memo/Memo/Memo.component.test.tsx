import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { MemoComponent } from "./Memo.component";

const memos = [
  { id: "1", title: "買い物リスト", status: "draft", createdAt: "2026-10-20T09:00:00Z" },
  { id: "2", title: "会議の議事録", status: "published", createdAt: "2026-10-23T10:15:00Z" },
] as const;

test("下書きタブを選ぶと下書きだけが残る", async () => {
  const screen = await render(
    <MemoComponent memos={[...memos]} isPending={false} isRefetching={false} />,
  );
  await screen.getByRole("tab", { name: "下書き" }).click();
  await expect.element(screen.getByText("買い物リスト")).toBeInTheDocument();
  await expect.element(screen.getByText("会議の議事録")).not.toBeInTheDocument();
});

test("タブはロード中も表示され、選択を保つ", async () => {
  const screen = await render(
    <MemoComponent memos={[]} isPending={true} isRefetching={false} />,
  );
  await screen.getByRole("tab", { name: "公開済み" }).click();
  await expect.element(screen.getByRole("tab", { name: "公開済み" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});
