"use client";

import { useOptimistic, useTransition } from "react";
import { BadgeCheck, Eye, Star } from "lucide-react";
import { toggleVote } from "@/lib/actions/incidents";
import { VOTE_LABEL } from "@/lib/format";
import type { VoteType } from "@/lib/types";

const ICONS = { CONFIRMADO: BadgeCheck, YO_LO_VI: Eye, IMPORTANTE: Star };

export function VoteButtons({
  incidentId,
  counts,
  mine,
}: {
  incidentId: number;
  counts: Record<VoteType, number>;
  mine: VoteType[];
}) {
  const [, startTransition] = useTransition();
  const [state, toggle] = useOptimistic({ counts, mine }, (s, type: VoteType) => {
    const has = s.mine.includes(type);
    return {
      counts: { ...s.counts, [type]: s.counts[type] + (has ? -1 : 1) },
      mine: has ? s.mine.filter((t) => t !== type) : [...s.mine, type],
    };
  });

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-muted">¿Puedes validar este reporte?</p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(ICONS) as VoteType[]).map((type) => {
          const Icon = ICONS[type];
          const active = state.mine.includes(type);
          return (
            <button
              key={type}
              type="button"
              aria-pressed={active}
              onClick={() =>
                startTransition(async () => {
                  toggle(type);
                  await toggleVote(incidentId, type);
                })
              }
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active ? "border-brand-600 bg-brand-600 text-white" : "border-line hover:border-brand-500"
              }`}
            >
              <Icon className="h-4 w-4" /> {VOTE_LABEL[type]}
              <span className={active ? "text-white/80" : "text-muted"}>{state.counts[type]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
