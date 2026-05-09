import { memo } from "react";
import { useOrderHistoryPresenter } from "./OrderHistory.presenter";
import type { OrderHistoryFacade } from "./OrderHistory.facade";
import type { PizzaOrderRecord } from "./OrderHistory.api";

const OrderHistoryView = memo(function OrderHistoryView({
  orders,
}: {
  orders: PizzaOrderRecord[];
}) {
  const { items, isEmpty } = useOrderHistoryPresenter({ orders });

  if (isEmpty) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <p className="text-gray-500">No orders yet.</p>
        <p className="mt-1 text-sm text-gray-400">
          Place your first order to see it here.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.orderId} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="font-semibold">
              {item.crustLabel} · {item.sizeLabel} · {item.modeLabel}
            </p>
            <p className="text-lg font-bold">{item.totalPrice}</p>
          </div>
          {item.toppingDisplay.mode === "whole" ? (
            <p className="text-sm text-gray-600">
              <span className="text-gray-400">Toppings: </span>
              {item.toppingDisplay.toppings}
            </p>
          ) : (
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="text-gray-400">Left: </span>
                {item.toppingDisplay.left}
              </p>
              <p>
                <span className="text-gray-400">Right: </span>
                {item.toppingDisplay.right}
              </p>
            </div>
          )}
          <p className="mt-2 text-xs text-gray-400">{item.createdAt}</p>
        </li>
      ))}
    </ul>
  );
});

function OrderHistorySkeleton() {
  return (
    <ul className="space-y-3">
      {[0, 1, 2].map((i) => (
        <li key={i} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="mb-2 h-5 w-2/3 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

export function OrderHistoryComponent({
  orders,
  isPending,
  isFetching,
}: OrderHistoryFacade) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Order History</h1>
      {isPending ? (
        <OrderHistorySkeleton />
      ) : (
        <div className={`transition-opacity ${isFetching ? "opacity-50" : ""}`}>
          <OrderHistoryView orders={orders} />
        </div>
      )}
    </div>
  );
}
