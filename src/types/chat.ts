export type ChatMessageType = 'TEXT';

export interface ChatMessageResponse {
  id: number;
  senderId: number;
  senderNickname: string;
  type: ChatMessageType;
  content: string;
  createdAt: string;
}

export interface ChatMessagePageParams {
  beforeId?: number;
  size?: number;
}

export interface ChatMessageSendRequest {
  content: string;
}

export interface ChatParticipantResponse {
  userId: number;
  nickname: string;
}

export type ChatConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';
