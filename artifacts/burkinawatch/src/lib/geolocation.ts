export type UserLocation = {
  lat: number;
  lng: number;
};

type LocationFailureCode =
  | "unsupported"
  | "permission-denied"
  | "timeout"
  | "unavailable"
  | "unknown";

export class LocationRequestError extends Error {
  constructor(
    public readonly code: LocationFailureCode,
    message: string,
  ) {
    super(message);
    this.name = "LocationRequestError";
  }
}

function toLocationError(error: GeolocationPositionError): LocationRequestError {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return new LocationRequestError(
        "permission-denied",
        "Autorisez la localisation pour BurkinaWatch dans les réglages du navigateur, puis réessayez.",
      );
    case error.TIMEOUT:
      return new LocationRequestError(
        "timeout",
        "La localisation prend trop de temps. Vérifiez que le GPS est activé, puis réessayez.",
      );
    case error.POSITION_UNAVAILABLE:
      return new LocationRequestError(
        "unavailable",
        "Votre position est momentanément indisponible. Vérifiez le GPS et réessayez.",
      );
    default:
      return new LocationRequestError(
        "unknown",
        "Impossible d'obtenir votre position. Vérifiez les permissions et réessayez.",
      );
  }
}

/**
 * Requests a location in a way that works better on mobile browsers:
 * use a cached/network position first, then retry once with device GPS when
 * the network location is unavailable or too slow.
 */
export function requestUserLocation(): Promise<UserLocation> {
  if (
    typeof navigator === "undefined" ||
    !navigator.geolocation ||
    (typeof window !== "undefined" && !window.isSecureContext)
  ) {
    return Promise.reject(
      new LocationRequestError(
        "unsupported",
        "La géolocalisation nécessite un navigateur compatible et une connexion HTTPS.",
      ),
    );
  }

  return new Promise((resolve, reject) => {
    const request = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        (error) => {
          if (
            !highAccuracy &&
            (error.code === error.POSITION_UNAVAILABLE ||
              error.code === error.TIMEOUT)
          ) {
            request(true);
            return;
          }
          reject(toLocationError(error));
        },
        highAccuracy
          ? {
              enableHighAccuracy: true,
              timeout: 15_000,
              maximumAge: 60_000,
            }
          : {
              enableHighAccuracy: false,
              timeout: 20_000,
              maximumAge: 300_000,
            },
      );
    };

    request(false);
  });
}

export function getLocationErrorMessage(error: unknown): string {
  return error instanceof LocationRequestError
    ? error.message
    : "Impossible d'obtenir votre position. Vérifiez les permissions et réessayez.";
}