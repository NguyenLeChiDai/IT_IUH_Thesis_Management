import React, { useState, useEffect } from "react";
import "../../css/ChangePassword.css";
import "font-awesome/css/font-awesome.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faKey } from "@fortawesome/free-solid-svg-icons";
import axios from "axios"; // Thêm axios để gửi request
import { useNavigate } from "react-router-dom";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId"); // Lấy ID từ localStorage

    if (!userId || !token) {
      setMessage(
        "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại."
      );
      setIsLoading(false);
      setTimeout(() => navigate("/login"), 300000);
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/auth/change-password/${userId}`,
        {
          oldPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(response.data.message);
      setOldPassword("");
      setNewPassword("");
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

  return (
    <div className="change-password-page">
      <div className="form-container">
        <h1
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "2rem",
            color: "#333",
          }}
        >
          <FontAwesomeIcon
            icon={faLock}
            style={{
              marginRight: "10px",
              fontSize: "1.5rem",
              color: "#4CAF50",
              transition: "color 0.3s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#45a049")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#4CAF50")}
          />
          <span
            style={{
              transition: "color 0.3s ease",
              fontWeight: "bold",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#45a049")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#333")}
          >
            Đổi mật khẩu
          </span>
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <FontAwesomeIcon icon={faKey} style={{ marginRight: "8px" }} />
              Mật khẩu hiện tại:
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>
              <FontAwesomeIcon icon={faKey} style={{ marginRight: "8px" }} />
              Mật khẩu mới:
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Xác nhận</button>
        </form>
        {message && <p>{message}</p>} {/* Hiển thị thông báo phản hồi */}
      </div>
    </div>
  );
};

export default ChangePassword;
