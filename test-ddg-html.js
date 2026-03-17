async function testDDGHtmlSearch(query) {
  console.log(`Testing DuckDuckGo HTML search for: "${query}"\n`);
  
  try {
    // DuckDuckGo's lite version uses HTML endpoint
    const searchUrl = `https://lite.duckduckgo.com/lite?q=${encodeURIComponent(query)}&t=h_`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log(`HTTP ${response.status}`);
      return;
    }

    const html = await response.text();
    
    // Parse DuckDuckGo lite results
    // Results wrap links in: `//duckduckgo.com/l/?uddg=<encoded_real_url>&...`
    const linkRegex = /href="\/\/duckduckgo\.com\/l\/\?uddg=([^&"]+)/gi;
    const titleRegex = /<a[^>]*href="\/\/duckduckgo\.com\/l\/\?uddg=[^"]*"[^>]*>(.*?)<\/a>/gi;
    
    const decodedLinks = [];
    let urlMatch, titleMatch;
    
    // Extract URLs
    while ((urlMatch = linkRegex.exec(html))) {
      try {
        const decodedUrl = decodeURIComponent(urlMatch[1]);
        if (decodedUrl && !decodedUrl.includes('duckduckgo')) {
          decodedLinks.push({ url: decodedUrl, title: '' });
        }
      } catch (e) {
        console.error('Decode error:', e.message);
      }
    }
    
    // Extract titles
    let titleIndex = 0;
    const titleMatches = html.matchAll(/<a[^>]*href="\/\/duckduckgo\.com\/l\/\?uddg=[^"]*"[^>]*>(.*?)<\/a>/gi);
    for (const match of titleMatches) {
      if (decodedLinks[titleIndex]) {
        decodedLinks[titleIndex].title = match[1].replace(/<[^>]*>/g, '').trim();
      }
      titleIndex++;
    }
    
    console.log(`Found ${decodedLinks.length} results:\n`);
    decodedLinks.slice(0, 5).forEach((item, i) => {
      if (item.title || item.url) {
        console.log(`${i + 1}. ${item.title || item.url.substring(0, 60)}`);
        console.log(`   ${item.url.substring(0, 100)}\n`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDDGHtmlSearch('latest AI news');
