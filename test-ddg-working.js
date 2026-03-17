// Test working DuckDuckGo lite search with filtering
async function testDuckDuckGoLite() {
  const query = 'latest AI news 2024';
  console.log(`Testing DuckDuckGo lite search for: "${query}"\n`);
  
  try {
    const response = await fetch(`https://lite.duckduckgo.com/lite?q=${encodeURIComponent(query)}&t=h_`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log(`HTTP ${response.status}`);
      return;
    }

    const html = await response.text();
    
    // Parse DuckDuckGo lite results using proper regex
    const linkRegex = /href="\/\/duckduckgo\.com\/l\/\?uddg=([^&"]+)/gi;
    const titlePatternRegex = /<a[^>]*href="\/\/duckduckgo\.com\/l\/\?uddg=[^"]*"[^>]*>(.*?)<\/a>/gi;
    
    const decodedLinks = [];
    let urlMatch;
    
    // Extract URLs
    while ((urlMatch = linkRegex.exec(html))) {
      try {
        const decodedUrl = decodeURIComponent(urlMatch[1]);
        if (decodedUrl && !decodedUrl.includes('duckduckgo.com')) {
          decodedLinks.push({ url: decodedUrl, title: '' });
        }
      } catch (e) {}
    }
    
    // Extract titles in order
    let titleIndex = 0;
    for (const match of html.matchAll(/<a[^>]*href="\/\/duckduckgo\.com\/l\/\?uddg=[^"]*"[^>]*>(.*?)<\/a>/gi)) {
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
    
    console.log(`✓ Found ${decodedLinks.length} results:\n`);
    
    // Format for AI
    const formattedResults = [];
    for (let i = 0; i < Math.min(5, decodedLinks.length); i++) {
      const item = decodedLinks[i];
      if (item.url) {
        const displayTitle = item.title ? item.title.substring(0, 80) : item.url.substring(0, 60);
        formattedResults.push(`- ${displayTitle} (${item.url})`);
        console.log(`${i + 1}. ${displayTitle}`);
        console.log(`   ${item.url}\n`);
      }
    }
    
    const finalOutput = `\n**Search Results for "${query}":**\n${formattedResults.join('\n')}\n`;
    console.log('Final output for AI:');
    console.log(finalOutput);
    
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

testDuckDuckGoLite();
