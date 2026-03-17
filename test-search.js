require('dotenv').config({ path: '.env' });

async function testSearch(query) {
  console.log(`Testing DuckDuckGo search for: "${query}"\n`);
  
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
    console.log(`Fetching: ${url}\n`);
    
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`HTTP ${response.status}`);
      return;
    }

    const data = await response.json();
    console.log(`Received response with ${data.RelatedTopics?.length || 0} results\n`);
    
    // Show RelatedTopics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      console.log('Results:');
      data.RelatedTopics.slice(0, 5).forEach((item, i) => {
        if (item.Text && item.FirstURL) {
          console.log(`\n${i + 1}. ${item.Text.substring(0, 120)}...`);
          console.log(`   URL: ${item.FirstURL}`);
        }
      });
    } else {
      console.log('No related topics found');
    }

    // Show instant answer if available
    if (data.Answer) {
      console.log(`\nInstant Answer: ${data.Answer}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSearch('latest AI breakthroughs');
