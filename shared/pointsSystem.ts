
export const POINTS_CONFIG = {
  VERIFIED_SIGNALEMENT: 10, // +10 points par signalement validé
  CITIZEN_CONFIRMATION: 5,  // +5 points par confirmation d'autres citoyens
} as const;

export const LEVELS = {
  SENTINELLE: {
    name: 'sentinelle',
    minPoints: 0,
    maxPoints: 99,
    titleKey: 'levels.sentinelle.title',
    descriptionKey: 'levels.sentinelle.description',
    color: '#10b981', // Vert émeraude
    icon: '🇧🇫',
  },
  VDP: {
    name: 'vdp',
    minPoints: 100,
    maxPoints: 224,
    titleKey: 'levels.vdp.title',
    descriptionKey: 'levels.vdp.description',
    color: '#f59e0b', // Jaune or
    icon: '✊',
  },
  FDS: {
    name: 'fds',
    minPoints: 225,
    maxPoints: Infinity,
    titleKey: 'levels.fds.title',
    descriptionKey: 'levels.fds.description',
    color: '#ef4444', // Rouge intense
    icon: '🛡️',
  },
} as const;

export function calculateLevel(points: number): 'sentinelle' | 'vdp' | 'fds' {
  if (points >= LEVELS.FDS.minPoints) return 'fds';
  if (points >= LEVELS.VDP.minPoints) return 'vdp';
  return 'sentinelle';
}

export function getLevelInfo(level: string) {
  const levelKey = level.toUpperCase() as keyof typeof LEVELS;
  return LEVELS[levelKey] || LEVELS.SENTINELLE;
}

export function getProgressToNextLevel(points: number) {
  const currentLevel = calculateLevel(points);
  const currentLevelInfo = getLevelInfo(currentLevel);
  
  if (currentLevel === 'fds') {
    return { percentage: 100, pointsNeeded: 0, nextLevel: null };
  }
  
  const nextLevelInfo = currentLevel === 'sentinelle' ? LEVELS.VDP : LEVELS.FDS;
  const pointsInCurrentLevel = points - currentLevelInfo.minPoints;
  const pointsNeededForNextLevel = nextLevelInfo.minPoints - currentLevelInfo.minPoints;
  const percentage = Math.min(100, (pointsInCurrentLevel / pointsNeededForNextLevel) * 100);
  const pointsNeeded = nextLevelInfo.minPoints - points;
  
  return {
    percentage,
    pointsNeeded,
    nextLevel: nextLevelInfo.name,
  };
}
