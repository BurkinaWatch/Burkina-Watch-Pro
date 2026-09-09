import MapPlaceholder from "../MapPlaceholder";

export default function MapPlaceholderExample() {
  const markers = [
    { id: "1", lat: 12.3714, lng: -1.5197, categorie: "urgence" as const, titre: "Accident", isSOS: true },
    { id: "2", lat: 12.3850, lng: -1.5350, categorie: "securite" as const, titre: "Patrouille" },
  ];

  return (
    <div className="p-4">
      <MapPlaceholder markers={markers} className="h-96" />
    </div>
  );
}
