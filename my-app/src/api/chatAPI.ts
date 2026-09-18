import { ApiError, request } from "./client";

export type ChatMessage = {
    id: number;
    studyId: number;
    sender: string;
    message: string;
    timestamp: string;
};

type ChatHistoryResponse = ChatMessage | ChatMessage[] | null;

function normalizeChatHistory(data: ChatHistoryResponse): ChatMessage[] {
    if (!data) {
        return [];
    }

    if (Array.isArray(data)) {
        return data;
    }

    return [data];
}

export async function getChatHistory(studyGroupId: number) {
    try {
        const data = await request<ChatHistoryResponse>(
            `/api/chat/${studyGroupId}/history`,
            {
                method: "GET",
            }
        );

        return normalizeChatHistory(data);
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            console.warn(
                "이전 채팅 내역 API가 404를 반환했습니다. 실시간 채팅 연결은 계속 진행합니다.",
                {
                    studyGroupId,
                    responseText: error.responseText,
                }
            );

            return [];
        }

        throw error;
    }
}