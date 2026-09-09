import BottomNav from "../BottomNav";
import { Router } from "wouter";

export default function BottomNavExample() {
  return (
    <Router>
      <div className="relative h-64 bg-muted/20">
        <BottomNav />
      </div>
    </Router>
  );
}
