import { supabase } from "@/src/lib/supabase";

export type PlayerStats = {
    profile_id: string;

    matches_played: number;
    matches_won: number;
    matches_lost: number;

    legs_played: number;
    legs_won: number;

    highest_checkout: number;
    highest_score: number;

    total_score: number;
    total_turns: number;

    created_at: string;
    updated_at: string;
};

export async function getCurrentUserStats() {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            stats: null,
            error: "Not logged in.",
        };
    }

    return getPlayerStats(user.id);
}

export async function getPlayerStats(profileId: string) {
    const { data, error } = await supabase
        .from("player_stats")
        .select("*")
        .eq("profile_id", profileId)
        .maybeSingle();

    if (error) {
        return {
            stats: null,
            error: error.message,
        };
    }

    return {
        stats: data as PlayerStats | null,
        error: null,
    };
}

export async function ensureCurrentUserStats() {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            stats: null,
            error: "Not logged in.",
        };
    }

    const existing = await getPlayerStats(user.id);

    if (existing.error) {
        return existing;
    }

    if (existing.stats) {
        return existing;
    }

    const { data, error } = await supabase
        .from("player_stats")
        .insert({
            profile_id: user.id,
        })
        .select("*")
        .single();

    if (error) {
        return {
            stats: null,
            error: error.message,
        };
    }

    return {
        stats: data as PlayerStats,
        error: null,
    };
}

export async function updateCurrentUserStatsAfterTurn(options: {
    score: number;
    checkout: boolean;
}) {
    const ensured = await ensureCurrentUserStats();

    if (ensured.error || !ensured.stats) {
        return {
            error: ensured.error ?? "Stats could not be loaded.",
        };
    }

    const stats = ensured.stats;

    const nextHighestScore = Math.max(stats.highest_score, options.score);
    const nextHighestCheckout = options.checkout
        ? Math.max(stats.highest_checkout, options.score)
        : stats.highest_checkout;

    const { error } = await supabase
        .from("player_stats")
        .update({
            highest_score: nextHighestScore,
            highest_checkout: nextHighestCheckout,
            total_score: stats.total_score + options.score,
            total_turns: stats.total_turns + 1,
            updated_at: new Date().toISOString(),
        })
        .eq("profile_id", stats.profile_id);

    return {
        error: error?.message ?? null,
    };
}

export async function updateCurrentUserStatsAfterMatch(options: {
    won: boolean;
}) {
    const ensured = await ensureCurrentUserStats();

    if (ensured.error || !ensured.stats) {
        return {
            error: ensured.error ?? "Stats could not be loaded.",
        };
    }

    const stats = ensured.stats;

    const { error } = await supabase
        .from("player_stats")
        .update({
            matches_played: stats.matches_played + 1,
            matches_won: stats.matches_won + (options.won ? 1 : 0),
            matches_lost: stats.matches_lost + (options.won ? 0 : 1),
            legs_played: stats.legs_played + 1,
            legs_won: stats.legs_won + (options.won ? 1 : 0),
            updated_at: new Date().toISOString(),
        })
        .eq("profile_id", stats.profile_id);

    return {
        error: error?.message ?? null,
    };
}