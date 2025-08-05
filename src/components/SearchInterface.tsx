import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Mic, Sparkles, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import FloatingElements from "./FloatingElements";
import SearchResults from "./SearchResults";

interface SearchResponse {
  summary: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

const SearchInterface = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { toast } = useToast();

  const quickSearches = [
    "Latest football news",
    "Premier League standings", 
    "Champions League results",
    "Transfer updates",
    "Match highlights"
  ];

  const trendingSearches = [
    "Manchester United vs Arsenal",
    "Messi PSG highlights", 
    "World Cup 2026 qualifiers",
    "Bayern Munich transfers",
    "Real Madrid vs Barcelona"
  ];

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-with-gemini', {
        body: { query: searchQuery }
      });

      if (error) {
        throw new Error(error.message || 'Search failed');
      }

      const response: SearchResponse = {
        summary: data.summary,
        sources: data.sources || []
      };

      setResults(response);
      setSearchHistory(prev => [searchQuery, ...prev.slice(0, 9)]);
      
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Unable to process your search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    handleSearch(searchTerm);
  };

  return (
    <div className="min-h-screen relative overflow-hidden gradient-hero">
      <FloatingElements />
      
      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold">FootballAiEngine</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-white hover:bg-white/10">
            🌙
          </Button>
          <Button variant="ghost" className="text-white hover:bg-white/10">
            Sign In
          </Button>
          <Button className="bg-white text-primary hover:bg-white/90">
            Sign Up
          </Button>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-4">
        {!results ? (
          /* Search Landing Page */
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-4">
                Football<span className="text-orange-300">Ai</span>Engine
              </h1>
              <p className="text-xl md:text-2xl text-white/80 mb-2">
                Smarter Search, Powered by AI
              </p>
              <p className="text-sm text-white/60 flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4" />
                Designed By Frank Bazuaye: Powered By LiveGig Ltd
              </p>
            </div>

            {/* Search Input */}
            <Card className="w-full max-w-4xl p-4 gradient-card border-white/20">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything or search through documents..."
                    className="h-14 pl-12 pr-4 text-lg border-none bg-white/95 focus:bg-white"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    autoFocus
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  onClick={() => handleSearch()}
                  disabled={isLoading}
                  className="h-14 px-8 gradient-search text-white hover:opacity-90"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
            </Card>

            {/* Quick Search Pills */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {quickSearches.map((search) => (
                <Badge
                  key={search}
                  variant="secondary"
                  className="px-4 py-2 cursor-pointer hover:bg-white/20 bg-white/10 text-white border-white/20"
                  onClick={() => handleQuickSearch(search)}
                >
                  {search}
                </Badge>
              ))}
            </div>

            {/* Trending Searches */}
            <div className="mt-12 w-full max-w-4xl">
              <div className="flex items-center gap-2 mb-4 text-white/80">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Trending searches:</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {trendingSearches.map((search) => (
                  <Badge
                    key={search}
                    variant="outline"
                    className="px-3 py-1 cursor-pointer hover:bg-white/10 border-white/30 text-white/90"
                    onClick={() => handleQuickSearch(search)}
                  >
                    {search}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Search Results Page */
          <SearchResults
            query={query}
            results={results}
            isLoading={isLoading}
            onNewSearch={setQuery}
            onSearch={handleSearch}
            searchHistory={searchHistory}
            onHistoryClick={handleQuickSearch}
          />
        )}
      </div>
    </div>
  );
};

export default SearchInterface;