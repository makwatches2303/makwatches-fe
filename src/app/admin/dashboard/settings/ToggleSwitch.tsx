import { COLORS } from "../colors";

export function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      <div
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
      <span className="ml-2 text-sm" style={{ color: COLORS.text }}>
        {checked ? "Enabled" : "Disabled"}
      </span>
    </label>
  );
}
