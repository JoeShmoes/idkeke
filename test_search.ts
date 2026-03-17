import fs from 'fs';

async function fetchWebResults(query: string) {
  try {
    console.log(`Searching for: ${query}`);
    const response = await fetch(`https://lite.duckduckgo.com/lite?q=${encodeURIComponent(query)}&t=h_`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
        console.error(`HTTP Error: ${response.status}`);
      return '';
    }

    const html = await response.text();
    console.log(`Received HTML length: ${html.length}`);
    fs.writeFileSync('ddg_output.html', html);
    
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
    console.log(`Found ${decodedLinks.length} URLs`);
    
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

    console.log('Results:\n' + results.join('\n'));
    return results.length > 0
      ? `\n**Search Results for "${query}":**\n${results.join('\n')}\n`
      : '';
  } catch (error) {
    console.error('Web search failed:', error);
    return '';
  }
}

fetchWebResults('latest news today');
