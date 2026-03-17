// Final integration test - simulating the actual flow
async function simulateAIChatWithSearch() {
  const userQuery = 'What is the latest AI news today';
  
  console.log('=== Simulating AI Chat with Web Search ===\n');
  console.log(`User: ${userQuery}\n`);
  
  // Step 1: Check if search is needed
  const searchKeywords = [
    'latest', 'recent', 'today', 'this week', 'current',
    'news', 'breaking', 'happening now', 'tell me about', 'search for'
  ];
  
  const needsSearch = searchKeywords.some(keyword => 
    userQuery.toLowerCase().includes(keyword)
  );
  
  console.log(`📍 Web search needed: ${needsSearch ? '✓ YES' : '✗ NO'}\n`);
  
  if (!needsSearch) {
    console.log('Query does not require web search');
    return;
  }
  
  // Step 2: Fetch web results
  console.log('🔍 Fetching web results...');
  
  try {
    const response = await fetch(`https://lite.duckduckgo.com/lite?q=${encodeURIComponent(userQuery)}&t=h_`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error(`✗ HTTP ${response.status}`);
      return;
    }

    const html = await response.text();
    
    // Parse results
    const linkRegex = /href="\/\/duckduckgo\.com\/l\/\?uddg=([^&"]+)/gi;
    const decodedLinks = [];
    let urlMatch;
    
    while ((urlMatch = linkRegex.exec(html))) {
      try {
        const decodedUrl = decodeURIComponent(urlMatch[1]);
        if (decodedUrl && !decodedUrl.includes('duckduckgo.com')) {
          decodedLinks.push({ url: decodedUrl, title: '' });
        }
      } catch (e) {}
    }
    
    // Extract titles
    let titleIndex = 0;
    for (const match of html.matchAll(/<a[^>]*href="\/\/duckduckgo\.com\/l\/\?uddg=[^"]*"[^>]*>(.*?)<\/a>/gi)) {
      if (decodedLinks[titleIndex]) {
        let title = match[1].replace(/<[^>]*>/g, '').trim();
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
    
    console.log(`✓ Found ${decodedLinks.length} results\n`);
    
    // Step 3: Format for AI injection
    const results = [];
    for (let i = 0; i < Math.min(5, decodedLinks.length); i++) {
      const item = decodedLinks[i];
      if (item.url) {
        const displayTitle = item.title ? item.title.substring(0, 100) : item.url.substring(0, 60);
        results.push(`- ${displayTitle} (${item.url})`);
      }
    }
    
    const searchContext = `\n**Search Results for "${userQuery}":**\n${results.join('\n')}\n`;
    
    // Step 4: Combine with user message
    const messageForMistral = userQuery + searchContext;
    
    console.log('📤 Message being sent to Mistral (with search results injected):\n');
    console.log('---');
    console.log(messageForMistral);
    console.log('---\n');
    
    console.log('✅ Ready to send to Mistral AI!');
    console.log(`   - Query: ${userQuery.substring(0, 50)}...`);
    console.log(`   - With ${results.length} search results attached`);
    console.log(`   - Total message length: ${messageForMistral.length} chars`);
    
  } catch (error) {
    console.error('✗ Error fetching search results:', error.message);
  }
}

simulateAIChatWithSearch();
