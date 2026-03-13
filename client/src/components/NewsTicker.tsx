import { useQuery } from "@tanstack/react-query";
import { useRef, useEffect, useState } from "react";
import { Newspaper, ExternalLink } from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  date: string;
}

function formatNewsDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Aujourd'hui";
    if (isYesterday(date)) return "Hier";
    return format(date, "d MMM", { locale: fr });
  } catch {
    return "";
  }
}

export function NewsTicker() {
  const { data: news = [], isLoading } = useQuery<NewsItem[]>({
    queryKey: ["/api/news/official"],
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
  });

  const stripRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(60);

  useEffect(() => {
    if (!stripRef.current || news.length === 0) return;
    const totalWidth = stripRef.current.scrollWidth;
    const halfWidth = totalWidth / 2;
    const speed = 80;
    setDuration(halfWidth / speed);
  }, [news]);

  if (isLoading || news.length === 0) {
    return (
      <div className="bg-gradient-to-r from-red-700 via-yellow-600 to-green-800 py-2 overflow-hidden">
        <div className="flex items-center justify-center gap-2 text-white text-sm">
          <Newspaper className="w-4 h-4" />
          <span>Chargement des communiqués officiels...</span>
        </div>
      </div>
    );
  }

  const renderItem = (item: NewsItem, prefix: string, index: number) => {
    const dateLabel = formatNewsDate(item.date);
    return (
      <a
        key={`${prefix}-${item.id}-${index}`}
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mx-10 hover:text-yellow-200 transition-colors flex-shrink-0"
        data-testid={`news-ticker-${prefix}-${index}`}
      >
        {dateLabel && (
          <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded font-medium">
            {dateLabel}
          </span>
        )}
        <span className="font-semibold text-yellow-100">{item.source} :</span>
        <span className="text-white">{item.title}</span>
        <ExternalLink className="w-3 h-3 opacity-60 flex-shrink-0" />
        <span className="text-white/30 ml-6 text-lg">•</span>
      </a>
    );
  };

  return (
    <div className="bg-gradient-to-r from-red-700 via-yellow-600 to-green-800 py-2.5 overflow-hidden relative">
      <div className="absolute left-16 top-0 bottom-0 w-10 bg-gradient-to-r from-red-700 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-green-800 to-transparent z-10 pointer-events-none" />

      <div className="flex items-center">
        <div className="flex-shrink-0 px-4 flex items-center gap-2 text-white font-bold border-r border-white/30 mr-0 z-20 bg-red-700 self-stretch py-0.5">
          <Newspaper className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">INFOS</span>
        </div>

        <div className="overflow-hidden flex-1">
          <div
            ref={stripRef}
            className="flex items-center text-white text-sm whitespace-nowrap"
            style={{
              width: "max-content",
              animation: `news-ticker ${duration}s linear infinite`,
              willChange: "transform",
            }}
          >
            {news.map((item, i) => renderItem(item, "a", i))}
            {news.map((item, i) => renderItem(item, "b", i))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes news-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
