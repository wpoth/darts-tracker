import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type GameCard = {
  title: string;
  description: string;
  startingScore: number;
  doubleOut: boolean;
  enabled: boolean;
};

const x01Games: GameCard[] = [
  {
    title: "301",
    description: "Fast x01 game. Good for short matches.",
    startingScore: 301,
    doubleOut: false,
    enabled: true,
  },
  {
    title: "301 Double Out",
    description: "Fast x01 with double-out rules.",
    startingScore: 301,
    doubleOut: true,
    enabled: true,
  },
  {
    title: "501",
    description: "Classic x01 scoring.",
    startingScore: 501,
    doubleOut: false,
    enabled: true,
  },
  {
    title: "501 Double Out",
    description: "Classic darts format. Busts if you leave 1.",
    startingScore: 501,
    doubleOut: true,
    enabled: true,
  },
  {
    title: "701",
    description: "Longer x01 game.",
    startingScore: 701,
    doubleOut: false,
    enabled: true,
  },
  {
    title: "701 Double Out",
    description: "Longer x01 game with double-out rules.",
    startingScore: 701,
    doubleOut: true,
    enabled: true,
  },
];

const comingSoonGames = [
  {
    title: "Cricket",
    description: "Close 15 to 20 and bull.",
  },
  {
    title: "Around the Clock",
    description: "Hit numbers in order from 1 to 20.",
  },
  {
    title: "Bob's 27",
    description: "Double practice game.",
  },
  {
    title: "Shanghai",
    description: "Score singles, doubles and triples.",
  },
];

export default function HomeScreen() {
  function startX01Game(game: GameCard) {
    router.push({
      pathname: "/x01",
      params: {
        title: game.title,
        startingScore: String(game.startingScore),
        doubleOut: String(game.doubleOut),
      },
    });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Choose game</Text>
        <Text style={styles.title}>Darts Tracker</Text>
        <Text style={styles.subtitle}>
          Track your own matches with quick scoring.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Playable now</Text>

        <View style={styles.gameGrid}>
          {x01Games.map((game) => (
            <Pressable
              key={game.title}
              style={styles.gameCard}
              onPress={() => startX01Game(game)}
            >
              <View>
                <Text style={styles.gameTitle}>{game.title}</Text>
                <Text style={styles.gameDescription}>{game.description}</Text>
              </View>

              <Text style={styles.gameMeta}>
                {game.doubleOut ? "Double out" : "Straight out"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coming later</Text>

        <View style={styles.gameGrid}>
          {comingSoonGames.map((game) => (
            <View key={game.title} style={[styles.gameCard, styles.disabledCard]}>
              <View>
                <Text style={styles.disabledTitle}>{game.title}</Text>
                <Text style={styles.disabledDescription}>
                  {game.description}
                </Text>
              </View>

              <Text style={styles.disabledMeta}>Coming soon</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    marginBottom: 22,
  },
  eyebrow: {
    color: "#f97316",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 6,
    lineHeight: 21,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  gameGrid: {
    gap: 10,
  },
  gameCard: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  gameTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  gameDescription: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    maxWidth: 220,
  },
  gameMeta: {
    color: "#fed7aa",
    fontSize: 12,
    fontWeight: "900",
    alignSelf: "flex-start",
    backgroundColor: "#1f2937",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  disabledCard: {
    opacity: 0.48,
  },
  disabledTitle: {
    color: "#cbd5e1",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  disabledDescription: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    maxWidth: 220,
  },
  disabledMeta: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "900",
    alignSelf: "flex-start",
    backgroundColor: "#1e293b",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
});