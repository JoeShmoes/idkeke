import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, mode } = await req.json();

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      const last = Array.isArray(messages) ? messages[messages.length - 1] : null;
      const fallback = last?.content ? `Alfred: ${last.content}` : 'Alfred: How can I help?';
      return NextResponse.json({ content: fallback });
    }

    const resp = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-medium',
        messages,
        max_tokens: mode === 'thinking' ? 1500 : mode === 'deep-research' ? 1200 : 800,
        temperature: mode === 'thinking' ? 0.5 : mode === 'deep-research' ? 0.3 : 0.7,
      }),
    });

    if (!resp.ok) {
      const details = await resp.text();
      return NextResponse.json({ error: 'API error', details }, { status: resp.status });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || content.trim() === '') {
      return NextResponse.json({ content: 'I apologize, but I was unable to generate a response. Please try again.' });
    }
    return NextResponse.json({ content });
  } catch (e) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
