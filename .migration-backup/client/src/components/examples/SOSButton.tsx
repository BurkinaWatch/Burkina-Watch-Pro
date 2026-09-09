import { Button } from "@/components/ui/button";
import { Siren } from "lucide-react";

export default function SOSButtonExample() {
  return (
    <div className="relative h-64 bg-muted/20 rounded-lg">
      <Button variant="destructive" onClick={() => console.log("SOS button clicked")}>
        <Siren className="mr-2 h-4 w-4" />
        SOS
      </Button>
    </div>
  );
}
