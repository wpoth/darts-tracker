import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrentUserProfile, type UserProfile } from "@/src/lib/profileDatabase";
import { supabase } from "@/src/lib/supabase";

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAccountLoading, setIsAccountLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      checkAccount();
    }, [])
  );

  async function checkAccount() {
    setIsAccountLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setIsLoggedIn(false);
      setProfile(null);
      setIsAccountLoading(false);
      return;
    }

    setIsLoggedIn(true);

    const { profile: currentProfile } = await getCurrentUserProfile();

    setProfile(currentProfile);
    setIsAccountLoading(false);
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert("Logout failed", error.message);
      return;
    }

    setIsLoggedIn(false);
    setProfile(null);
  }

  function openAccountScreen() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (!profile) {
      router.push("/profile-setup");
      return;
    }
  }

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

  const accountLabel = isAccountLoading
    ? "Loading..."
    : profile
      ? `@${profile.username}`
      : isLoggedIn
        ? "Set username"
        : "Account";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Choose game</Text>
            <Text style={styles.title}>Darts Tracker</Text>
            <Text style={styles.subtitle}>
              Track your own matches with quick scoring.
            </Text>
          </View>

          <View style={styles.accountActions}>
            <Pressable style={styles.accountButton} onPress={openAccountScreen}>
              <Text style={styles.accountButtonText}>{accountLabel}</Text>
            </Pressable>

            {isLoggedIn && (
              <>
                <Pressable
                  style={styles.friendsButton}
                  onPress={() => router.push("/friends")}
                >
                  <Text style={styles.friendsButtonText}>Friends</Text>
                </Pressable>

                <Pressable style={styles.logoutButton} onPress={signOut}>
                  <Text style={styles.logoutButtonText}>Log out</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        {profile && (
          <View style={styles.profileCard}>
            <Text style={styles.profileLabel}>Signed in as</Text>
            <Text style={styles.profileName}>{profile.username}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playable now</Text>

          <View style={styles.gameGrid}>
            {x01Games.map((game) => (
              <Pressable
                key={game.title}
                style={styles.gameCard}
                onPress={() => startX01Game(game)}
              >
                <View style={styles.gameText}>
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
                <View style={styles.gameText}>
                  <Text style={styles.disabledTitle}>{game.title}</Text>
                  <Text style={styles.disabledDescription}>{game.description}</Text>
                </View>

                <Text style={styles.disabledMeta}>Soon</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020617",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 14,
    gap: 14,
  },
  headerText: {
    width: "100%",
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
  accountActions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  accountButton: {
    alignSelf: "flex-start",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  accountButtonText: {
    color: "#fed7aa",
    fontSize: 13,
    fontWeight: "900",
  },
  logoutButton: {
    alignSelf: "flex-start",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  logoutButtonText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "900",
  },
  profileCard: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
  },
  profileLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  profileName: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
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
    width: "100%",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  gameText: {
    width: "100%",
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
  },
  gameMeta: {
    alignSelf: "flex-start",
    color: "#fed7aa",
    fontSize: 12,
    fontWeight: "900",
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
  },
  disabledMeta: {
    alignSelf: "flex-start",
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "900",
    backgroundColor: "#1e293b",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  friendsButton: {
    alignSelf: "flex-start",
    backgroundColor: "#f97316",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  friendsButtonText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "900",
  },
});