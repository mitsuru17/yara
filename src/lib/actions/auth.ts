"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: string } | undefined;

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

const loginSchema = z.object({
  email: z.email("Ingresa un correo válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Correo o contraseña incorrectos." };

  redirect(safeNext(formData.get("next")));
}

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Ingresa tu nombre").max(100),
    lastname: z.string().trim().min(2, "Ingresa tu apellido").max(100),
    email: z.email("Ingresa un correo válido"),
    phone: z
      .string()
      .trim()
      .regex(/^(\+?51)?9\d{8}$/, "Ingresa un celular peruano válido (9 dígitos)")
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Za-z]/, "La contraseña debe incluir letras")
      .regex(/\d/, "La contraseña debe incluir números"),
    confirm: z.string(),
    consent: z.literal("on", { error: "Debes aceptar el tratamiento de datos personales" }),
  })
  .refine((d) => d.password === d.confirm, { message: "Las contraseñas no coinciden" });

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, lastname, email, phone, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, lastname, phone: phone || null } },
  });
  if (error) {
    return {
      error: error.message.includes("registered")
        ? "Ya existe una cuenta con ese correo."
        : "No se pudo crear la cuenta. Inténtalo nuevamente.",
    };
  }
  if (!data.session) {
    return { ok: "Te enviamos un correo para confirmar tu cuenta." };
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
