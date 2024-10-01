import React, { useState, useEffect, useContext } from "react";
import "../../css/ChangePassword.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faKey,
  faEye,
  faEyeSlash,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext"; // Đảm bảo đường dẫn này chính xác
import Swal from "sweetalert2";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Sử dụng AuthContext để lấy thông tin người dùng và token
  const { authState } = useContext(AuthContext);

  const togglePasswordVisibility = (field) => {
    switch (field) {
      case "old":
        setShowOldPassword(!showOldPassword);
        break;
      case "new":
        setShowNewPassword(!showNewPassword);
        break;
      case "confirm":
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      setIsLoading(false);
      return;
    }

    if (!authState.isAuthenticated || !authState.user) {
      setMessage("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
      setIsLoading(false);
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/auth/change-password/${authState.user._id}`,
        {
          oldPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      setMessage(response.data.message);
      Swal.fire("Thành công", `Bạn đã đổi mật khẩu thành công!`, "success");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleExit = () => {
    // Điều hướng về trang trước đó
    navigate(-1);
    // Hoặc nếu bạn muốn điều hướng đến một trang cụ thể, ví dụ trang chủ:
    // navigate('/');
  };
  return (
    <div className="change-password-page">
      <div className="form-container">
        <h1>
          <FontAwesomeIcon icon={faLock} />
          <span>Đổi mật khẩu</span>
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <FontAwesomeIcon icon={faKey} />
              Mật khẩu hiện tại:
            </label>
            <div className="password-input">
              <input
                type={showOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
              <FontAwesomeIcon
                icon={showOldPassword ? faEyeSlash : faEye}
                onClick={() => togglePasswordVisibility("old")}
                className="password-toggle"
              />
            </div>
          </div>
          <div className="form-group">
            <label>
              <FontAwesomeIcon icon={faKey} />
              Mật khẩu mới:
            </label>
            <div className="password-input">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <FontAwesomeIcon
                icon={showNewPassword ? faEyeSlash : faEye}
                onClick={() => togglePasswordVisibility("new")}
                className="password-toggle"
              />
            </div>
          </div>
          <div className="form-group">
            <label>
              <FontAwesomeIcon icon={faKey} />
              Xác nhận mật khẩu mới:
            </label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <FontAwesomeIcon
                icon={showConfirmPassword ? faEyeSlash : faEye}
                onClick={() => togglePasswordVisibility("confirm")}
                className="password-toggle"
              />
            </div>
          </div>
          {/* Nút quay lại và xác nhận */}
          <div className="button-group">
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Xác nhận"}
            </button>
            <button type="button" onClick={handleExit} className="exit-button">
              <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
            </button>
          </div>
        </form>
        {message && (
          <p
            className={
              message.includes("thành công")
                ? "success-message"
                : "error-message"
            }
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;
