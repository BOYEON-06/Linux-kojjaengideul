import React from "react";
import type { Assignment } from "../types/assignment";

type ExpiredAssignmentSectionProps = {
    assignments: Assignment[];
    loading: boolean;
    isLeader: boolean;
    onOpenSubmissionListModal: (assignment: Assignment) => void;
};

const ExpiredAssignmentSection: React.FC<ExpiredAssignmentSectionProps> = ({
    assignments,
    loading,
    isLeader,
    onOpenSubmissionListModal,
}) => {
    return (
        <div className="content-card large">
            <div className="card-title-row">
                <h3>마감된 과제</h3>
            </div>

            <div className="assignment-list">
                {loading && (
                    <p className="empty-text">마감된 과제를 불러오는 중...</p>
                )}

                {!loading && assignments.length === 0 && (
                    <p className="empty-text">아직 마감된 과제가 없습니다.</p>
                )}

                {!loading &&
                    assignments.map((assignment) => (
                        <div className="assignment-item" key={assignment.id}>
                            <div className="assignment-info">
                                <p className="assignment-title">{assignment.title}</p>

                                <span className="assignment-due">
                                    마감일: {assignment.due}
                                </span>

                                <p className="assignment-content-preview">
                                    {assignment.content}
                                </p>
                            </div>

                            <div className="assignment-right">
                                <span
                                    className={`status-badge ${assignment.status}`}
                                    style={{
                                        backgroundColor: "#f3f4f6",
                                        color: "#4b5563",
                                    }}
                                >
                                    마감
                                </span>

                                {isLeader && (
                                    <button
                                        className="assignment-submit-btn"
                                        onClick={() => onOpenSubmissionListModal(assignment)}
                                    >
                                        제출 확인
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default ExpiredAssignmentSection;