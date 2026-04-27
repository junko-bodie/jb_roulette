export const BOT_NAMES = [
  'AceHigh', 'RoyalFlush', 'NeonRider', 'ShadowBet', 'CrimsonKing',
  'DiamondDiva', 'GoldDigger', 'MidnightWolf', 'SilverBullet', 'PhantomPro',
  'ViperVegas', 'JackpotJoy', 'RogueSpinner', 'TitanTricks', 'ZenithPlayer',
  'MysticLuck', 'IronGamble', 'ChaosCroupier', 'SolarSpin', 'LunarLuna',
  'BlazeBet', 'FrostyFold', 'OmegaWager', 'AlphaAce', 'SigmaStakes',
  'GigaGamble', 'UltraUser', 'MegaMaster', 'ProPunter', 'EliteEdge',
  'ZenMaster', 'SilentWinner', 'LuckyStriker', 'CasinoQueen', 'RouletteRebel',
  'BettingBeast', 'ProfitPirate', 'WagerWizard', 'SpinSurfer', 'GlitchGambler',
  'RandoRich', 'HighRoller', 'BrokeToRich', 'VegasVulture', 'DesertDealer',
  'NeonGlow', 'CyberSpinner', 'MatrixMistress', 'VectorVegas', 'PixelPunter'
];

export function getRandomBotName(exclude: string[] = []): string {
  const available = BOT_NAMES.filter(name => !exclude.includes(name));
  const list = available.length > 0 ? available : BOT_NAMES;
  return list[Math.floor(Math.random() * list.length)];
}
