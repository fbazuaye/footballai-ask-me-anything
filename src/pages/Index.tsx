
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Search } from "lucide-react";
import { Link } from "react-router-dom";
import FloatingElements from "@/components/FloatingElements";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();
  
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
            <Button asChild className="bg-white text-primary hover:bg-white/90 text-xs md:text-sm px-2 md:px-4">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-white hover:bg-white/10 text-xs md:text-sm px-2 md:px-4">
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild className="bg-white text-primary hover:bg-white/90 text-xs md:text-sm px-2 md:px-4">
                <Link to="/auth">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Homepage Content */}
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

          {/* CTA Section */}
          <Card className="w-full max-w-4xl p-4 md:p-6 gradient-card border-white/20 mb-8">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">
                Get Started with AI-Powered Football Search
              </h2>
              <p className="text-white/80 mb-6 text-sm md:text-base">
                Access real-time football insights, match analysis, and comprehensive search capabilities
              </p>
              <Button asChild size="lg" className="gradient-search text-white hover:opacity-90 w-full sm:w-auto">
                <Link to={user ? "/dashboard" : "/auth"} className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  {user ? "Go to Dashboard" : "Start Searching"}
                </Link>
              </Button>
            </div>
          </Card>

          {/* Quick Search Pills */}
          <div className="mt-6 md:mt-8 flex flex-wrap justify-center gap-2 md:gap-3">
            {quickSearches.map((search) => (
              <Badge
                key={search}
                variant="secondary"
                className="px-3 md:px-4 py-1.5 md:py-2 bg-white/10 text-white border-white/20 text-xs md:text-sm"
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
                  className="px-2 md:px-3 py-1 border-white/30 text-white/90 text-xs md:text-sm"
                >
                  {search}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
