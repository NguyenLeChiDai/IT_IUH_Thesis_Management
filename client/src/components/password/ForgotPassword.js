import React, { useState } from "react";
import { Button, Form, Alert } from "react-bootstrap";
import axios from "axios";
import "../../css/ForgotPassword.css";
import OTPInput from "./OTPInput";
import { Link } from "react-router-dom";
const ForgotPassword = () => {
  const [id, setId] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { id }
      );
      if (response.data.success) {
        setSuccess("Mã OTP đã được gửi đến email của bạn.");
        setStep(2);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu OTP"
      );
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/verify-otp",
        { id, otp }
      );
      if (response.data.success) {
        setSuccess("Mã OTP hợp lệ.");
        setStep(3);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn"
      );
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        { id, otp, newPassword }
      );
      if (response.data.success) {
        setSuccess("Mật khẩu đã được đặt lại thành công");
        // Redirect to login page or clear form
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Có lỗi xảy ra khi đặt lại mật khẩu"
      );
    }
  };

  const handleOTPComplete = (completedOtp) => {
    setOtp(completedOtp);
  };

  return (
    <div className="forgot-password-container">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {step === 1 && (
        <Form onSubmit={handleRequestOTP}>
          <Form.Group>
            <Form.Label>Giảng Viên/Sinh Viên</Form.Label>
            <Form.Control
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              placeholder="Nhập mã giảng viên/sinh viên của bạn"
            />
          </Form.Group>
          <Button type="submit">Gửi mã OTP</Button>
        </Form>
      )}

      {step === 2 && (
        <Form onSubmit={handleVerifyOTP}>
          <Form.Group>
            <Form.Label>Nhập mã OTP</Form.Label>
            <OTPInput length={6} onComplete={handleOTPComplete} />
          </Form.Group>
          <Button type="submit">Xác nhận OTP</Button>
        </Form>
      )}

      {step === 3 && (
        <div className="forgot-password-container step-3">
          <Form onSubmit={handleResetPassword}>
            <Form.Group>
              <Form.Label>Mật khẩu mới</Form.Label>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Xác nhận mật khẩu mới</Form.Label>
              <Form.Control
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Button type="submit">Đặt lại mật khẩu</Button>
          </Form>
        </div>
      )}
      <p className="login-link">
        Bạn đã có tài khoản?
        <Link to="/login">
          <span className="btn-login">Đăng nhập</span>
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
