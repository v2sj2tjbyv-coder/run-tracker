import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import { t } from "../i18n";
import { RunPoint } from "../types/run";

type RouteMapProps = {
  activePoints: RunPoint[];
  isPaused: boolean;
  isTracking: boolean;
  routeRegion: Region;
  routeSegments: RunPoint[][];
};

export function RouteMap({
  activePoints,
  isPaused,
  isTracking,
  routeRegion,
  routeSegments
}: RouteMapProps) {
  return (
    <View style={styles.mapShell}>
      <MapView
        style={styles.map}
        region={routeRegion}
        showsUserLocation={isTracking && !isPaused}
      >
        {activePoints.length > 0 ? (
          <>
            {routeSegments.map((segment, index) => (
              <Polyline
                key={`${segment[0]?.timestamp ?? index}-${index}`}
                coordinates={segment}
                strokeColor="#0f766e"
                strokeWidth={5}
              />
            ))}
            <Marker coordinate={activePoints[0]} title={t("selectedRunStartMarker")} />
            <Marker
              coordinate={activePoints[activePoints.length - 1]}
              title={t("selectedRunCurrentMarker")}
            />
          </>
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapShell: {
    borderColor: "#dbe3ea",
    borderRadius: 8,
    borderWidth: 1,
    height: 330,
    marginTop: 18,
    overflow: "hidden"
  },
  map: {
    height: "100%",
    width: "100%"
  }
});
