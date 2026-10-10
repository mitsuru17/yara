"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/lib/actions/auth";
import { Field, FormMessage, SubmitButton, inputClass } from "@/components/form-fields";

export function RegisterForm() {
  const [state, action] = useActionState(signUp, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          <input name="name" required maxLength={100} autoComplete="given-name" className={inputClass} />
        </Field>
        <Field label="Apellido">
          <input name="lastname" required maxLength={100} autoComplete="family-name" className={inputClass} />
        </Field>
      </div>
      <Field label="Correo electrónico">
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </Field>
      <Field label={<>Celular <span className="font-normal text-muted">(opcional)</span></>}>
        <input name="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="987654321" className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contraseña" hint="Mín. 8 caracteres, letras y números">
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        </Field>
        <Field label="Confirmar contraseña">
          <input name="confirm" type="password" required autoComplete="new-password" className={inputClass} />
        </Field>
      </div>
      <label className="flex items-start gap-3 text-sm text-muted">
        <input name="consent" type="checkbox" required className="mt-1 h-4 w-4 accent-brand-600" />
        <span>
          Autorizo el tratamiento de mis datos personales conforme a la Ley N.° 29733 y la{" "}
          <Link href="/informacion#privacidad" className="font-semibold text-brand-600 hover:underline">
            política de privacidad
          </Link>{" "}
          de YARA.
        </span>
      </label>
      <FormMessage state={state} />
      <SubmitButton>Crear cuenta</SubmitButton>
    </form>
  );
}
