import type { CrustId, SizeId, ToppingId } from "../pizza-order/PizzaOrder.api";
import type { PizzaOrderRecord } from "./OrderHistory.api";

export interface OrderHistoryPresenterProps {
  orders: PizzaOrderRecord[];
}

export interface OrderHistoryItemVM {
  orderId: string;
  crustLabel: string;
  sizeLabel: string;
  modeLabel: string;
  toppingDisplay:
    | { mode: "whole"; toppings: string }
    | { mode: "half"; left: string; right: string };
  totalPrice: string;
  createdAt: string;
}

export interface OrderHistoryPresenter {
  items: OrderHistoryItemVM[];
  isEmpty: boolean;
}

const CRUST_LABELS: Record<CrustId, string> = {
  "hand-tossed": "Hand-Tossed",
  pan: "Pan",
  "thin-crispy": "Thin & Crispy",
  stuffed: "Stuffed Crust",
};

const SIZE_LABELS: Record<SizeId, string> = {
  medium: "Medium",
  large: "Large",
};

const TOPPING_LABELS: Record<ToppingId, string> = {
  pepperoni: "Pepperoni",
  sausage: "Sausage",
  bacon: "Bacon",
  chicken: "Chicken",
  ham: "Ham",
  mushroom: "Mushroom",
  onion: "Onion",
  "green-pepper": "Green Pepper",
  "black-olive": "Black Olive",
  jalapeno: "Jalapeño",
  "extra-cheese": "Extra Cheese",
  pineapple: "Pineapple",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function joinToppings(ids: ToppingId[] | undefined): string {
  if (!ids || ids.length === 0) return "—";
  return ids.map((id) => TOPPING_LABELS[id]).join(", ");
}

export function useOrderHistoryPresenter({
  orders,
}: OrderHistoryPresenterProps): OrderHistoryPresenter {
  const items: OrderHistoryItemVM[] = orders.map((order) => ({
    orderId: order.orderId,
    crustLabel: CRUST_LABELS[order.crust],
    sizeLabel: SIZE_LABELS[order.size],
    modeLabel: order.mode === "whole" ? "Whole" : "Half & Half",
    toppingDisplay:
      order.mode === "whole"
        ? { mode: "whole", toppings: joinToppings(order.toppings) }
        : {
            mode: "half",
            left: joinToppings(order.leftToppings),
            right: joinToppings(order.rightToppings),
          },
    totalPrice: `$${order.totalPrice.toFixed(2)}`,
    createdAt: dateFormatter.format(new Date(order.createdAt)),
  }));

  return {
    items,
    isEmpty: items.length === 0,
  };
}
