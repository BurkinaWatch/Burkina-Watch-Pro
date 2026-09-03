import StatCard from "../StatCard";
import { AlertCircle, CheckCircle2, Clock, Users } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <StatCard
        title="Total Signalements"
        value="1,247"
        icon={AlertCircle}
        description="+12 aujourd'hui"
        trend={{ value: 8, isPositive: true }}
      />
      <StatCard
        title="En attente"
        value="156"
        icon={Clock}
        description="Nécessitent attention"
      />
      <StatCard
        title="Résolus"
        value="892"
        icon={CheckCircle2}
        trend={{ value: 15, isPositive: true }}
      />
      <StatCard
        title="Utilisateurs actifs"
        value="8,432"
        icon={Users}
        description="Citoyens engagés"
      />
    </div>
  );
}
