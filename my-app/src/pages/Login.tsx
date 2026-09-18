import { useState } from "react";
import type { FormEvent } from "react";
import { authContinue } from "../api/authAPI";
import "./Login.css";

type LoginProps = {
    onLoginSuccess: () => void;
};

function Login({ onLoginSuccess }: LoginProps) {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        if (!name.trim()) {
            alert("이름을 입력하세요.");
            return;
        }

        if (!password.trim()) {
            alert("비밀번호를 입력하세요.");
            return;
        }

        try {
            setLoading(true);

            const data = await authContinue({
                name: name.trim(),
                password: password.trim(),
            });

            localStorage.setItem("user", JSON.stringify(data.user));

            console.log("로그인 응답:", data);
            console.log("현재 브라우저에서 접근 가능한 쿠키:", document.cookie);

            alert(data.message || "로그인 성공");

            onLoginSuccess();
        } catch (error) {
            console.error(error);
            alert(
                "로그인 또는 회원가입에 실패했습니다. 프록시 설정, 세션 쿠키, 백엔드 응답을 확인해주세요."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleAuth();
    };

    return (
        <div className="login-page">
            <form className="login-card" onSubmit={handleSubmit}>
                <p className="login-label">Login or Sign up</p>
                <h1 className="login-title">SwitMe</h1>

                <input
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="login-input"
                />

                <input
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input"
                />

                <button className="login-button" type="submit" disabled={loading}>
                    {loading ? "처리 중..." : "Continue"}
                </button>
            </form>
        </div>
    );
}

export default Login;