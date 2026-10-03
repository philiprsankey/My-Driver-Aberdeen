export function originFrom(headerList: { get(name: string): string | null }) {
  const host = (headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "").split(",")[0].trim();
  if (!host) return "http://127.0.0.1:3000";
  const forwarded = headerList.get("x-forwarded-proto")?.split(",")[0].trim();
  const proto = forwarded || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}
