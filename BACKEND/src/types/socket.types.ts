export interface SocketSendMessage {
    key: string;
    conversationId: string;
    message?: string;
    image?: Buffer;
}

export interface SocketChatData {
    conversationId: string;
    message?: string;
    image?: Buffer;
}
export interface MLResponse {
  query: string;
  final_answer?: string;
  confidence?: number;
  current_task?: string;
  temporal_mode?: string;
  modalities?: string[];
  image_count?: number;
  input_valid: boolean;
  validation_errors: string[];
  retry_count: number;

  reflection?: {
    decision: string;
    required_action: string;
    reason: string;
    confidence: number;
    evidence_confidence: number;
    min_confidence: number;
    retry_count: number;
  };

  evidence?: unknown[];
  execution_trace?: unknown[];
  duration_seconds?: number;
}