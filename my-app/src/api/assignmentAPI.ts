import { request } from "./client";

export type GenerateAIAssignmentRequest = {
    topic: string;
    difficulty: string;
    additionalRequest: string;
    dueDate: string;
};

export type GenerateAIAssignmentResponse = {
    title: string;
    content: string;
    modelAnswer: string;
};

export type CreateAssignmentRequest = {
    title: string;
    content: string;
    dueDate: string;
};

export type CreateAssignmentResponse = {
    message: string;
    assignmentId: number;
    dueDate: string;
};

export type SubmitAssignmentRequest = {
    content: string;
};

export type SubmitAssignmentResponse = {
    submissionId: number;
    message: string;
};

export type MyAssignmentItem = {
    studyId: number;
    assignmentId: number;
    creatorName: string;
    studyTitle: string;
    title: string;
    content: string;
    dueDate: string;
    isExpired: boolean;
    isSubmitted: boolean;

    submittedContent?: string | null;
    submitDate?: string | null;
    score?: number | null;
    feedback?: string | null;
    gradedAt?: string | null;
};

export type AssignmentSubmissionItem = {
    submissionId: number;
    memberId: number;
    memberName: string;
    content: string;
    submittedAt: string;
    score?: number | null;
    feedback?: string | null;
    gradedAt?: string | null;
};

export type LeaderAssignmentGroup = {
    assignment: MyAssignmentItem;
    submissions: AssignmentSubmissionItem[];
};

export type LeaderAssignmentItem = {
    studyGroupId: number;
    studyTitle: string;
    assignmentGroup: LeaderAssignmentGroup[];
};

export type GradeSubmissionRequest = {
    score: number;
    feedback: string;
};

export type GradeSubmissionResponse = {
    message: string;
};

export type ConfirmAIReservationTaskRequest = {
    title: string;
    content: string;
    modelAnswer: string;
    openAt: string;
    closeAt: string;
};

export type ConfirmAIReservationTaskResponse = {
    message: string;
    reservationTaskId: number;
};

export type ReservationTaskDetail = {
    id: number;
    title: string;
    content: string;
    openAt: string;
    closeAt: string;
    dueDate?: string;
};

export type SubmitReservationTaskRequest = {
    answer: string;
};

function valueToString(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value.map(valueToString).join("\n");
    }

    if (typeof value === "object") {
        const objectValue = value as Record<string, unknown>;

        if (typeof objectValue.content === "string") {
            return objectValue.content;
        }

        if (typeof objectValue.answer === "string") {
            return objectValue.answer;
        }

        if (typeof objectValue.text === "string") {
            return objectValue.text;
        }

        if (typeof objectValue.message === "string") {
            return objectValue.message;
        }

        return JSON.stringify(objectValue, null, 2);
    }

    return String(value);
}

function normalizeAIAssignmentResponse(data: unknown): GenerateAIAssignmentResponse {
    const raw = data as Record<string, unknown>;

    return {
        title: valueToString(raw.title),
        content: valueToString(raw.content),
        modelAnswer: valueToString(raw.modelAnswer),
    };
}

export async function generateAIAssignment(data: GenerateAIAssignmentRequest) {
    const response = await request<unknown>("/api/assignments/generate-ai", {
        method: "POST",
        body: data,
    });

    return normalizeAIAssignmentResponse(response);
}

export async function createManualAssignment(
    studyId: number,
    data: CreateAssignmentRequest
) {
    return request<CreateAssignmentResponse>(`/api/assignments/${studyId}`, {
        method: "POST",
        body: data,
    });
}

export async function submitAssignment(
    studyId: number,
    assignmentId: number,
    data: SubmitAssignmentRequest
) {
    return request<SubmitAssignmentResponse>(
        `/api/assignments/${studyId}/submit/${assignmentId}`,
        {
            method: "POST",
            body: data,
        }
    );
}

export async function getAssignmentSubmissions(
    studyId: number,
    assignmentId: number
) {
    return request<AssignmentSubmissionItem[]>(
        `/api/assignments/${studyId}/submissions/${assignmentId}`
    );
}

export async function getMyAssignments() {
    return request<MyAssignmentItem[]>("/api/assignments/my-assignments");
}

export async function getLeaderAssignments() {
    return request<LeaderAssignmentItem[]>("/api/assignments/leader");
}

export async function gradeSubmission(
    submissionId: number,
    data: GradeSubmissionRequest
) {
    return request<GradeSubmissionResponse>(
        `/api/assignments/submissions/${submissionId}/grade`,
        {
            method: "POST",
            body: data,
        }
    );
}

export async function confirmAIReservationTask(
    studyGroupId: number,
    data: ConfirmAIReservationTaskRequest
) {
    return request<ConfirmAIReservationTaskResponse>(
        `/api/reservation-tasks/${studyGroupId}/confirm-ai`,
        {
            method: "POST",
            body: data,
        }
    );
}

export async function getReservationTaskDetail(reservationTaskId: number) {
    return request<ReservationTaskDetail>(
        `/api/reservation-tasks/${reservationTaskId}`
    );
}

export async function submitReservationTask(
    reservationTaskId: number,
    userId: number,
    data: SubmitReservationTaskRequest
) {
    return request<void>(
        `/api/reservation-tasks/${reservationTaskId}/submissions?userId=${userId}`,
        {
            method: "POST",
            body: data,
        }
    );
}