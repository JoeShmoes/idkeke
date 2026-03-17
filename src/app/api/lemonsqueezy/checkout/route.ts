import { NextResponse } from 'next/server';

const LEMON_SQUEEZY_ENDPOINT = 'https://api.lemonsqueezy.com/v1';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

    if (!apiKey || !storeId) {
      return NextResponse.json(
        { error: 'Lemon Squeezy configuration is missing' },
        { status: 500 }
      );
    }

    const { variantId, customPrice } = await req.json();

    if (!variantId) {
      return NextResponse.json(
        { error: 'Variant ID is required' },
        { status: 400 }
      );
    }

    const body = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            custom: {
              user_id: 'guest',
            },
            // If customPrice is provided, we can use it to set the quantity or a custom price field
            // Note: This depends on how your Lemon Squeezy product is configured (e.g., "Pay what you want")
            ...(customPrice ? { custom_price: customPrice * 100 } : {}), // Lemon Squeezy usually uses cents
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
      return NextResponse.json(
        { error: 'Lemon Squeezy API error', details: error },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({ url: result.data.attributes.url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
