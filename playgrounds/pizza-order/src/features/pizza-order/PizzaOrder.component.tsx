import { memo } from "react";
import { usePizzaOrderPresenter } from "./PizzaOrder.presenter";
import type { PizzaOrderFacade } from "./PizzaOrder.facade";
import type {
  CrustOptionVM,
  SizeOptionVM,
  ToppingOptionVM,
} from "./PizzaOrder.presenter";
import type { CrustId, SizeId, ToppingId } from "./PizzaOrder.api";

// --- View (memo) ---

interface PizzaOrderViewProps {
  crust: PizzaOrderFacade["crust"];
  size: PizzaOrderFacade["size"];
  mode: PizzaOrderFacade["mode"];
  leftToppings: PizzaOrderFacade["leftToppings"];
  rightToppings: PizzaOrderFacade["rightToppings"];
  setCrust: PizzaOrderFacade["setCrust"];
  setSize: PizzaOrderFacade["setSize"];
  setMode: PizzaOrderFacade["setMode"];
  setLeftToppings: PizzaOrderFacade["setLeftToppings"];
  setRightToppings: PizzaOrderFacade["setRightToppings"];
  submitOrder: PizzaOrderFacade["submitOrder"];
}

const PizzaOrderView = memo(function PizzaOrderView(props: PizzaOrderViewProps) {
  const {
    totalPrice,
    leftDiscountLabel,
    rightDiscountLabel,
    isSubmitDisabled,
    crustOptions,
    sizeOptions,
    wholeToppingOptions,
    leftToppingOptions,
    rightToppingOptions,
    handleSelectCrust,
    handleSelectSize,
    handleToggleMode,
    handleToggleWholeTopping,
    handleToggleLeftTopping,
    handleToggleRightTopping,
    handleSubmit,
  } = usePizzaOrderPresenter(props);

  const { crust, size, mode } = props;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Build Your Pizza</h1>

      {/* Order rules */}
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="mb-2 font-semibold">How it works</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Max 5 toppings per side, max 3 meat toppings per side</li>
          <li>Topping price: +$1.50 (whole) / +$0.75 per half</li>
          <li>Meat Lovers discount: 3+ meat toppings on a side → −$1.00</li>
          <li>Stuffed Crust: +$2.00</li>
          <li>Thin &amp; Crispy: Large size not available</li>
          <li>Select a crust, a size, and at least 1 topping per active side to place your order</li>
        </ul>
      </section>

      {/* Crust */}
      <section>
        <h2 className="mb-2 font-semibold">Crust</h2>
        <CrustSelector
          options={crustOptions}
          selected={crust}
          onSelect={handleSelectCrust}
        />
      </section>

      {/* Size */}
      <section>
        <h2 className="mb-2 font-semibold">Size</h2>
        <SizeSelector
          options={sizeOptions}
          selected={size}
          onSelect={handleSelectSize}
        />
      </section>

      {/* Whole / Half toggle */}
      <section>
        <h2 className="mb-2 font-semibold">Style</h2>
        <button
          type="button"
          onClick={handleToggleMode}
          className="rounded border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
        >
          {mode === "whole" ? "Switch to Half & Half" : "Switch to Whole Pizza"}
        </button>
      </section>

      {/* Toppings */}
      <section>
        <h2 className="mb-2 font-semibold">Toppings</h2>
        {mode === "whole" ? (
          <ToppingPanel
            label="Whole Pizza"
            options={wholeToppingOptions}
            onToggle={handleToggleWholeTopping}
            discountLabel={leftDiscountLabel}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>

              <ToppingPanel
                label="Left Half"
                options={leftToppingOptions}
                onToggle={handleToggleLeftTopping}
                discountLabel={leftDiscountLabel}
              />
            </div>
            <ToppingPanel
              label="Right Half"
              options={rightToppingOptions}
              onToggle={handleToggleRightTopping}
              discountLabel={rightDiscountLabel}
            />
          </div>
        )}
      </section>

      {/* Price + Submit */}
      <section className="flex items-center justify-between border-t pt-4">
        <div>
          <p className="text-xl font-bold">{totalPrice}</p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="rounded bg-red-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Place Order
        </button>
      </section>
    </div>
  );
});

function CrustSelector({
  options,
  selected,
  onSelect,
}: {
  options: CrustOptionVM[];
  selected: CrustId | null;
  onSelect: (id: CrustId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={o.isDisabled}
          onClick={() => onSelect(o.id)}
          className={`rounded border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            selected === o.id
              ? "border-red-600 bg-red-600 text-white"
              : "hover:border-gray-400"
          }`}
        >
          {o.label}
          {o.priceLabel ? (
            <span className="ml-1 text-xs opacity-75">{o.priceLabel}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function SizeSelector({
  options,
  selected,
  onSelect,
}: {
  options: SizeOptionVM[];
  selected: SizeId | null;
  onSelect: (id: SizeId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={o.isDisabled}
          onClick={() => onSelect(o.id)}
          className={`rounded border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            selected === o.id
              ? "border-red-600 bg-red-600 text-white"
              : "hover:border-gray-400"
          }`}
        >
          {o.label}
          <span className="ml-1 text-xs opacity-75">{o.priceLabel}</span>
        </button>
      ))}
    </div>
  );
}

function ToppingPanel({
  label,
  options,
  onToggle,
  discountLabel,
}: {
  label: string;
  options: ToppingOptionVM[];
  onToggle: (id: ToppingId) => void;
  discountLabel: string | null;
}) {
  const meat = options.filter((o) => o.category === "meat");
  const veggie = options.filter((o) => o.category === "veggie");

  return (
    <div className="rounded border p-3">
      <p className="mb-2 text-sm font-medium text-gray-600">{label}</p>
      {discountLabel ? (
        <p className="mb-2 text-xs font-medium text-green-700">{discountLabel}</p>
      ) : null}
      <div className="mb-3">
        <p className="mb-1 text-xs text-gray-500">Meat</p>
        <div className="space-y-1">
          {meat.map((o) => (
            <ToppingCheckbox key={o.id} option={o} onToggle={onToggle} />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs text-gray-500">Veggie / Other</p>
        <div className="space-y-1">
          {veggie.map((o) => (
            <ToppingCheckbox key={o.id} option={o} onToggle={onToggle} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ToppingCheckbox({
  option,
  onToggle,
}: {
  option: ToppingOptionVM;
  onToggle: (id: ToppingId) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 text-sm ${
        option.isDisabled ? "cursor-not-allowed opacity-40" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={option.isChecked}
        disabled={option.isDisabled}
        onChange={() => onToggle(option.id)}
        className="size-4"
      />
      {option.label}
    </label>
  );
}

// --- Component (outer, no memo) ---

export function PizzaOrderComponent({
  crust,
  size,
  mode,
  leftToppings,
  rightToppings,
  setCrust,
  setSize,
  setMode,
  setLeftToppings,
  setRightToppings,
  isSubmitting,
  submitOrder,
}: PizzaOrderFacade) {
  return (
    <div className={isSubmitting ? "pointer-events-none opacity-50" : ""}>
      <PizzaOrderView
        crust={crust}
        size={size}
        mode={mode}
        leftToppings={leftToppings}
        rightToppings={rightToppings}
        setCrust={setCrust}
        setSize={setSize}
        setMode={setMode}
        setLeftToppings={setLeftToppings}
        setRightToppings={setRightToppings}
        submitOrder={submitOrder}
      />
    </div>
  );
}
