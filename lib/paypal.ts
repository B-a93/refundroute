const GUIDED_PRICE = "9.00";
const GUIDED_CURRENCY = "USD";

export const guidedProduct = {
  amount: GUIDED_PRICE,
  currency: GUIDED_CURRENCY,
  name: "MyResolveCenter guided recovery case",
};

export function paypalBaseUrl() {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function requirePayPalConfiguration() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!clientId || !clientSecret || !serviceRoleKey) {
    throw new Error("PayPal checkout is not configured yet.");
  }
  return { clientId, clientSecret, serviceRoleKey };
}

export async function getPayPalAccessToken() {
  const { clientId, clientSecret } = requirePayPalConfiguration();
  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({})) as { access_token?: string; error_description?: string };
  if (!response.ok || !data.access_token) throw new Error(data.error_description || "PayPal authentication failed.");
  return data.access_token;
}
