import React from "react";
import type { Assignment } from "../types/assignment";

type AssignmentAllModalProps = {
    assignments: Assignment[];
    loading: boolean;
    isLeader: boolean;
    onClose: () => void;
    onOpenSubmitModal: (assignment: Assignment) => void;
    onOpenSubmissionListModal: (assignment: Assignment) => void;
};

const getStatusStyle = (status: Assignment["status"]): React.CSSProperties => {
    if (status === "제출완료") {
        return {
            backgroundColor: "#dcfce7",
            color: "#166534",
        };
    }

    if (status === "마감") {
        return {
            backgroundColor: "#f3f4f6",
            color: "#4b5563",
        };
    }

    return {
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
    };
};

const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const AssignmentAllModal: React.FC<AssignmentAllModalProps> = ({
    assignments,
    loading,
    isLeader,
    onClose,
    onOpenSubmitModal,
    onOpenSubmissionListModal,
}) => {
    const activeAssignments = assignments.filter(
        (assignment) => assignment.status !== "마감"
    );

    const expiredAssignments = assignments.filter(
        (assignment) => assignment.status === "마감"
    );

    const submittedActiveCount = activeAssignments.filter(
        (assignment) => assignment.status === "제출완료"
    ).length;

    const progressPercent =
        activeAssignments.length === 0
            ? 0
            : Math.round((submittedActiveCount / activeAssignments.length) * 100);

    const handleSubmitClick = (assignment: Assignment) => {
        onClose();
        onOpenSubmitModal(assignment);
    };

    const handleSubmissionListClick = (assignment: Assignment) => {
        onClose();
        onOpenSubmissionListModal(assignment);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="study-modal submission-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div>
                        <p className="modal-label">All Assignments</p>
                        <h2>전체 과제 보기</h2>
                    </div>

                    <button className="modal-close-btn" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div style={styles.summaryGrid}>
                    <div style={styles.summaryBox}>
                        <strong>{assignments.length}개</strong>
                        <span>전체 과제</span>
                    </div>

                    <div style={styles.summaryBox}>
                        <strong>{activeAssignments.length}개</strong>
                        <span>진행중 과제</span>
                    </div>

                    <div style={styles.summaryBox}>
                        <strong>{expiredAssignments.length}개</strong>
                        <span>마감된 과제</span>
                    </div>

                    <div style={styles.summaryBox}>
                        <strong>{progressPercent}%</strong>
                        <span>제출 진행률</span>
                    </div>
                </div>

                <div className="submission-list">
                    {loading && (
                        <p className="empty-text">전체 과제를 불러오는 중...</p>
                    )}

                    {!loading && assignments.length === 0 && (
                        <p className="empty-text">아직 등록된 과제가 없습니다.</p>
                    )}

                    {!loading &&
                        assignments.map((assignment) => {
                            const isGraded =
                                assignment.score !== null &&
                                assignment.score !== undefined;

                            return (
                                <div className="submission-item" key={assignment.id}>
                                    <div className="submission-header">
                                        <div>
                                            <strong>{assignment.title}</strong>

                                            <p
                                                style={{
                                                    margin: "6px 0 0",
                                                    color: "#6b7280",
                                                    fontSize: "13px",
                                                }}
                                            >
                                                마감일: {assignment.due}
                                            </p>
                                        </div>

                                        <span
                                            className="status-badge"
                                            style={getStatusStyle(assignment.status)}
                                        >
                                            {assignment.status}
                                        </span>
                                    </div>

                                    <p>{assignment.content}</p>

                                    {!isLeader && assignment.status === "제출완료" && (
                                        <div style={styles.mySubmitBox}>
                                            <div style={styles.mySubmitHeader}>
                                                <strong>내 제출 / 채점 결과</strong>

                                                <span
                                                    style={{
                                                        ...styles.gradeBadge,
                                                        ...(isGraded
                                                            ? styles.gradeComplete
                                                            : styles.gradeWaiting),
                                                    }}
                                                >
                                                    {isGraded ? "채점 완료" : "채점 대기"}
                                                </span>
                                            </div>

                                            <p style={styles.submitMeta}>
                                                제출일: {formatDate(assignment.submitDate)}
                                            </p>

                                            {assignment.submittedContent && (
                                                <p style={styles.submittedContent}>
                                                    {assignment.submittedContent}
                                                </p>
                                            )}

                                            {isGraded ? (
                                                <div style={styles.gradeResultBox}>
                                                    <p style={styles.scoreText}>
                                                        점수:{" "}
                                                        <strong>{assignment.score}점</strong>
                                                    </p>

                                                    <p style={styles.feedbackText}>
                                                        피드백:{" "}
                                                        {assignment.feedback?.trim()
                                                            ? assignment.feedback
                                                            : "등록된 피드백이 없습니다."}
                                                    </p>

                                                    <p style={styles.gradedAt}>
                                                        채점일:{" "}
                                                        {formatDate(assignment.gradedAt)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p style={styles.waitingText}>
                                                    아직 스터디장이 채점하지 않았습니다.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div style={styles.actionRow}>
                                        {isLeader ? (
                                            <button
                                                type="button"
                                                className="assignment-submit-btn"
                                                onClick={() =>
                                                    handleSubmissionListClick(assignment)
                                                }
                                            >
                                                제출 확인
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="assignment-submit-btn"
                                                onClick={() =>
                                                    handleSubmitClick(assignment)
                                                }
                                                disabled={
                                                    assignment.status === "마감" ||
                                                    assignment.status === "제출완료"
                                                }
                                            >
                                                {assignment.status === "제출완료"
                                                    ? "제출 완료"
                                                    : assignment.status === "마감"
                                                        ? "마감"
                                                        : "제출"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    summaryGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "10px",
        marginBottom: "18px",
    },
    summaryBox: {
        backgroundColor: "#f8faff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        textAlign: "center",
    },
    actionRow: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: "12px",
    },
    mySubmitBox: {
        marginTop: "12px",
        padding: "12px",
        borderRadius: "12px",
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    mySubmitHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
    },
    gradeBadge: {
        borderRadius: "999px",
        padding: "5px 9px",
        fontSize: "12px",
        fontWeight: 800,
        whiteSpace: "nowrap",
    },
    gradeComplete: {
        backgroundColor: "#ecfdf5",
        color: "#047857",
    },
    gradeWaiting: {
        backgroundColor: "#fff7ed",
        color: "#c2410c",
    },
    submitMeta: {
        margin: 0,
        color: "#6b7280",
        fontSize: "12px",
    },
    submittedContent: {
        margin: 0,
        color: "#374151",
        fontSize: "13px",
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
    },
    gradeResultBox: {
        padding: "10px",
        borderRadius: "10px",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
    },
    scoreText: {
        margin: "0 0 6px",
        color: "#111827",
        fontSize: "13px",
    },
    feedbackText: {
        margin: "0 0 6px",
        color: "#374151",
        fontSize: "13px",
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
    },
    gradedAt: {
        margin: 0,
        color: "#6b7280",
        fontSize: "12px",
    },
    waitingText: {
        margin: 0,
        color: "#c2410c",
        fontSize: "13px",
        fontWeight: 700,
    },
};

export default AssignmentAllModal;