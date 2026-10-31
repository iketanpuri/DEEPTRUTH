export type SearchResult = {
  sourceName: string;
  url: string;
  type: 'Official' | 'News' | 'Blog' | 'Unknown';
  snippet: string;
};

export async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    // For the hackathon, we use the free Wikipedia API as a robust fact-checking source
    // to avoid requiring the user to sign up for paid search APIs like Tavily or Serper.
    
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`Wikipedia Search failed: ${response.statusText}`);
    }

    const data = await response.json();
    const hits = data.query?.search || [];

    // Map Wikipedia results to our generic SearchResult format
    const results: SearchResult[] = hits.slice(0, 3).map((hit: any) => {
      // Clean HTML tags from snippet
      const cleanSnippet = hit.snippet.replace(/<[^>]*>?/gm, '');
      
      return {
        sourceName: `Wikipedia: ${hit.title}`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title)}`,
        type: 'Official',
        snippet: cleanSnippet
      };
    });

    // If Wikipedia finds nothing, add a fallback "Unknown" source to simulate web crawling
    if (results.length === 0) {
      results.push({
        sourceName: "Web Crawler (General)",
        url: "#",
        type: "Unknown",
        snippet: "No highly authoritative sources directly confirm or deny this exact phrasing in recent indexes."
      });
    }

    return results;

  } catch (error) {
    console.error("Web Search Error:", error);
    // Return a graceful failure state
    return [{
        sourceName: "DeepTruth Fallback Source",
        url: "#",
        type: "Unknown",
        snippet: "Live search is temporarily unavailable. Proceeding with intrinsic analysis."
    }];
  }
}
