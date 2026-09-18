export type Submission = {
    submissionId: number;
    memberId: number;
    memberName: string;
    content: string;
    submittedAt: string;
    score?: number | null;
    feedback?: string | null;
    gradedAt?: string | null;
};