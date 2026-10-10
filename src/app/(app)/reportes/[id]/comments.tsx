"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { addComment, deleteComment } from "@/lib/actions/incidents";
import { FormMessage, SubmitButton, inputClass } from "@/components/form-fields";

export function CommentForm({ incidentId }: { incidentId: number }) {
  const [state, action] = useActionState(addComment, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="mt-4 space-y-3">
      <input type="hidden" name="incidentId" value={incidentId} />
      <textarea
        name="message"
        rows={2}
        maxLength={500}
        required
        placeholder="Aporta información útil para los vecinos…"
        className={`${inputClass} resize-none`}
      />
      {state?.error && <FormMessage state={state} />}
      <SubmitButton className="sm:w-auto">Comentar</SubmitButton>
    </form>
  );
}

export function DeleteCommentButton({ commentId, incidentId }: { commentId: number; incidentId: number }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => deleteComment(commentId, incidentId))}
      aria-label="Eliminar comentario"
      className="rounded-full p-1.5 text-muted hover:bg-white hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
