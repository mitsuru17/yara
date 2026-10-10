"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { Field, FormMessage, SubmitButton, inputClass } from "@/components/form-fields";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfile, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          <input name="name" defaultValue={profile.name} required className={inputClass} />
        </Field>
        <Field label="Apellido">
          <input name="lastname" defaultValue={profile.lastname} required className={inputClass} />
        </Field>
      </div>
      <Field label="Correo electrónico">
        <input value={profile.email} disabled className={`${inputClass} bg-canvas text-muted`} />
      </Field>
      <Field label="Celular">
        <input name="phone" defaultValue={profile.phone ?? ""} inputMode="numeric" className={inputClass} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="sm:w-auto">Guardar cambios</SubmitButton>
    </form>
  );
}
