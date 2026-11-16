import type { CompetitionId } from './competition-catalog.ts';

export type FriendProfile = { username: string; nickname: string; avatar: number };
export type RaceInvitation = { id: string; from: FriendProfile; mode: CompetitionId };
export type InvitedRace = { id: string; code: string; mode: CompetitionId };
export type FriendsList = {
  friends: FriendProfile[];
  incoming: FriendProfile[];
  outgoing: FriendProfile[];
  invitations: RaceInvitation[];
};
