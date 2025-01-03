export type DragonType = '수룡' | '화룡';

export interface TimerData {
  id: number;
  channelNumber: number;
  killedTime: string;
  dragonType: DragonType;
  respawnTime: Date;
  remainingTime: string;
  isCompleted: boolean;
} 