import { supabase } from "@/src/lib/supabase";
import type { Player, Turn } from "@/src/types/darts";
import type {
    MatchRoom,
    MatchRoomPlayer,
    MatchRoomTurn,
} from "@/src/lib/matchRoomsDatabase";

export type MatchType = "solo" | "local-two" | "local-friend" | "remote";

export type MatchResult = {
    id: string;
    match_room_id: string | null;
    game_title: string;
    starting_score: number;
    double_in: boolean;
    double_out: boolean;
    match_type: MatchType;
    winner_id: string | null;
    created_by: string | null;
    created_at: string;
};

export type MatchResultPlayer = {
    id: string;
    match_result_id: string;
    profile_id: string | null;
    username: string;
    opponent_id: string | null;
    opponent_username: string | null;
    player_order: number;
    won: boolean;
    final_remaining: number;
    total_score: number;
    total_turns: number;
    highest_score: number;
    highest_checkout: number;
    created_at: string;
};

export type HeadToHeadStats = {
    matchesPlayed: number;
    wins: number;
    losses: number;
    highestScore: number;
    highestCheckout: number;
    totalScore: number;
    totalTurns: number;
    averageScorePerTurn: number;
};

function getHighestScoreFromTurns(turns: Turn[], playerId: string) {
    return turns
        .filter((turn) => turn.playerId === playerId)
        .reduce((highest, turn) => Math.max(highest, turn.score), 0);
}

function getHighestCheckoutFromTurns(turns: Turn[], playerId: string) {
    return turns
        .filter((turn) => turn.playerId === playerId && turn.checkout)
        .reduce((highest, turn) => Math.max(highest, turn.score), 0);
}

function getTotalScoreFromTurns(turns: Turn[], playerId: string) {
    return turns
        .filter((turn) => turn.playerId === playerId && !turn.bust)
        .reduce((total, turn) => total + turn.score, 0);
}

function getTurnCount(turns: Turn[], playerId: string) {
    return turns.filter((turn) => turn.playerId === playerId).length;
}

function getRemoteHighestScoreFromTurns(
    turns: MatchRoomTurn[],
    profileId: string
) {
    return turns
        .filter((turn) => turn.profile_id === profileId)
        .reduce((highest, turn) => Math.max(highest, turn.score), 0);
}

function getRemoteHighestCheckoutFromTurns(
    turns: MatchRoomTurn[],
    profileId: string
) {
    return turns
        .filter((turn) => turn.profile_id === profileId && turn.checkout)
        .reduce((highest, turn) => Math.max(highest, turn.score), 0);
}

function getRemoteTotalScoreFromTurns(
    turns: MatchRoomTurn[],
    profileId: string
) {
    return turns
        .filter((turn) => turn.profile_id === profileId && !turn.bust)
        .reduce((total, turn) => total + turn.score, 0);
}

function getRemoteTurnCount(turns: MatchRoomTurn[], profileId: string) {
    return turns.filter((turn) => turn.profile_id === profileId).length;
}

export async function recordLocalX01MatchResult(options: {
    gameTitle: string;
    startingScore: number;
    doubleIn: boolean;
    doubleOut: boolean;
    matchType: Exclude<MatchType, "remote">;
    players: Player[];
    turns: Turn[];
    winnerPlayerId: string;
    playerOneProfileId?: string | null;
    playerTwoProfileId?: string | null;
}) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            result: null,
            error: "Not logged in.",
        };
    }

    const winner = options.players.find(
        (player) => player.id === options.winnerPlayerId
    );

    const winnerProfileId =
        options.winnerPlayerId === "player-1"
            ? options.playerOneProfileId ?? user.id
            : options.playerTwoProfileId ?? null;

    const { data: matchResult, error: matchResultError } = await supabase
        .from("match_results")
        .insert({
            game_title: options.gameTitle,
            starting_score: options.startingScore,
            double_in: options.doubleIn,
            double_out: options.doubleOut,
            match_type: options.matchType,
            winner_id: winnerProfileId,
            created_by: user.id,
        })
        .select("*")
        .single();

    if (matchResultError) {
        return {
            result: null,
            error: matchResultError.message,
        };
    }

    const playerRows = options.players.map((player, index) => {
        const opponent = options.players.find((other) => other.id !== player.id);

        const profileId =
            player.id === "player-1"
                ? options.playerOneProfileId ?? user.id
                : options.playerTwoProfileId ?? null;

        const opponentProfileId =
            opponent?.id === "player-1"
                ? options.playerOneProfileId ?? user.id
                : options.playerTwoProfileId ?? null;

        return {
            match_result_id: matchResult.id,
            profile_id: profileId,
            username: player.name,
            opponent_id: opponentProfileId,
            opponent_username: opponent?.name ?? null,
            player_order: index + 1,
            won: player.id === winner?.id,
            final_remaining: player.remaining,
            total_score: getTotalScoreFromTurns(options.turns, player.id),
            total_turns: getTurnCount(options.turns, player.id),
            highest_score: getHighestScoreFromTurns(options.turns, player.id),
            highest_checkout: getHighestCheckoutFromTurns(options.turns, player.id),
        };
    });

    const { error: playersError } = await supabase
        .from("match_result_players")
        .insert(playerRows);

    if (playersError) {
        return {
            result: null,
            error: playersError.message,
        };
    }

    return {
        result: matchResult as MatchResult,
        error: null,
    };
}

