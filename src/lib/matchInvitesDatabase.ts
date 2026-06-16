import { supabase } from "@/src/lib/supabase";
import type { FriendProfile } from "@/src/lib/friendsDatabase";

export type MatchInviteStatus =
    | "pending"
    | "accepted"
    | "declined"
    | "cancelled";

export type MatchInvite = {
    id: string;
    sender_id: string;
    receiver_id: string;
    game_title: string;
    starting_score: number;
    double_out: boolean;
    status: MatchInviteStatus;
    created_at: string;
    updated_at: string;
    sender?: FriendProfile | null;
    receiver?: FriendProfile | null;
};

type SupabaseJoinedProfile = FriendProfile | FriendProfile[] | null;

type RawMatchInvite = Omit<MatchInvite, "sender" | "receiver"> & {
    sender?: SupabaseJoinedProfile;
    receiver?: SupabaseJoinedProfile;
};

function normalizeJoinedProfile(
    profile: SupabaseJoinedProfile | undefined
): FriendProfile | null {
    if (!profile) {
        return null;
    }

    if (Array.isArray(profile)) {
        return profile[0] ?? null;
    }

    return profile;
}

function normalizeMatchInvite(invite: RawMatchInvite): MatchInvite {
    return {
        ...invite,
        sender: normalizeJoinedProfile(invite.sender),
        receiver: normalizeJoinedProfile(invite.receiver),
    };
}

export async function sendMatchInvite(options: {
    receiverId: string;
    gameTitle: string;
    startingScore: number;
    doubleOut: boolean;
}) {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            invite: null,
            error: "Not logged in.",
        };
    }

    if (options.receiverId === user.id) {
        return {
            invite: null,
            error: "You cannot invite yourself.",
        };
    }

    const { data, error } = await supabase
        .from("match_invites")
        .insert({
            sender_id: user.id,
            receiver_id: options.receiverId,
            game_title: options.gameTitle,
            starting_score: options.startingScore,
            double_out: options.doubleOut,
            status: "pending",
        })
        .select(
            `
      id,
      sender_id,
      receiver_id,
      game_title,
      starting_score,
      double_out,
      status,
      created_at,
      updated_at
    `
        )
        .single();

    if (error) {
        return {
            invite: null,
            error: error.message,
        };
    }

    return {
        invite: normalizeMatchInvite(data as RawMatchInvite),
        error: null,
    };
}

export async function getIncomingMatchInvites() {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            invites: [] as MatchInvite[],
            error: "Not logged in.",
        };
    }

    const { data, error } = await supabase
        .from("match_invites")
        .select(
            `
      id,
      sender_id,
      receiver_id,
      game_title,
      starting_score,
      double_out,
      status,
      created_at,
      updated_at,
      sender:profiles!match_invites_sender_id_fkey (
        id,
        username
      )
    `
        )
        .eq("receiver_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    if (error) {
        return {
            invites: [] as MatchInvite[],
            error: error.message,
        };
    }

    return {
        invites: ((data ?? []) as RawMatchInvite[]).map(normalizeMatchInvite),
        error: null,
    };
}

export async function getOutgoingMatchInvites() {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            invites: [] as MatchInvite[],
            error: "Not logged in.",
        };
    }

    const { data, error } = await supabase
        .from("match_invites")
        .select(
            `
      id,
      sender_id,
      receiver_id,
      game_title,
      starting_score,
      double_out,
      status,
      created_at,
      updated_at,
      receiver:profiles!match_invites_receiver_id_fkey (
        id,
        username
      )
    `
        )
        .eq("sender_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    if (error) {
        return {
            invites: [] as MatchInvite[],
            error: error.message,
        };
    }

    return {
        invites: ((data ?? []) as RawMatchInvite[]).map(normalizeMatchInvite),
        error: null,
    };
}

export async function respondToMatchInvite(
    inviteId: string,
    status: "accepted" | "declined"
) {
    const { data, error } = await supabase
        .from("match_invites")
        .update({
            status,
            updated_at: new Date().toISOString(),
        })
        .eq("id", inviteId)
        .select(
            `
      id,
      sender_id,
      receiver_id,
      game_title,
      starting_score,
      double_out,
      status,
      created_at,
      updated_at
    `
        )
        .single();

    if (error) {
        return {
            invite: null,
            error: error.message,
        };
    }

    return {
        invite: normalizeMatchInvite(data as RawMatchInvite),
        error: null,
    };
}