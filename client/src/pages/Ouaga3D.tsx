import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";

export default function Ouaga3D() {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate("/streetview", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Helmet>
        <title>Ouagadougou 3D - Burkina Watch</title>
      </Helmet>
      <p className="text-muted-foreground">Redirection vers StreetView...</p>
    </div>
  );
}
