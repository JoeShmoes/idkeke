
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const query = searchParams.get('q');
  
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
      return NextResponse.json({ error: 'NEWS_API_KEY is not configured.' }, { status: 500 });
  }

  try {
    let url = '';
    if (type === 'headlines') {
      url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;
    } else if (query) {
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${apiKey}`;
    } else {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    const res = await fetch(url, {
        headers: {
            'User-Agent': 'NexarisModuleApp/1.0',
        }
    });
    if (!res.ok) {
        console.error(`NewsAPI Error: ${res.status} ${res.statusText}`);
        // Fallback to mock data on error (especially 401 Invalid Key)
        console.log("Falling back to mock data...");
        
        let mockArticles = [
                    {
                        source: { id: "mock-1", name: "Tech Daily" },
                        author: "Jane Doe",
                        title: "The Future of AI in 2024 (Mock Data)",
                        description: "An in-depth look at how artificial intelligence is shaping the future of technology and business.",
                        url: "https://duckduckgo.com/?q=!ducky+future+of+AI+2024+news",
                        urlToImage: null,
                        publishedAt: new Date().toISOString(),
                        content: "Artificial Intelligence is evolving rapidly..."
                    },
                    {
                        source: { id: "mock-2", name: "Global News" },
                        author: "John Smith",
                        title: "Sustainable Energy Solutions (Mock Data)",
                        description: "Exploring the latest advancements in renewable energy and their impact on the global economy.",
                        url: "https://duckduckgo.com/?q=!ducky+sustainable+energy+solutions+news",
                        urlToImage: null,
                        publishedAt: new Date(Date.now() - 3600000).toISOString(),
                        content: "Renewable energy sources are becoming more accessible..."
                    },
                    {
                        source: { id: "mock-3", name: "Finance Weekly" },
                        author: "Alice Johnson",
                        title: "Market Trends to Watch (Mock Data)",
                        description: "Key financial trends that investors should keep an eye on in the coming months.",
                        url: "https://duckduckgo.com/?q=!ducky+market+trends+watch+news",
                        urlToImage: null,
                        publishedAt: new Date(Date.now() - 7200000).toISOString(),
                        content: "The stock market is experiencing significant volatility..."
                    }
                ];

        // Filter or generate dynamic mock data based on query
        if (query) {
            const lowerQuery = query.toLowerCase();
            const filtered = mockArticles.filter(article => 
                article.title.toLowerCase().includes(lowerQuery) || 
                article.description.toLowerCase().includes(lowerQuery)
            );

            if (filtered.length > 0) {
                mockArticles = filtered;
            } else {
                // If no matches, generate a fake result for the query
                mockArticles = [
                    {
                        source: { id: "mock-search-1", name: "News Aggregator" },
                        author: "System",
                        title: `Latest updates on ${query} (Mock Data)`,
                        description: `Recent developments and breaking news regarding ${query}.`,
                        url: "https://duckduckgo.com/?q=" + encodeURIComponent("!ducky " + query + " news"),
                        urlToImage: null,
                        publishedAt: new Date().toISOString(),
                        content: `Comprehensive coverage of the latest events related to ${query}...`
                    },
                    {
                        source: { id: "mock-search-2", name: "History Channel" },
                        author: "Historian",
                        title: `Historical context: ${query} (Mock Data)`,
                        description: `Understanding the background and history of ${query}.`,
                        url: "https://en.wikipedia.org/wiki/Special:Search?search=" + encodeURIComponent(query) + "&go=Go",
                        urlToImage: null,
                        publishedAt: new Date(Date.now() - 86400000).toISOString(),
                        content: `To understand the current state of ${query}, we must look back...`
                    },
                    {
                        source: { id: "mock-search-3", name: "AI Analyst" },
                        author: "AI Bot",
                        title: `Analysis of ${query} trends (Mock Data)`,
                        description: `AI-generated analysis of current trends involving ${query}.`,
                        url: "https://duckduckgo.com/?q=" + encodeURIComponent(query + " trends analysis"),
                        urlToImage: null,
                        publishedAt: new Date(Date.now() - 43200000).toISOString(),
                        content: `Data analysis shows a growing interest in ${query}...`
                    }
                ];
            }
        }

        return NextResponse.json({ articles: mockArticles });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
