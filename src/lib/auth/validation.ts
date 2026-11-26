export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

export interface RegistrationData {
  fullName: string;
  email: string;
  password: string;
  phone: string | null;
}

export interface BusinessSetupData {
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  currency: string;
  description: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BUSINESS_TYPES = new Set([
  "Retail Shop",
  "Wholesale",
  "Grocery",
  "Stationery",
  "Hardware",
  "Other",
]);

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function optionalValue(value: unknown): string | null {
  const normalized = stringValue(value).trim();
  return normalized || null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateRegistration(
  input: Record<string, unknown>,
): ValidationResult<RegistrationData> {
  const fullName = stringValue(input.fullName).trim();
  const email = normalizeEmail(stringValue(input.email));
  const password = stringValue(input.password);
  const confirmPassword = stringValue(input.confirmPassword);
  const phone = optionalValue(input.phone);
  const errors: Record<string, string> = {};

  if (!fullName) errors.fullName = "Enter your full name.";
  else if (fullName.length > 120) {
    errors.fullName = "Full name must be 120 characters or fewer.";
  }

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (password.length < 8 || password.length > 128) {
    errors.password = "Password must be between 8 and 128 characters.";
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = "Password must include at least one letter and one number.";
  }

  if (confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (phone && phone.length > 32) {
    errors.phone = "Phone number must be 32 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };

  return {
    success: true,
    data: { fullName, email, password, phone },
  };
}

export function validateBusinessSetup(
  input: Record<string, unknown>,
): ValidationResult<BusinessSetupData> {
  const name = stringValue(input.name).trim();
  const type = stringValue(input.type).trim();
  const phone = optionalValue(input.phone);
  const email = optionalValue(input.email);
  const address = optionalValue(input.address);
  const currency = stringValue(input.currency).trim().toUpperCase() || "NPR";
  const description = optionalValue(input.description);
  const errors: Record<string, string> = {};

  if (!name) errors.name = "Enter your business name.";
  else if (name.length > 160) {
    errors.name = "Business name must be 160 characters or fewer.";
  }

  if (!BUSINESS_TYPES.has(type)) {
    errors.type = "Choose a valid business type.";
  }

  if (email && (email.length > 254 || !EMAIL_PATTERN.test(normalizeEmail(email)))) {
    errors.email = "Enter a valid business email address.";
  }

  if (phone && phone.length > 32) {
    errors.phone = "Business phone must be 32 characters or fewer.";
  }

  if (address && address.length > 240) {
    errors.address = "Business address must be 240 characters or fewer.";
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    errors.currency = "Choose a valid three-letter currency code.";
  }

  if (description && description.length > 1000) {
    errors.description = "Description must be 1000 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };

  return {
    success: true,
    data: {
      name,
      type,
      phone,
      email: email ? normalizeEmail(email) : null,
      address,
      currency,
      description,
    },
  };
}
