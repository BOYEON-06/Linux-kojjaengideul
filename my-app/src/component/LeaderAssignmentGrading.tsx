import { useEffect, useState } from "react";
import {
    getLeaderAssignments,
    gradeSubmission,
    type AssignmentSubmissionItem,
    type LeaderAssignmentItem,
} from "../api/assignmentAPI";

type GradeFormState = {
    score: string;
    feedback: string;
};

function formatDate(dateString: string | null) {
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
}

function LeaderAssignmentGrading() {
    const [leaderAssignments, setLeaderAssignments] = useState<LeaderAssignmentItem[]>([]);
    const [gradeForms, setGradeForms] = useState<Record<number, GradeFormState>>({});
    const [loading, setLoading] = useState(true);
    const [gradingId, setGradingId] = useState<number | null>(null);
    const [error, setError] = useState("");

    const loadLeaderAssignments = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getLeaderAssignments();
            setLeaderAssignments(data);

            const initialForms: Record<number, GradeFormState> = {};

            data.forEach((study) => {
                study.assignmentGroup.forEach((group) => {
                    group.submissions.forEach((submission) => {
                        initialForms[submission.submissionId] = {
                            score:
                                submission.score !== null && submission.score !== undefined
                                    ? String(submission.score)
                                    : "",
                            feedback: submission.feedback ?? "",
                        };
                    });
                });
            });

            setGradeForms(initialForms);
        } catch (err) {
            console.error(err);
            setError(
                err instanceof Error
                    ? err.message
                    : "스터디원이 제출한 과제 목록을 불러오지 못했습니다."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeaderAssignments();
    }, []);

    const handleFormChange = (
        submissionId: number,
        field: keyof GradeFormState,
        value: string
    ) => {
        setGradeForms((prev) => ({
            ...prev,
            [submissionId]: {
                ...prev[submissionId],
                [field]: value,
            },
        }));
    };

    const handleGradeSubmit = async (submission: AssignmentSubmissionItem) => {
        const form = gradeForms[submission.submissionId];

        if (!form) {
            alert("채점 정보를 입력하세요.");
            return;
        }

        const score = Number(form.score);

        if (Number.isNaN(score)) {
            alert("점수는 숫자로 입력해야 합니다.");
            return;
        }

        if (score < 0 || score > 100) {
            alert("점수는 0점 이상 100점 이하로 입력하세요.");
            return;
        }

        if (!form.feedback.trim()) {
            alert("피드백을 입력하세요.");
            return;
        }

        try {
            setGradingId(submission.submissionId);

            const result = await gradeSubmission(submission.submissionId, {
                score,
                feedback: form.feedback.trim(),
            });

            alert(result.message || "채점이 완료되었습니다.");
            await loadLeaderAssignments();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "채점에 실패했습니다.");
        } finally {
            setGradingId(null);
        }
    };

    if (loading) {
        return <div style={styles.messageBox}>제출된 과제를 불러오는 중입니다...</div>;
    }

    if (error) {
        return (
            <div style={styles.messageBox}>
                <p style={styles.errorText}>{error}</p>
                <button style={styles.retryButton} onClick={loadLeaderAssignments}>
                    다시 불러오기
                </button>
            </div>
        );
    }

    if (leaderAssignments.length === 0) {
        return (
            <div style={styles.messageBox}>
                아직 스터디원이 제출한 과제가 없습니다.
            </div>
        );
    }

    return (
        <section style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>스터디원이 제출한 과제 채점</h2>
                    <p style={styles.description}>
                        스터디장이 출제한 과제별 제출 내역을 확인하고 점수와 피드백을 남길 수 있습니다.
                    </p>
                </div>

                <button style={styles.refreshButton} onClick={loadLeaderAssignments}>
                    새로고침
                </button>
            </div>

            <div style={styles.studyList}>
                {leaderAssignments.map((study) => (
                    <article key={study.studyGroupId} style={styles.studyCard}>
                        <div style={styles.studyHeader}>
                            <h3 style={styles.studyTitle}>{study.studyTitle}</h3>
                            <span style={styles.studyBadge}>스터디 ID {study.studyGroupId}</span>
                        </div>

                        {study.assignmentGroup.length === 0 ? (
                            <p style={styles.emptyText}>출제한 과제가 없습니다.</p>
                        ) : (
                            <div style={styles.assignmentList}>
                                {study.assignmentGroup.map((group) => (
                                    <div
                                        key={group.assignment.assignmentId}
                                        style={styles.assignmentCard}
                                    >
                                        <div style={styles.assignmentHeader}>
                                            <div>
                                                <h4 style={styles.assignmentTitle}>
                                                    {group.assignment.title}
                                                </h4>
                                                <p style={styles.assignmentContent}>
                                                    {group.assignment.content}
                                                </p>
                                            </div>

                                            <div style={styles.assignmentMeta}>
                                                <span>
                                                    마감일: {formatDate(group.assignment.dueDate)}
                                                </span>
                                                <span>
                                                    제출 수: {group.submissions.length}명
                                                </span>
                                            </div>
                                        </div>

                                        {group.submissions.length === 0 ? (
                                            <p style={styles.emptyText}>
                                                아직 제출한 스터디원이 없습니다.
                                            </p>
                                        ) : (
                                            <div style={styles.submissionList}>
                                                {group.submissions.map((submission) => {
                                                    const form = gradeForms[submission.submissionId] ?? {
                                                        score: "",
                                                        feedback: "",
                                                    };

                                                    const isGrading =
                                                        gradingId === submission.submissionId;

                                                    return (
                                                        <div
                                                            key={submission.submissionId}
                                                            style={styles.submissionCard}
                                                        >
                                                            <div style={styles.submissionHeader}>
                                                                <div>
                                                                    <strong style={styles.memberName}>
                                                                        {submission.memberName}
                                                                    </strong>
                                                                    <p style={styles.submittedAt}>
                                                                        제출일:{" "}
                                                                        {formatDate(
                                                                            submission.submittedAt
                                                                        )}
                                                                    </p>
                                                                </div>

                                                                <span
                                                                    style={{
                                                                        ...styles.gradeBadge,
                                                                        ...(submission.score !== null
                                                                            ? styles.gradeComplete
                                                                            : styles.gradeWaiting),
                                                                    }}
                                                                >
                                                                    {submission.score !== null
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
                                                                            handleFormChange(
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
                                                                            handleFormChange(
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
                                                                    style={styles.submitButton}
                                                                    disabled={isGrading}
                                                                    onClick={() =>
                                                                        handleGradeSubmit(submission)
                                                                    }
                                                                >
                                                                    {isGrading ? "채점 중..." : "채점 완료"}
                                                                </button>
                                                            </div>

                                                            {submission.gradedAt && (
                                                                <p style={styles.gradedAt}>
                                                                    최근 채점일:{" "}
                                                                    {formatDate(submission.gradedAt)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
    },
    title: {
        margin: 0,
        fontSize: "24px",
        fontWeight: 800,
        color: "#1f2937",
    },
    description: {
        margin: "8px 0 0",
        color: "#6b7280",
        fontSize: "14px",
    },
    refreshButton: {
        border: "1px solid #800020",
        backgroundColor: "#ffffff",
        color: "#800020",
        borderRadius: "10px",
        padding: "10px 14px",
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
    },
    studyList: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    studyCard: {
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "18px",
        padding: "22px",
        boxShadow: "0 12px 28px rgba(0, 0, 0, 0.06)",
    },
    studyHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        marginBottom: "16px",
    },
    studyTitle: {
        margin: 0,
        color: "#800020",
        fontSize: "20px",
        fontWeight: 800,
    },
    studyBadge: {
        backgroundColor: "#fdf2f5",
        color: "#800020",
        borderRadius: "999px",
        padding: "6px 10px",
        fontSize: "12px",
        fontWeight: 700,
    },
    assignmentList: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    assignmentCard: {
        backgroundColor: "#fafafa",
        border: "1px solid #eeeeee",
        borderRadius: "14px",
        padding: "18px",
    },
    assignmentHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
        marginBottom: "14px",
    },
    assignmentTitle: {
        margin: 0,
        color: "#111827",
        fontSize: "17px",
        fontWeight: 800,
    },
    assignmentContent: {
        margin: "8px 0 0",
        color: "#4b5563",
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
    },
    assignmentMeta: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        color: "#6b7280",
        fontSize: "13px",
        textAlign: "right",
        whiteSpace: "nowrap",
    },
    submissionList: {
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },
    submissionCard: {
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "16px",
    },
    submissionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        marginBottom: "12px",
    },
    memberName: {
        color: "#111827",
        fontSize: "16px",
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
        marginBottom: "14px",
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
    submitButton: {
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
        margin: "10px 0 0",
        color: "#6b7280",
        fontSize: "12px",
    },
    emptyText: {
        margin: 0,
        color: "#9ca3af",
        fontSize: "14px",
    },
    messageBox: {
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "24px",
        color: "#6b7280",
        textAlign: "center",
    },
    errorText: {
        color: "#dc2626",
        margin: "0 0 12px",
    },
    retryButton: {
        border: "none",
        backgroundColor: "#800020",
        color: "#ffffff",
        borderRadius: "10px",
        padding: "10px 14px",
        fontWeight: 700,
        cursor: "pointer",
    },
};

export default LeaderAssignmentGrading;