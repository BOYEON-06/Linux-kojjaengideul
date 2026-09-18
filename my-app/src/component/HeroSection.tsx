import React from "react";
import type { Study } from "../types/study";

type HeroSectionProps = {
    selectedStudy: Study | null;
    activeAssignmentCount: number;
    submittedActiveAssignmentCount: number;
    progressPercent: number;
};

const HeroSection: React.FC<HeroSectionProps> = ({
    selectedStudy,
    activeAssignmentCount,
    submittedActiveAssignmentCount,
    progressPercent,
}) => {
    return (
        <section className="hero-card">
            <div className="hero-left">
                <span className="hero-badge">
                    {selectedStudy ? `${selectedStudy.role} 모드` : "스터디 없음"}
                </span>

                <h2>
                    {selectedStudy
                        ? "과제, 일정, 프로젝트 현황을 한 번에 관리하세요"
                        : "왼쪽에서 스터디를 생성하거나 참여하세요"}
                </h2>

                <p>
                    {selectedStudy?.description ||
                        "AI 자동 퀴즈, 과제 분석, 팀 프로젝트 진행률 확인까지. 스터디 운영에 필요한 정보를 한 화면에서 빠르게 확인할 수 있습니다."}
                </p>

                <div className="hero-summary">
                    <div className="summary-box">
                        <h3>
                            {selectedStudy ? "스터디 참여중" : "0명"}
                        </h3>

                        <p>참여 상태</p>
                    </div>

                    <div className="summary-box">
                        <h3>
                            {selectedStudy ? `${activeAssignmentCount}개` : "0개"}
                        </h3>

                        <p>진행중 과제</p>
                    </div>

                    <div className="summary-box">
                        <h3>
                            {selectedStudy?.inviteCode || "-"}
                        </h3>

                        <p>초대코드</p>
                    </div>
                </div>
            </div>

            <div className="hero-right">
                <div className="progress-card">
                    <p className="progress-title">
                        제출 기준 프로젝트 진행률
                    </p>

                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: selectedStudy ? `${progressPercent}%` : "0%",
                            }}
                        ></div>
                    </div>

                    <strong>
                        {selectedStudy ? `${progressPercent}%` : "0%"}
                    </strong>

                    <p
                        style={{
                            margin: "10px 0 0",
                            color: "rgba(255, 255, 255, 0.75)",
                            fontSize: "13px",
                            lineHeight: 1.6,
                        }}
                    >
                        {selectedStudy
                            ? `제출 완료 ${submittedActiveAssignmentCount}개 / 마감 전 과제 ${activeAssignmentCount}개`
                            : "스터디를 선택하면 진행률이 표시됩니다."}
                    </p>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;