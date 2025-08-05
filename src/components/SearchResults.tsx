import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Copy, 
  Download, 
  MessageSquare, 
  ExternalLink,
  ChevronLeft,
  History,
  Eye,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchResponse {
  summary: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

interface SearchResultsProps {
  query: string;
  results: SearchResponse;
  isLoading: boolean;
  onNewSearch: (query: string) => void;
  onSearch: (query?: string) => void;
  searchHistory: string[];
  onHistoryClick: (query: string) => void;
}

const SearchResults = ({
  query,
  results,
  isLoading,
  onNewSearch,
  onSearch,
  searchHistory,
  onHistoryClick
}: SearchResultsProps) => {
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'sources'>('summary');
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(results.summary);
    toast({
      title: "Copied to clipboard",
      description: "The AI response has been copied to your clipboard."
    });
  };

  const handleExport = () => {
    const content = `Query: ${query}\n\nAI Response:\n${results.summary}\n\nSources:\n${results.sources.map(s => `- ${s.title}: ${s.url}`).join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFollowUp = () => {
    if (followUpQuery.trim()) {
      onNewSearch(followUpQuery);
      onSearch(followUpQuery);
      setFollowUpQuery("");
    }
  };

  return (
    <div className="py-8">
      {/* Header with search bar */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10"
          onClick={() => window.location.reload()}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        
        <Card className="flex-1 gradient-card border-white/20">
          <div className="flex gap-2 p-3">
            <div className="relative flex-1">
              <Input
                value={query}
                onChange={(e) => onNewSearch(e.target.value)}
                className="h-10 pl-10 border-none bg-white/95 focus:bg-white"
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            <Button
              onClick={() => onSearch()}
              disabled={isLoading}
              size="sm"
              className="gradient-search text-white"
            >
              Search
            </Button>
          </div>
        </Card>

        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search History Sidebar */}
        {showHistory && (
          <div className="lg:col-span-1">
            <Card className="gradient-card border-white/20">
              <CardContent className="p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Recent Searches
                </h3>
                <div className="space-y-2">
                  {searchHistory.slice(0, 10).map((historyQuery, index) => (
                    <button
                      key={index}
                      onClick={() => onHistoryClick(historyQuery)}
                      className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm transition-colors"
                    >
                      {historyQuery}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Results */}
        <div className={showHistory ? "lg:col-span-3" : "lg:col-span-4"}>
          {/* View Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant={viewMode === 'summary' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('summary')}
              className={viewMode === 'summary' ? 'bg-white text-primary' : 'text-white hover:bg-white/10'}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              AI Summary
            </Button>
            <Button
              variant={viewMode === 'sources' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('sources')}
              className={viewMode === 'sources' ? 'bg-white text-primary' : 'text-white hover:bg-white/10'}
            >
              <FileText className="w-4 h-4 mr-1" />
              Source Documents
            </Button>
          </div>

          {/* AI Response Card */}
          <Card className="gradient-card border-white/20 mb-6">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-white font-medium">AI Response</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExport}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {viewMode === 'summary' ? (
                <div className="text-white/90 leading-relaxed">
                  {results.summary}
                </div>
              ) : (
                <div className="space-y-4">
                  {results.sources.map((source, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{source.title}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-white/70 hover:text-white hover:bg-white/10"
                        >
                          <a href={source.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                      <p className="text-white/70 text-sm">{source.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sources Quick View */}
          {viewMode === 'summary' && (
            <Card className="gradient-card border-white/20 mb-6">
              <CardContent className="p-4">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Sources
                </h3>
                <div className="flex flex-wrap gap-2">
                  {results.sources.map((source, index) => (
                    <a 
                      key={index}
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Badge
                        variant="secondary"
                        className="bg-white/10 text-white/80 border-white/20 hover:bg-white/20 cursor-pointer"
                      >
                        {source.title}
                      </Badge>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Follow-up Question */}
          <Card className="gradient-card border-white/20">
            <CardContent className="p-4">
              <h3 className="text-white font-medium mb-3">Ask a follow-up question</h3>
              <div className="flex gap-2">
                <Input
                  value={followUpQuery}
                  onChange={(e) => setFollowUpQuery(e.target.value)}
                  placeholder="Ask for more details or a related question..."
                  className="border-none bg-white/95 focus:bg-white"
                  onKeyDown={(e) => e.key === "Enter" && handleFollowUp()}
                />
                <Button
                  onClick={handleFollowUp}
                  disabled={!followUpQuery.trim()}
                  className="gradient-search text-white"
                >
                  Ask
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;