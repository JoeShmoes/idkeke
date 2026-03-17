import { env } from 'process';

const LEMON_SQUEEZY_ENDPOINT = 'https://api.lemonsqueezy.com/v1';

export async function createCheckout(storeId: string, variantId: string, customPrice?: number) {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;

  if (!apiKey) {
    throw new Error('LEMON_SQUEEZY_API_KEY is not set');
  }

  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          custom: {
            user_id: 'guest', // You can replace this with actual user ID if available
          },
          ...(customPrice ? { variant_quantities: [{ variant_id: variantId, quantity: customPrice }] } : {}),
        },
      },
      relationships: {
        store: {
          data: {
            type: 'stores',
            id: storeId,
          },
        },
        variant: {
          data: {
            type: 'variants',
            id: variantId,
          },
        },
      },
    },
  };

  const response = await fetch(`${LEMON_SQUEEZY_ENDPOINT}/checkouts`, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Lemon Squeezy API error: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  return result.data.attributes.url;
}
