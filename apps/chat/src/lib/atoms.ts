import { atom } from "jotai";

export const statsForNerdsAtom = atom(false);

interface ChatMetadata {
  tokensUsed: number;
  cost: number;
  totalMessages: number;
}

export const chatMetadataAtom = atom<ChatMetadata>({
  tokensUsed: 0,
  cost: 0,
  totalMessages: 0,
});
