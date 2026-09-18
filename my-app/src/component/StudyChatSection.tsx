import React, { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getChatHistory, type ChatMessage } from "../api/chatAPI";
import { WS_BASE_URL } from "../api/client";
import type { Study } from "../types/study";

type StudyChatSectionProps = {
    selectedStudy: Study | null;
};

const getCurrentUser = () => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
        return {
            id: null as number | null,
            name: "익명",
        };
    }

    try {
        const user = JSON.parse(savedUser);

        const rawId =
            user?.id ??
            user?.userId ??
            user?.memberId ??
            user?.memberPk ??
            user?.memberPK ??
            null;

        const parsedId = Number(rawId);

        return {
            id: Number.isNaN(parsedId) ? null : parsedId,
            name: user?.name || "익명",
        };
    } catch {
        return {
            id: null as number | null,
            name: "익명",
        };
    }
};

const normalizeChatMessage = (rawMessage: unknown): ChatMessage => {
    const raw = rawMessage as Record<string, unknown>;

    return {
        id:
            typeof raw.id === "number"
                ? raw.id
                : typeof raw.chatId === "number"
                    ? raw.chatId
                    : Date.now(),
        sender:
            typeof raw.sender === "string"
                ? raw.sender
                : typeof raw.senderName === "string"
                    ? raw.senderName
                    : typeof raw.memberName === "string"
                        ? raw.memberName
                        : "익명",
        message:
            typeof raw.message === "string"
                ? raw.message
                : typeof raw.content === "string"
                    ? raw.content
                    : "",
        timestamp:
            typeof raw.timestamp === "string"
                ? raw.timestamp
                : typeof raw.createdAt === "string"
                    ? raw.createdAt
                    : typeof raw.sentAt === "string"
                        ? raw.sentAt
                        : new Date().toISOString(),
    } as ChatMessage;
};

