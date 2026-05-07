import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type CrustId = components["schemas"]["Crust"];
export type SizeId = components["schemas"]["Size"];
export type ToppingId = components["schemas"]["Topping"];
export type PizzaOrderMode = components["schemas"]["PizzaOrderMode"];
export type PizzaOrderInput = components["schemas"]["PizzaOrderInput"];
export type PizzaOrderConfirmation = components["schemas"]["PizzaOrderConfirmation"];

export const MEAT_TOPPINGS: ReadonlySet<ToppingId> = new Set([
  "pepperoni",
  "sausage",
  "bacon",
  "chicken",
  "ham",
]);

export const pizzaOrderApi = {
  submit: (input: PizzaOrderInput) =>
    api.post("orders", { json: input }).json<PizzaOrderConfirmation>(),
};
