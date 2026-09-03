import SignalementCard from "../SignalementCard";

export default function SignalementCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <SignalementCard
        id="1"
        titre="Accident de la circulation sur l'avenue Kwame Nkrumah"
        description="Un accident impliquant deux véhicules vient de se produire. Les blessés ont besoin d'assistance médicale urgente."
        categorie="urgence"
        localisation="Avenue Kwame Nkrumah, Ouagadougou"
        photo="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&h=300&fit=crop"
        isSOS={true}
        statut="en_cours"
        likes={24}
        commentCount={8}
        createdAt={new Date(Date.now() - 1000 * 60 * 15)}
        auteur="Jean Ouédraogo"
      />
      <SignalementCard
        id="2"
        titre="Déchets non collectés depuis une semaine"
        description="Les ordures s'accumulent dans notre quartier et représentent un risque sanitaire pour les habitants."
        categorie="environnement"
        localisation="Secteur 15, Ouagadougou"
        statut="en_attente"
        likes={12}
        commentCount={3}
        createdAt={new Date(Date.now() - 1000 * 60 * 60 * 2)}
      />
      <SignalementCard
        id="3"
        titre="Lampadaires défectueux"
        description="Plusieurs lampadaires sont hors service dans notre rue, créant une zone d'insécurité la nuit."
        categorie="infrastructure"
        localisation="Rue 13.25, Secteur 13"
        photo="https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop"
        statut="resolu"
        likes={45}
        commentCount={15}
        createdAt={new Date(Date.now() - 1000 * 60 * 60 * 24)}
      />
    </div>
  );
}
