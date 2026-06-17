import { supabase } from "@/src/lib/supabase";

export type FriendProfile = {
    id: string;
    username: string;
};

export type FriendRequestStatus = "pending" | "accepted" | "declined";

export type FriendRequest = {
    id: string;
    sender_id: string;
    receiver_id: string;
    status: FriendRequestStatus;
    created_at: string;
    updated_at: string;
};

export type IncomingFriendRequest = FriendRequest & {
    sender: FriendProfile | null;
};

type SupabaseJoinedProfile = FriendProfile | FriendProfile[] | null;

type RawIncomingFriendRequest = FriendRequest & {
    sender?: SupabaseJoinedProfile;
};

type RawFriendRequestWithProfiles = FriendRequest & {
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

function normalizeIncomingFriendRequest(
    request: RawIncomingFriendRequest
): IncomingFriendRequest {
    return {
        ...request,
        sender: normalizeJoinedProfile(request.sender),
    };
}

export async function searchProfilesByUsername(query: string) {
    const cleanQuery = query.trim();

    if (cleanQuery.length < 2) {
        return {
            profiles: [] as FriendProfile[],
            error: null,
        };
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            profiles: [] as FriendProfile[],
            error: "Not logged in.",
        };
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", `%${cleanQuery}%`)
        .neq("id", user.id)
        .limit(10);

    if (error) {
        return {
            profiles: [] as FriendProfile[],
            error: error.message,
        };
    }

    return {
        profiles: data as FriendProfile[],
        error: null,
    };
}

export async function sendFriendRequest(receiverId: string) {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return {
            error: "Not logged in.",
        };
    }

    if (receiverId === user.id) {
        return {
            error: "You cannot add yourself.",
        };
    }

    const { error } = await supabase.from("friend_requests").insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: "pending",
    });

    if (error) {
        if (error.message.toLowerCase().includes("duplicate")) {
            return {
                error: "You already sent this user a friend request.",
            };
        }

        return {
            error: error.message,
        };
    }

    return {
        error: null,
    };
}

export async function getIncomingFriendRequests() {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            requests: [] as IncomingFriendRequest[],
            error: "Not logged in.",
        };
    }

    const { data, error } = await supabase
        .from("friend_requests")
        .select(
            `
      id,
      sender_id,
      receiver_id,
      status,
      created_at,
      updated_at,
      sender:profiles!friend_requests_sender_id_fkey (
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
            requests: [] as IncomingFriendRequest[],
            error: error.message,
        };
    }

    return {
        requests: ((data ?? []) as RawIncomingFriendRequest[]).map(
            normalizeIncomingFriendRequest
        ),
        error: null,
    };
}

export async function respondToFriendRequest(
    requestId: string,
    status: "accepted" | "declined"
) {
    const { error } = await supabase
        .from("friend_requests")
        .update({
            status,
            updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

    return {
        error: error?.message ?? null,
    };
}

export async function getFriends() {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            friends: [] as FriendProfile[],
            error: "Not logged in.",
        };
    }

    const { data, error } = await supabase
        .from("friend_requests")
        .select(
            `
      id,
      sender_id,
      receiver_id,
      status,
      created_at,
      updated_at,
      sender:profiles!friend_requests_sender_id_fkey (
        id,
        username
      ),
      receiver:profiles!friend_requests_receiver_id_fkey (
        id,
        username
      )
    `
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted");

    if (error) {
        return {
            friends: [] as FriendProfile[],
            error: error.message,
        };
    }

    const friends = ((data ?? []) as RawFriendRequestWithProfiles[])
        .map((request) => {
            if (request.sender_id === user.id) {
                return normalizeJoinedProfile(request.receiver);
            }

            return normalizeJoinedProfile(request.sender);
        })
        .filter((friend): friend is FriendProfile => Boolean(friend));

    return {
        friends,
        error: null,
    };
}