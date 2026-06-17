import { supabase } from "@/src/lib/supabase";
import type { FriendProfile } from "@/src/lib/friendsDatabase";
import { getCurrentUserProfile } from "@/src/lib/profileDatabase";

export type MatchInviteStatus =
    | "pending"
    | "accepted"
    | "declined"
    | "cancelled";

export type MatchInvite = {
    id: string;
    sender_id: string;
    receiver_id: string;
    match_room_id: string | null;
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

async function getProfileById(profileId: string) {
    const { data, error } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", profileId)
        .single();

    if (error) {
        return {
            profile: null,
            error: error.message,
        };
    }

    return {
        profile: data as FriendProfile,
        error: null,
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

    const { profile: senderProfile, error: senderProfileError } =
        await getCurrentUserProfile();

    if (senderProfileError || !senderProfile) {
        return {
            invite: null,
            error: senderProfileError ?? "Your profile could not be found.",
        };
    }

    const { profile: receiverProfile, error: receiverProfileError } =
        await getProfileById(options.receiverId);

    if (receiverProfileError || !receiverProfile) {
        return {
            invite: null,
            error: receiverProfileError ?? "Friend profile could not be found.",
        };
    }

    const { data: room, error: roomError } = await supabase
        .from("match_rooms")
        .insert({
            created_by: user.id,
            opponent_id: options.receiverId,
            game_title: options.gameTitle,
            starting_score: options.startingScore,
            double_out: options.doubleOut,
            status: "pending",
            current_player_id: user.id,
        })
        .select("id")
        .single();

    if (roomError) {
        return {
            invite: null,
            error: roomError.message,
        };
    }

    const matchRoomId = room.id as string;

    const { error: playersError } = await supabase
        .from("match_room_players")
        .insert([
            {
                match_room_id: matchRoomId,
                profile_id: senderProfile.id,
                username: senderProfile.username,
                player_order: 1,
                remaining: options.startingScore,
            },
            {
                match_room_id: matchRoomId,
                profile_id: receiverProfile.id,
                username: receiverProfile.username,
                player_order: 2,
                remaining: options.startingScore,
            },
        ]);

    if (playersError) {
        return {
            invite: null,
            error: playersError.message,
        };
    }

    const { data, error } = await supabase
        .from("match_invites")
        .insert({
            sender_id: user.id,
            receiver_id: options.receiverId,
            match_room_id: matchRoomId,
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
      match_room_id,
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
      match_room_id,
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
             match_room_id,
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
        .in("status", ["pending", "accepted"])
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
      match_room_id,
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

    const invite = normalizeMatchInvite(data as RawMatchInvite);

    if (status === "accepted" && invite.match_room_id) {
        const { error: roomUpdateError } = await supabase
            .from("match_rooms")
            .update({
                status: "active",
                updated_at: new Date().toISOString(),
            })
            .eq("id", invite.match_room_id);

        if (roomUpdateError) {
            return {
                invite: null,
                error: roomUpdateError.message,
            };
        }
    }

    return {
        invite,
        error: null,
    };
}

export async function getMyMatchInvites() {
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
      match_room_id,
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
        .in("status", ["pending", "accepted"])
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