const { exec } = require('child_process');

class SearchManager {
    constructor() {
        this.googleSearchApiKey = process.env.GOOGLE_SEARCH_API_KEY;
        this.googleSearchCx = process.env.GOOGLE_SEARCH_CX;
    }

    async search(query) {
        if (this.googleSearchApiKey && this.googleSearchCx) {
            return this.googleCustomSearch(query);
        } else {
            return this.duckDuckGoSearch(query);
        }
    }

    async googleCustomSearch(query) {
        const url = `https://www.googleapis.com/customsearch/v1?key=${this.googleSearchApiKey}&cx=${this.googleSearchCx}&q=${encodeURIComponent(query)}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.items.map(item => ({
                title: item.title,
                link: item.link,
                snippet: item.snippet
            })).slice(0, 5);
        } catch (error) {
            console.error('Google Custom Search error:', error);
            return this.duckDuckGoSearch(query);
        }
    }

    async duckDuckGoSearch(query) {
        // Simple fallback using a public API or scraping (carefully)
        // For a production-ready free alternative, we might use a dedicated service or just prompt the AI to use the browser
        console.log(`Fallback search for: ${query}`);
        return null; // Return null to indicate fallback to browser
    }
}

module.exports = new SearchManager();
