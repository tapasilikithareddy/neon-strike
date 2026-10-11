import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowToPlay } from './components/HowToPlay';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { CreateRoomModal } from './components/CreateRoomModal';
import { JoinRoomModal } from './components/JoinRoomModal';
import { WaitingLobby } from './components/WaitingLobby';
import { GameArena } from './components/GameArena';
import { PracticeModal } from './components/PracticeModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { PlayerInfo, PlayerSide, AIDifficulty } from './types/game';
import { IMultiplayerTransport } from './multiplayer/transport';
import { createMultiplayerTransport } from './multiplayer/transportFactory';
import { NetworkPacket } from './types/multiplayer';
import { soundEngine } from './engine/soundEngine';

type AppView = 'landing' | 'lobby' | 'playing';

export const App: React.FC = () => {
  const [view, setView] = useState<AppView>('landing');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  const [initialJoinCode, setInitialJoinCode] = useState('');
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Active match data
  const [roomCode, setRoomCode] = useState<string>('');
  const [isPractice, setIsPractice] = useState(false);
  const [practiceDifficulty, setPracticeDifficulty] = useState<AIDifficulty>('EASY');
  const [localPlayer, setLocalPlayer] = useState<PlayerInfo>({
    id: 'p_' + Math.random().toString(36).substring(2, 9),
    name: 'CyberStriker',
    side: 'bottom',
    isHost: true,
    isReady: false,
    avatarSeed: 'seed_host',
  });
  const [remotePlayer, setRemotePlayer] = useState<PlayerInfo | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Multiplayer Transport instance
  const transportRef = useRef<IMultiplayerTransport | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check URL query params for ?room=XYZ or ?join=XYZ
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('room') || params.get('join');
    if (codeParam) {
      setInitialJoinCode(codeParam.toUpperCase());
      setIsJoinOpen(true);
      addToast(`Arena invite found: ${codeParam.toUpperCase()}`, 'info');
    }
  }, []);

  // Initialize transport and listen for multiplayer packets
  const setupTransport = () => {
    if (transportRef.current) {
      transportRef.current.disconnect();
    }
    const transport = createMultiplayerTransport();
    transportRef.current = transport;

    transport.onPacket((packet: NetworkPacket) => {
      if (packet.type === 'JOIN_REQUEST') {
        // Host receives Join request from challenger
        setRemotePlayer(packet.player);
        addToast(`${packet.player.name} entered the arena!`, 'success');

        // Host responds with JOIN_ACCEPT
        transport.send({
          type: 'JOIN_ACCEPT',
          roomCode: roomCode,
          host: localPlayer,
          guest: packet.player,
          assignedSide: 'top',
          timestamp: Date.now(),
        });
      } else if (packet.type === 'JOIN_ACCEPT') {
        // Guest accepted into room
        setRemotePlayer(packet.host);
        setLocalPlayer((prev) => ({ ...prev, side: 'top', isHost: false }));
        setIsJoinOpen(false);
        setIsConnecting(false);
        setView('lobby');
        addToast(`Connected to ${packet.host.name}'s Arena!`, 'success');
      } else if (packet.type === 'JOIN_REJECT') {
        setJoinErrorMessage(packet.reason);
        setIsConnecting(false);
        addToast(packet.reason, 'error');
      } else if (packet.type === 'READY_TOGGLE') {
        setRemotePlayer((prev) => (prev ? { ...prev, isReady: packet.isReady } : null));
      } else if (packet.type === 'COUNTDOWN_START') {
        setCountdown(packet.count);
        soundEngine.playCountdown(packet.count);
        if (packet.count === 0) {
          setView('playing');
        }
      } else if (packet.type === 'GAME_START') {
        setView('playing');
        setCountdown(null);
      } else if (packet.type === 'PLAYER_LEFT') {
        addToast(packet.reason, 'error');
        setRemotePlayer(null);
        if (view === 'playing') {
          setView('lobby');
        }
      }
    });

    transport.onStatusChange((status) => {
      if (status === 'error') {
        setIsConnecting(false);
      }
    });

    return transport;
  };

  // --- Room Actions ---
  const handleCreateRoom = async (name: string, code: string) => {
    setIsCreateOpen(false);
    setRoomCode(code);
    setIsPractice(false);

    const player: PlayerInfo = {
      id: 'p_' + Math.random().toString(36).substring(2, 9),
      name,
      side: 'bottom',
      isHost: true,
      isReady: false,
      avatarSeed: 'host_' + code,
    };
    setLocalPlayer(player);
    setRemotePlayer(null);

    const transport = setupTransport();
    try {
      await transport.connect(code, player, true);
      setView('lobby');
      addToast(`Arena ${code} created. Share code with your opponent.`, 'success');
    } catch (err: unknown) {
      console.error(err);
      addToast((err as Error).message || 'Failed to create arena', 'error');
    }
  };

  const handleJoinRoom = async (name: string, code: string) => {
    setJoinErrorMessage(null);
    setIsConnecting(true);
    setRoomCode(code);
    setIsPractice(false);

    const player: PlayerInfo = {
      id: 'p_' + Math.random().toString(36).substring(2, 9),
      name,
      side: 'top',
      isHost: false,
      isReady: false,
      avatarSeed: 'guest_' + code,
    };
    setLocalPlayer(player);

    const transport = setupTransport();
    try {
      await transport.connect(code, player, false);
      // Wait for JOIN_ACCEPT packet to transition view
    } catch (err: unknown) {
      setIsConnecting(false);
      setJoinErrorMessage((err as Error).message || 'Failed to connect to arena.');
      addToast('Arena connection failed.', 'error');
    }
  };

  const handleToggleReady = (isReady: boolean) => {
    setLocalPlayer((prev) => ({ ...prev, isReady }));

    if (transportRef.current) {
      transportRef.current.send({
        type: 'READY_TOGGLE',
        playerId: localPlayer.id,
        isReady,
        timestamp: Date.now(),
      });
    }

    // If both players are ready and this client is host, start countdown
    if (localPlayer.isHost && remotePlayer?.isReady && isReady) {
      initiateMatchCountdown();
    }
  };

  const initiateMatchCountdown = () => {
    let count = 3;
    setCountdown(count);
    soundEngine.playCountdown(count);

    if (transportRef.current) {
      transportRef.current.send({
        type: 'COUNTDOWN_START',
        count,
        timestamp: Date.now(),
      });
    }

    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      soundEngine.playCountdown(count);

      if (transportRef.current) {
        transportRef.current.send({
          type: 'COUNTDOWN_START',
          count,
          timestamp: Date.now(),
        });
      }

      if (count <= 0) {
        clearInterval(timer);
        setView('playing');
        setCountdown(null);
        if (transportRef.current) {
          transportRef.current.send({
            type: 'GAME_START',
            initialState: {} as any,
            timestamp: Date.now(),
          });
        }
      }
    }, 1000);
  };

  // Open Solo Practice Difficulty Selector
  const handleOpenPracticeModal = () => {
    setIsPracticeModalOpen(true);
  };

  // Launch Solo Practice Drill with chosen difficulty
  const handleLaunchPractice = (difficulty: AIDifficulty) => {
    setPracticeDifficulty(difficulty);
    setIsPractice(true);
    setRoomCode('SOLO-PRACTICE');
    setLocalPlayer({
      id: 'solo_player',
      name: localStorage.getItem('neon_player_name') || 'Striker',
      side: 'bottom',
      isHost: true,
      isReady: true,
      avatarSeed: 'solo',
    });
    const botLabels: Record<AIDifficulty, string> = {
      EASY: 'Cyber-Bot (Casual)',
      MEDIUM: 'Cyber-Bot (Pro)',
      CYBER_ELITE: 'Cyber-Bot (Elite)',
    };
    setRemotePlayer({
      id: 'cyber_bot',
      name: botLabels[difficulty] || 'Cyber-Bot 9000',
      side: 'top',
      isHost: false,
      isReady: true,
      avatarSeed: 'bot',
    });
    setView('playing');
    addToast(`Engaged Solo Drill [${difficulty === 'CYBER_ELITE' ? 'ELITE' : difficulty}].`, 'info');
  };

  const handleLeaveGame = () => {
    if (transportRef.current) {
      transportRef.current.send({
        type: 'PLAYER_LEFT',
        reason: `${localPlayer.name} left the arena.`,
        timestamp: Date.now(),
      });
      transportRef.current.disconnect();
      transportRef.current = null;
    }
    setView('landing');
    setRemotePlayer(null);
    setCountdown(null);
    setIsPractice(false);
  };

  return (
    <div className="min-h-screen bg-[#060913] text-white relative overflow-x-hidden selection:bg-[#00f0ff] selection:text-black">
      {/* Background Cyber Grid */}
      <div className="cyber-grid-bg" />

      {/* Navigation */}
      {view !== 'playing' && (
        <Navbar
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          onStartPractice={handleOpenPracticeModal}
          inGame={false}
        />
      )}

      {/* Main Content Area */}
      <main>
        {view === 'landing' && (
          <>
            <Hero
              onCreateRoom={() => setIsCreateOpen(true)}
              onJoinRoom={() => setIsJoinOpen(true)}
              onStartPractice={handleOpenPracticeModal}
            />
            <HowToPlay />
            <Features />
            <Footer />
          </>
        )}

        {view === 'lobby' && (
          <WaitingLobby
            roomCode={roomCode}
            localPlayer={localPlayer}
            remotePlayer={remotePlayer}
            countdown={countdown}
            onToggleReady={handleToggleReady}
            onLeave={handleLeaveGame}
          />
        )}

        {view === 'playing' && (
          <GameArena
            localPlayer={localPlayer}
            remotePlayer={remotePlayer}
            transport={transportRef.current}
            roomCode={roomCode}
            isPractice={isPractice}
            practiceDifficulty={practiceDifficulty}
            onLeave={handleLeaveGame}
          />
        )}
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateRoom}
      />

      <JoinRoomModal
        isOpen={isJoinOpen}
        initialRoomCode={initialJoinCode}
        errorMessage={joinErrorMessage}
        isConnecting={isConnecting}
        onClose={() => {
          setIsJoinOpen(false);
          setJoinErrorMessage(null);
        }}
        onJoin={handleJoinRoom}
      />

      <PracticeModal
        isOpen={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
        onStart={handleLaunchPractice}
      />

      {isHowToPlayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-panel-elevated w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <HowToPlay onClose={() => setIsHowToPlayOpen(false)} isModal />
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
