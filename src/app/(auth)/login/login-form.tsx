"use client";

import { useActionState } from "react";
import { signIn } from "@/lib/actions/auth";
import { Field, FormMessage, SubmitButton, inputClass } from "@/components/form-fields";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(signIn, undefined);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <Field label="Correo electrónico">
        <input name="email" type="email" required autoComplete="email" className={inputClass} placeholder="tucorreo@ejemplo.com" />
      </Field>
      <Field label="Contraseña">
        <input name="password" type="password" required autoComplete="current-password" className={inputClass} placeholder="••••••••" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton>Iniciar sesión</SubmitButton>
    </form>
  );
}
