import React, { useState } from "react";
import {
    confirmAIReservationTask,
    generateAIAssignment,
    type GenerateAIAssignmentResponse,
} from "../api/assignmentAPI";

type AIAssignmentModalProps = {
    studyGroupId: number;
    onClose: () => void;
    onConfirmed?: (reservationTaskId: number) => Promise<void> | void;
};

const formatDateTimeForServer = (dateTimeLocal: string) => {
    if (!dateTimeLocal) return "";

    if (dateTimeLocal.length === 16) {
        return `${dateTimeLocal}:00`;
    }

    return dateTimeLocal;
};

const AIAssignmentModal: React.FC<AIAssignmentModalProps> = ({
    studyGroupId,
    onClose,
    onConfirmed,
}) => {
    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState("중");
    const [additionalRequest, setAdditionalRequest] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [openAt, setOpenAt] = useState("");
    const [closeAt, setCloseAt] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [result, setResult] = useState<GenerateAIAssignmentResponse | null>(null);

    const validateDueDate = () => {
        if (!dueDate) {
            alert("마감기한을 설정하세요.");
            return false;
        }

        const selectedDueDate = new Date(dueDate);
        const now = new Date();

        if (Number.isNaN(selectedDueDate.getTime())) {
            alert("마감기한 형식이 올바르지 않습니다.");
            return false;
        }

        if (selectedDueDate <= now) {
            alert("마감기한은 현재 시간 이후로 설정해야 합니다.");
            return false;
        }

        return true;
    };

    const validateReservationTime = () => {
        if (!openAt) {
            alert("문제 공개 시간을 설정하세요.");
            return false;
        }

        if (!closeAt) {
            alert("마감 시간을 설정하세요.");
            return false;
        }

        const openDate = new Date(openAt);
        const closeDate = new Date(closeAt);
        const now = new Date();

        if (Number.isNaN(openDate.getTime()) || Number.isNaN(closeDate.getTime())) {
            alert("시간 형식이 올바르지 않습니다.");
            return false;
        }

        if (openDate <= now) {
            alert("문제 공개 시간은 현재 시간 이후로 설정해야 합니다.");
            return false;
        }

        if (closeDate <= openDate) {
            alert("마감 시간은 공개 시간 이후여야 합니다.");
            return false;
        }

        return true;
    };

    const handleGenerate = async () => {
        if (!topic.trim()) {
            alert("과제 주제를 입력하세요.");
            return;
        }

        if (!difficulty.trim()) {
            alert("난이도를 입력하세요.");
            return;
        }

        if (!validateDueDate()) {
            return;
        }

        try {
            setLoading(true);

            const data = await generateAIAssignment({
                topic: topic.trim(),
                difficulty,
                additionalRequest: additionalRequest.trim(),
                dueDate: formatDateTimeForServer(dueDate),
            });

            setResult(data);
        } catch (error) {
            console.error(error);
            alert("AI 과제 생성에 실패했습니다. 로그인 상태 또는 권한을 확인해주세요.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!result) {
            alert("먼저 AI 과제를 생성하세요.");
            return;
        }

        if (!validateReservationTime()) {
            return;
        }

        try {
            setConfirming(true);

            const data = await confirmAIReservationTask(studyGroupId, {
                title: result.title,
                content: result.content,
                modelAnswer: result.modelAnswer,
                openAt: formatDateTimeForServer(openAt),
                closeAt: formatDateTimeForServer(closeAt),
            });

            alert(`${data.message}\n실시간 예약 과제 ID: ${data.reservationTaskId}`);

            if (onConfirmed) {
                await onConfirmed(data.reservationTaskId);
            }

            onClose();
        } catch (error) {
            console.error(error);
            alert("AI 제안 과제 출제 확정에 실패했습니다. 스터디장 권한 또는 API 경로를 확인해주세요.");
        } finally {
            setConfirming(false);
        }
    };

    const handleClose = () => {
        if (loading || confirming) return;
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="study-modal ai-assignment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <p className="modal-label">AI Assignment</p>
                        <h2>AI 과제 출제</h2>
                    </div>

                    <button className="modal-close-btn" onClick={handleClose}>
                        ×
                    </button>
                </div>

                <div className="modal-form">
                    <label>
                        과제 주제
                        <input
                            type="text"
                            placeholder="예: 자바 인터페이스와 추상클래스"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </label>

                    <label>
                        난이도
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            <option value="하">하</option>
                            <option value="중">중</option>
                            <option value="상">상</option>
                        </select>
                    </label>

                    <label>
                        AI 과제 생성용 마감기한
                        <input
                            type="datetime-local"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </label>

                    <label>
                        추가 요청사항
                        <textarea
                            placeholder="예: 실생활 예시를 들어서 문제를 내주고, 코드 블록을 포함해줘."
                            value={additionalRequest}
                            onChange={(e) => setAdditionalRequest(e.target.value)}
                        />
                    </label>
                </div>

                <div className="modal-actions">
                    <button className="modal-cancel-btn" onClick={handleClose}>
                        닫기
                    </button>

                    <button
                        className="modal-submit-btn"
                        onClick={handleGenerate}
                        disabled={loading || confirming}
                    >
                        {loading ? "생성 중..." : "AI 과제 생성"}
                    </button>
                </div>

                {result && (
                    <div className="ai-result-box">
                        <h3>{result.title}</h3>

                        <div className="ai-result-section">
                            <strong>과제 내용</strong>
                            <p style={{ whiteSpace: "pre-wrap" }}>{result.content}</p>
                        </div>

                        <div className="ai-result-section">
                            <strong>모범 답안</strong>
                            <p style={{ whiteSpace: "pre-wrap" }}>{result.modelAnswer}</p>
                        </div>

                        <div className="modal-form">
                            <label>
                                문제 공개 시간
                                <input
                                    type="datetime-local"
                                    value={openAt}
                                    onChange={(e) => setOpenAt(e.target.value)}
                                />
                            </label>

                            <label>
                                문제 마감 시간
                                <input
                                    type="datetime-local"
                                    value={closeAt}
                                    onChange={(e) => setCloseAt(e.target.value)}
                                />
                            </label>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="modal-submit-btn"
                                onClick={handleConfirm}
                                disabled={confirming}
                            >
                                {confirming ? "등록 중..." : "AI 제안 과제 출제 확정"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAssignmentModal;