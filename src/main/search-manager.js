const { exec } = require('child_process');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class SearchManager {
    constructor() {
        this.googleSearchApiKey = process.env.GOOGLE_SEARCH_API_KEY;
        this.googleSearchCx = process.env.GOOGLE_SEARCH_CX;
    }

    async search(query) {
        console.log(`[SearchManager] Searching for: ${query}`);
        if (this.googleSearchApiKey && this.googleSearchCx) {
            try {
                return await this.googleCustomSearch(query);
            } catch (e) {
                console.warn('[SearchManager] Google Search failed, falling back to DuckDuckGo/Web scraping logic');
            }
        }
        return await this.duckDuckGoSearch(query);
    }

    async googleCustomSearch(query) {
        const url = `https://www.googleapis.com/customsearch/v1?key=${this.googleSearchApiKey}&cx=${this.googleSearchCx}&q=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.items) return [];

        return data.items.map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        })).slice(0, 5);
    }

    async duckDuckGoSearch(query) {

        return null;
    }
}

module.exports = new SearchManager();
