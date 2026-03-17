// Test the complete web search + system message flow
async function testWebSearchWithSystemMessage() {
  console.log('=== Testing Web Search with System Message ===\n');
  
  const userQuery = 'What are the latest developments in AI?';
  
  // Step 1: Simulate search trigger
  const searchKeywords = [
    'latest', 'recent', 'today', 'news', 'breaking', 'happening now',
    'tell me about', 'search for', 'developments', 'updates'
  ];
  
  const triggersSearch = searchKeywords.some(keyword => 
    userQuery.toLowerCase().includes(keyword)
  );
  
  console.log(`Query: "${userQuery}"`);
  console.log(`Triggers search: ${triggersSearch ? '✓ YES' : '✗ NO'}\n`);
  
  if (!triggersSearch) {
    console.log('❌ Query does not trigger search');
    return;
  }
  
  // Step 2: Fetch web results
  console.log('🔍 Fetching web results from DuckDuckGo...\n');
  
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
    
    console.log(`✓ Found ${decodedLinks.length} web results\n`);
    
    // Step 3: Format for injection
    const results = [];
    for (let i = 0; i < Math.min(5, decodedLinks.length); i++) {
      const item = decodedLinks[i];
      if (item.url) {
        const displayTitle = item.title ? item.title.substring(0, 100) : item.url.substring(0, 60);
        results.push(`- ${displayTitle} (${item.url})`);
      }
    }
    
    const searchContext = `\n**Search Results for "${userQuery}":**\n${results.join('\n')}\n`;
    
    // Step 4: Create message to send to Mistral
    const userMessage = userQuery + searchContext;
    
    const messagesForMistral = [
      {
        role: 'system',
        content: 'You have access to real-time web search results. Use the search results provided in the user message to answer questions about current events, latest news, and recent developments. If search results are included, base your answer on them.'
      },
      {
        role: 'user',
        content: userMessage
      }
    ];
    
    // Step 5: Show what would be sent to Mistral
    console.log('📤 Messages ready for Mistral API:\n');
    console.log('System Message:');
    console.log('  "You have access to real-time web search results..."');
    console.log('\nUser Message (with injected search results):');
    console.log('---');
    console.log(userMessage.substring(0, 500) + '...');
    console.log('---\n');
    
    console.log('✅ Complete workflow successful!');
    console.log(`   ✓ Search triggered on keywords`);
    console.log(`   ✓ ${results.length} web results fetched`);
    console.log(`   ✓ Results injected into message`);
    console.log(`   ✓ System message informs AI of web search capability`);
    console.log(`   ✓ Ready to send to Mistral for intelligent response`);
    
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

testWebSearchWithSystemMessage();
