import { NextResponse } from 'next/server';

// Helper: Determine if query needs web search
function needsWebSearch(text: string): boolean {
  const searchKeywords = [
    'latest', 'recent', 'today', 'this week', 'this month', 'current',
    'news', 'breaking', 'happening now', 'just announced', 'released',
    'tell me about', 'search for', 'find information', 'what are the', 
    'any updates', 'new developments', 'what is happening',
  ];
  const lowerText = text.toLowerCase();
  return searchKeywords.some(keyword => lowerText.includes(keyword));
}

// Helper: Fetch web results using DuckDuckGo HTML lite endpoint
async function fetchWebResults(query: string): Promise<string> {
  try {
    const response = await fetch(`https://lite.duckduckgo.com/lite?q=${encodeURIComponent(query)}&t=h_`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return '';
    }

    const html = await response.text();
    
    // Parse DuckDuckGo lite results - links are wrapped in DuckDuckGo redirect URLs
    // Format: href="//duckduckgo.com/l/?uddg=<encoded_real_url>&..."
    const linkRegex = /href="\/\/duckduckgo\.com\/l\/\?uddg=([^&"]+)/gi;
    const titleRegex = /<a[^>]*href="\/\/duckduckgo\.com\/l\/\?uddg=[^"]*"[^>]*>(.*?)<\/a>/gi;
    
    const decodedLinks: any[] = [];
    let urlMatch;
    
    // Extract and decode URLs
    while ((urlMatch = linkRegex.exec(html))) {
      try {
        const decodedUrl = decodeURIComponent(urlMatch[1]);
        if (decodedUrl && !decodedUrl.includes('duckduckgo.com')) {
          decodedLinks.push({ url: decodedUrl, title: '' });
        }
      } catch (e) {
        // Skip malformed URLs
      }
    }
    
    // Extract and match titles
    let titleIndex = 0;
    const titleMatches = html.matchAll(/<a[^>]*href="\/\/duckduckgo\.com\/l\/\?uddg=[^"]*"[^>]*>(.*?)<\/a>/gi);
    for (const match of titleMatches) {
      if (decodedLinks[titleIndex]) {
        let title = match[1].replace(/<[^>]*>/g, '').trim();
        // Decode HTML entities
        title = title
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&#39;/g, "'");
        decodedLinks[titleIndex].title = title;
      }
      titleIndex++;
    }

    // Format results for AI context
    const results: string[] = [];
    for (let i = 0; i < Math.min(5, decodedLinks.length); i++) {
      const item = decodedLinks[i];
      if (item.url) {
        const displayTitle = item.title ? item.title.substring(0, 100) : item.url.substring(0, 60);
        results.push(`- ${displayTitle} (${item.url})`);
      }
    }

    return results.length > 0
      ? `Search Results for "${query}":\n${results.join('\n')}`
      : '';
  } catch (error) {
    console.error('Web search failed:', error);
    return '';
  }
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    let messages = body.messages || [];
    const shouldStream = Boolean(body.stream);
    const maxTokens =
      typeof body.max_tokens === 'number' && body.max_tokens > 0
        ? Math.min(body.max_tokens, 4000)
        : 1024;

    // Determine Provider & API Key
    // Prefer Groq (labeled as GROCK in env) if available, it matches the "GPT-OSS" performance
    const groqKey = process.env.GROCK_GPT_API_KEY;
    const mistralKey = process.env.MISTRAL_API_KEY;
    
    let apiKey = groqKey || mistralKey;
    let provider: 'groq' | 'mistral' = groqKey ? 'groq' : 'mistral';
    let model = groqKey 
      ? (process.env.GROCK_MODEL || 'llama-3.3-70b-versatile') 
      : (process.env.MISTRAL_MODEL || 'mistral-small-latest');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No AI API Key defined in environment (.env)' },
        { status: 500 }
      );
    }

    // --- SEARCH INTEGRATION ---
    const lastMessage = messages?.[messages.length - 1];
    if (lastMessage?.role === 'user' && needsWebSearch(lastMessage.content)) {
      try {
        const searchResults = await fetchWebResults(lastMessage.content);
        if (searchResults) {
          console.log(`[AI Chat] Web search triggered for ${provider}:`, lastMessage.content);
          messages = [
            ...messages.slice(0, -1),
            {
              role: 'assistant',
              content: `SEARCH_RESULTS_RECEIVED:\n${searchResults}`,
            },
            lastMessage,
          ];
        }
      } catch (e) {
        console.error('[AI Chat] Failed to fetch search results:', e);
      }
    }

    // --- SYSTEM PROMPT CONSOLIDATION ---
    // Avoid double system prompts. If the incoming messages already have a system prompt,
    // we merge our instructions into it or prepend if missing.
    const alfredInstructions = `You are Alfred, a state-of-the-art AI assistant for the Nexaris platform. You help users manage their business, strategy, research, and personal life. Be concise, professional, and insightful.`;
    const searchInstructions = `You have access to real-time search results. Use them to provide accurate, cited information. At the end, list URLs in a **Sources:** section and use inline citations [1], [2].`;
    
    const combinedSystemPrompt = `${alfredInstructions}\n\n${searchInstructions}`;

    // Filter out existing system prompts to replace with our consolidated one at the top
    const cleanedMessages = messages.filter((m: any) => m.role !== 'system');
    const finalMessages = [
      { role: 'system', content: combinedSystemPrompt },
      ...cleanedMessages
    ];

    const endpoint = provider === 'groq' 
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.mistral.ai/v1/chat/completions';

    const aiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: finalMessages,
        max_tokens: maxTokens,
        stream: shouldStream
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: `${provider === 'groq' ? 'Groq' : 'Mistral'} API error`, 
          details: errorData.error?.message || JSON.stringify(errorData),
          status: aiResponse.status 
        },
        { status: aiResponse.status }
      );
    }

    // Handle Streaming
    if (shouldStream && aiResponse.body) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          const text = decoder.decode(chunk);
          const lines = text.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                if (delta) {
                  controller.enqueue(encoder.encode(delta));
                }
              } catch (e) {
                // Ignore parsing errors for partial/malformed SSE lines
              }
            }
          }
        }
      });

      return new Response(aiResponse.body.pipeThrough(transformStream), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Used-Provider': provider,
          'X-Used-Model': model,
        },
      });
    }

    // Handle Non-Streaming
    const completion = await aiResponse.json();
    const content = completion.choices?.[0]?.message?.content || '';

    return NextResponse.json({
      content: String(content || '').trim(),
      model,
      provider
    });

  } catch (error) {
    console.error('[AI Chat] Internal Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(error) },
      { status: 500 }
    );
  }
}

