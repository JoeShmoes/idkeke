// Debug DuckDuckGo response structure
const query = 'AI news';

(async () => {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const data = await response.json();
    
    console.log('Results array:', data.Results?.length, 'items');
    if (data.Results && data.Results.length > 0) {
      console.log('\nFirst result:');
      console.log(JSON.stringify(data.Results[0], null, 2));
    }
    
    console.log('\n\nAbstractText:', data.AbstractText);
    console.log('AbstractSource:', data.AbstractSource);
    console.log('RelatedTopics length:', data.RelatedTopics?.length);
    console.log('\n\nAll keys in response:');
    console.log(Object.keys(data).filter(k => data[k]));
    
    console.log('\n\nFull response (first 2000 chars):');
    console.log(JSON.stringify(data, null, 2).substring(0, 2000));
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
