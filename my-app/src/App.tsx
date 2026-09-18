import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import { checkName, type AuthUser } from "./api/authAPI";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [authChecking, setAuthChecking] = useState(true);
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    const restoreLogin = async () => {
      try {
        setAuthChecking(true);

        const savedUser = localStorage.getItem("user");

        if (!savedUser) {
          setIsLogin(false);
          return;
        }

        const user = JSON.parse(savedUser) as AuthUser;

        console.log("앱 시작: /api/auth/check-name으로 로그인 상태 확인");
        console.log("저장된 user:", user);
        console.log("요청 전 document.cookie:", document.cookie);

        await checkName(user.name);

        setIsLogin(true);

        if (location.pathname === "/" || location.pathname === "/login") {
          navigate("/home", { replace: true });
        }
      } catch (error) {
        console.error("로그인 복구 실패:", error);

        localStorage.removeItem("user");
        setIsLogin(false);

        if (location.pathname !== "/login") {
          navigate("/login", { replace: true });
        }
      } finally {
        setAuthChecking(false);
      }
    };

    restoreLogin();
  }, []);

  const handleLoginSuccess = () => {
    setIsLogin(true);
    navigate("/home", { replace: true });
  };

  if (authChecking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          color: "#374151",
        }}
      >
        로그인 상태를 확인하는 중입니다...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isLogin ? (
            <Navigate to="/home" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/login"
        element={
          isLogin ? (
            <Navigate to="/home" replace />
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} />
          )
        }
      />

      <Route
        path="/home"
        element={
          isLogin ? (
            <Home />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;