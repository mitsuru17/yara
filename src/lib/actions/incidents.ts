"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/session";
import type { FormState } from "./auth";

const voteSchema = z.object({
  incidentId: z.number().int().positive(),
  type: z.enum(["CONFIRMADO", "YO_LO_VI", "IMPORTANTE"]),
});

export async function toggleVote(incidentId: number, type: string) {
  const parsed = voteSchema.safeParse({ incidentId, type });
  if (!parsed.success) return;
  const { supabase, profile } = await getSession();
  if (!profile) redirect(`/login?next=/reportes/${incidentId}`);

  const { data: existing } = await supabase
    .from("incident_votes")
    .select("id")
    .match({ incident_id: incidentId, user_id: profile.id, type })
    .maybeSingle();

  if (existing) {
    await supabase.from("incident_votes").delete().eq("id", existing.id);
  } else {
    await supabase
      .from("incident_votes")
      .insert({ incident_id: incidentId, user_id: profile.id, type: parsed.data.type });
  }
  revalidatePath(`/reportes/${incidentId}`);
}

const commentSchema = z.object({
  incidentId: z.coerce.number().int().positive(),
  message: z.string().trim().min(1, "Escribe un comentario").max(500, "Máximo 500 caracteres"),
});

export async function addComment(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = commentSchema.safeParse({
    incidentId: formData.get("incidentId"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, profile } = await getSession();
  if (!profile) return { error: "Inicia sesión para comentar." };

  const { error } = await supabase.from("comments").insert({
    incident_id: parsed.data.incidentId,
    user_id: profile.id,
    message: parsed.data.message,
  });
  if (error) return { error: "No se pudo publicar el comentario." };

  revalidatePath(`/reportes/${parsed.data.incidentId}`);
  return { ok: "Comentario publicado." };
}

export async function deleteComment(commentId: number, incidentId: number) {
  const { supabase } = await getSession();
  await supabase.from("comments").delete().eq("id", commentId);
  revalidatePath(`/reportes/${incidentId}`);
}
