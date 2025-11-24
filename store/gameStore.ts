import { createStore } from 'solid-js/store';
import { batch } from 'solid-js';
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
    turnId: string;
}

const initialState: GameState = {
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
};

export const [gameStore, setGameStore] = createStore<GameState>(initialState);

export const gameActions = {
    startGame: (selectedColors: PlayerColor[]) => {
        const sortedColors = PLAYER_ORDER.filter(c => selectedColors.includes(c));

        const newPlayers: Player[] = sortedColors.map((color, idx) => ({
            id: idx,
            color,
            name: color.charAt(0).toUpperCase() + color.slice(1),
            pieces: [0, 1, 2, 3].map((pid) => ({ id: pid, position: -1, state: 'base' as const })),
        }));

        batch(() => {
            setGameStore({
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
        });
    },

    setHighlightedPiece: (id: number | null) => {
        setGameStore('highlightedPieceId', id);
    },

    rollDice: () => {
        if (gameStore.turnState !== 'rolling') return;

        const roll = Math.floor(Math.random() * 6) + 1;
        const currentPlayer = gameStore.players[gameStore.currentPlayerIndex];
        let newConsecutiveSixes = gameStore.consecutiveSixes;
        const newTurnId = Math.random().toString(36);

        if (roll === 6) {
            newConsecutiveSixes += 1;
            if (newConsecutiveSixes === 3) {
                const newPlayers = JSON.parse(JSON.stringify(gameStore.players));
                const activePlayer = newPlayers[gameStore.currentPlayerIndex];
                const uniqueMovedIds = [...new Set(gameStore.movedPieceIds)];

                uniqueMovedIds.forEach((id: number) => {
                    const p = activePlayer.pieces.find((piece: Piece) => piece.id === id);
                    if (p && p.state !== 'finished') {
                        p.state = 'base';
                        p.position = -1;
                    }
                });

                const msg = "Three consecutive 6s! Engines overheated! Pieces returned to hangar.";
                const nextPlayerIndex = (gameStore.currentPlayerIndex + 1) % gameStore.players.length;

                batch(() => {
                    setGameStore({
                        diceValue: roll,
                        players: newPlayers,
                        turnState: 'resolving',
                        consecutiveSixes: 0,
                        movedPieceIds: [],
                        turnId: newTurnId,
                        logs: [{ turn: gameStore.logs.length + 1, text: msg, playerColor: currentPlayer.color }, ...gameStore.logs]
                    });
                });

                setTimeout(() => {
                    batch(() => {
                        setGameStore({
                            turnState: 'rolling',
                            currentPlayerIndex: nextPlayerIndex,
                            diceValue: null
                        });
                    });
                }, 800);
                return;
            }
        }

        const canMove = currentPlayer.pieces.some(p => {
            if (p.state === 'finished') return false;
            if (p.state === 'base') return roll === 6;
            return true; // launched, active, or home pieces can always move
        });

        const logText = roll === 6 && newConsecutiveSixes > 0
            ? `${currentPlayer.name} rolled a 6! (Streak: ${newConsecutiveSixes})`
            : `${currentPlayer.name} rolled ${roll}`;

        const newLogs = [
            { turn: gameStore.logs.length + 1, text: logText, playerColor: currentPlayer.color },
            ...gameStore.logs
        ];

        if (!canMove) {
            batch(() => {
                setGameStore({
                    diceValue: roll,
                    logs: newLogs,
                    consecutiveSixes: newConsecutiveSixes,
                    turnState: 'resolving',
                    turnId: newTurnId
                });
            });
            setTimeout(() => {
                gameActions.skipTurn();
            }, 1000);
        } else {
            batch(() => {
                setGameStore({
                    diceValue: roll,
                    logs: newLogs,
                    consecutiveSixes: newConsecutiveSixes,
                    turnState: 'moving',
                    turnId: newTurnId
                });
            });
        }
    },

    movePiece: (pieceId: number) => {
        if (!gameStore.diceValue || gameStore.turnState !== 'moving') return;

        const newPlayers = JSON.parse(JSON.stringify(gameStore.players));
        const player = newPlayers[gameStore.currentPlayerIndex];
        const piece = player.pieces.find((p: Piece) => p.id === pieceId);

        if (!piece) return;

        let msg = "";
        const isSix = gameStore.diceValue === 6;
        const diceValue = gameStore.diceValue;

        if (piece.state === 'base') {
            if (diceValue === 6) {
                piece.state = 'launched';
                piece.position = -1;
                msg = "Ready to Launch!";
            } else {
                return;
            }
        }
        else if (piece.state === 'launched') {
            const startIndex = START_INDICES[player.color];
            const targetIndex = (startIndex + diceValue - 1) % TRACK_LENGTH;

            piece.state = 'active';
            piece.position = targetIndex;
            msg = `Launched to Track!`;

            let collision = false;
            newPlayers.forEach((p: Player, pIdx: number) => {
                if (pIdx !== gameStore.currentPlayerIndex) {
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

                    newPlayers.forEach((p: Player, pIdx: number) => {
                        if (pIdx !== gameStore.currentPlayerIndex) {
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

                let collision = false;
                newPlayers.forEach((p: Player, pIdx: number) => {
                    if (pIdx !== gameStore.currentPlayerIndex) {
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
                    const isGateway = piece.position === GATEWAY_INDICES[player.color];

                    if (landedTile.color === player.color && !isGateway) {
                        const shortcut = SHORTCUTS[player.color];

                        if (piece.position === shortcut.start) {
                            const flyPath = getShortcutPath(player.color);
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

                            newPlayers.forEach((p: Player, pIdx: number) => {
                                if (pIdx !== gameStore.currentPlayerIndex) {
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

                            newPlayers.forEach((p: Player, pIdx: number) => {
                                if (pIdx !== gameStore.currentPlayerIndex) {
                                    p.pieces.forEach((enemy: Piece) => {
                                        if (enemy.state === 'active' && enemy.position === piece.position) {
                                            enemy.state = 'base';
                                            enemy.position = -1;
                                            msg += ` Hit & Captured ${p.name}!`;
                                        }
                                    });
                                }
                            });

                            if (piece.position === shortcut.start) {
                                const flyPath = getShortcutPath(player.color);
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
                                    if (pIdx !== gameStore.currentPlayerIndex) {
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

        if (piece.state === 'active') {
            newPlayers.forEach((p: Player, pIdx: number) => {
                if (pIdx !== gameStore.currentPlayerIndex) {
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

        if (hasWon) {
            batch(() => {
                setGameStore({
                    players: newPlayers,
                    winner: player,
                    turnState: 'finished',
                    diceValue: null,
                    logs: [{ turn: gameStore.logs.length + 1, text: msg, playerColor: player.color }, ...gameStore.logs]
                });
            });
        } else {
            if (isSix) {
                msg += " Bonus Roll!";

                batch(() => {
                    setGameStore({
                        players: newPlayers,
                        turnState: 'resolving',
                        movedPieceIds: [...gameStore.movedPieceIds, pieceId],
                        logs: [{ turn: gameStore.logs.length + 1, text: msg, playerColor: player.color }, ...gameStore.logs],
                        highlightedPieceId: null
                    });
                });

                setTimeout(() => {
                    batch(() => {
                        setGameStore({
                            turnState: 'rolling',
                            diceValue: null,
                            turnId: Math.random().toString(36)
                        });
                    });
                }, 500);
            } else {
                const nextPlayerIndex = (gameStore.currentPlayerIndex + 1) % newPlayers.length;

                batch(() => {
                    setGameStore({
                        players: newPlayers,
                        diceValue: null,
                        turnState: 'resolving',
                        logs: [{ turn: gameStore.logs.length + 1, text: msg, playerColor: player.color }, ...gameStore.logs],
                        highlightedPieceId: null
                    });
                });

                setTimeout(() => {
                    batch(() => {
                        setGameStore({
                            turnState: 'rolling',
                            currentPlayerIndex: nextPlayerIndex,
                            consecutiveSixes: 0,
                            movedPieceIds: [],
                            turnId: Math.random().toString(36)
                        });
                    });
                }, 500);
            }
        }
    },

    skipTurn: () => {
        let nextPlayerIndex = gameStore.currentPlayerIndex;
        let nextConsecutiveSixes = 0;
        let nextMovedPieceIds: number[] = [];
        let msg = "Skipped.";
        let logColor = gameStore.players[gameStore.currentPlayerIndex].color;

        if (gameStore.diceValue === 6) {
            msg = "No moves, but rolled 6! Roll again.";
            nextPlayerIndex = gameStore.currentPlayerIndex;
            nextConsecutiveSixes = gameStore.consecutiveSixes;
            nextMovedPieceIds = gameStore.movedPieceIds;

            batch(() => {
                setGameStore({
                    turnState: 'rolling',
                    diceValue: null,
                    currentPlayerIndex: nextPlayerIndex,
                    consecutiveSixes: nextConsecutiveSixes,
                    movedPieceIds: nextMovedPieceIds,
                    turnId: Math.random().toString(36),
                    logs: [{ turn: gameStore.logs.length + 1, text: msg, playerColor: logColor }, ...gameStore.logs]
                });
            });
        } else {
            msg = "Skipped.";
            nextPlayerIndex = (gameStore.currentPlayerIndex + 1) % gameStore.players.length;

            batch(() => {
                setGameStore({
                    turnState: 'resolving',
                    diceValue: null,
                    logs: [{ turn: gameStore.logs.length + 1, text: msg, playerColor: logColor }, ...gameStore.logs]
                });
            });

            setTimeout(() => {
                batch(() => {
                    setGameStore({
                        turnState: 'rolling',
                        currentPlayerIndex: nextPlayerIndex,
                        consecutiveSixes: 0,
                        movedPieceIds: [],
                        turnId: Math.random().toString(36)
                    });
                });
            }, 500);
        }
    },

    resetGame: () => {
        batch(() => {
            setGameStore({
                gameStatus: 'setup',
                winner: null,
                players: [],
                logs: [],
                turnState: 'rolling',
                currentPlayerIndex: 0,
                consecutiveSixes: 0,
                movedPieceIds: [],
                turnId: ''
            });
        });
    },
};