import { applyTurn } from "@/src/lib/dartsScoring";
import { supabase } from "@/src/lib/supabase";

export type MatchRoom = {
    id: string;
    created_by: string;
    opponent_id: string;
    game_title: string;
    starting_score: number;
    double_out: boolean;
    status: "pending" | "active" | "finished";
    current_player_id: string | null;
    winner_id: string | null;
    created_at: string;
    updated_at: string;
};

export type MatchRoomPlayer = {
    id: string;
    match_room_id: string;
    profile_id: string;
    username: string;
    player_order: number;
    remaining: number;
};

export type MatchRoomTurn = {
    id: string;
    match_room_id: string;
    profile_id: string;
    username: string;
    score: number;
    remaining_before: number;
    remaining_after: number;
    bust: boolean;
    checkout: boolean;
    created_at: string;
};

export async function getMatchRoomState(matchRoomId: string) {
    const { data: room, error: roomError } = await supabase
        .from("match_rooms")
        .select("*")
        .eq("id", matchRoomId)
        .single();

    if (roomError) {
        return {
            room: null,
            players: [] as MatchRoomPlayer[],
            turns: [] as MatchRoomTurn[],
            error: roomError.message,
        };
    }

    const { data: players, error: playersError } = await supabase
        .from("match_room_players")
        .select("*")
        .eq("match_room_id", matchRoomId)
        .order("player_order", { ascending: true });

    if (playersError) {
        return {
            room: null,
            players: [] as MatchRoomPlayer[],
            turns: [] as MatchRoomTurn[],
            error: playersError.message,
        };
    }

    const { data: turns, error: turnsError } = await supabase
        .from("match_room_turns")
        .select("*")
        .eq("match_room_id", matchRoomId)
        .order("created_at", { ascending: false })
        .limit(10);

    if (turnsError) {
        return {
            room: null,
            players: [] as MatchRoomPlayer[],
            turns: [] as MatchRoomTurn[],
            error: turnsError.message,
        };
    }

    return {
        room: room as MatchRoom,
        players: players as MatchRoomPlayer[],
        turns: turns as MatchRoomTurn[],
        error: null,
    };
}

export async function submitMatchRoomScore(matchRoomId: string, score: number) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            turn: null,
            error: "Not logged in.",
        };
    }

    const state = await getMatchRoomState(matchRoomId);

    if (state.error || !state.room) {
        return {
            turn: null,
            error: state.error ?? "Match room not found.",
        };
    }

    if (state.room.status === "finished") {
        return {
            turn: null,
            error: "This match is already finished.",
        };
    }

    if (state.room.current_player_id !== user.id) {
        return {
            turn: null,
            error: "It is not your turn.",
        };
    }

    const currentPlayer = state.players.find(
        (player) => player.profile_id === user.id
    );

    if (!currentPlayer) {
        return {
            turn: null,
            error: "You are not a player in this match.",
        };
    }

    const nextPlayer = state.players.find(
        (player) => player.profile_id !== user.id
    );

    const result = applyTurn(currentPlayer.remaining, score, {
        doubleOut: state.room.double_out,
    });

    if (result.error) {
        return {
            turn: null,
            error: result.error,
        };
    }

    const { data: insertedTurn, error: turnError } = await supabase
        .from("match_room_turns")
        .insert({
            match_room_id: matchRoomId,
            profile_id: user.id,
            username: currentPlayer.username,
            score,
            remaining_before: currentPlayer.remaining,
            remaining_after: result.remainingAfter,
            bust: result.bust,
            checkout: result.checkout,
        })
        .select("*")
        .single();

    if (turnError) {
        return {
            turn: null,
            error: turnError.message,
        };
    }

    if (!result.bust) {
        const { error: playerUpdateError } = await supabase
            .from("match_room_players")
            .update({
                remaining: result.remainingAfter,
            })
            .eq("id", currentPlayer.id);

        if (playerUpdateError) {
            return {
                turn: null,
                error: playerUpdateError.message,
            };
        }
    }

    const { error: roomUpdateError } = await supabase
        .from("match_rooms")
        .update({
            status: result.checkout ? "finished" : state.room.status,
            winner_id: result.checkout ? user.id : null,
            current_player_id: result.checkout
                ? user.id
                : nextPlayer?.profile_id ?? user.id,
            updated_at: new Date().toISOString(),
        })
        .eq("id", matchRoomId);

    if (roomUpdateError) {
        return {
            turn: null,
            error: roomUpdateError.message,
        };
    }

    return {
        turn: insertedTurn as MatchRoomTurn,
        error: null,
    };
}