import { supabase } from "@/src/lib/supabase";

export type UserProfile = {
    id: string;
    username: string;
    created_at: string;
};

export async function getCurrentUserProfile() {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            profile: null,
            error: "Not logged in.",
        };
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("id, username, created_at")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        return {
            profile: null,
            error: error.message,
        };
    }

    return {
        profile: data as UserProfile | null,
        error: null,
    };
}

export async function createCurrentUserProfile(username: string) {
    const cleanUsername = username.trim();

    if (cleanUsername.length < 3) {
        return {
            profile: null,
            error: "Username must be at least 3 characters.",
        };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        return {
            profile: null,
            error: "Username can only contain letters, numbers and underscores.",
        };
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            profile: null,
            error: "Not logged in.",
        };
    }

    const { data, error } = await supabase
        .from("profiles")
        .insert({
            id: user.id,
            username: cleanUsername,
        })
        .select("id, username, created_at")
        .single();

    if (error) {
        if (error.message.toLowerCase().includes("duplicate")) {
            return {
                profile: null,
                error: "That username is already taken.",
            };
        }

        return {
            profile: null,
            error: error.message,
        };
    }

    return {
        profile: data as UserProfile,
        error: null,
    };
}