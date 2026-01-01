const https = require('https');

const apiKey = '68955cd12cfd49f6bee0a38f387fe6b1';
const url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;

const options = {
  headers: {
    'User-Agent': 'NexarisApp/1.0'
  }
};

https.get(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    try {
        const json = JSON.parse(data);
        console.log('Response:', JSON.stringify(json, null, 2));
    } catch (e) {
        console.log('Raw Data:', data);
    }
  });

}).on('error', (err) => {
  console.error('Error:', err.message);
});
