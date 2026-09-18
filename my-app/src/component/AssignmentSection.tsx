import React from "react";
import type { Assignment } from "../types/assignment";

type AssignmentSectionProps = {
    assignments: Assignment[];
    loading: boolean;
    isLeader: boolean;
    onOpenSubmitModal: (assignment: Assignment) => void;
    onOpenSubmissionListModal: (assignment: Assignment) => void;
    onOpenAllAssignmentModal: () => void;
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

const AssignmentSection: React.FC<AssignmentSectionProps> = ({
    assignments,
    loading,
    isLeader,
    onOpenSubmitModal,
    onOpenSubmissionListModal,
    onOpenAllAssignmentModal,
}) => {
    return (
        <div className="content-card large">
            <div className="card-title-row">
                <h3>진행중 과제</h3>
                <button type="button" onClick={onOpenAllAssignmentModal}>
                    전체보기
                </button>
            </div>

            <div className="assignment-list">
                {loading && (
                    <p className="empty-text">과제 목록을 불러오는 중...</p>
                )}

                {!loading && assignments.length === 0 && (
                    <p className="empty-text">
                        마감기한이 지나지 않은 진행중 과제가 없습니다.
                    </p>
                )}

                {!loading &&
                    assignments.map((assignment) => {
                        const isGraded =
                            assignment.score !== null &&
                            assignment.score !== undefined;

                        return (
                            <div className="assignment-item" key={assignment.id}>
                                <div className="assignment-info">
                                    <p className="assignment-title">
                                        {assignment.title}
                                    </p>

                                    <span className="assignment-due">
                                        마감일: {assignment.due}
                                    </span>

                                    <p className="assignment-content-preview">
                                        {assignment.content}
                                    </p>

                                    {!isLeader && assignment.status === "제출완료" && (
                                        <div style={styles.mySubmitBox}>
                                            <div style={styles.mySubmitHeader}>
                                                <strong>내 제출 현황</strong>

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
                                </div>

                                <div className="assignment-right">
                                    <span className={`status-badge ${assignment.status}`}>
                                        {assignment.status}
                                    </span>

                                    {isLeader ? (
                                        <button
                                            className="assignment-submit-btn"
                                            onClick={() =>
                                                onOpenSubmissionListModal(assignment)
                                            }
                                        >
                                            제출 확인
                                        </button>
                                    ) : (
                                        <button
                                            className="assignment-submit-btn"
                                            onClick={() => onOpenSubmitModal(assignment)}
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
    );
};

const styles: Record<string, React.CSSProperties> = {
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

export default AssignmentSection;