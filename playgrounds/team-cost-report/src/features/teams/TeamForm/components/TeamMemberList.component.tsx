import { memo } from "react";
import type { PickedMember } from "../TeamForm.component.hook";

export interface TeamMemberListProps {
  picked: PickedMember[];
  onRateChange: (memberId: string, hourlyRate: number) => void;
  onRemove: (memberId: string) => void;
}

export const TeamMemberList = memo(function TeamMemberList({
  picked,
  onRateChange,
  onRemove,
}: TeamMemberListProps) {
  if (picked.length === 0) return null;

  const handleRateChange = (memberId: string, value: string) => {
    const parsed = Number.parseFloat(value);
    onRateChange(memberId, Number.isFinite(parsed) ? parsed : 0);
  };

  return (
    <ul className="space-y-2">
      {picked.map((p) => (
        <li
          key={p.memberId}
          className="flex items-center gap-3 rounded border border-gray-200 bg-white p-2.5"
        >
          <span className="flex-1 text-sm text-gray-800">{p.name}</span>
          <label className="flex items-center gap-1 text-sm text-gray-600">
            <span>$</span>
            <input
              type="number"
              min={0}
              step={1}
              value={p.hourlyRate || ""}
              onChange={(e) => handleRateChange(p.memberId, e.target.value)}
              placeholder="rate"
              aria-label={`Hourly rate for ${p.name}`}
              className="w-24 rounded border border-gray-300 px-2 py-1 text-right focus:border-blue-400 focus:outline-none"
            />
            <span>/h</span>
          </label>
          <button
            type="button"
            aria-label={`Remove ${p.name}`}
            onClick={() => onRemove(p.memberId)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
});
