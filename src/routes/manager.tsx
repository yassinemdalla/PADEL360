import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { managerSchedule, managerBookings, type SlotState } from "@/lib/padel-data";

export const Route = createFileRoute("/manager")({
  head: () => ({
    meta: [
      { title: "Club Manager — Courts, Bookings & Schedules | PadelBase" },
      {
        name: "description",
        content: "Run your padel club: control court availability, review bookings and manage the daily schedule.",
      },
      { property: "og:title", content: "Club Manager — Courts, Bookings & Schedules | PadelBase" },
      {
        property: "og:description",
        content: "Court availability, bookings and schedules for padel club managers.",
      },
    ],
  }),
  component: ManagerPage,
});

const stateStyles: Record<SlotState, string> = {
  booked: "bg-court text-ink",
  hold: "bg-clay text-sand",
  available: "bg-ink text-sand",
};

function ManagerPage() {
  const [schedule, setSchedule] = useState(managerSchedule);

  const toggle = (rowIndex: number, courtIndex: number) => {
    setSchedule((prev) =>
      prev.map((row, ri) =>
        ri !== rowIndex
          ? row
          : {
              ...row,
              courts: row.courts.map((c, ci) => {
                if (ci !== courtIndex) return c;
                const next: SlotState =
                  c.state === "available" ? "hold" : c.state === "hold" ? "booked" : "available";
                return {
                  state: next,
                  label: next === "available" ? "Open" : next === "hold" ? "Hold" : c.label === "Open" || c.label === "Hold" ? "Walk-in" : c.label,
                };
              }),
            },
      ),
    );
  };

  const open = schedule.flatMap((r) => r.courts).filter((c) => c.state === "available").length;
  const booked = schedule.flatMap((r) => r.courts).filter((c) => c.state === "booked").length;
  const total = schedule.length * 3;

  return (
    <div className="min-h-screen w-full bg-ink text-sand flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b-4 border-clay">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-clay mb-4">
              /// Riverside Padel Club · Manager
            </div>
            <h1 className="font-display font-black uppercase tracking-tighter text-5xl md:text-7xl leading-[0.85]">
              Club
              <br />
              <span className="text-clay">Manager.</span>
            </h1>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { v: booked, l: "Bookings today" },
                { v: `${Math.round((booked / total) * 100)}%`, l: "Court occupancy" },
                { v: open, l: "Open slots" },
                { v: "€612", l: "Est. revenue" },
              ].map((s) => (
                <div key={s.l} className="border-2 border-sand/30 p-3">
                  <div className="font-display font-black text-3xl leading-none">{s.v}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wide text-sand/60 mt-1">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-12 space-y-6">
          <div className="border-4 border-sand/30">
            <div className="bg-clay text-sand px-5 py-3 flex items-center justify-between">
              <h2 className="font-display font-black uppercase tracking-tight text-xl">
                Court Availability
              </h2>
              <span className="font-mono text-xs font-bold">Tap a slot to change state</span>
            </div>
            <div className="p-5 overflow-x-auto">
              <div className="min-w-[520px]">
                <div className="grid grid-cols-[7rem_repeat(3,1fr)] gap-2 font-mono text-[10px] uppercase tracking-widest text-sand/60 mb-2">
                  <div>Time</div>
                  <div>Court 1</div>
                  <div>Court 2</div>
                  <div>Court 3</div>
                </div>
                <div className="space-y-2">
                  {schedule.map((row, ri) => (
                    <div key={row.time} className="grid grid-cols-[7rem_repeat(3,1fr)] gap-2 items-stretch">
                      <div className="font-mono text-xs flex items-center">{row.time}</div>
                      {row.courts.map((c, ci) => (
                        <button
                          key={ci}
                          onClick={() => toggle(ri, ci)}
                          className={`border-2 border-sand/20 px-3 py-2 font-mono text-xs text-left ${stateStyles[c.state]}`}
                        >
                          {c.state === "available" ? "Available" : c.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-4 border-sand/30">
            <div className="bg-court text-ink px-5 py-3 flex items-center justify-between">
              <h2 className="font-display font-black uppercase tracking-tight text-xl">Today's Bookings</h2>
              <span className="font-mono text-xs font-bold">{managerBookings.length} reservations</span>
            </div>
            <div>
              {managerBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-wrap items-center gap-4 border-b-2 border-sand/20 last:border-b-0 px-5 py-4 font-mono text-xs"
                >
                  <span className="w-14 text-court font-bold">{b.time}</span>
                  <span className="w-20">{b.court}</span>
                  <span className="flex-1 font-display font-bold text-base not-italic">{b.player}</span>
                  <span
                    className={`px-2 py-0.5 font-bold ${
                      b.status === "Paid" ? "bg-court text-ink" : "bg-clay text-sand"
                    }`}
                  >
                    {b.status}
                  </span>
                  <span className="w-12 text-right">{b.price}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
