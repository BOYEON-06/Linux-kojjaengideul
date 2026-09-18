import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

import {
    createStudy,
    getMyStudyList,
    joinStudy,
    type StudyListItem,
} from "../api/studyAPI";

import {
    createManualAssignment,
    getAssignmentSubmissions,
    getLeaderAssignments,
    getMyAssignments,
    gradeSubmission,
    submitAssignment,
    type AssignmentSubmissionItem,
    type LeaderAssignmentItem,
    type MyAssignmentItem,
} from "../api/assignmentAPI";

import { LoginRequiredError } from "../api/client";

import Sidebar from "../component/Sidebar";
import Header from "../component/Header";
import HeroSection from "../component/HeroSection";
import AssignmentSection from "../component/AssignmentSection";
import ExpiredAssignmentSection from "../component/ExpiredAssignmentSection";
import AssignmentAllModal from "../component/AssignmentAllModal";
import ActivitySection from "../component/ActivitySection";
import CreateStudyModal from "../component/CreateStudyModal";
import JoinStudyModal from "../component/JoinStudyModal";
import AIAssignmentModal from "../component/AIAssignmentModal";
import ManualAssignmentModal from "../component/ManualAssignmentModal";
import SubmitAssignmentModal from "../component/SubmitAssignmentModal";
import SubmissionListModal from "../component/SubmissionListModal";
import StudyChatSection from "../component/StudyChatSection";

import type { Study } from "../types/study";
import type { Assignment } from "../types/assignment";
import type { Submission } from "../types/submission";

type GradeForm = {
    score: string;
    feedback: string;
};

