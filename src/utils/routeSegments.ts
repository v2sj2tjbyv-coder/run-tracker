import { Region } from "react-native-maps";
import { RunPoint } from "../types/run";

export const DEFAULT_REGION: Region = {
  latitude: 10.7769,
  longitude: 106.7009,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02
};

export const getRouteSegments = (points: RunPoint[]) => {
  return points.reduce<RunPoint[][]>((segments, point) => {
    const segmentIndex = point.segmentIndex ?? 0;
    const lastSegment = segments[segments.length - 1];
    const lastPoint = lastSegment?.[lastSegment.length - 1];

    if (!lastSegment || (lastPoint?.segmentIndex ?? 0) !== segmentIndex) {
      segments.push([point]);
      return segments;
    }

    lastSegment.push(point);
    return segments;
  }, []);
};

export const getRouteRegion = (points: RunPoint[]): Region => {
  const lastPoint = points[points.length - 1];

  if (!lastPoint) {
    return DEFAULT_REGION;
  }

  return {
    latitude: lastPoint.latitude,
    longitude: lastPoint.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01
  };
};
