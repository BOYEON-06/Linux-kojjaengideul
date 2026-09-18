import React from "react";

type ActivitySectionProps = {
    activeAssignmentCount: number;
    submittedActiveAssignmentCount: number;
    expiredAssignmentCount: number;
    totalAssignmentCount: number;
    progressPercent: number;
};

const ActivitySection: React.FC<ActivitySectionProps> = ({
    activeAssignmentCount,
    submittedActiveAssignmentCount,
    expiredAssignmentCount,
    totalAssignmentCount,
    progressPercent,
}) => {
    return (
        <div className="content-card wide">
            <div className="card-title-row">
                <h3>스터디 활동 요약</h3>
            </div>

            <div className="activity-grid">
                <div className="activity-box">
                    <strong>{activeAssignmentCount}</strong>
                    <span>진행중 과제</span>
                </div>

                <div className="activity-box">
                    <strong>{submittedActiveAssignmentCount}</strong>
                    <span>마감 전 제출 완료</span>
                </div>

                <div className="activity-box">
                    <strong>{expiredAssignmentCount}</strong>
                    <span>마감된 과제</span>
                </div>

                <div className="activity-box">
                    <strong>{progressPercent}%</strong>
                    <span>
                        제출 진행률
                        <br />
                        전체 {totalAssignmentCount}개 기준
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ActivitySection;