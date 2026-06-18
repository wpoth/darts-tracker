import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getCurrentUserProfile,
  type UserProfile,
} from "@/src/lib/profileDatabase";
import { supabase } from "@/src/lib/supabase";

type GameCategory = {
  title: string;
  description: string;
  status: "playable" | "coming-soon";
  route?: string;
};

const gameCategories: GameCategory[] = [
  {
    title: "Classic X01",
    description: "Play 301, 501, or 701 with custom rules and player setup.",
    status: "playable",
    route: "/classic",
  },
  {
    title: "Cricket",
    description: "Close numbers and race your opponent for points.",
    status: "coming-soon",
  },
  {
    title: "Around the Clock",
    description: "Hit each number in order from 1 to 20.",
    status: "coming-soon",
  },
  {
    title: "Bob's 27",
    description: "Practice doubles with a focused scoring format.",
    status: "coming-soon",
  },
  {
    title: "Shanghai",
    description: "Score singles, doubles, and triples per round.",
    status: "coming-soon",
  },
];

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useFocusEffect(
    useCallback(() => {
      checkAccount();
    }, [])
  );

  async function checkAccount() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setIsLoggedIn(Boolean(user));

    if (!user) {
      setProfile(null);
      return;
    }

    const { profile: currentProfile } = await getCurrentUserProfile();
    setProfile(currentProfile);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setProfile(null);
  }

  function openCategory(category: GameCategory) {
    if (category.status === "coming-soon" || !category.route) {
      return;
    }

    router.push(category.route as never);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.eyebrow}>Darts Tracker</Text>
              <Text style={styles.title}>Choose a game</Text>
            </View>

            <View style={styles.accountActions}>
              {isLoggedIn ? (
                <>
                  <Pressable
                    style={styles.accountButton}
                    onPress={() =>
                      profile
                        ? router.push("/profile")
                        : router.push("/profile-setup")
                    }
                  >
                    <Text style={styles.accountButtonText}>
                      {profile ? `@${profile.username}` : "Set username"}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => router.push("/friends")}
                  >
                    <Text style={styles.secondaryButtonText}>Friends</Text>
                  </Pressable>

                  <Pressable style={styles.logoutButton} onPress={signOut}>
                    <Text style={styles.logoutButtonText}>Log out</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  style={styles.accountButton}
                  onPress={() => router.push("/login")}
                >
                  <Text style={styles.accountButtonText}>Login</Text>
                </Pressable>
              )}
            </View>
          </View>

          <Text style={styles.subtitle}>
            Start by picking the type of darts game. The setup steps come after
            that.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game modes</Text>

          <View style={styles.gameList}>
            {gameCategories.map((category) => {
              const isComingSoon = category.status === "coming-soon";

              return (
                <Pressable
                  key={category.title}
                  style={[
                    styles.gameCard,
                    isComingSoon && styles.disabledGameCard,
                  ]}
                  onPress={() => openCategory(category)}
                >
                  <View style={styles.gameText}>
                    <Text
                      style={[
                        styles.gameTitle,
                        isComingSoon && styles.disabledText,
                      ]}
                    >
                      {category.title}
                    </Text>

                    <Text style={styles.gameDescription}>
                      {category.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isComingSoon && styles.disabledBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isComingSoon && styles.disabledBadgeText,
                      ]}
                    >
                      {isComingSoon ? "Soon" : "Play"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
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
    paddingTop: 12,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 28,
  },
  headerTop: {
    gap: 18,
  },
  eyebrow: {
    color: "#f97316",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 12,
  },
  accountActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  accountButton: {
    backgroundColor: "#f97316",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  accountButtonText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "900",
  },
  secondaryButton: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  secondaryButtonText: {
    color: "#fed7aa",
    fontSize: 13,
    fontWeight: "900",
  },
  logoutButton: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  logoutButtonText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "900",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  gameList: {
    gap: 12,
  },
  gameCard: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  disabledGameCard: {
    opacity: 0.58,
  },
  gameText: {
    flex: 1,
  },
  gameTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "900",
  },
  disabledText: {
    color: "#cbd5e1",
  },
  gameDescription: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: 5,
  },
  statusBadge: {
    backgroundColor: "#f97316",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusBadgeText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "900",
  },
  disabledBadge: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
  },
  disabledBadgeText: {
    color: "#94a3b8",
  },
});