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

import { supabase } from "@/src/lib/supabase";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function signIn() {
        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        if (error) {
            Alert.alert("Login failed", error.message);
            return;
        }

        router.replace("/");
    }

    async function signUp() {
        const { error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
        });

        if (error) {
            Alert.alert("Sign up failed", error.message);
            return;
        }

        Alert.alert(
            "Account created",
            "You can now log in. If email confirmation is enabled, check your inbox first."
        );
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
                        <Pressable onPress={() => router.back()} hitSlop={12}>
                            <Text style={styles.backText}>← Back</Text>
                        </Pressable>

                        <Text style={styles.eyebrow}>Account</Text>
                        <Text style={styles.title}>Log in</Text>
                        <Text style={styles.subtitle}>
                            Save your matches and view your stats later.
                        </Text>
                    </View>

                    <View style={styles.formCard}>
                        <View style={styles.form}>
                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="email-address"
                                placeholder="Email"
                                placeholderTextColor="#64748b"
                                style={styles.input}
                            />

                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                placeholder="Password"
                                placeholderTextColor="#64748b"
                                style={styles.input}
                            />

                            <Pressable style={styles.primaryButton} onPress={signIn}>
                                <Text style={styles.primaryButtonText}>Log in</Text>
                            </Pressable>

                            <Pressable style={styles.secondaryButton} onPress={signUp}>
                                <Text style={styles.secondaryButtonText}>Create account</Text>
                            </Pressable>

                            <Pressable onPress={() => router.replace("/")}>
                                <Text style={styles.skipText}>Continue without account</Text>
                            </Pressable>
                        </View>
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
        width: "100%",
    },
    backText: {
        color: "#94a3b8",
        fontSize: 14,
        fontWeight: "800",
        marginBottom: 18,
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
        maxWidth: "100%",
    },
    formCard: {
        width: "100%",
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "#1e293b",
        borderRadius: 22,
        padding: 14,
    },
    form: {
        width: "100%",
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
    secondaryButton: {
        width: "100%",
        backgroundColor: "#111827",
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    secondaryButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "900",
    },
    skipText: {
        color: "#94a3b8",
        textAlign: "center",
        fontSize: 14,
        fontWeight: "800",
        marginTop: 8,
    },
});