interface PartyIdentity {
  name: string;
  phone: string | null;
}

function normalizedName(name: string): string {
  return name.trim().toLowerCase();
}

function normalizedPhone(phone: string | null): string {
  return phone?.replace(/[^0-9]/g, "") ?? "";
}

export function hasSamePartyIdentity(
  first: PartyIdentity,
  second: PartyIdentity,
): boolean {
  const firstPhone = normalizedPhone(first.phone);
  const secondPhone = normalizedPhone(second.phone);

  return (
    firstPhone !== "" &&
    firstPhone === secondPhone &&
    normalizedName(first.name) === normalizedName(second.name)
  );
}
