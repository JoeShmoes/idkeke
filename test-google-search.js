// Test with MetaGPT or similar
// Using Metaphor API (free tier) or try a simpler approach

async function testGoogleSearch(query) {
  console.log(`Testing Google search for: "${query}"\n`);
  
  try {
    // Try using a simple Google search URL with DOMPurify-like parsing
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=5`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.log(`HTTP ${response.status}`);
      return;
    }

    const html = await response.text();
    
    // Simple regex to extract search results
    const titleRegex = /<h3[^>]*>([^<]+)<\/h3>/g;
    const urlRegex = /href="([^"]*google[^"]*\/url\?q=([^&]+)&/;
    
    const titles = [...html.matchAll(titleRegex)].map(m => m[1]);
    const urls = [...html.matchAll(urlRegex)].map(m => {
      try {
        return decodeURIComponent(m[2]);
      } catch(e) {
        return m[2];
      }
    });
    
    console.log(`Found ${Math.min(titles.length, urls.length)} results:\n`);
    for (let i = 0; i < Math.min(5, titles.length); i++) {
      console.log(`${i+1}. ${titles[i]}`);
      if (urls[i]) console.log(`   ${urls[i]}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGoogleSearch('latest AI news today');
