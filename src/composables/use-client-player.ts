import { computed, onBeforeUnmount } from "vue";
import { GameConsoleState, Player, Room, SignalData } from "../types";

import { UpdateStateParams, useGameConsoleStore } from "../stores/game-console.store";
import { useMainStore } from "../stores/main.store";
import { createEventHook } from "@vueuse/core";
import { getPlayerColor } from "../common/utils";

export function useClientPlayer() {
  const mainStore = useMainStore();
  const gameConsoleStore = useGameConsoleStore();

  function joinRoom(roomId: string): Promise<Room> {
    // client 尚未連線，先進行連線
    if (!mainStore.client?.connected) {
      const client = mainStore.connect('player');

      return new Promise((resolve, reject) => {
        client.once('connect', () => {
          client.removeAllListeners();

          emitJoinRoom(client, roomId)
            .then(resolve)
            .catch(reject)
        });

        // 發生連線異常
        client.once('connect_error', (error) => {
          client.removeAllListeners();
          reject(error);
        });
      });
    }

    // client 已經連線，直接發出事件
    return emitJoinRoom(mainStore.client, roomId);
  }

  /** 發送 player:join-room 事件至 server 並設定 3 秒超時 */
  function emitJoinRoom(client: NonNullable<typeof mainStore['client']>, roomId: string): Promise<Room> {
    return new Promise((resolve, reject) => {
      client.timeout(3000).emit('player:join-room', roomId, (err, res) => {
        if (err) {
          return reject(err);
        }

        if (res.status === 'err') {
          return reject(res);
        }

        /** 儲存 room id */
        gameConsoleStore.setRoomId(res.data.id);
        resolve(res.data);
      });
    });
  }

  const stateUpdateHook = createEventHook<GameConsoleState>();
  const playerUpdateHook = createEventHook<Player[]>();

  /** 元件解除安裝前，移除 Listener 以免記憶體洩漏 */
  onBeforeUnmount(() => {
    mainStore.client?.removeListener('game-console:state-update', stateUpdateHook.trigger);
    mainStore.client?.removeListener('game-console:player-update', playerUpdateHook.trigger);
  });

  async function requestGameConsoleState() {
    if (!mainStore.client?.connected) {
      return Promise.reject('client 尚未連線');
    }
    mainStore.client.emit('player:request-game-console-state');
  }

  const codeName = computed(() => {
    const index = gameConsoleStore.players.findIndex((player) =>
      player.clientId === mainStore.clientId
    );

    if (index < 0) {
      return 'unknown';
    }

    return `${index + 1}P`;
  });
  const colorName = computed(() => getPlayerColor({ codeName: codeName.value }));

  async function emitGamepadData(data: SignalData[]) {
    if (!mainStore.client?.connected) {
      return Promise.reject('client 尚未連線');
    }

    mainStore.client.emit('player:gamepad-data', {
      playerId: mainStore.clientId,
      keys: data,
    })
  }

  async function emitProfile(data: Omit<Player, 'clientId'>) {
    if (!mainStore.client?.connected) {
      return Promise.reject('client 尚未連線');
    }

    mainStore.client.emit('player:profile', {
      clientId: mainStore.clientId,
      ...data,
    });
  }

  return {
    joinRoom,

    onGameConsoleStateUpdate: (fn: Parameters<typeof stateUpdateHook['on']>[0]) => {
      /** 監聽 game-console:state-update 事件 */
      mainStore.client?.on('game-console:state-update', stateUpdateHook.trigger);
      return stateUpdateHook.on(fn);
    },
    /** 玩家變更事件，例如玩家加入或斷線等等 */
    onPlayerUpdate: (fn: Parameters<typeof playerUpdateHook['on']>[0]) => {
      mainStore.client?.on('game-console:player-update', playerUpdateHook.trigger);
      return playerUpdateHook.on(fn);
    },

    requestGameConsoleState,

    codeName,
    colorName,

    emitGamepadData,
    /** 發送玩家自身資料 */
    emitProfile,
  }
}