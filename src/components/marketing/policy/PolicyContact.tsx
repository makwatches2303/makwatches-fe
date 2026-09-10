import { Text } from "@/design-system";

/**
 * The store's contact details, in the same three-column shape every policy
 * page ends on. Real values only -- see MAK_CONTACT below, the one place
 * these are written down.
 */
export const MAK_CONTACT = {
  email: "makwatches2303@gmail.com",
  phone: "9974959693",
  phoneDisplay: "+91 9974959693",
  address: [
    "Shree Ganesh Watch",
    "Matwa Street",
    "Near Balaji Cineplex",
    "Jetpur, Rajkot",
    "Gujarat - 360370",
  ],
} as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Text size="label" tone="muted" className="mb-1.5">
        {label}
      </Text>
      {children}
    </div>
  );
}

export function PolicyContact() {
  return (
    <div className="grid gap-8 border-2 border-mak-line p-8 md:grid-cols-3 md:p-10">
      <Field label="Email">
        <a
          href={`mailto:${MAK_CONTACT.email}`}
          className="font-display text-mak-small font-extrabold text-mak-accent hover:underline"
        >
          {MAK_CONTACT.email}
        </a>
      </Field>

      <Field label="Phone">
        <a
          href={`tel:${MAK_CONTACT.phone}`}
          className="font-display text-mak-small font-extrabold text-mak-accent hover:underline"
        >
          {MAK_CONTACT.phoneDisplay}
        </a>
      </Field>

      <Field label="Address">
        <Text size="small">
          {MAK_CONTACT.address.map((line, i) => (
            <span key={line}>
              {line}
              {i < MAK_CONTACT.address.length - 1 ? <br /> : null}
            </span>
          ))}
        </Text>
      </Field>
    </div>
  );
}
