require('dotenv').config({ path: '.env' });

async function testBraveSearch(query) {
  console.log(`Testing Brave Search for: "${query}"\n`);
  
  try {
    // Brave Search API - free tier at api.search.brave.com
    // No API key required for basic searches
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!response.ok) {
      console.error(`HTTP ${response.status}: ${response.statusText}`);
      const text = await response.text();
      console.log('Response:', text.substring(0, 500));
      return;
    }

    const data = await response.json();
    console.log('Response keys:', Object.keys(data));
    
    if (data.web && data.web.results) {
      console.log(`\nFound ${data.web.results.length} results:\n`);
      data.web.results.slice(0, 5).forEach((item, i) => {
        console.log(`${i + 1}. ${item.title}`);
        console.log(`   ${item.url}`);
        console.log(`   ${item.description?.substring(0, 100)}...\n`);
      });
    } else {
      console.log('No results found');
      console.log('Full response:', JSON.stringify(data, null, 2).substring(0, 500));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBraveSearch('latest AI news 2024');
