const PROVIDERS = {
  sms: { name: "SMS", fields: ["to", "body"] },
  email: { name: "email", fields: ["to", "subject", "text"] },
} as const;

export type ProviderKind = keyof typeof PROVIDERS;

/** A fake provider this app can play: its kind, display name and the message fields it requires. */
export type Provider = {
  kind: ProviderKind;
  name: string;
  fields: readonly string[];
};

/** Looks up a provider by kind, or returns undefined for an unknown kind. */
export function findProvider(kind: string): Provider | undefined {
  if (!Object.hasOwn(PROVIDERS, kind)) return undefined;
  const known = kind as ProviderKind;
  return { kind: known, ...PROVIDERS[known] };
}

/** Every kind `findProvider` knows, for error messages. */
export const providerKinds = Object.keys(PROVIDERS);
