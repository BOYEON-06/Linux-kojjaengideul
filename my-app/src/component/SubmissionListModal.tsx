import React from "react";
import type { Assignment } from "../types/assignment";
import type { Submission } from "../types/submission";

type GradeForm = {
    score: string;
    feedback: string;
};

type SubmissionListModalProps = {
    assignment: Assignment;
    submissions: Submission[];
    loading: boolean;
    gradeForms: Record<number, GradeForm>;
    gradingSubmissionId: number | null;
    onClose: () => void;
    onGradeFormChange: (
        submissionId: number,
        field: keyof GradeForm,
        value: string
    ) => void;
    onGradeSubmission: (submissionId: number) => Promise<void>;
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

const SubmissionListModal: React.FC<SubmissionListModalProps> = ({
    assignment,
    submissions,
    loading,
    gradeForms,
    gradingSubmissionId,
    onClose,
    onGradeFormChange,
    onGradeSubmission,
}) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="study-modal submission-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div>
                        <p className="modal-label">Submissions</p>
                        <h2>과제 제출 확인 및 채점</h2>
                    </div>

                    <button className="modal-close-btn" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="assignment-detail-box">
                    <h3>{assignment.title}</h3>
                    <p>{assignment.content}</p>
                    <span>마감일: {assignment.due}</span>
                </div>

                <div className="submission-list">
                    {loading && (
                        <p className="empty-text">제출 목록을 불러오는 중...</p>
                    )}

                    {!loading && submissions.length === 0 && (
                        <p className="empty-text">
                            아직 제출한 스터디원이 없습니다.
                        </p>
                    )}

                    {!loading &&
                        submissions.map((submission) => {
                            const form = gradeForms[submission.submissionId] ?? {
                                score:
                                    submission.score !== null &&
                                        submission.score !== undefined
                                        ? String(submission.score)
                                        : "",
                                feedback: submission.feedback ?? "",
                            };

                            const isGrading =
                                gradingSubmissionId === submission.submissionId;

                            return (
                                <div
                                    className="submission-item"
                                    key={submission.submissionId}
                                    style={styles.submissionItem}
                                >
                                    <div className="submission-header">
                                        <div>
                                            <strong>{submission.memberName}</strong>
                                            <p style={styles.submittedAt}>
                                                제출일: {formatDate(submission.submittedAt)}
                                            </p>
                                        </div>

                                        <span
                                            style={{
                                                ...styles.gradeBadge,
                                                ...(submission.score !== null &&
                                                    submission.score !== undefined
                                                    ? styles.gradeComplete
                                                    : styles.gradeWaiting),
                                            }}
                                        >
                                            {submission.score !== null &&
                                                submission.score !== undefined
                                                ? `${submission.score}점`
                                                : "미채점"}
                                        </span>
                                    </div>

                                    <div style={styles.answerBox}>
                                        {submission.content}
                                    </div>

                                    <div style={styles.gradeForm}>
                                        <label style={styles.label}>
                                            점수
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={form.score}
                                                onChange={(event) =>
                                                    onGradeFormChange(
                                                        submission.submissionId,
                                                        "score",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="0~100"
                                                style={styles.scoreInput}
                                            />
                                        </label>

                                        <label style={styles.label}>
                                            피드백
                                            <textarea
                                                value={form.feedback}
                                                onChange={(event) =>
                                                    onGradeFormChange(
                                                        submission.submissionId,
                                                        "feedback",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="피드백을 입력하세요."
                                                style={styles.feedbackInput}
                                            />
                                        </label>

                                        <button
                                            type="button"
                                            style={styles.gradeButton}
                                            disabled={isGrading}
                                            onClick={() =>
                                                onGradeSubmission(submission.submissionId)
                                            }
                                        >
                                            {isGrading ? "채점 중..." : "채점 완료"}
                                        </button>
                                    </div>

                                    {submission.gradedAt && (
                                        <p style={styles.gradedAt}>
                                            최근 채점일: {formatDate(submission.gradedAt)}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    submissionItem: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    submittedAt: {
        margin: "4px 0 0",
        color: "#6b7280",
        fontSize: "13px",
    },
    gradeBadge: {
        borderRadius: "999px",
        padding: "6px 10px",
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
    answerBox: {
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "12px",
        color: "#374151",
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
    },
    gradeForm: {
        display: "grid",
        gridTemplateColumns: "120px 1fr auto",
        gap: "12px",
        alignItems: "end",
    },
    label: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        color: "#374151",
        fontSize: "13px",
        fontWeight: 700,
    },
    scoreInput: {
        height: "40px",
        border: "1px solid #d1d5db",
        borderRadius: "10px",
        padding: "0 10px",
        outline: "none",
    },
    feedbackInput: {
        minHeight: "40px",
        border: "1px solid #d1d5db",
        borderRadius: "10px",
        padding: "10px",
        resize: "vertical",
        outline: "none",
        fontFamily: "inherit",
    },
    gradeButton: {
        height: "40px",
        border: "none",
        backgroundColor: "#800020",
        color: "#ffffff",
        borderRadius: "10px",
        padding: "0 16px",
        fontWeight: 800,
        cursor: "pointer",
        whiteSpace: "nowrap",
    },
    gradedAt: {
        margin: 0,
        color: "#6b7280",
        fontSize: "12px",
    },
};

export default SubmissionListModal;