import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { VoiceSearchButton } from "./VoiceSearchButton";
import { cn } from "@/lib/utils";

interface VoiceSearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onQueryChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

export function VoiceSearchInput({
  value,
  onChange,
  onQueryChange,
  placeholder,
  className,
  "data-testid": testId,
}: VoiceSearchInputProps) {
  const handleChange = onChange || onQueryChange;

  if (!handleChange) {
    return null;
  }

  if (value !== undefined) {
    return (
      <div className={cn("relative flex items-center gap-2", className)}>
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder={placeholder}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="pl-9 pr-4 h-11 bg-background/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary/30 transition-all shadow-sm"
            data-testid={testId}
          />
        </div>
        <VoiceSearchButton onQueryChange={handleChange} />
      </div>
    );
  }

  return <VoiceSearchButton onQueryChange={handleChange} />;
}
