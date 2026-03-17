// Direct DuckDuckGo test
const query = 'what is the latest AI news';

(async () => {
  try {
    console.log('Testing DuckDuckGo API...\n');
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
    console.log(`URL: ${url}\n`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const data = await response.json();
    
    console.log('Response keys:', Object.keys(data));
    console.log('\nRelatedTopics count:', data.RelatedTopics?.length);
    console.log('\nFirst 3 results:');
    
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      data.RelatedTopics.slice(0, 3).forEach((item, i) => {
        console.log(`\n${i + 1}.`);
        console.log('   Text:', item.Text?.substring(0, 80));
        console.log('   URL:', item.FirstURL);
      });
    } else {
      console.log('No related topics found');
    }
    
    if (data.Answer) {
      console.log('\n\nInstant Answer:', data.Answer);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
