import { RunPoint } from "../types/run";

const EARTH_RADIUS_METERS = 6371000;

const toRadians = (value: number) => (value * Math.PI) / 180;

export const distanceBetween = (a: RunPoint, b: RunPoint) => {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const calculateDistance = (points: RunPoint[]) => {
  if (points.length < 2) {
    return 0;
  }

  return points.reduce((total, point, index) => {
    if (index === 0) {
      return total;
    }

    const previousPoint = points[index - 1];
    const previousSegment = previousPoint.segmentIndex ?? 0;
    const currentSegment = point.segmentIndex ?? 0;

    if (previousSegment !== currentSegment) {
      return total;
    }

    return total + distanceBetween(previousPoint, point);
  }, 0);
};

export const calculatePace = (distanceMeters: number, durationSeconds: number) => {
  if (distanceMeters < 1 || durationSeconds < 1) {
    return null;
  }

  return durationSeconds / (distanceMeters / 1000);
};

export const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [minutes, seconds].map((part) => String(part).padStart(2, "0"));
  return hours > 0 ? `${hours}:${parts.join(":")}` : parts.join(":");
};

export const formatDistance = (meters: number, unitLabel: string) =>
  `${(meters / 1000).toFixed(2)} ${unitLabel}`;

export const formatPace = (secondsPerKm: number | null, unitLabel: string, unavailableLabel: string) => {
  if (!secondsPerKm || !Number.isFinite(secondsPerKm)) {
    return unavailableLabel;
  }

  const roundedSeconds = Math.round(secondsPerKm);
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} ${unitLabel}`;
};
