"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/session";
import type { FormState } from "./auth";

async function requireAdmin() {
  const session = await getSession();
  if (session.profile?.role !== "ADMIN") redirect("/");
  return session;
}

const statusSchema = z.enum(["PENDING", "PUBLISHED", "CLOSED", "HIDDEN"]);

export async function setIncidentStatus(incidentId: number, status: string) {
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return;
  const { supabase } = await requireAdmin();
  await supabase.from("incidents").update({ status: parsed.data }).eq("id", incidentId);
  revalidatePath("/", "layout");
}

export async function deleteIncident(incidentId: number) {
  const { supabase } = await requireAdmin();
  await supabase.from("incidents").delete().eq("id", incidentId);
  revalidatePath("/", "layout");
  redirect("/admin");
}

const announcementSchema = z.object({
  title: z.string().trim().min(5, "El título debe tener al menos 5 caracteres").max(150),
  message: z.string().trim().min(10, "El mensaje debe tener al menos 10 caracteres").max(1000),
});

export async function sendAnnouncement(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = announcementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("send_announcement", {
    p_title: parsed.data.title,
    p_message: parsed.data.message,
  });
  if (error) return { error: "No se pudo enviar el comunicado." };

  revalidatePath("/admin");
  return { ok: "Comunicado enviado a todos los vecinos." };
}

export async function setUserStatus(userId: string, status: "ACTIVE" | "INACTIVE") {
  const { supabase, profile } = await requireAdmin();
  if (userId === profile!.id) return;
  await supabase.from("profiles").update({ status }).eq("id", userId);
  revalidatePath("/admin");
}
