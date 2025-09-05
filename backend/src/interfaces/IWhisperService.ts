import { WhisperServiceRequest, WhisperServiceResponse } from '../types';

export interface IWhisperService {
  transcribe(request: WhisperServiceRequest): Promise<WhisperServiceResponse>;
  healthCheck(): Promise<boolean>;
}