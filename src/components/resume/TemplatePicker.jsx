import { useEffect, useState } from "react";
import { Link } from "react-router";
import { request } from "../../lib/api";
export default function TemplatePicker({ data, onChange }) {
  const [plan, setPlan] = useState("basic");
  useEffect(() => {
    request("/api/account/usage")
      .then((d) => setPlan(d.plan))
      .catch(() => {});
  }, []);
  return (
    <div className="my-4 border rounded-xl p-4 space-y-3">
      <label className="block text-sm font-semibold">
        Document template
        <select
          value={data.template || "ats"}
          onChange={(e) => onChange({ ...data, template: e.target.value })}
          className="mt-2 w-full border rounded-xl p-2"
        >
          <option value="ats">Classic ATS — all plans</option>
          <option value="professional" disabled={plan === "basic"}>
            Professional — Standard / Premium
          </option>
          <option value="compact" disabled={plan === "basic"}>
            Compact — Standard / Premium
          </option>
        </select>
      </label>
      {plan === "premium" ? (
        <div className="flex gap-4 flex-wrap">
          <label className="text-sm">
            Heading color
            <input
              type="color"
              className="block mt-1"
              value={data.customStyle?.accent || "#1d4ed8"}
              onChange={(e) =>
                onChange({
                  ...data,
                  customStyle: { ...data.customStyle, accent: e.target.value },
                })
              }
            />
          </label>
          <label className="text-sm">
            Body text size
            <select
              value={data.customStyle?.fontSize || 10}
              onChange={(e) =>
                onChange({
                  ...data,
                  customStyle: {
                    ...data.customStyle,
                    fontSize: Number(e.target.value),
                  },
                })
              }
              className="block mt-1 border rounded-lg p-2"
            >
              {[9, 10, 11].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="text-sm text-blue-700"
            onClick={() => onChange({ ...data, customStyle: {} })}
          >
            Reset custom style
          </button>
        </div>
      ) : (
        <Link to="/pricing" className="text-xs text-blue-700 underline">
          Premium unlocks custom heading color and text size
        </Link>
      )}
    </div>
  );
}
