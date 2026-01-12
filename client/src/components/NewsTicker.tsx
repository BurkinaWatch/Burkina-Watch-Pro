import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Newspaper, ExternalLink } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  date: string;
}

export function NewsTicker() {
  const { data: news = [], isLoading } = useQuery<NewsItem[]>({
    queryKey: ["/api/news/official"],
    staleTime: 1000 * 60 * 15,
    refetchInterval: 1000 * 60 * 30,
  });

  if (isLoading || news.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-800 via-yellow-600 to-red-700 py-2 overflow-hidden">
        <div className="flex items-center justify-center gap-2 text-white text-sm">
          <Newspaper className="w-4 h-4" />
          <span>Chargement des communiqués officiels...</span>
        </div>
      </div>
    );
  }

  const tickerContent = news.map((item, index) => (
    <a
      key={`${item.id}-${index}`}
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 mx-8 hover:text-yellow-200 transition-colors"
      data-testid={`news-item-${item.id}`}
    >
      <span className="font-medium">{item.source}:</span>
      <span>{item.title}</span>
      <ExternalLink className="w-3 h-3 opacity-70" />
    </a>
  ));

  const duplicatedContent = news.flatMap((item, index) => [
    <a
      key={`${item.id}-first-${index}`}
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 mx-8 hover:text-yellow-200 transition-colors"
    >
      <span className="font-medium">{item.source}:</span>
      <span>{item.title}</span>
      <ExternalLink className="w-3 h-3 opacity-70" />
    </a>,
    <a
      key={`${item.id}-second-${index}`}
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 mx-8 hover:text-yellow-200 transition-colors"
    >
      <span className="font-medium">{item.source}:</span>
      <span>{item.title}</span>
      <ExternalLink className="w-3 h-3 opacity-70" />
    </a>
  ]);

  return (
    <div className="bg-gradient-to-r from-green-800 via-yellow-600 to-red-700 py-2.5 overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-green-800 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-red-700 to-transparent z-10" />
      
      <div className="flex items-center">
        <div className="flex-shrink-0 px-4 flex items-center gap-2 text-white font-bold border-r border-white/30 mr-4 z-20 bg-green-800">
          <Newspaper className="w-4 h-4" />
          <span className="hidden sm:inline">INFOS</span>
        </div>
        
        <motion.div
          className="flex items-center text-white text-sm whitespace-nowrap"
          animate={{
            x: [0, -50 * news.length * 20],
          }}
          transition={{
            x: {
              duration: news.length * 15,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        >
          {duplicatedContent}
        </motion.div>
      </div>
    </div>
  );
}
