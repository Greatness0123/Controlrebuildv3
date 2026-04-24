const { exec } = require('child_process');
const https = require('https');
const { URL } = require('url');

class SearchManager {
    constructor() {
        this.googleSearchApiKey = process.env.GOOGLE_SEARCH_API_KEY;
        this.googleSearchCx = process.env.GOOGLE_SEARCH_CX;
    }

    async search(query) {
        console.log(`[SearchManager] Searching for: ${query}`);
        
        // Try Google Custom Search first if API key is set
        if (this.googleSearchApiKey && this.googleSearchCx) {
            try {
                return await this.googleCustomSearch(query);
            } catch (e) {
                console.warn('[SearchManager] Google Search failed:', e.message);
            }
        }
        
        // Fallback to free web search (DuckDuckGo instant answer API)
        try {
            return await this.duckDuckGoInstantSearch(query);
        } catch (e) {
            console.warn('[SearchManager] DuckDuckGo failed:', e.message);
        }
        
        // Final fallback - try serper API if available
        if (process.env.SERPER_API_KEY) {
            try {
                return await this.serperSearch(query);
            } catch (e) {
                console.warn('[SearchManager] Serper failed:', e.message);
            }
        }
        
        return [];
    }

    async googleCustomSearch(query) {
        const url = `https://www.googleapis.com/customsearch/v1?key=${this.googleSearchApiKey}&cx=${this.googleSearchCx}&q=${encodeURIComponent(query)}`;
        const response = await this.httpGet(url);
        const data = JSON.parse(response);

        if (!data.items) return [];

        return data.items.map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        })).slice(0, 5);
    }

    async duckDuckGoInstantSearch(query) {
        // Use DuckDuckGo HTML search (no API key needed)
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const html = await this.httpGet(url);
        
        // Simple HTML parsing without external dependencies
        const results = [];
        const regex = /<a rel="nofollow" class="result__a" href="[^"]*u=([^"]*)"[^>]*>([^<]*)<\/a>/g;
        const snippetRegex = /<a class="result__snippet"[^>]*>([^<]*)<\/a>/g;
        
        let match;
        let count = 0;
        while ((match = regex.exec(html)) !== null && count < 5) {
            const link = decodeURIComponent(match[1]);
            const title = match[2].replace(/<[^>]*>/g, '').trim();
            
            // Find snippet for this result
            const snippetMatch = snippetRegex.exec(html);
            const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : '';
            
            if (link && title && link.startsWith('http')) {
                results.push({ title, link, snippet });
                count++;
            }
        }
        
        return results;
    }

    async serperSearch(query) {
        const options = {
            hostname: 'google.serper.dev',
            path: '/search',
            method: 'POST',
            headers: {
                'X-API-KEY': process.env.SERPER_API_KEY,
                'Content-Type': 'application/json'
            }
        };

        const response = await this.httpPost(options, JSON.stringify({ q: query }));
        const data = JSON.parse(response);

        if (!data.organic) return [];

        return data.organic.map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        })).slice(0, 5);
    }

    httpGet(url) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const options = {
                hostname: parsedUrl.hostname,
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            });

            req.on('error', reject);
            req.end();
        });
    }

    httpPost(options, body) {
        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            });

            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }
}

module.exports = new SearchManager();