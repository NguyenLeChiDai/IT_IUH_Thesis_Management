import React from "react";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";
import Header from "./Header";
import Footer from "./Footer";
import "../css/Auth.css"; // Tạo file CSS để điều chỉnh style của Auth nếu cần

import { AuthContext } from "../contexts/AuthContext";
import { useContext } from "react";
import Spinner from "react-bootstrap/Spinner";
import { Navigate } from "react-router-dom"; // Không cần import 'redirect' nữa
import logo from "../assets/logo-iuh.jpg";
import ForgotPassword from "../components/password/ForgotPassword";

const Auth = ({ authRoute }) => {
  const {
    authState: { authLoading, isAuthenticated, user },
  } = useContext(AuthContext);

  let body;

  if (authLoading)
    body = (
      <div className="d-fle justify-content-center mt-2">
        <Spinner animation="boder" variant="info" />
      </div>
    );
  else if (isAuthenticated) {
    // Điều hướng dựa trên role
    if (user.role === "admin") {
      return <Navigate to="/dashboardAdmin" />;
    } else if (user.role === "Sinh viên") {
      return <Navigate to="/dashboardStudent" />;
    } else {
      return <Navigate to="/dashboardTeacher" />;
    }
  } else
    body = (
      <>
        {authRoute === "login" && <LoginForm />}
        {authRoute === "register" && <RegisterForm />}
        {authRoute === "forgot-password" && <ForgotPassword />}
      </>
    );

  return (
    <div className="auth-page">
      <Header />
      <div className="auth-content">
        <div className="auth-form" style={{ width: 550, height: 650 }}>
          <h2 className="auth-title">
            <strong>
              {authRoute === "forgot-password"
                ? "LẤY LẠI MẬT KHẨU"
                : "ĐĂNG NHẬP"}
            </strong>
          </h2>

          {body}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
