import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

type StatCardProps = {
  label: string;
  value: ReactNode;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe3ea",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 74,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  label: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  value: {
    color: "#102033",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 6
  }
});
