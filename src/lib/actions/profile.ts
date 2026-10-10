"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/session";
import type { FormState } from "./auth";

const schema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre").max(100),
  lastname: z.string().trim().min(2, "Ingresa tu apellido").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?51)?9\d{8}$/, "Ingresa un celular peruano válido (9 dígitos)")
    .or(z.literal("")),
});

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, profile } = await getSession();
  if (!profile) return { error: "Sesión expirada." };

  const { error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, phone: parsed.data.phone || null })
    .eq("id", profile.id);
  if (error) return { error: "No se pudo actualizar tu perfil." };

  revalidatePath("/", "layout");
  return { ok: "Perfil actualizado." };
}
