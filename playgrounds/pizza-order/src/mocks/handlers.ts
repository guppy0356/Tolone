import { delay } from "msw";
import { createOpenApiHttp } from "openapi-msw";
import type { components, paths } from "../types/openapi";

type PizzaOrderInput = components["schemas"]["PizzaOrderInput"];
type PizzaOrderRecord = components["schemas"]["PizzaOrderRecord"];
type Topping = components["schemas"]["Topping"];

const http = createOpenApiHttp<paths>();

const MEAT_TOPPINGS = new Set<Topping>([
  "pepperoni",
  "sausage",
  "bacon",
  "chicken",
  "ham",
]);

function calcSidePrice(toppings: Topping[], perTopping: number): number {
  const meatCount = toppings.filter((t) => MEAT_TOPPINGS.has(t)).length;
  const discount = meatCount >= 3 ? 1.0 : 0.0;
  return toppings.length * perTopping - discount;
}

function calcTotalPrice(input: PizzaOrderInput): number {
  const basePrice = input.size === "medium" ? 15.0 : 20.0;
  const crustPremium = input.crust === "stuffed" ? 2.0 : 0.0;
  if (input.mode === "whole") {
    return basePrice + crustPremium + calcSidePrice(input.toppings ?? [], 1.5);
  }
  return (
    basePrice +
    crustPremium +
    calcSidePrice(input.leftToppings ?? [], 0.75) +
    calcSidePrice(input.rightToppings ?? [], 0.75)
  );
}

const orders: PizzaOrderRecord[] = [];

export const handlers = [
  http.get("/api/orders", async ({ response }) => {
    await delay(400);
    return response(200).json([...orders].reverse());
  }),

  http.post("/api/orders", async ({ request, response }) => {
    const body = await request.json();
    await delay(800);
    const totalPrice = calcTotalPrice(body);
    const record: PizzaOrderRecord = {
      orderId: crypto.randomUUID(),
      totalPrice,
      crust: body.crust,
      size: body.size,
      mode: body.mode,
      toppings: body.toppings,
      leftToppings: body.leftToppings,
      rightToppings: body.rightToppings,
      createdAt: new Date().toISOString(),
    };
    orders.push(record);
    return response(201).json({
      orderId: record.orderId,
      totalPrice: record.totalPrice,
    });
  }),
];
