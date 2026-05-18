import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { locale, t } from "../i18n";
import { RunSummary } from "../types/run";
import { formatDistance, formatDuration, formatPace } from "../utils/runMetrics";

type RunHistoryProps = {
  runs: RunSummary[];
  onSelectRun: (run: RunSummary) => void;
};

export function RunHistory({ runs, onSelectRun }: RunHistoryProps) {
  return (
    <>
      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>{t("historyTitle")}</Text>
        <Text style={styles.historyCount}>{t("historyCount", { count: runs.length })}</Text>
      </View>

      <FlatList
        data={runs}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.emptyText}>{t("emptyHistory")}</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              onSelectRun(item);
            }}
            style={({ pressed }) => [styles.runRow, pressed && styles.rowPressed]}
          >
            <View>
              <Text style={styles.runDate}>{new Date(item.startedAt).toLocaleString(locale)}</Text>
              <Text style={styles.runMeta}>
                {formatDuration(item.durationSeconds)} {t("runMetaSeparator")}{" "}
                {formatPace(item.averagePaceSecondsPerKm, t("paceUnit"), t("unavailablePace"))}
              </Text>
            </View>
            <Text style={styles.runDistance}>
              {formatDistance(item.distanceMeters, t("distanceUnit"))}
            </Text>
          </Pressable>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  historyHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 26
  },
  sectionTitle: {
    color: "#102033",
    fontSize: 20,
    fontWeight: "900"
  },
  historyCount: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700"
  },
  emptyText: {
    color: "#64748b",
    fontSize: 15,
    marginTop: 14
  },
  separator: {
    height: 10
  },
  runRow: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dbe3ea",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    padding: 14
  },
  rowPressed: {
    backgroundColor: "#f1f5f9"
  },
  runDate: {
    color: "#102033",
    fontSize: 15,
    fontWeight: "800"
  },
  runMeta: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 4
  },
  runDistance: {
    color: "#0f766e",
    fontSize: 17,
    fontWeight: "900"
  }
});
