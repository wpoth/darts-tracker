import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View>
        <Text style={styles.title}>Darts Tracker</Text>
        <Text style={styles.subtitle}>501 scoring app</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "800",
  },
  subtitle: {
    color: "#f97316",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },
});