const Home: React.FC = () => {
    const navigate = useNavigate();

    const [authChecking, setAuthChecking] = useState(true);
    const [isLogin, setIsLogin] = useState(false);

    const [studies, setStudies] = useState<Study[]>([]);
    const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
    const [studyListLoading, setStudyListLoading] = useState(false);

    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [selectedAssignment, setSelectedAssignment] =
        useState<Assignment | null>(null);
    const [assignmentLoading, setAssignmentLoading] = useState(false);

    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [submissionLoading, setSubmissionLoading] = useState(false);

    const [leaderAssignments, setLeaderAssignments] = useState<
        LeaderAssignmentItem[]
    >([]);
    const [leaderAssignmentLoading, setLeaderAssignmentLoading] =
        useState(false);
    const [gradeForms, setGradeForms] = useState<Record<number, GradeForm>>({});
    const [gradingSubmissionId, setGradingSubmissionId] = useState<
        number | null
    >(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isAIAssignmentModalOpen, setIsAIAssignmentModalOpen] =
        useState(false);
    const [isManualAssignmentModalOpen, setIsManualAssignmentModalOpen] =
        useState(false);
    const [isSubmitAssignmentModalOpen, setIsSubmitAssignmentModalOpen] =
        useState(false);
    const [isSubmissionListModalOpen, setIsSubmissionListModalOpen] =
        useState(false);
    const [isAllAssignmentModalOpen, setIsAllAssignmentModalOpen] =
        useState(false);

    const convertStudy = (study: StudyListItem): Study => {
        const savedUser = localStorage.getItem("user");
        const user = savedUser ? JSON.parse(savedUser) : null;

        return {
            id: study.id,
            name: study.title,
            role: user?.name === study.creatorName ? "스터디장" : "스터디원",
            description: study.description,
            inviteCode: study.inviteCode,
            creatorName: study.creatorName,
        };
    };

    const convertAssignment = (assignment: MyAssignmentItem): Assignment => {
        let status: Assignment["status"] = "미제출";

        if (assignment.isExpired) {
            status = "마감";
        } else if (assignment.isSubmitted) {
            status = "제출완료";
        }

        return {
            id: assignment.assignmentId,
            studyId: assignment.studyId,
            title: assignment.title,
            content: assignment.content,
            due: assignment.dueDate,
            status,
            submittedContent: assignment.submittedContent ?? null,
            submitDate: assignment.submitDate ?? null,
            score: assignment.score ?? null,
            feedback: assignment.feedback ?? null,
            gradedAt: assignment.gradedAt ?? null,
        };
    };

    const convertSubmission = (
        submission: AssignmentSubmissionItem
    ): Submission => {
        return {
            submissionId: submission.submissionId,
            memberId: submission.memberId,
            memberName: submission.memberName,
            content: submission.content,
            submittedAt: submission.submittedAt,
            score: submission.score ?? null,
            feedback: submission.feedback ?? "",
            gradedAt: submission.gradedAt ?? null,
        };
    };

    const fetchMyStudyList = async () => {
        try {
            setStudyListLoading(true);

            const data = await getMyStudyList();
            const convertedStudies = data.map(convertStudy);

            setStudies(convertedStudies);

            if (convertedStudies.length > 0) {
                setSelectedStudy((prev) => prev ?? convertedStudies[0]);
            } else {
                setSelectedStudy(null);
            }

            return convertedStudies;
        } catch (error) {
            console.error(error);

            if (error instanceof LoginRequiredError) {
                throw error;
            }

            alert("내 스터디 목록을 불러오지 못했습니다.");
            return [];
        } finally {
            setStudyListLoading(false);
        }
    };

    const fetchMyAssignments = async () => {
        try {
            setAssignmentLoading(true);

            const data = await getMyAssignments();
            const convertedAssignments = data.map(convertAssignment);

            setAssignments(convertedAssignments);
        } catch (error) {
            console.error(error);
            setAssignments([]);

            if (error instanceof LoginRequiredError) {
                console.warn(
                    "과제 목록 API가 인증 실패를 반환했습니다. 하지만 스터디 목록 API가 성공했다면 Home 화면은 유지합니다."
                );
                return;
            }

            alert("과제 목록을 불러오지 못했습니다. Home 화면은 유지합니다.");
        } finally {
            setAssignmentLoading(false);
        }
    };

    const fetchLeaderAssignments = async () => {
        try {
            setLeaderAssignmentLoading(true);

            const data = await getLeaderAssignments();
            setLeaderAssignments(data);

            const nextGradeForms: Record<number, GradeForm> = {};

            data.forEach((study) => {
                study.assignmentGroup.forEach((group) => {
                    group.submissions.forEach((submission) => {
                        nextGradeForms[submission.submissionId] = {
                            score:
                                submission.score !== null &&
                                    submission.score !== undefined
                                    ? String(submission.score)
                                    : "",
                            feedback: submission.feedback ?? "",
                        };
                    });
                });
            });

            setGradeForms(nextGradeForms);
        } catch (error) {
            console.error(error);
            setLeaderAssignments([]);

            if (error instanceof LoginRequiredError) {
                console.warn(
                    "스터디장 과제 API가 인증 실패를 반환했습니다. Home 화면은 유지합니다."
                );
                return;
            }

            console.warn(
                "스터디장 과제 목록을 불러오지 못했습니다. Home 화면은 유지합니다."
            );
        } finally {
            setLeaderAssignmentLoading(false);
        }
    };

    const restoreLoginAndFetchInitialData = async () => {
        try {
            setAuthChecking(true);

            console.log("새로고침 로그인 복구 시작");
            console.log("복구 요청 전 document.cookie:", document.cookie);
            console.log(
                "복구 요청 전 localStorage user:",
                localStorage.getItem("user")
            );

            const loadedStudies = await fetchMyStudyList();

            setIsLogin(true);
            setAuthChecking(false);

            console.log("스터디 목록 API 성공 → 로그인 성공으로 판단");
            console.log("Home 화면 먼저 진입 후 나머지 API 호출 시작");

            fetchMyAssignments();

            const firstStudy = loadedStudies[0];

            if (firstStudy?.role === "스터디장") {
                fetchLeaderAssignments();
            }
        } catch (error) {
            console.error("로그인 복구 실패:", error);

            localStorage.removeItem("user");
            setIsLogin(false);
            setAuthChecking(false);

            navigate("/", { replace: true });
        }
    };

    const fetchAssignmentSubmissions = async (assignment: Assignment) => {
        if (!selectedStudy) return;

        try {
            setSubmissionLoading(true);

            const data = await getAssignmentSubmissions(
                selectedStudy.id,
                assignment.id
            );

            const convertedSubmissions = data.map(convertSubmission);

            setSubmissions(convertedSubmissions);

            const nextGradeForms: Record<number, GradeForm> = {};

            convertedSubmissions.forEach((submission) => {
                nextGradeForms[submission.submissionId] = {
                    score:
                        submission.score !== null &&
                            submission.score !== undefined
                            ? String(submission.score)
                            : "",
                    feedback: submission.feedback ?? "",
                };
            });

            setGradeForms(nextGradeForms);
        } catch (error) {
            console.error(error);

            if (error instanceof LoginRequiredError) {
                alert("제출 목록을 보려면 로그인이 필요합니다.");
                return;
            }

            alert(
                "제출 목록을 불러오지 못했습니다. 로그인 상태 또는 권한을 확인해주세요."
            );
        } finally {
            setSubmissionLoading(false);
        }
    };

    useEffect(() => {
        restoreLoginAndFetchInitialData();
    }, []);

    const selectedAllAssignments = selectedStudy
        ? assignments.filter((assignment) => assignment.studyId === selectedStudy.id)
        : [];

    const selectedActiveAssignments = selectedAllAssignments.filter(
        (assignment) => assignment.status !== "마감"
    );

    const selectedExpiredAssignments = selectedAllAssignments.filter(
        (assignment) => assignment.status === "마감"
    );

    const submittedActiveAssignmentCount = selectedActiveAssignments.filter(
        (assignment) => assignment.status === "제출완료"
    ).length;

    const activeAssignmentCount = selectedActiveAssignments.length;

    const progressPercent =
        activeAssignmentCount === 0
            ? 0
            : Math.round(
                (submittedActiveAssignmentCount / activeAssignmentCount) * 100
            );

    const selectedLeaderAssignmentGroups =
        selectedStudy && selectedStudy.role === "스터디장"
            ? leaderAssignments.find(
                (item) => item.studyGroupId === selectedStudy.id
            )?.assignmentGroup ?? []
            : [];

    const handleCreateStudy = async (title: string, description: string) => {
        const result = await createStudy({
            title,
            description,
        });

        alert(`${result.message}\n초대코드: ${result.inviteCode}`);

        await fetchMyStudyList();
    };

    const handleJoinStudy = async (inviteCode: string) => {
        const result = await joinStudy({
            inviteCode,
        });

        alert(result.message);

        const loadedStudies = await fetchMyStudyList();
        await fetchMyAssignments();

        const joinedOrFirstStudy =
            loadedStudies.find((study) => study.name === result.studyTitle) ??
            loadedStudies[0];

        if (joinedOrFirstStudy?.role === "스터디장") {
            await fetchLeaderAssignments();
        }
    };

    const handleShareInviteCode = async () => {
        if (!selectedStudy) {
            alert("스터디를 먼저 선택하세요.");
            return;
        }

        if (!selectedStudy.inviteCode) {
            alert("초대코드가 없습니다.");
            return;
        }

        try {
            await navigator.clipboard.writeText(selectedStudy.inviteCode);
            alert(`초대코드가 복사되었습니다.\n${selectedStudy.inviteCode}`);
        } catch (error) {
            console.error(error);
            alert(`초대코드: ${selectedStudy.inviteCode}`);
        }
    };

    const checkStudyLeader = () => {
        if (!selectedStudy) {
            alert("스터디를 먼저 선택하세요.");
            return false;
        }

        if (selectedStudy.role !== "스터디장") {
            alert("스터디장만 사용할 수 있는 기능입니다.");
            return false;
        }

        return true;
    };

    const handleOpenAIAssignmentModal = () => {
        if (!checkStudyLeader()) return;
        setIsAIAssignmentModalOpen(true);
    };

    const handleOpenManualAssignmentModal = () => {
        if (!checkStudyLeader()) return;
        setIsManualAssignmentModalOpen(true);
    };

    const handleCreateManualAssignment = async (
        title: string,
        content: string,
        dueDate: string
    ) => {
        if (!selectedStudy) return;

        const result = await createManualAssignment(selectedStudy.id, {
            title,
            content,
            dueDate,
        });

        alert(`${result.message}\n마감일: ${result.dueDate}`);

        await fetchMyAssignments();

        if (selectedStudy.role === "스터디장") {
            await fetchLeaderAssignments();
        }
    };

    const handleOpenSubmitModal = (assignment: Assignment) => {
        if (assignment.status === "마감") {
            alert("마감된 과제는 제출할 수 없습니다.");
            return;
        }

        if (assignment.status === "제출완료") {
            alert("이미 제출한 과제입니다.");
            return;
        }

        setSelectedAssignment(assignment);
        setIsSubmitAssignmentModalOpen(true);
    };

    const handleSubmitAssignment = async (content: string) => {
        if (!selectedStudy || !selectedAssignment) return;

        const result = await submitAssignment(
            selectedStudy.id,
            selectedAssignment.id,
            { content }
        );

        alert(result.message);

        await fetchMyAssignments();

        if (selectedStudy.role === "스터디장") {
            await fetchLeaderAssignments();
        }
    };

    const handleOpenSubmissionListModal = async (assignment: Assignment) => {
        if (!checkStudyLeader()) return;

        setSelectedAssignment(assignment);
        setIsSubmissionListModalOpen(true);
        await fetchAssignmentSubmissions(assignment);
    };

    const handleGradeFormChange = (
        submissionId: number,
        field: keyof GradeForm,
        value: string
    ) => {
        setGradeForms((prev) => ({
            ...prev,
            [submissionId]: {
                score: prev[submissionId]?.score ?? "",
                feedback: prev[submissionId]?.feedback ?? "",
                [field]: value,
            },
        }));
    };

    const handleGradeSubmission = async (submissionId: number) => {
        const form = gradeForms[submissionId];

        if (!form) {
            alert("채점 정보를 입력해주세요.");
            return;
        }

        const score = Number(form.score);

        if (Number.isNaN(score)) {
            alert("점수는 숫자로 입력해주세요.");
            return;
        }

        if (score < 0 || score > 100) {
            alert("점수는 0점 이상 100점 이하로 입력해주세요.");
            return;
        }

        if (!form.feedback.trim()) {
            alert("피드백을 입력해주세요.");
            return;
        }

        try {
            setGradingSubmissionId(submissionId);

            const result = await gradeSubmission(submissionId, {
                score,
                feedback: form.feedback.trim(),
            });

            alert(result.message);

            await fetchLeaderAssignments();

            if (selectedAssignment) {
                await fetchAssignmentSubmissions(selectedAssignment);
            }
        } catch (error) {
            console.error(error);

            if (error instanceof LoginRequiredError) {
                alert("채점을 하려면 로그인이 필요합니다.");
                return;
            }

            alert("채점에 실패했습니다.");
        } finally {
            setGradingSubmissionId(null);
        }
    };

    if (authChecking) {
        return (
            <div className="home">
                <main className="main-content">
                    <p>로그인 상태를 확인하는 중입니다...</p>
                </main>
            </div>
        );
    }

    if (!isLogin) {
        return null;
    }

    return (
        <div className="home">
            <Sidebar
                studies={studies}
                selectedStudy={selectedStudy}
                loading={studyListLoading}
                onSelectStudy={setSelectedStudy}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
                onOpenJoinModal={() => setIsJoinModalOpen(true)}
            />

            <main className="main-content">
                <Header
                    selectedStudy={selectedStudy}
                    onShareInviteCode={handleShareInviteCode}
                    onOpenAIAssignmentModal={handleOpenAIAssignmentModal}
                    onOpenManualAssignmentModal={handleOpenManualAssignmentModal}
                />

                <HeroSection
                    selectedStudy={selectedStudy}
                    activeAssignmentCount={activeAssignmentCount}
                    submittedActiveAssignmentCount={submittedActiveAssignmentCount}
                    progressPercent={progressPercent}
                />

                <section className="content-grid">
                    <AssignmentSection
                        assignments={selectedActiveAssignments}
                        loading={assignmentLoading}
                        isLeader={selectedStudy?.role === "스터디장"}
                        onOpenSubmitModal={handleOpenSubmitModal}
                        onOpenSubmissionListModal={handleOpenSubmissionListModal}
                        onOpenAllAssignmentModal={() =>
                            setIsAllAssignmentModalOpen(true)
                        }
                    />

                    <ExpiredAssignmentSection
                        assignments={selectedExpiredAssignments}
                        loading={assignmentLoading}
                        isLeader={selectedStudy?.role === "스터디장"}
                        onOpenSubmissionListModal={handleOpenSubmissionListModal}
                    />

                    <StudyChatSection selectedStudy={selectedStudy} />

                    {selectedStudy?.role === "스터디장" && (
                        <section style={styles.leaderGradeSection}>
                            <div style={styles.leaderGradeHeader}>
                                <div>
                                    <h2 style={styles.leaderGradeTitle}>
                                        스터디원이 제출한 과제 채점
                                    </h2>
                                    <p style={styles.leaderGradeDescription}>
                                        내가 출제한 과제의 제출물을 확인하고 점수와
                                        피드백을 입력하세요.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    style={styles.refreshButton}
                                    onClick={fetchLeaderAssignments}
                                >
                                    새로고침
                                </button>
                            </div>

                            {leaderAssignmentLoading ? (
                                <p style={styles.emptyText}>
                                    제출된 과제를 불러오는 중입니다...
                                </p>
                            ) : selectedLeaderAssignmentGroups.length === 0 ? (
                                <p style={styles.emptyText}>
                                    아직 채점할 제출물이 없습니다.
                                </p>
                            ) : (
                                <div style={styles.leaderAssignmentList}>
                                    {selectedLeaderAssignmentGroups.map((group) => (
                                        <article
                                            key={group.assignment.assignmentId}
                                            style={styles.leaderAssignmentCard}
                                        >
                                            <div style={styles.assignmentHeader}>
                                                <div>
                                                    <h3 style={styles.assignmentTitle}>
                                                        {group.assignment.title}
                                                    </h3>
                                                    <p style={styles.assignmentContent}>
                                                        {group.assignment.content}
                                                    </p>
                                                </div>

                                                <span style={styles.submissionCount}>
                                                    제출 {group.submissions.length}명
                                                </span>
                                            </div>

                                            {group.submissions.length === 0 ? (
                                                <p style={styles.emptyText}>
                                                    아직 제출한 스터디원이 없습니다.
                                                </p>
                                            ) : (
                                                <div style={styles.submissionList}>
                                                    {group.submissions.map(
                                                        (submission) => {
                                                            const form = gradeForms[
                                                                submission.submissionId
                                                            ] ?? {
                                                                score: "",
                                                                feedback: "",
                                                            };

                                                            const isGrading =
                                                                gradingSubmissionId ===
                                                                submission.submissionId;

                                                            return (
                                                                <div
                                                                    key={
                                                                        submission.submissionId
                                                                    }
                                                                    style={
                                                                        styles.submissionCard
                                                                    }
                                                                >
                                                                    <div
                                                                        style={
                                                                            styles.submissionHeader
                                                                        }
                                                                    >
                                                                        <div>
                                                                            <strong
                                                                                style={
                                                                                    styles.memberName
                                                                                }
                                                                            >
                                                                                {
                                                                                    submission.memberName
                                                                                }
                                                                            </strong>
                                                                            <p
                                                                                style={
                                                                                    styles.submittedAt
                                                                                }
                                                                            >
                                                                                제출일:{" "}
                                                                                {
                                                                                    submission.submittedAt
                                                                                }
                                                                            </p>
                                                                        </div>

                                                                        <span
                                                                            style={{
                                                                                ...styles.gradeBadge,
                                                                                ...(submission.score !==
                                                                                    null &&
                                                                                    submission.score !==
                                                                                    undefined
                                                                                    ? styles.gradeComplete
                                                                                    : styles.gradeWaiting),
                                                                            }}
                                                                        >
                                                                            {submission.score !==
                                                                                null &&
                                                                                submission.score !==
                                                                                undefined
                                                                                ? `${submission.score}점`
                                                                                : "미채점"}
                                                                        </span>
                                                                    </div>

                                                                    <div
                                                                        style={
                                                                            styles.answerBox
                                                                        }
                                                                    >
                                                                        {
                                                                            submission.content
                                                                        }
                                                                    </div>

                                                                    <div
                                                                        style={
                                                                            styles.gradeForm
                                                                        }
                                                                    >
                                                                        <label
                                                                            style={
                                                                                styles.label
                                                                            }
                                                                        >
                                                                            점수
                                                                            <input
                                                                                type="number"
                                                                                min={0}
                                                                                max={100}
                                                                                value={
                                                                                    form.score
                                                                                }
                                                                                onChange={(
                                                                                    event
                                                                                ) =>
                                                                                    handleGradeFormChange(
                                                                                        submission.submissionId,
                                                                                        "score",
                                                                                        event
                                                                                            .target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                                placeholder="0~100"
                                                                                style={
                                                                                    styles.scoreInput
                                                                                }
                                                                            />
                                                                        </label>

                                                                        <label
                                                                            style={
                                                                                styles.label
                                                                            }
                                                                        >
                                                                            피드백
                                                                            <textarea
                                                                                value={
                                                                                    form.feedback
                                                                                }
                                                                                onChange={(
                                                                                    event
                                                                                ) =>
                                                                                    handleGradeFormChange(
                                                                                        submission.submissionId,
                                                                                        "feedback",
                                                                                        event
                                                                                            .target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                                placeholder="피드백을 입력하세요."
                                                                                style={
                                                                                    styles.feedbackInput
                                                                                }
                                                                            />
                                                                        </label>

                                                                        <button
                                                                            type="button"
                                                                            style={
                                                                                styles.gradeButton
                                                                            }
                                                                            disabled={
                                                                                isGrading
                                                                            }
                                                                            onClick={() =>
                                                                                handleGradeSubmission(
                                                                                    submission.submissionId
                                                                                )
                                                                            }
                                                                        >
                                                                            {isGrading
                                                                                ? "채점 중..."
                                                                                : "채점 완료"}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    <ActivitySection
                        activeAssignmentCount={activeAssignmentCount}
                        submittedActiveAssignmentCount={
                            submittedActiveAssignmentCount
                        }
                        expiredAssignmentCount={selectedExpiredAssignments.length}
                        totalAssignmentCount={selectedAllAssignments.length}
                        progressPercent={progressPercent}
                    />
                </section>
            </main>

            {isCreateModalOpen && (
                <CreateStudyModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreate={handleCreateStudy}
                />
            )}

            {isJoinModalOpen && (
                <JoinStudyModal
                    onClose={() => setIsJoinModalOpen(false)}
                    onJoin={handleJoinStudy}
                />
            )}

            {isAIAssignmentModalOpen && selectedStudy && (
                <AIAssignmentModal
                    studyGroupId={selectedStudy.id}
                    onClose={() => setIsAIAssignmentModalOpen(false)}
                    onConfirmed={async () => {
                        await fetchMyAssignments();

                        if (selectedStudy.role === "스터디장") {
                            await fetchLeaderAssignments();
                        }
                    }}
                />
            )}

            {isManualAssignmentModalOpen && (
                <ManualAssignmentModal
                    onClose={() => setIsManualAssignmentModalOpen(false)}
                    onCreate={handleCreateManualAssignment}
                />
            )}

            {isSubmitAssignmentModalOpen && selectedAssignment && (
                <SubmitAssignmentModal
                    assignment={selectedAssignment}
                    onClose={() => setIsSubmitAssignmentModalOpen(false)}
                    onSubmit={handleSubmitAssignment}
                />
            )}

            {isSubmissionListModalOpen && selectedAssignment && (
                <SubmissionListModal
                    assignment={selectedAssignment}
                    submissions={submissions}
                    loading={submissionLoading}
                    gradeForms={gradeForms}
                    gradingSubmissionId={gradingSubmissionId}
                    onClose={() => setIsSubmissionListModalOpen(false)}
                    onGradeFormChange={handleGradeFormChange}
                    onGradeSubmission={handleGradeSubmission}
                />
            )}

            {isAllAssignmentModalOpen && (
                <AssignmentAllModal
                    assignments={selectedAllAssignments}
                    loading={assignmentLoading}
                    isLeader={selectedStudy?.role === "스터디장"}
                    onClose={() => setIsAllAssignmentModalOpen(false)}
                    onOpenSubmitModal={handleOpenSubmitModal}
                    onOpenSubmissionListModal={handleOpenSubmissionListModal}
                />
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    leaderGradeSection: {
        gridColumn: "1 / -1",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 14px 30px rgba(0, 0, 0, 0.06)",
    },
    leaderGradeHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
        marginBottom: "20px",
    },
    leaderGradeTitle: {
        margin: 0,
        color: "#1f2937",
        fontSize: "22px",
        fontWeight: 800,
    },
    leaderGradeDescription: {
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
    emptyText: {
        margin: 0,
        color: "#9ca3af",
        fontSize: "14px",
    },
    leaderAssignmentList: {
        display: "flex",
        flexDirection: "column",
        gap: "18px",
    },
    leaderAssignmentCard: {
        backgroundColor: "#fafafa",
        border: "1px solid #eeeeee",
        borderRadius: "16px",
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
        color: "#800020",
        fontSize: "18px",
        fontWeight: 800,
    },
    assignmentContent: {
        margin: "8px 0 0",
        color: "#4b5563",
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
    },
    submissionCount: {
        backgroundColor: "#fdf2f5",
        color: "#800020",
        borderRadius: "999px",
        padding: "6px 10px",
        fontSize: "12px",
        fontWeight: 800,
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
        borderRadius: "14px",
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
};

export default Home;