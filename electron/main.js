const { app, BrowserWindow, shell, nativeImage, Menu, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    const wins = BrowserWindow.getAllWindows();
    if (wins.length > 0) {
      if (wins[0].isMinimized()) wins[0].restore();
      wins[0].focus();
    }
  });

  function createWindow() {
  // Create the browser window
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Don't show until ready
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000', // Transparent to let background show through, or set to match theme
      symbolColor: '#ffffff',
      height: 32
    },
    trafficLightPosition: { x: 10, y: 10 },
    icon: path.join(__dirname, '../icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Show window when ready to avoid visual flashing
  win.once('ready-to-show', () => {
    win.show();
  });

  // Set custom UserAgent to detect desktop app
  win.webContents.setUserAgent(win.webContents.getUserAgent() + ' NexarisDesktop');

  // Handle Title Bar Overlay updates from Renderer
  ipcMain.on('update-title-bar-overlay', (event, options) => {
    try {
      win.setTitleBarOverlay(options);
    } catch (error) {
      // Overlay not supported in current mode (e.g. frame: true)
    }
  });

  // Handle News Fetching (Proxy to avoid CORS/Static issues)
  ipcMain.handle('fetch-news', async (event, { type, query }) => {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
        return { error: 'NEWS_API_KEY is missing from .env file.' };
    }

    let url = '';
    if (type === 'headlines') {
        url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;
    } else {
        url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query || '')}&apiKey=${apiKey}`;
    }

    try {
        const { net } = require('electron');
        const request = net.request(url);
        request.setHeader('User-Agent', 'NexarisDesktop/1.0');
        
        return new Promise((resolve) => {
            request.on('response', (response) => {
                let data = '';
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                   try {
                       const json = JSON.parse(data);
                       if (response.statusCode === 401 || response.statusCode !== 200) {
                           // Fallback to mock data
                           let mockArticles = [
                               {
                                   source: { id: "mock-1", name: "Tech Daily" },
                            author: "Jane Doe",
                            title: "The Future of AI in 2024 (Mock Data)",
                            description: "An in-depth look at how artificial intelligence is shaping the future of technology and business.",
                            url: "https://duckduckgo.com/?q=!ducky+future+of+AI+2024+news",
                            publishedAt: new Date().toISOString(),
                        },
                        {
                            source: { id: "mock-2", name: "Global News" },
                            author: "John Smith",
                            title: "Sustainable Energy Solutions (Mock Data)",
                            description: "Exploring the latest advancements in renewable energy and their impact on the global economy.",
                            url: "https://duckduckgo.com/?q=!ducky+sustainable+energy+solutions+news",
                            publishedAt: new Date(Date.now() - 3600000).toISOString(),
                        },
                        {
                            source: { id: "mock-3", name: "Finance Weekly" },
                            author: "Alice Johnson",
                            title: "Market Trends to Watch (Mock Data)",
                            description: "Key financial trends that investors should keep an eye on in the coming months.",
                            url: "https://duckduckgo.com/?q=!ducky+market+trends+watch+news",
                            publishedAt: new Date(Date.now() - 7200000).toISOString(),
                        }
                           ];

                           if (query) {
                               const lowerQuery = query.toLowerCase();
                               const filtered = mockArticles.filter(article => 
                                   article.title.toLowerCase().includes(lowerQuery) || 
                                   article.description.toLowerCase().includes(lowerQuery)
                               );
                   
                               if (filtered.length > 0) {
                                   mockArticles = filtered;
                               } else {
                                   mockArticles = [
                                       {
                                           source: { id: "mock-search-1", name: "News Aggregator" },
                                           author: "System",
                                           title: `Latest updates on ${query} (Mock Data)`,
                                           description: `Recent developments and breaking news regarding ${query}.`,
                                           url: "https://duckduckgo.com/?q=" + encodeURIComponent("!ducky " + query + " news"),
                                           publishedAt: new Date().toISOString(),
                                       },
                                       {
                                           source: { id: "mock-search-2", name: "History Channel" },
                                           author: "Historian",
                                           title: `Historical context: ${query} (Mock Data)`,
                                           description: `Understanding the background and history of ${query}.`,
                                           url: "https://en.wikipedia.org/wiki/Special:Search?search=" + encodeURIComponent(query) + "&go=Go",
                                           publishedAt: new Date(Date.now() - 86400000).toISOString(),
                                       },
                                       {
                                           source: { id: "mock-search-3", name: "Market Watch" },
                                           author: "Analyst",
                                           title: `Market Impact: ${query} (Mock Data)`,
                                           description: `How ${query} is affecting global markets and industries.`,
                                           url: "https://duckduckgo.com/?q=" + encodeURIComponent("!ducky " + query + " market news"),
                                           publishedAt: new Date(Date.now() - 172800000).toISOString(),
                                       },
                                       {
                                           source: { id: "mock-search-4", name: "Tech Weekly" },
                                           author: "Tech Reporter",
                                           title: `Technology behind ${query} (Mock Data)`,
                                           description: `A deep dive into the technological aspects of ${query}.`,
                                           url: "https://duckduckgo.com/?q=" + encodeURIComponent("!ducky " + query + " technology news"),
                                           publishedAt: new Date(Date.now() - 259200000).toISOString(),
                                       },
                                       {
                                           source: { id: "mock-search-5", name: "Opinion" },
                                           author: "Guest Columnist",
                                           title: `Opinion: Why ${query} matters (Mock Data)`,
                                           description: `Perspectives on the significance of ${query} in today's world.`,
                                           url: "https://duckduckgo.com/?q=" + encodeURIComponent("!ducky " + query + " opinion"),
                                           publishedAt: new Date(Date.now() - 345600000).toISOString(),
                                       }
                                   ];
                               }
                           }

                           resolve({
                               status: "ok",
                               totalResults: mockArticles.length,
                               articles: mockArticles
                           });
                       } else {
                           resolve(json);
                       }
                   } catch (e) {
                       resolve({ error: 'Failed to parse news response' });
                   }
                });
            });
            request.on('error', (error) => {
                // Fallback to mock data on network error
                resolve({
                    status: "ok",
                    totalResults: 1,
                    articles: [{
                        title: "Network Error - Showing Offline Content",
                        description: "Unable to reach News service. Please check your internet connection.",
                        source: { name: "System" },
                        publishedAt: new Date().toISOString()
                    }]
                });
            });
            request.end();
        });
    } catch (error) {
        return { error: error.message };
    }
  });

  // Handle Wikipedia Search (Proxy)
  ipcMain.handle('wiki-search', async (event, query) => {
    try {
      const { net } = require('electron');
      const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const request = net.request(url);
      
      return new Promise((resolve) => {
        request.on('response', (response) => {
          let data = '';
          response.on('data', (chunk) => { data += chunk; });
          response.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve({ error: 'Failed to parse Wikipedia search response' });
            }
          });
        });
        request.on('error', (err) => resolve({ error: err.message }));
        request.end();
      });
    } catch (error) {
      return { error: error.message };
    }
  });

  // Handle Wikipedia Summary (Proxy)
  ipcMain.handle('wiki-summary', async (event, title) => {
    try {
      const { net } = require('electron');
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const request = net.request(url);
      request.setHeader('User-Agent', 'NexarisDesktop/1.0');
      
      return new Promise((resolve) => {
        request.on('response', (response) => {
          let data = '';
          response.on('data', (chunk) => { data += chunk; });
          response.on('end', () => {
             if (response.statusCode === 200) {
               try {
                 resolve(JSON.parse(data));
               } catch (e) {
                 resolve({ error: 'Failed to parse Wikipedia summary' });
               }
             } else {
               resolve({ error: `Wikipedia API Error: ${response.statusCode}` });
             }
          });
        });
        request.on('error', (err) => resolve({ error: err.message }));
        request.end();
      });
    } catch (error) {
      return { error: error.message };
    }
  });

  // Handle Wikipedia HTML Fetching (Proxy for Workspace)
  ipcMain.handle('fetch-wiki', async (event, title) => {
      try {
        const { net } = require('electron');
        const url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`;
        const request = net.request(url);
        request.setHeader('User-Agent', 'NexarisDesktop/1.0');

        return new Promise((resolve) => {
            request.on('response', (response) => {
                let data = '';
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    if (response.statusCode === 200) {
                         // Fix relative links (do not force _blank)
                         const fixedHtml = data.toString().replace(/href="\.\//g, 'href="https://en.wikipedia.org/api/rest_v1/page/html/');
                         resolve({ html: fixedHtml });
                    } else {
                         resolve({ error: `Wikipedia API Error: ${response.statusCode}` });
                    }
                });
            });
            request.on('error', (error) => {
                 resolve({ error: error.message });
            });
            request.end();
        });
      } catch (error) {
          return { error: error.message };
      }
  });

  // Handle Web Search (DuckDuckGo Scraping + Google News RSS Fallback)
   ipcMain.handle('web-search', async (event, query) => {
     try {
       const { net } = require('electron');
       // Dynamic import for Cheerio (ESM)
       let cheerio;
       try {
          cheerio = await import('cheerio');
          if (cheerio.default) cheerio = cheerio.default;
       } catch (e) {
          console.error('Failed to load cheerio:', e);
          return { error: 'Failed to load scraping library' };
       }

       // Helper to fetch URL
       const fetchUrl = (url) => {
         return new Promise((resolve, reject) => {
            const request = net.request(url);
            request.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            request.on('response', (response) => {
                let data = '';
                response.on('data', (chunk) => { data += chunk; });
                response.on('end', () => resolve(data));
            });
            request.on('error', (err) => reject(err));
            request.end();
         });
       };

       // 1. Try DuckDuckGo HTML
       try {
           const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
           const ddgHtml = await fetchUrl(ddgUrl);
           const $ = cheerio.load(ddgHtml);
           const results = [];
           
           $('.result').each((i, el) => {
               const $el = $(el);
               const title = $el.find('.result__a').text().trim() || $el.find('.result__title').text().trim();
               let link = $el.find('.result__a').attr('href') || $el.find('.result__url').attr('href');
               const snippet = $el.find('.result__snippet').text().trim();
               
               if (link && link.startsWith('/l/?')) {
                  // Attempt to extract real URL from DDG redirect
                  try {
                    const urlParams = new URLSearchParams(link);
                    if (urlParams.get('uddg')) link = urlParams.get('uddg');
                  } catch(e) {}
               }

               if (title && link && snippet) {
                   results.push({ title, link, snippet, source: 'DuckDuckGo' });
               }
           });

           if (results.length > 0) {
               return { results: results.slice(0, 8) };
           }
       } catch (e) {
           console.error('DDG Search failed:', e);
       }

       // 2. Fallback: Google News RSS
       try {
           const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
           const rssXml = await fetchUrl(rssUrl);
           const $ = cheerio.load(rssXml, { xmlMode: true });
           const results = [];

           $('item').each((i, el) => {
               const $el = $(el);
               const title = $el.find('title').text();
               const link = $el.find('link').text();
               const snippet = $el.find('description').text().replace(/<[^>]*>/g, ''); // Strip HTML
               const pubDate = $el.find('pubDate').text();

               if (title && link) {
                   results.push({ 
                       title, 
                       link, 
                       snippet: `${pubDate}: ${snippet}`,
                       source: 'Google News'
                   });
               }
           });

           return { results: results.slice(0, 8) };
       } catch (e) {
           return { error: 'All search methods failed', details: e.message };
       }

     } catch (error) {
       return { error: error.message };
     }
   });

  // Helper: Determine if query needs web search
  function needsWebSearch(text) {
    const searchKeywords = [
      'latest', 'recent', 'today', 'this week', 'this month', 'current',
      'news', 'breaking', 'happening now', 'just announced', 'released',
      'tell me about', 'search for', 'find information', 'what are the', 
      'any updates', 'new developments', 'what is happening',
    ];
    const lowerText = text.toLowerCase();
    return searchKeywords.some(keyword => lowerText.includes(keyword));
  }

  // Helper: Fetch web results using DuckDuckGo HTML lite endpoint
  async function fetchWebResults(query) {
    try {
      const response = await fetch(`https://lite.duckduckgo.com/lite?q=${encodeURIComponent(query)}&t=h_`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) return '';

      const html = await response.text();
      
      // Parse DuckDuckGo lite results - links are wrapped in DuckDuckGo redirect URLs
      // Format: href="//duckduckgo.com/l/?uddg=<encoded_real_url>&..."
      const linkRegex = /href="\/\/duckduckgo\.com\/l\/\?uddg=([^&"]+)/gi;
      const titleRegex = /<a[^>]*href="\/\/duckduckgo\.com\/l\/\?uddg=[^"]*"[^>]*>(.*?)<\/a>/gi;
      
      const decodedLinks = [];
      let urlMatch;
      
      // Extract and decode URLs
      while ((urlMatch = linkRegex.exec(html))) {
        try {
          const decodedUrl = decodeURIComponent(urlMatch[1]);
          if (decodedUrl && !decodedUrl.includes('duckduckgo.com')) {
            decodedLinks.push({ url: decodedUrl, title: '' });
          }
        } catch (e) {
          // Skip malformed URLs
        }
      }
      
      // Extract and match titles
      let titleIndex = 0;
      const titleMatches = html.matchAll(/<a[^>]*href="\/\/duckduckgo\.com\/l\/\?uddg=[^"]*"[^>]*>(.*?)<\/a>/gi);
      for (const match of titleMatches) {
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

      // Format results for AI context
      const results = [];
      for (let i = 0; i < Math.min(5, decodedLinks.length); i++) {
        const item = decodedLinks[i];
        if (item.url) {
          const displayTitle = item.title ? item.title.substring(0, 100) : item.url.substring(0, 60);
          results.push(`- ${displayTitle} (${item.url})`);
        }
      }

      return results.length > 0
        ? `\n**Search Results for "${query}":**\n${results.join('\n')}\n`
        : '';
    } catch (error) {
      console.error('Web search failed:', error);
      return '';
    }
  }

  // Handle AI Chat
  ipcMain.handle('ai-chat', async (event, { messages, mode }) => {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      const last = Array.isArray(messages) ? messages[messages.length - 1] : null;
      const fallback = last?.content ? `Alfred: ${last.content}` : 'Alfred: How can I help?';
      return { content: fallback };
    }

    try {
        // Check if the last user message needs web search
        let messagesForMistral = messages;
        const lastMessage = messages?.[messages.length - 1];
        if (lastMessage?.role === 'user' && needsWebSearch(lastMessage.content)) {
          try {
            const searchResults = await fetchWebResults(lastMessage.content);
            if (searchResults) {
              // Inject search results as a separate assistant message so the
              // model can clearly see and cite exact links.
              messagesForMistral = [
                ...messages.slice(0, -1),
                {
                  role: 'assistant',
                  content: `Search results for "${lastMessage.content}":\n${searchResults}`,
                },
                lastMessage,
              ];
            }
          } catch (e) {
            console.error('Failed to fetch search results:', e);
          }
        }

        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-medium',
                messages: [
                  {
                    role: 'system',
                    content: `You have access to real-time web search results. When answering, YOU MUST ONLY use information from the search results provided in the conversation (the assistant message titled "Search results"). Do NOT invent, assume, or attribute facts to any source not present in those results. At the end of your response, include a **Sources:** section listing each exact URL you relied on, and use inline numeric citations in the body like [1], [2] that reference that Sources list. If the search results do not contain verifiable information for the user's request, explicitly say you could not verify and avoid fabricating answers.`
                  },
                  ...messagesForMistral
                ],
                max_tokens: mode === 'thinking' ? 1500 : mode === 'deep-research' ? 1200 : 800,
                temperature: mode === 'thinking' ? 0.5 : mode === 'deep-research' ? 0.3 : 0.7,
            })
        });

        if (!response.ok) {
            const details = await response.text();
            return { error: 'API error', details, status: response.status };
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        
        if (!content || content.trim() === '') {
             return { content: 'I apologize, but I was unable to generate a response. Please try again.' };
        }
        return { content };

    } catch (e) {
        return { error: e.message };
    }
  });

  const isDev = !app.isPackaged;
  
  if (isDev) {
    win.loadURL('http://localhost:9002');
  } else {
    // Online mode: Load the production URL
    // win.loadURL('https://app.nexarismedia.online/dashboard');
    
    // Offline mode: Load from local export
    win.loadFile(path.join(__dirname, '../out/index.html'));
  }

  win.setMenuBarVisibility(false);
  win.webContents.on('will-navigate', (e, url) => {
    // Allow navigation within the app
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
}
