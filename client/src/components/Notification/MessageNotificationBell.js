import React, { useState, useEffect, useRef } from "react";
import { Badge } from "react-bootstrap";
import { MessageCircle } from "lucide-react";
import axios from "axios";
import moment from "moment";
import { useNavigate } from "react-router-dom";

const MessageNotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/messageNotification/unread-count",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/messageNotification/notifications",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      // Kiểm tra và lấy groupId
      if (!notification) {
        console.error("Invalid notification data");
        return;
      }

      const groupId = notification.groupId?._id || notification.groupId;

      if (!groupId) {
        console.error("No group ID found in notification");
        return;
      }

      // Điều hướng dựa trên vai trò người dùng
      const userRole = localStorage.getItem("role");
      if (userRole === "Giảng viên") {
        navigate("/dashboardTeacher/messageTeacher", {
          state: {
            groupInfo: {
              id: groupId,
              name: notification.groupName || "Unknown Group",
            },
          },
        });
      } else {
        navigate("/dashboardStudent/messageStudent", {
          state: {
            groupInfo: {
              _id: groupId,
              name: notification.groupName || "Unknown Group",
            },
            teacherInfo: {
              id: notification.sender?._id || "",
              name: notification.sender?.name || "Unknown Teacher",
            },
          },
        });
      }

      // Cập nhật trạng thái
      setShowDropdown(false);
      fetchUnreadCount();
      fetchNotifications();
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      fetchNotifications();
    }
  };

  const renderNotificationContent = (notification) => {
    if (!notification) return null;

    return (
      <div
        key={notification._id}
        className={`p-2 border-bottom ${
          !notification.isRead ? "bg-light" : ""
        }`}
        onClick={() => handleNotificationClick(notification)}
        style={{ cursor: "pointer" }}
      >
        <div
          className="d-flex justify-content-between"
          style={{ color: "black" }}
        >
          <strong>
            Nhóm: {notification.groupName || "Nhóm không xác định"}
          </strong>
          <small className="text-muted">
            {moment(notification.createdAt).fromNow()}
          </small>
        </div>
        <div className="text-muted small mb-1" style={{ color: "black" }}>
          {notification.sender?.name}
        </div>
        <div className="text-truncate" style={{ color: "black" }}>
          {notification.message?.content}
        </div>
      </div>
    );
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button
        className="btn btn-link p-0 position-relative"
        onClick={handleBellClick}
        style={{ border: "none", background: "none" }}
      >
        <MessageCircle className="text-secondary" size={24} />
        {unreadCount > 0 && (
          <Badge
            bg="danger"
            className="position-absolute top-0 start-100 translate-middle"
          >
            {unreadCount}
          </Badge>
        )}
      </button>

      {showDropdown && (
        <div
          className="position-absolute bg-white shadow rounded p-2"
          style={{
            width: "300px",
            right: 0,
            top: "100%",
            zIndex: 1000,
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          <h6 className="mb-3">Tin nhắn mới</h6>
          {notifications.length > 0 ? (
            notifications.map((notification) =>
              renderNotificationContent(notification)
            )
          ) : (
            <div className="text-center text-muted">Không có tin nhắn mới</div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageNotificationBell;
