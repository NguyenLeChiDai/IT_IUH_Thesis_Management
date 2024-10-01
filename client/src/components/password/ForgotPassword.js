import React, { useState, useEffect } from "react";
import { Button, Form, Alert } from "react-bootstrap";
import { auth } from "../../firebase/ConfigFirebase.js";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userId, setUserId] = useState("");
  const [canResendOTP, setCanResendOTP] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setCanResendOTP(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, step]);

  const generateRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: (response) => {
            console.log("reCAPTCHA solved successfully");
          },
        }
      );
    }
  };

  const requestOTP = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/check-user-for-reset",
        { id, phone }
      );
      if (response.data.success) {
        setUserId(response.data.userId);
        generateRecaptcha();
        const formattedPhone = "+84" + response.data.phone.slice(1);
        const appVerifier = window.recaptchaVerifier;

        console.log("Attempting to sign in with phone number:", formattedPhone);

        signInWithPhoneNumber(auth, formattedPhone, appVerifier)
          .then((confirmationResult) => {
            window.confirmationResult = confirmationResult;
            setStep(2);
            setCountdown(30);
            setCanResendOTP(false);
            console.log("OTP sent successfully");
          })
          .catch((error) => {
            console.error("Firebase OTP error:", error);
            setError("Lỗi gửi OTP: " + error.message);
          });
      }
    } catch (error) {
      console.error("Error in requestOTP:", error);
      setError(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi kiểm tra thông tin người dùng"
      );
    }
  };

  const verifyOTP = (e) => {
    e.preventDefault();
    if (otp.length === 6) {
      let confirmationResult = window.confirmationResult;
      confirmationResult
        .confirm(otp)
        .then(() => {
          setStep(3);
        })
        .catch((error) => {
          setError("OTP không đúng");
        });
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        {
          userId,
          newPassword,
        }
      );
      if (response.data.success) {
        setSuccess("Mật khẩu đã được đặt lại thành công");
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Có lỗi xảy ra khi đặt lại mật khẩu"
      );
    }
  };

  const resendOTP = () => {
    if (canResendOTP) {
      requestOTP({ preventDefault: () => {} });
    }
  };

  return (
    <div className="forgot-password-container">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      {step === 1 && (
        <Form onSubmit={requestOTP}>
          <Form.Group>
            <Form.Label>ID Sinh viên/Giảng viên</Form.Label>
            <Form.Control
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              placeholder="Ví dụ: 20012345"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Số điện thoại</Form.Label>
            <Form.Control
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="Ví dụ: 0123456789"
            />
          </Form.Group>
          <Button type="submit">Gửi OTP</Button>
        </Form>
      )}
      {step === 2 && (
        <Form onSubmit={verifyOTP}>
          <Form.Group>
            <Form.Label>Nhập mã OTP</Form.Label>
            <Form.Control
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </Form.Group>
          <Button type="submit">Xác nhận OTP</Button>
          {countdown > 0 ? (
            <p>Gửi lại OTP sau {countdown} giây</p>
          ) : (
            <Button onClick={resendOTP} disabled={!canResendOTP}>
              Gửi lại OTP
            </Button>
          )}
        </Form>
      )}
      {step === 3 && (
        <Form onSubmit={resetPassword}>
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
      )}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default ForgotPassword;
