import { useMemo, useState } from "react";
import Sheet from "./Sheet";
import { slotDays } from "../../lib/slots";

/** Choose a day in the next week, then a half-hour start time. */
export default function SlotSheet({ open, onClose, selected, onSelect }) {
  // Worked out when the sheet opens, so slots that have just passed drop off.
  const days = useMemo(() => (open ? slotDays() : []), [open]);
  const [dayKey, setDayKey] = useState(null);
  const [pick, setPick] = useState(selected);

  const pickOpen = days.some((d) => d.slots.some((s) => s.iso === pick && s.open));
  const selectedDay = selected && days.find((d) => d.slots.some((s) => s.iso === selected))?.key;
  const day = days.find((d) => d.key === (dayKey || selectedDay)) || days[0];

  const close = () => {
    setDayKey(null);
    setPick(selected);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      title="When should the professional arrive?"
      wide
      footer={
        <button
          className="btn btn-block"
          disabled={!pickOpen}
          onClick={() => {
            onSelect(pick);
            setDayKey(null);
          }}
        >
          Proceed with this slot
        </button>
      }
    >
      <p className="slot-note">All times are in India time (IST).</p>
      <div className="slot-days">
        {days.map((d) => (
          <button
            key={d.key}
            className={d.key === day?.key ? "active" : ""}
            onClick={() => setDayKey(d.key)}
          >
            <span>{d.weekday}</span>
            <strong>{d.date}</strong>
          </button>
        ))}
      </div>

      <h3 className="slot-heading">Select start time of service</h3>
      <div className="slot-times">
        {day?.slots.map((s) => (
          <button
            key={s.iso}
            disabled={!s.open}
            className={s.iso === pick ? "active" : ""}
            onClick={() => setPick(s.iso)}
          >
            {s.time}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
