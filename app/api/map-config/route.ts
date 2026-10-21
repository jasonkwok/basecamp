import "server-only";
import { getToken } from "@vercel/connect";

export async function GET() {
  // Fetch credentials at request time rather than caching them in a shared response.
  const headers = { "Cache-Control": "no-store" };
  const connector = process.env.MAPBOX_CONNECTOR;

  if (!connector) {
    return Response.json(
      { error: "Map connection is not configured yet." },
      { status: 503, headers },
    );
  }

  try {
    const token = await getToken(connector, { subject: { type: "app" } });

    // This endpoint intentionally returns a browser-visible public Mapbox token.
    // Never return secret credentials, connector metadata, or Vercel OIDC tokens.
    if (!token.startsWith("pk."))
      throw new Error("Public Mapbox token required");

    return Response.json({ token }, { headers });
  } catch {
    // Keep connector and authentication details out of browser-facing errors.
    return Response.json(
      { error: "The map connection is temporarily unavailable." },
      { status: 503, headers },
    );
  }
}