export async function recordRemoteMatchResult(options: {
    room: MatchRoom;
    players: MatchRoomPlayer[];
    turns: MatchRoomTurn[];
}) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            result: null,
            error: "Not logged in.",
        };
    }

    if (options.room.status !== "finished") {
        return {
            result: null,
            error: "This match is not finished yet.",
        };
    }

    const { data: existingResult } = await supabase
        .from("match_results")
        .select("*")
        .eq("match_room_id", options.room.id)
        .maybeSingle();

    if (existingResult) {
        return {
            result: existingResult as MatchResult,
            error: null,
        };
    }

    const { data: matchResult, error: matchResultError } = await supabase
        .from("match_results")
        .insert({
            match_room_id: options.room.id,
            game_title: options.room.game_title,
            starting_score: options.room.starting_score,
            double_in: false,
            double_out: options.room.double_out,
            match_type: "remote",
            winner_id: options.room.winner_id,
            created_by: user.id,
        })
        .select("*")
        .single();

    if (matchResultError) {
        return {
            result: null,
            error: matchResultError.message,
        };
    }

    const playerRows = options.players.map((player) => {
        const opponent = options.players.find(
            (other) => other.profile_id !== player.profile_id
        );

        return {
            match_result_id: matchResult.id,
            profile_id: player.profile_id,
            username: player.username,
            opponent_id: opponent?.profile_id ?? null,
            opponent_username: opponent?.username ?? null,
            player_order: player.player_order,
            won: player.profile_id === options.room.winner_id,
            final_remaining: player.remaining,
            total_score: getRemoteTotalScoreFromTurns(options.turns, player.profile_id),
            total_turns: getRemoteTurnCount(options.turns, player.profile_id),
            highest_score: getRemoteHighestScoreFromTurns(
                options.turns,
                player.profile_id
            ),
            highest_checkout: getRemoteHighestCheckoutFromTurns(
                options.turns,
                player.profile_id
            ),
        };
    });

    const { error: playersError } = await supabase
        .from("match_result_players")
        .insert(playerRows);

    if (playersError) {
        return {
            result: null,
            error: playersError.message,
        };
    }

    return {
        result: matchResult as MatchResult,
        error: null,
    };
}

export async function getHeadToHeadStats(friendProfileId: string) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            stats: null,
            error: "Not logged in.",
        };
    }

    const { data, error } = await supabase
        .from("match_result_players")
        .select(
            `
      id,
      won,
      total_score,
      total_turns,
      highest_score,
      highest_checkout
    `
        )
        .eq("profile_id", user.id)
        .eq("opponent_id", friendProfileId);

    if (error) {
        return {
            stats: null,
            error: error.message,
        };
    }

    const rows = data ?? [];

    const wins = rows.filter((row) => row.won).length;
    const losses = rows.filter((row) => !row.won).length;
    const totalScore = rows.reduce((total, row) => total + row.total_score, 0);
    const totalTurns = rows.reduce((total, row) => total + row.total_turns, 0);

    const stats: HeadToHeadStats = {
        matchesPlayed: rows.length,
        wins,
        losses,
        highestScore: rows.reduce(
            (highest, row) => Math.max(highest, row.highest_score),
            0
        ),
        highestCheckout: rows.reduce(
            (highest, row) => Math.max(highest, row.highest_checkout),
            0
        ),
        totalScore,
        totalTurns,
        averageScorePerTurn: totalTurns > 0 ? totalScore / totalTurns : 0,
    };

    return {
        stats,
        error: null,
    };
}

export async function getRecentMatchResults(limit = 10) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            matches: [],
            error: "Not logged in.",
        };
    }

    const { data, error } = await supabase
        .from("match_result_players")
        .select(
            `
      id,
      won,
      username,
      opponent_username,
      total_score,
      total_turns,
      highest_score,
      highest_checkout,
      created_at,
      match_results (
        id,
        game_title,
        starting_score,
        double_in,
        double_out,
        match_type,
        created_at
      )
    `
        )
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        return {
            matches: [],
            error: error.message,
        };
    }

    return {
        matches: data ?? [],
        error: null,
    };
}