import React, { useState } from "react";

type ManualAssignmentModalProps = {
    onClose: () => void;
    onCreate: (title: string, content: string, dueDate: string) => Promise<void>;
};

const formatDateTimeForServer = (dateTimeLocal: string) => {
    return dateTimeLocal.replace("T", " ") + ":00";
};

const ManualAssignmentModal: React.FC<ManualAssignmentModalProps> = ({
    onClose,
    onCreate,
}) => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!title.trim()) {
            alert("과제 제목을 입력하세요.");
            return;
        }

        if (!content.trim()) {
            alert("과제 내용을 입력하세요.");
            return;
        }

        if (!dueDate) {
            alert("마감기한을 설정하세요.");
            return;
        }

        const selectedDueDate = new Date(dueDate);
        const now = new Date();

        if (selectedDueDate <= now) {
            alert("마감기한은 현재 시간 이후로 설정해야 합니다.");
            return;
        }

        try {
            setCreating(true);

            await onCreate(
                title.trim(),
                content.trim(),
                formatDateTimeForServer(dueDate)
            );

            onClose();
        } catch (error) {
            console.error(error);
            alert("과제 생성에 실패했습니다. 로그인 상태 또는 권한을 확인해주세요.");
        } finally {
            setCreating(false);
        }
    };

    const handleClose = () => {
        if (creating) return;
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="study-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <p className="modal-label">Manual Assignment</p>
                        <h2>수동 과제 출제</h2>
                    </div>

                    <button className="modal-close-btn" onClick={handleClose}>
                        ×
                    </button>
                </div>

                <div className="modal-form">
                    <label>
                        과제 제목
                        <input
                            type="text"
                            placeholder="예: 첫 번째 과제 테스트"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </label>

                    <label>
                        과제 내용
                        <textarea
                            placeholder="예: JPA의 영속성 컨텍스트에 대해 서술하세요."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </label>

                    <label>
                        마감기한
                        <input
                            type="datetime-local"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </label>
                </div>

                <div className="modal-actions">
                    <button className="modal-cancel-btn" onClick={handleClose}>
                        취소
                    </button>

                    <button
                        className="modal-submit-btn"
                        onClick={handleCreate}
                        disabled={creating}
                    >
                        {creating ? "등록 중..." : "과제 등록"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualAssignmentModal;