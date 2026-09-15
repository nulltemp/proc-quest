import type { Messages } from './messages.js';

export const ja: Messages = {
  nodeType: {
    start: '開始地点',
    boss: 'ボス',
    battle: '戦闘',
    event: 'イベント',
    normal: '通常',
    treasure: '宝箱',
  },
  effectType: {
    shield: 'シールド',
  },
  itemType: {
    powerTonic: 'パワードリンク',
    guardianWard: 'ガーディアンウォード',
  },
  map: {
    seed: (seed) => `シード: ${seed}`,
    nodesHeader: (count) => `ノード数 (${count}):`,
    edgesHeader: (count) => `エッジ数 (${count}):`,
    startBoss: (startNodeId, bossNodeId) => `開始地点: ノード${startNodeId}   ボス: ノード${bossNodeId}`,
  },
  game: {
    unknownNodeType: '不明',
    turnStatus: (turn, nodeId, nodeType) => `ターン${turn} — ノード${nodeId} (${nodeType}) にいます`,
    power: (player, enemy) => `自軍の戦力: ${player}  |  敵軍の戦力: ${enemy}`,
    activeEffects: (summary) => `効果: ${summary}`,
    moveTo: (options) => `移動先: ${options}`,
    events: {
      moved: (from, to) => `  ノード${from}からノード${to}へ移動しました。`,
      blocked: (attemptedNodeId) => `  ノード${attemptedNodeId}へは移動できません — 隣接していません。`,
      battle: (enemyDamage, playerDamage) => `  戦闘発生！ ${enemyDamage}のダメージを与え、${playerDamage}のダメージを受けました。`,
      bossDefeated: `  ボスを倒しました！ 勝利！`,
      bossCounterattack: (damage) => `  ボスの反撃！ ${damage}のダメージ！`,
      event: (powerDelta) => `  イベント: 戦力 ${powerDelta >= 0 ? '+' : ''}${powerDelta}。`,
      attrition: (powerDelta) => `  消耗: 戦力 ${powerDelta}。`,
      itemAcquired: (itemLabel, powerDelta) =>
        `  ${itemLabel}を見つけました！${powerDelta !== undefined ? `（戦力+${powerDelta}）` : ''}`,
      itemEffectTriggered: (itemLabel, damageBlocked) => `  ${itemLabel}が${damageBlocked}のダメージを吸収しました！`,
    },
  },
  cli: {
    reproduce: (seed) => `再現するには: node dist/index.js ${seed}`,
    gameStart: '--- ゲーム開始（ノードIDを入力して移動、"quit"で終了） ---',
    noMoves: '移動できるノードがありません。ゲームを終了します。',
    invalidNodeId: '有効なノードIDを入力してください。',
    victory: '敵のボスを倒しました！ 勝利！',
    gameOver: '自軍の戦力が尽きました。ゲームオーバー。',
    gameEnded: 'ゲーム終了。',
  },
  web: {
    title: 'proc-quest マップビューア',
    seedLabel: 'シード',
    regenerate: '再生成',
    randomSeed: 'ランダムシード',
    log: 'ログ',
    langLabel: '言語',
    turnLog: (turn) => `ターン${turn}:`,
  },
};