const formatTime = (timestamp: string) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return timestamp;
    }

    return date.toLocaleString("ko-KR", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const delay = (ms: number) => {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
};

const StudyChatSection: React.FC<StudyChatSectionProps> = ({ selectedStudy }) => {
    const stompClientRef = useRef<Client | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState("");
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [connectionError, setConnectionError] = useState("");

    const currentUser = getCurrentUser();
    const currentUserName = currentUser.name;

    const disconnectSocket = async () => {
        if (stompClientRef.current) {
            await stompClientRef.current.deactivate();
            stompClientRef.current = null;
        }

        setConnected(false);
        setConnecting(false);
    };

    const loadHistory = async () => {
        if (!selectedStudy) return;

        try {
            setLoading(true);

            console.log("========== 채팅 history 조회 시작 ==========");
            console.log("선택된 스터디:", selectedStudy);
            console.log("채팅 내역 요청 Study_Group_PK:", selectedStudy.id);
            console.log("요청 API:", `/api/chat/${selectedStudy.id}/history`);

            const data = await getChatHistory(selectedStudy.id);

            console.log("history 원본 응답:", data);
            console.table(data);

            const normalizedMessages = data.map((item) =>
                normalizeChatMessage(item)
            );

            console.log("history 화면 표시용 변환 결과:", normalizedMessages);
            console.table(normalizedMessages);
            console.log("========== 채팅 history 조회 끝 ==========");

            setMessages(normalizedMessages);
        } catch (error) {
            console.error("이전 채팅 내역 조회 실패:", error);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const reloadHistoryAfterSend = async () => {
        await delay(350);
        await loadHistory();
    };

    const handleConnectChat = async () => {
        if (!selectedStudy) {
            alert("스터디를 먼저 선택하세요.");
            return;
        }

        if (connected || connecting) {
            return;
        }

        if (!currentUser.id) {
            alert("로그인한 사용자 ID를 찾지 못했습니다. 다시 로그인해주세요.");
            return;
        }

        try {
            setConnecting(true);
            setConnectionError("");

            await loadHistory();

            if (stompClientRef.current) {
                await stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }

            const connectHeaders = {
                userId: String(currentUser.id),
                memberId: String(currentUser.id),
                senderId: String(currentUser.id),
                senderName: currentUserName,
                memberName: currentUserName,
                studyGroupId: String(selectedStudy.id),
                studyId: String(selectedStudy.id),
            };

            console.log("WebSocket 연결 주소:", WS_BASE_URL);
            console.log("STOMP subscribe 주소:", `/topic/study/${selectedStudy.id}`);
            console.log("STOMP publish 주소:", `/app/chat/${selectedStudy.id}`);
            console.log("STOMP connectHeaders:", connectHeaders);

            const client = new Client({
                webSocketFactory: () => new SockJS(WS_BASE_URL),
                connectHeaders,
                reconnectDelay: 5000,
                heartbeatIncoming: 10000,
                heartbeatOutgoing: 10000,
                debug: (message) => {
                    console.log("[STOMP]", message);
                },

                onConnect: () => {
                    setConnected(true);
                    setConnecting(false);
                    setConnectionError("");

                    console.log("STOMP 연결 및 검문소 통과 완료");

                    client.subscribe(`/topic/study/${selectedStudy.id}`, (frame) => {
                        try {
                            console.log("STOMP 수신 원본 frame.body:", frame.body);

                            const receivedMessage = normalizeChatMessage(
                                JSON.parse(frame.body)
                            );

                            console.log("STOMP 수신 변환 메시지:", receivedMessage);

                            setMessages((prev) => {
                                const alreadyExists = prev.some(
                                    (item) =>
                                        item.id === receivedMessage.id &&
                                        item.timestamp === receivedMessage.timestamp &&
                                        item.message === receivedMessage.message
                                );

                                if (alreadyExists) {
                                    return prev;
                                }

                                return [...prev, receivedMessage];
                            });
                        } catch (error) {
                            console.error("채팅 메시지 파싱 실패:", error);
                        }
                    });
                },

                onDisconnect: () => {
                    setConnected(false);
                    setConnecting(false);
                },

                onStompError: (frame) => {
                    console.error("STOMP 에러:", frame.headers["message"]);
                    console.error("STOMP 에러 body:", frame.body);

                    setConnected(false);
                    setConnecting(false);
                    setConnectionError("채팅 서버에서 STOMP 오류가 발생했습니다.");
                },

                onWebSocketClose: (event) => {
                    console.error("WebSocket 연결 종료:", event);

                    setConnected(false);
                    setConnecting(false);
                    setConnectionError(
                        "채팅 서버 연결이 종료되었습니다. /ws-stomp 백엔드 엔드포인트 또는 프록시 설정을 확인하세요."
                    );
                },

                onWebSocketError: (error) => {
                    console.error("WebSocket 에러:", error);

                    setConnected(false);
                    setConnecting(false);
                    setConnectionError(
                        "채팅 서버 연결에 실패했습니다. 백엔드 /ws-stomp 설정, Vite 프록시, 서버 재시작 여부를 확인하세요."
                    );
                },
            });

            stompClientRef.current = client;
            client.activate();
        } catch (error) {
            console.error(error);
            setConnected(false);
            setConnecting(false);
            setConnectionError("채팅 연결 중 오류가 발생했습니다.");
        }
    };

    useEffect(() => {
        setMessages([]);
        setMessage("");
        setConnected(false);
        setConnecting(false);
        setConnectionError("");

        if (stompClientRef.current) {
            stompClientRef.current.deactivate();
            stompClientRef.current = null;
        }

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
        };
    }, [selectedStudy]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!selectedStudy) {
            alert("스터디를 먼저 선택하세요.");
            return;
        }

        if (!message.trim()) {
            alert("메시지를 입력하세요.");
            return;
        }

        if (!stompClientRef.current || !connected) {
            alert("채팅 서버에 연결되지 않았습니다. 채팅 연결 버튼을 먼저 눌러주세요.");
            return;
        }

        if (!currentUser.id) {
            alert("로그인한 사용자 ID를 찾지 못했습니다. 다시 로그인해주세요.");
            return;
        }

        if (sending) {
            return;
        }

        const trimmedMessage = message.trim();

        const payload = {
            studyGroupId: selectedStudy.id,
            studyId: selectedStudy.id,
            senderId: currentUser.id,
            memberId: currentUser.id,
            userId: currentUser.id,
            sender: currentUserName,
            senderName: currentUserName,
            memberName: currentUserName,
            message: trimmedMessage,
            content: trimmedMessage,
        };

        try {
            setSending(true);

            console.log("STOMP 전송 payload:", payload);

            stompClientRef.current.publish({
                destination: `/app/chat/${selectedStudy.id}`,
                headers: {
                    userId: String(currentUser.id),
                    memberId: String(currentUser.id),
                    senderId: String(currentUser.id),
                    senderName: currentUserName,
                    memberName: currentUserName,
                    studyGroupId: String(selectedStudy.id),
                    studyId: String(selectedStudy.id),
                },
                body: JSON.stringify(payload),
            });

            setMessage("");

            await reloadHistoryAfterSend();
        } catch (error) {
            console.error("채팅 전송 후 history 재조회 실패:", error);
            alert("메시지 전송 후 채팅 내역을 다시 불러오지 못했습니다.");
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            handleSendMessage();
        }
    };

    return (
        <div className="content-card wide" style={styles.card}>
            <div className="card-title-row">
                <div>
                    <h3>스터디 채팅방</h3>
                    <p style={styles.description}>
                        {selectedStudy
                            ? `${selectedStudy.name} 전용 실시간 채팅방입니다.`
                            : "스터디를 선택하면 채팅방이 열립니다."}
                    </p>
                </div>

                <div style={styles.chatHeaderRight}>
                    <span
                        style={{
                            ...styles.statusBadge,
                            ...(connected ? styles.connected : styles.disconnected),
                        }}
                    >
                        {connected ? "연결됨" : connecting ? "연결 중" : "연결 안 됨"}
                    </span>

                    <button
                        type="button"
                        style={{
                            ...styles.connectButton,
                            opacity: !selectedStudy || connected || connecting ? 0.55 : 1,
                            cursor:
                                !selectedStudy || connected || connecting
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                        disabled={!selectedStudy || connected || connecting}
                        onClick={handleConnectChat}
                    >
                        {connecting
                            ? "연결 중..."
                            : connected
                                ? "연결 완료"
                                : "채팅 연결"}
                    </button>

                    {connected && (
                        <button
                            type="button"
                            style={styles.disconnectButton}
                            onClick={disconnectSocket}
                        >
                            연결 끊기
                        </button>
                    )}
                </div>
            </div>

            {!selectedStudy ? (
                <p className="empty-text">왼쪽에서 스터디를 선택하세요.</p>
            ) : (
                <>
                    {connectionError && (
                        <div style={styles.errorBox}>
                            {connectionError}
                        </div>
                    )}

                    <div style={styles.messageList}>
                        {loading && (
                            <p className="empty-text">이전 채팅 내역을 불러오는 중...</p>
                        )}

                        {!loading && messages.length === 0 && (
                            <p className="empty-text">
                                채팅 연결 버튼을 누르면 이전 채팅 내역과 실시간 채팅을 사용할 수 있습니다.
                            </p>
                        )}

                        {!loading &&
                            messages.map((chat, index) => {
                                const isMine = chat.sender === currentUserName;

                                return (
                                    <div
                                        key={`${chat.id}-${chat.timestamp}-${index}`}
                                        style={{
                                            ...styles.messageRow,
                                            justifyContent: isMine ? "flex-end" : "flex-start",
                                        }}
                                    >
                                        <div
                                            style={{
                                                ...styles.messageBubble,
                                                ...(isMine ? styles.myBubble : styles.otherBubble),
                                            }}
                                        >
                                            <div style={styles.messageTop}>
                                                <strong>{chat.sender}</strong>
                                                <span>{formatTime(chat.timestamp)}</span>
                                            </div>

                                            <p style={styles.messageText}>{chat.message}</p>
                                        </div>
                                    </div>
                                );
                            })}

                        <div ref={bottomRef} />
                    </div>

                    <div style={styles.inputRow}>
                        <input
                            type="text"
                            placeholder={
                                connected
                                    ? "메시지를 입력하세요."
                                    : "채팅 연결 버튼을 먼저 눌러주세요."
                            }
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={!connected || sending}
                            style={styles.input}
                        />

                        <button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={!connected || sending}
                            style={{
                                ...styles.sendButton,
                                opacity: connected && !sending ? 1 : 0.5,
                                cursor: connected && !sending ? "pointer" : "not-allowed",
                            }}
                        >
                            {sending ? "전송 중..." : "전송"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    card: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    description: {
        margin: "6px 0 0",
        color: "#6b7280",
        fontSize: "13px",
    },
    chatHeaderRight: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
        justifyContent: "flex-end",
    },
    statusBadge: {
        borderRadius: "999px",
        padding: "6px 10px",
        fontSize: "12px",
        fontWeight: 800,
        whiteSpace: "nowrap",
    },
    connected: {
        backgroundColor: "#ecfdf5",
        color: "#047857",
    },
    disconnected: {
        backgroundColor: "#fef2f2",
        color: "#b91c1c",
    },
    connectButton: {
        border: "none",
        backgroundColor: "#800020",
        color: "#ffffff",
        borderRadius: "10px",
        padding: "8px 12px",
        fontSize: "12px",
        fontWeight: 800,
        whiteSpace: "nowrap",
    },
    disconnectButton: {
        border: "1px solid #d1d5db",
        backgroundColor: "#ffffff",
        color: "#374151",
        borderRadius: "10px",
        padding: "8px 12px",
        fontSize: "12px",
        fontWeight: 800,
        cursor: "pointer",
        whiteSpace: "nowrap",
    },
    errorBox: {
        padding: "10px 12px",
        borderRadius: "12px",
        backgroundColor: "#fef2f2",
        color: "#b91c1c",
        fontSize: "13px",
        fontWeight: 700,
    },
    messageList: {
        height: "320px",
        overflowY: "auto",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "14px",
        backgroundColor: "#f9fafb",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    messageRow: {
        display: "flex",
        width: "100%",
    },
    messageBubble: {
        maxWidth: "72%",
        borderRadius: "14px",
        padding: "10px 12px",
        border: "1px solid #e5e7eb",
    },
    myBubble: {
        backgroundColor: "#800020",
        color: "#ffffff",
        borderColor: "#800020",
    },
    otherBubble: {
        backgroundColor: "#ffffff",
        color: "#1f2937",
    },
    messageTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        fontSize: "12px",
        opacity: 0.85,
        marginBottom: "6px",
    },
    messageText: {
        margin: 0,
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
    },
    inputRow: {
        display: "flex",
        gap: "10px",
    },
    input: {
        flex: 1,
        height: "44px",
        border: "1px solid #d1d5db",
        borderRadius: "12px",
        padding: "0 14px",
        outline: "none",
        fontSize: "14px",
    },
    sendButton: {
        border: "none",
        backgroundColor: "#800020",
        color: "#ffffff",
        borderRadius: "12px",
        padding: "0 18px",
        fontWeight: 800,
    },
};

export default StudyChatSection;