import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, RefreshCw, Eye, Copy, Check, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
type EstimationCard = 0 | 1 | 2 | 3 | 5 | 8 | 13 | 21 | 34 | 55 | 89 | '?';
type Player = {
  id: string;
  name: string;
  estimate: EstimationCard | null;
  isOwner: boolean;
};
type Room = {
  id: string;
  players: Player[];
  revealed: boolean;
};
type AppState = 'home' | 'join' | 'room';
const FIBONACCI_CARDS: EstimationCard[] = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, '?'];

// @component: PlanningPokerApp
export const PlanningPokerApp = () => {
  const [appState, setAppState] = useState<AppState>('home');
  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    if (roomId) {
      setRoomIdInput(roomId);
      setAppState('join');
    }
  }, []);
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };
  const createRoom = () => {
    if (!nameInput.trim()) return;
    const roomId = generateRoomId();
    const player: Player = {
      id: Math.random().toString(36).substring(7),
      name: nameInput.trim(),
      estimate: null,
      isOwner: true
    };
    const newRoom: Room = {
      id: roomId,
      players: [player],
      revealed: false
    };
    setCurrentPlayer(player);
    setRoom(newRoom);
    setAppState('room');
    window.history.pushState({}, '', `?room=${roomId}`);
  };
  const joinRoom = () => {
    if (!nameInput.trim() || !roomIdInput.trim()) return;
    const player: Player = {
      id: Math.random().toString(36).substring(7),
      name: nameInput.trim(),
      estimate: null,
      isOwner: false
    };
    const newRoom: Room = {
      id: roomIdInput.trim().toUpperCase(),
      players: [player],
      revealed: false
    };
    setCurrentPlayer(player);
    setRoom(newRoom);
    setAppState('room');
  };
  const selectCard = (card: EstimationCard) => {
    if (!currentPlayer || !room) return;
    const updatedPlayer = {
      ...currentPlayer,
      estimate: card
    };
    setCurrentPlayer(updatedPlayer);
    const updatedPlayers = room.players.map(p => p.id === currentPlayer.id ? updatedPlayer : p);
    setRoom({
      ...room,
      players: updatedPlayers
    });
  };
  const revealEstimates = () => {
    if (!room || !currentPlayer?.isOwner) return;
    setRoom({
      ...room,
      revealed: true
    });
  };
  const resetEstimates = () => {
    if (!room || !currentPlayer?.isOwner) return;
    const resetPlayers = room.players.map(p => ({
      ...p,
      estimate: null
    }));
    setRoom({
      ...room,
      players: resetPlayers,
      revealed: false
    });
    if (currentPlayer) {
      setCurrentPlayer({
        ...currentPlayer,
        estimate: null
      });
    }
  };
  const copyRoomLink = async () => {
    if (!room) return;
    const link = `${window.location.origin}${window.location.pathname}?room=${room.id}`;
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy room link', error);
    }
  };
  const leaveRoom = () => {
    setRoom(null);
    setCurrentPlayer(null);
    setNameInput('');
    setRoomIdInput('');
    setAppState('home');
    window.history.pushState({}, '', window.location.pathname);
  };
  const getEstimateGroups = () => {
    if (!room) return [];
    const groups = new Map<EstimationCard | null, Player[]>();
    room.players.forEach(player => {
      const estimate = player.estimate;
      if (!groups.has(estimate)) {
        groups.set(estimate, []);
      }
      groups.get(estimate)?.push(player);
    });
    return Array.from(groups.entries()).sort((a, b) => {
      if (a[0] === null) return 1;
      if (b[0] === null) return -1;
      if (a[0] === '?') return 1;
      if (b[0] === '?') return -1;
      return (a[0] as number) - (b[0] as number);
    });
  };
  const allPlayersVoted = () => {
    return room?.players.every(p => p.estimate !== null) ?? false;
  };

  // @return
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {appState === 'home' && <motion.div key="home" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -20
      }} className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Planning Poker</h1>
                <p className="text-gray-600">Estimate together, decide faster</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input type="text" value={nameInput} onChange={e => setNameInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && createRoom()} placeholder="Enter your name" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                </div>

                <button onClick={createRoom} disabled={!nameInput.trim()} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                  Create Room
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <button onClick={() => setAppState('join')} className="w-full bg-white text-gray-700 py-3 rounded-lg font-semibold border-2 border-gray-300 hover:border-gray-400 transition-colors">
                  Join Existing Room
                </button>
              </div>
            </div>
          </motion.div>}

        {appState === 'join' && <motion.div key="join" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -20
      }} className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Room</h1>
                <p className="text-gray-600">Enter room details to join</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input type="text" value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="Enter your name" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Code
                  </label>
                  <input type="text" value={roomIdInput} onChange={e => setRoomIdInput(e.target.value.toUpperCase())} onKeyPress={e => e.key === 'Enter' && joinRoom()} placeholder="Enter room code" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all uppercase" />
                </div>

                <button onClick={joinRoom} disabled={!nameInput.trim() || !roomIdInput.trim()} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                  Join Room
                </button>

                <button onClick={() => setAppState('home')} className="w-full bg-white text-gray-700 py-3 rounded-lg font-semibold border-2 border-gray-300 hover:border-gray-400 transition-colors">
                  Back
                </button>
              </div>
            </div>
          </motion.div>}

        {appState === 'room' && room && currentPlayer && <motion.div key="room" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="w-full max-w-6xl">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Planning Poker
                  </h1>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{room.players.length} players</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Room:</span>
                    <span className="font-mono font-bold text-gray-900">{room.id}</span>
                    <button onClick={copyRoomLink} className="ml-2 text-gray-500 hover:text-gray-700 transition-colors">
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <button onClick={leaveRoom} className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Leave
                  </button>

                  {currentPlayer.isOwner && <>
                      <button onClick={revealEstimates} disabled={room.revealed || !allPlayersVoted()} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                        <Eye className="w-4 h-4" />
                        Reveal
                      </button>
                      <button onClick={resetEstimates} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                        Reset
                      </button>
                    </>}
                </div>
              </div>

              {!room.revealed && <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Select Your Estimate
                  </h2>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-3">
                    {FIBONACCI_CARDS.map(card => <motion.button key={card} onClick={() => selectCard(card)} whileHover={{
                scale: 1.05
              }} whileTap={{
                scale: 0.95
              }} className={cn('aspect-[2/3] rounded-xl font-bold text-2xl transition-all shadow-md', currentPlayer.estimate === card ? 'bg-blue-600 text-white ring-4 ring-blue-300' : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400')}>
                        {card}
                      </motion.button>)}
                  </div>
                </div>}

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Players</h2>

                {room.revealed ? <div className="space-y-4">
                    {getEstimateGroups().map(([estimate, players]) => <div key={estimate?.toString() ?? 'null'} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-12 h-16 rounded-lg flex items-center justify-center font-bold text-2xl shadow-md', estimate !== null ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600')}>
                              {estimate ?? '—'}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {estimate !== null ? `Estimate: ${estimate}` : 'No Estimate'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {players.length} {players.length === 1 ? 'person' : 'people'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {players.map(player => <div key={player.id} className="bg-white px-4 py-2 rounded-lg border border-gray-300 text-sm shadow-sm">
                              <span className="font-medium text-gray-900">{player.name}</span>
                              {player.isOwner && <span className="ml-1.5 text-xs text-blue-600 font-semibold">(Owner)</span>}
                            </div>)}
                        </div>
                      </div>)}
                  </div> : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {room.players.map(player => <motion.div key={player.id} initial={{
                opacity: 0,
                scale: 0.8
              }} animate={{
                opacity: 1,
                scale: 1
              }} className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                        <div className="mb-3">
                          <div className={cn('w-full aspect-[2/3] rounded-lg flex items-center justify-center font-bold text-xl shadow-md transition-colors', player.estimate !== null ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500')}>
                            {player.estimate !== null ? '✓' : '?'}
                          </div>
                        </div>
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {player.name}
                        </div>
                        {player.isOwner && <div className="text-xs text-blue-600 mt-1">Owner</div>}
                      </motion.div>)}
                  </div>}
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>
    </div>;
};
