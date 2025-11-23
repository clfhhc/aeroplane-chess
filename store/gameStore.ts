import { create } from 'zustand';
import { Player, PlayerColor, Piece, LogEntry } from '../types';
import { PLAYER_ORDER, START_INDICES, GATEWAY_INDICES, TRACK_LENGTH, SHORTCUTS } from '../constants';
import { TRACK_COORDS, getShortcutPath, getHomeCoordinates } from '../utils/boardUtils';

interface GameState {
    gameStatus: 'setup' | 'playing' | 'finished';
    winner: Player | null;
    players: Player[];
    currentPlayerIndex: number;
    diceValue: number | null;
    turnState: 'rolling' | 'moving' | 'resolving' | 'finished';
    logs: LogEntry[];
    highlightedPieceId: number | null;

    consecutiveSixes: number;
    movedPieceIds: number[];
    turnId: string; // Unique ID for the current roll to prevent double-execution

    startGame: (selectedColors: PlayerColor[]) => void;
    rollDice: () => void;
    movePiece: (pieceId: number) => void;
    skipTurn: () => void;
    resetGame: () => void;
    setHighlightedPiece: (id: number | null) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    gameStatus: 'setup',
    winner: null,
    players: [],
    currentPlayerIndex: 0,
    diceValue: null,
    turnState: 'rolling',
    logs: [],
    highlightedPieceId: null,
    consecutiveSixes: 0,
    movedPieceIds: [],
    turnId: '',

    startGame: (selectedColors: PlayerColor[]) => {
        const sortedColors = PLAYER_ORDER.filter(c => selectedColors.includes(c));

        const newPlayers: Player[] = sortedColors.map((color, idx) => ({
            id: idx,
            color,
            name: color.charAt(0).toUpperCase() + color.slice(1),
            pieces: [0, 1, 2, 3].map((pid) => ({ id: pid, position: -1, state: 'base' })),
        }));

        set({
            gameStatus: 'playing',
            winner: null,
            players: newPlayers,
            currentPlayerIndex: 0,
            diceValue: null,
            turnState: 'rolling',
            consecutiveSixes: 0,
            movedPieceIds: [],
            turnId: Math.random().toString(36),
            logs: [{ turn: 0, text: "Mission Started!", playerColor: sortedColors[0] }]
        });
    },

    setHighlightedPiece: (id) => set({ highlightedPieceId: id }),

    rollDice: () => {
        const { turnState, currentPlayerIndex, players, consecutiveSixes, movedPieceIds } = get();

        // STRICT LOCK: Only allow rolling if state is explicitly 'rolling'
        if (turnState !== 'rolling') return;

        const roll = Math.floor(Math.random() * 6) + 1;
        const currentPlayer = players[currentPlayerIndex];
        let newConsecutiveSixes = consecutiveSixes;
        const newTurnId = Math.random().toString(36);

        if (roll === 6) {
            newConsecutiveSixes += 1;
            if (newConsecutiveSixes === 3) {
                const newPlayers = JSON.parse(JSON.stringify(players));
                const activePlayer = newPlayers[currentPlayerIndex];
                const uniqueMovedIds = [...new Set(movedPieceIds)];

                uniqueMovedIds.forEach((id: number) => {
                    const p = activePlayer.pieces.find((piece: Piece) => piece.id === id);
                    if (p && p.state !== 'finished') {
                        p.state = 'base';
                        p.position = -1;
                    }
                });

                const msg = "Three consecutive 6s! Engines overheated! Pieces returned to hangar.";
                const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

                // Transition with delay to prevent confusion/accidental clicks
                set({
                    diceValue: roll,
                    players: newPlayers,
                    turnState: 'resolving', // Lock input
                    consecutiveSixes: 0,
                    movedPieceIds: [],
                    turnId: newTurnId, // Invalidates previous turn
                    logs: [{ turn: get().logs.length + 1, text: msg, playerColor: currentPlayer.color }, ...get().logs]
                });

                setTimeout(() => {
                    set({
                        turnState: 'rolling',
                        currentPlayerIndex: nextPlayerIndex,
                        diceValue: null
                    });
                }, 1500);
                return;
            }
        } else {
            // Reset streaks if not a 6 (though logic handles reset on turn change usually)
            // Actually, streak persists *during* the turn if 6s are rolled. 
            // If < 6, it's the last move of the turn anyway.
        }

        const canMove = currentPlayer.pieces.some(p => {
            if (p.state === 'base') return roll === 6;
            if (p.state === 'launched') return true;
            if (p.state === 'active') return true;
            if (p.state === 'home') return true;
            return false;
        });

        const logText = roll === 6 && newConsecutiveSixes > 0
            ? `${currentPlayer.name} rolled a 6! (Streak: ${newConsecutiveSixes})`
            : `${currentPlayer.name} rolled ${roll}`;

        const newLogs = [
            { turn: get().logs.length + 1, text: logText, playerColor: currentPlayer.color },
            ...get().logs
        ];

        // If can't move, lock UI in 'resolving' then auto-skip
        if (!canMove) {
            set({
                diceValue: roll,
                logs: newLogs,
                consecutiveSixes: newConsecutiveSixes,
                turnState: 'resolving',
                turnId: newTurnId
            });
            setTimeout(() => {
                get().skipTurn();
            }, 1000);
        } else {
            set({
                diceValue: roll,
                logs: newLogs,
                consecutiveSixes: newConsecutiveSixes,
                turnState: 'moving',
                turnId: newTurnId
            });
        }
    },

