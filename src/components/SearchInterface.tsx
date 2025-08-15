
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Mic, Sparkles, TrendingUp, LogOut, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user, signOut } = useAuth();

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

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was an error signing out. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden gradient-hero">
      <FloatingElements />
      
      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-4 md:p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold text-sm md:text-base lg:text-lg">FootballAiEngine</span>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" className="text-white hover:bg-white/10 p-2 md:p-3">
            🌙
          </Button>
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
                <User className="w-4 h-4 text-white" />
                <span className="text-white text-sm hidden sm:inline">
                  {user.email?.split('@')[0]}
                </span>
              </div>
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="text-white hover:bg-white/10 text-xs md:text-sm px-2 md:px-4"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" className="text-white hover:bg-white/10 text-xs md:text-sm px-2 md:px-4">
                Sign In
              </Button>
              <Button className="bg-white text-primary hover:bg-white/90 text-xs md:text-sm px-2 md:px-4">
                Sign Up
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {!results ? (
          /* Search Landing Page */
          <div className="flex flex-col items-center justify-center min-h-[70vh] md:min-h-[80vh] text-center">
            <div className="mb-6 md:mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-2 md:mb-4">
                Football<span className="text-orange-300">Ai</span>Engine
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-white/80 mb-2 px-4">
                Smarter Search, Powered by AI
              </p>
              <p className="text-xs sm:text-sm text-white/60 flex items-center justify-center gap-1 flex-wrap px-4">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Designed By Frank Bazuaye: Powered By LiveGig Ltd</span>
                <span className="sm:hidden">By Frank Bazuaye - LiveGig Ltd</span>
              </p>
            </div>

            {/* Search Input */}
            <Card className="w-full max-w-4xl p-3 md:p-4 gradient-card border-white/20">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything or search through documents..."
                    className="h-12 sm:h-14 pl-10 sm:pl-12 pr-12 sm:pr-4 text-base sm:text-lg border-none bg-white/95 focus:bg-white"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    autoFocus
                  />
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 sm:w-5 h-4 sm:h-5" />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 sm:hidden"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  onClick={() => handleSearch()}
                  disabled={isLoading}
                  className="h-12 sm:h-14 px-6 sm:px-8 gradient-search text-white hover:opacity-90 w-full sm:w-auto"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>Search</span>
                      <Search className="w-4 h-4 sm:hidden" />
                    </span>
                  )}
                </Button>
              </div>
            </Card>

            {/* Quick Search Pills */}
            <div className="mt-6 md:mt-8 flex flex-wrap justify-center gap-2 md:gap-3">
              {quickSearches.map((search) => (
                <Badge
                  key={search}
                  variant="secondary"
                  className="px-3 md:px-4 py-1.5 md:py-2 cursor-pointer hover:bg-white/20 bg-white/10 text-white border-white/20 text-xs md:text-sm"
                  onClick={() => handleQuickSearch(search)}
                >
                  {search}
                </Badge>
              ))}
            </div>

            {/* Trending Searches */}
            <div className="mt-8 md:mt-12 w-full max-w-4xl">
              <div className="flex items-center gap-2 mb-3 md:mb-4 text-white/80 justify-center md:justify-start">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Trending searches:</span>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-start">
                {trendingSearches.map((search) => (
                  <Badge
                    key={search}
                    variant="outline"
                    className="px-2 md:px-3 py-1 cursor-pointer hover:bg-white/10 border-white/30 text-white/90 text-xs md:text-sm"
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
