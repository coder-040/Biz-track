import { fieldErrorClass } from "@/components/parties/form-styles";

interface FieldErrorProps {
  id: string;
  message?: string;
}

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p id={id} className={fieldErrorClass}>
      {message}
    </p>
  );
}