    movePiece: (pieceId: number) => {
        const { diceValue, currentPlayerIndex, players, logs, consecutiveSixes, movedPieceIds, turnId } = get();

        // CRITICAL FIX: Check turnState AND ensure diceValue exists.
        // The turnId check isn't strictly necessary if state logic is perfect, but helps with race conditions.
        if (!diceValue || get().turnState !== 'moving') return;

        // Invalidate turn immediately to prevent double-clicks on stacked pieces
        set({ turnState: 'resolving' });

        const newPlayers = JSON.parse(JSON.stringify(players));
        const player = newPlayers[currentPlayerIndex];
        const piece = player.pieces.find((p: Piece) => p.id === pieceId);

        if (!piece) return;

        let msg = "";
        const isSix = diceValue === 6;

        // --- MOVEMENT LOGIC ---
        // 1. Launching
        if (piece.state === 'base') {
            if (diceValue === 6) {
                piece.state = 'launched';
                piece.position = -1;
                msg = "Ready to Launch!";
            } else {
                return; // Should not happen due to validation
            }
        }
        // 2. Launched -> Active
        else if (piece.state === 'launched') {
            const startIndex = START_INDICES[player.color];
            const targetIndex = (startIndex + diceValue - 1) % TRACK_LENGTH;

            piece.state = 'active';
            piece.position = targetIndex;
            msg = `Launched to Track!`;

            let collision = false;
            newPlayers.forEach((p: Player, pIdx: number) => {
                if (pIdx !== currentPlayerIndex) {
                    p.pieces.forEach((enemy: Piece) => {
                        if (enemy.state === 'active' && enemy.position === piece.position) {
                            enemy.state = 'base';
                            enemy.position = -1;
                            msg += ` Hit & Captured ${p.name}!`;
                            collision = true;
                        }
                    });
                }
            });

            if (!collision) {
                const landedTile = TRACK_COORDS[piece.position];
                if (landedTile.color === player.color) {
                    piece.position = (piece.position + 4) % TRACK_LENGTH;
                    msg += " + Jump!";

                    // Check collision after jump
                    newPlayers.forEach((p: Player, pIdx: number) => {
                        if (pIdx !== currentPlayerIndex) {
                            p.pieces.forEach((enemy: Piece) => {
                                if (enemy.state === 'active' && enemy.position === piece.position) {
                                    enemy.state = 'base';
                                    enemy.position = -1;
                                    msg += ` Hit & Captured ${p.name} after jump!`;
                                }
                            });
                        }
                    });
                }
            }
        }
        // 3. Active Track
        else if (piece.state === 'active') {
            const currentPos = piece.position;
            const gateway = GATEWAY_INDICES[player.color];

            let distToGateway = (gateway - currentPos + TRACK_LENGTH) % TRACK_LENGTH;

            if (diceValue > distToGateway) {
                const homeSteps = diceValue - distToGateway - 1;
                if (homeSteps === 5) {
                    piece.state = 'finished';
                    piece.position = 200;
                    msg = "Direct Hit! Mission Accomplished!";
                } else if (homeSteps < 5) {
                    piece.state = 'home';
                    piece.position = 100 + homeSteps;
                    msg = "Entered Final Stretch!";
                    if (homeSteps === 4) msg += " 1 step to win!";
                } else {
                    const overflow = homeSteps - 5;
                    piece.state = 'home';
                    piece.position = 100 + (5 - overflow);
                    msg = "Overshot & Bounced!";
                }
            } else {
                piece.position = (currentPos + diceValue) % TRACK_LENGTH;
                msg = `Moved ${diceValue}.`;

                // Collision Check 1
                let collision = false;
                newPlayers.forEach((p: Player, pIdx: number) => {
                    if (pIdx !== currentPlayerIndex) {
                        p.pieces.forEach((enemy: Piece) => {
                            if (enemy.state === 'active' && enemy.position === piece.position) {
                                enemy.state = 'base';
                                enemy.position = -1;
                                msg += ` Hit & Captured ${p.name}!`;
                                collision = true;
                            }
                        });
                    }
                });

                // Jump Logic (Only if NO collision)
                if (!collision) {
                    const landedTile = TRACK_COORDS[piece.position];
                    const isGateway = piece.position === GATEWAY_INDICES[player.color];

                    if (landedTile.color === player.color && !isGateway) {
                        const shortcut = SHORTCUTS[player.color];

                        if (piece.position === shortcut.start) {
                            const flyPath = getShortcutPath(player.color);
                            // Collision on flight path
                            newPlayers.forEach((opp: Player) => {
                                if (opp.id === player.id) return;
                                const oppHomeCoords = getHomeCoordinates(opp.color);
                                opp.pieces.forEach((oppPiece: Piece) => {
                                    if (oppPiece.state === 'home') {
                                        const homeIdx = oppPiece.position - 100;
                                        if (oppHomeCoords[homeIdx]) {
                                            const pCoord = oppHomeCoords[homeIdx];
                                            if (flyPath.some(fc => fc.x === pCoord.x && fc.y === pCoord.y)) {
                                                oppPiece.state = 'base';
                                                oppPiece.position = -1;
                                                msg += ` Crashed ${opp.name}!`;
                                            }
                                        }
                                    }
                                });
                            });
                            piece.position = shortcut.end;
                            msg += " SHORTCUT!";

                            // Collision after shortcut
                            newPlayers.forEach((p: Player, pIdx: number) => {
                                if (pIdx !== currentPlayerIndex) {
                                    p.pieces.forEach((enemy: Piece) => {
                                        if (enemy.state === 'active' && enemy.position === piece.position) {
                                            enemy.state = 'base';
                                            enemy.position = -1;
                                            msg += ` Hit & Captured ${p.name}!`;
                                        }
                                    });
                                }
                            });
                        } else {
                            piece.position = (piece.position + 4) % TRACK_LENGTH;
                            msg += " Jumped +4!";

                            // Collision after regular jump
                            newPlayers.forEach((p: Player, pIdx: number) => {
                                if (pIdx !== currentPlayerIndex) {
                                    p.pieces.forEach((enemy: Piece) => {
                                        if (enemy.state === 'active' && enemy.position === piece.position) {
                                            enemy.state = 'base';
                                            enemy.position = -1;
                                            msg += ` Hit & Captured ${p.name}!`;
                                        }
                                    });
                                }
                            });

                            // Chain Shortcut if jump lands on it
                            if (piece.position === shortcut.start) {
                                const flyPath = getShortcutPath(player.color);
                                // Collision on flight path
                                newPlayers.forEach((opp: Player) => {
                                    if (opp.id === player.id) return;
                                    const oppHomeCoords = getHomeCoordinates(opp.color);
                                    opp.pieces.forEach((oppPiece: Piece) => {
                                        if (oppPiece.state === 'home') {
                                            const homeIdx = oppPiece.position - 100;
                                            if (oppHomeCoords[homeIdx]) {
                                                const pCoord = oppHomeCoords[homeIdx];
                                                if (flyPath.some(fc => fc.x === pCoord.x && fc.y === pCoord.y)) {
                                                    oppPiece.state = 'base';
                                                    oppPiece.position = -1;
                                                    msg += ` Crashed ${opp.name}!`;
                                                }
                                            }
                                        }
                                    });
                                });

                                piece.position = shortcut.end;
                                msg += " + SHORTCUT!";
                                newPlayers.forEach((p: Player, pIdx: number) => {
                                    if (pIdx !== currentPlayerIndex) {
                                        p.pieces.forEach((enemy: Piece) => {
                                            if (enemy.state === 'active' && enemy.position === piece.position) {
                                                enemy.state = 'base';
                                                enemy.position = -1;
                                                msg += ` Hit & Captured ${p.name}!`;
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    } else if (isGateway) {
                        msg += " (Ready for Home)";
                    }
                }
            }
        }
        // 4. Home Stretch
        else if (piece.state === 'home') {
            const currentProgress = piece.position - 100;
            const target = currentProgress + diceValue;

            if (target === 5) {
                piece.state = 'finished';
                piece.position = 200;
                msg = "Docked at Center!";
            } else if (target < 5) {
                piece.position = 100 + target;
                msg = "Approaching center...";
                if (target === 4) {
                    msg += " 1 step to win!";
                }
            } else {
                const overflow = target - 5;
                piece.position = 100 + (5 - overflow);
                msg = "Bounced back!";
            }
        }

        // Collision Check Final (Catch-all)
        if (piece.state === 'active') {
            newPlayers.forEach((p: Player, pIdx: number) => {
                if (pIdx !== currentPlayerIndex) {
                    p.pieces.forEach((enemy: Piece) => {
                        if (enemy.state === 'active' && enemy.position === piece.position) {
                            enemy.state = 'base';
                            enemy.position = -1;
                            msg += ` Hit ${p.name}!`;
                        }
                    });
                }
            });
        }

        const hasWon = player.pieces.every((p: Piece) => p.state === 'finished');

        let nextTurnState: 'rolling' | 'moving' | 'resolving' | 'finished' = 'rolling';
        let nextPlayerIndex = currentPlayerIndex;
        let nextConsecutiveSixes = 0;
        let nextMovedPieceIds: number[] = [];

        if (hasWon) {
            nextTurnState = 'finished';
            set({
                players: newPlayers,
                winner: player,
                turnState: nextTurnState,
                diceValue: null,
                logs: [{ turn: get().logs.length + 1, text: msg, playerColor: player.color }, ...logs]
            });
        } else {
            if (isSix) {
                nextTurnState = 'rolling';
                nextPlayerIndex = currentPlayerIndex;
                nextConsecutiveSixes = consecutiveSixes;
                nextMovedPieceIds = [...movedPieceIds, pieceId];
                msg += " Bonus Roll!";

                set({
                    players: newPlayers,
                    winner: null,
                    turnState: nextTurnState,
                    diceValue: null,
                    currentPlayerIndex: nextPlayerIndex,
                    consecutiveSixes: nextConsecutiveSixes,
                    movedPieceIds: nextMovedPieceIds,
                    // New Turn ID for the bonus roll
                    turnId: Math.random().toString(36),
                    logs: [{ turn: get().logs.length + 1, text: msg, playerColor: player.color }, ...logs]
                });
            } else {
                // End Turn with delay
                nextPlayerIndex = (currentPlayerIndex + 1) % newPlayers.length;

                set({
                    players: newPlayers,
                    diceValue: null,
                    turnState: 'resolving',
                    logs: [{ turn: get().logs.length + 1, text: msg, playerColor: player.color }, ...logs],
                    highlightedPieceId: null
                });

                setTimeout(() => {
                    set({
                        turnState: 'rolling',
                        currentPlayerIndex: nextPlayerIndex,
                        consecutiveSixes: 0,
                        movedPieceIds: [],
                        turnId: Math.random().toString(36) // Ready for next player
                    });
                }, 800);
            }
        }
    },

    skipTurn: () => {
        const { players, currentPlayerIndex, diceValue, consecutiveSixes, logs } = get();

        let nextPlayerIndex = currentPlayerIndex;
        let nextConsecutiveSixes = 0;
        let nextMovedPieceIds: number[] = [];
        let msg = "Skipped.";
        let logColor = players[currentPlayerIndex].color;

        if (diceValue === 6) {
            msg = "No moves, but rolled 6! Roll again.";
            nextPlayerIndex = currentPlayerIndex;
            nextConsecutiveSixes = consecutiveSixes;
            nextMovedPieceIds = get().movedPieceIds;

            set({
                turnState: 'rolling',
                diceValue: null,
                currentPlayerIndex: nextPlayerIndex,
                consecutiveSixes: nextConsecutiveSixes,
                movedPieceIds: nextMovedPieceIds,
                turnId: Math.random().toString(36),
                logs: [{ turn: logs.length + 1, text: msg, playerColor: logColor }, ...logs]
            });
        } else {
            msg = "Skipped.";
            nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

            set({
                turnState: 'resolving',
                diceValue: null,
                logs: [{ turn: logs.length + 1, text: msg, playerColor: logColor }, ...logs]
            });

            setTimeout(() => {
                set({
                    turnState: 'rolling',
                    currentPlayerIndex: nextPlayerIndex,
                    consecutiveSixes: 0,
                    movedPieceIds: [],
                    turnId: Math.random().toString(36)
                });
            }, 800);
        }
    },

    resetGame: () => set({
        gameStatus: 'setup',
        winner: null,
        players: [],
        logs: [],
        turnState: 'rolling',
        currentPlayerIndex: 0,
        consecutiveSixes: 0,
        movedPieceIds: [],
        turnId: ''
    }),
}));