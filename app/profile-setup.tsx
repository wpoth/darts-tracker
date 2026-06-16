import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { createCurrentUserProfile } from "@/src/lib/profileDatabase";

export default function ProfileSetupScreen() {
    const [username, setUsername] = useState("");

    async function saveUsername() {
        const { error } = await createCurrentUserProfile(username);

        if (error) {
            Alert.alert("Username failed", error);
            return;
        }

        router.replace("/");
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Text style={styles.eyebrow}>Profile</Text>
                        <Text style={styles.title}>Choose username</Text>
                        <Text style={styles.subtitle}>
                            This name will be shown in your match history and stats later.
                        </Text>
                    </View>

                    <View style={styles.formCard}>
                        <TextInput
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                            placeholder="Username"
                            placeholderTextColor="#64748b"
                            style={styles.input}
                        />

                        <Text style={styles.helpText}>
                            Use at least 3 characters. Letters, numbers and underscores only.
                        </Text>

                        <Pressable style={styles.primaryButton} onPress={saveUsername}>
                            <Text style={styles.primaryButtonText}>Save username</Text>
                        </Pressable>

                        <Pressable onPress={() => router.replace("/")}>
                            <Text style={styles.skipText}>Skip for now</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#020617",
    },
    keyboardView: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 24,
    },
    header: {
        marginBottom: 24,
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
    formCard: {
        width: "100%",
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "#1e293b",
        borderRadius: 22,
        padding: 14,
        gap: 12,
    },
    input: {
        width: "100%",
        backgroundColor: "#020617",
        borderWidth: 1,
        borderColor: "#334155",
        color: "#ffffff",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 15,
        fontSize: 16,
    },
    helpText: {
        color: "#64748b",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 18,
    },
    primaryButton: {
        width: "100%",
        backgroundColor: "#f97316",
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "900",
    },
    skipText: {
        color: "#94a3b8",
        textAlign: "center",
        fontSize: 14,
        fontWeight: "800",
        marginTop: 4,
    },
});