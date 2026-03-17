
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title');

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`;
    
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'NexarisModuleApp/1.0 (https://app.nexarismedia.online; contact@example.com)',
            'Accept': 'text/html; charset=utf-8; profile="https://www.mediawiki.org/wiki/Specs/HTML/2.1.0"'
        }
    });

    if (!res.ok) {
        console.error(`Wikipedia API Error: ${res.status} ${res.statusText}`);
        return NextResponse.json({ error: `Wikipedia API Error: ${res.status}` }, { status: res.status });
    }

    const html = await res.text();
    
    // Fix relative links to absolute (leave target alone so they open in‑frame)
    const fixedHtml = html.replace(/href="\.\//g, 'href="https://en.wikipedia.org/api/rest_v1/page/html/');

    // Return HTML as text/html or JSON? JSON is safer for the client to handle
    return NextResponse.json({ html: fixedHtml });
    
  } catch (error) {
    console.error("Wikipedia Proxy Error:", error);
    return NextResponse.json({ error: 'Failed to fetch Wikipedia content' }, { status: 500 });
  }
}
