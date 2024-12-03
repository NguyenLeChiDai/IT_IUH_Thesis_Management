import React, { useState, useEffect, useRef } from "react";
import { Badge } from "react-bootstrap";
import { MessageCircle } from "lucide-react";
import axios from "axios";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../../contexts/AuthContext";
import { useContext } from "react";
import io from "socket.io-client";

const MessageNotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);

  const {
    authState: { authLoading, isAuthenticated, user },
  } = useContext(AuthContext);

  //SOCKET
  useEffect(() => {
    // Kết nối socket
    const newSocket = io("http://localhost:5000", {
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    setSocket(newSocket);

    // Khi kết nối thành công
    newSocket.on("connect", () => {
      // Gửi yêu cầu join groups
      newSocket.emit("joinGroups");
    });

    // Listener cho thông báo tin nhắn mới
    newSocket.on("newMessageNotification", (data) => {
      // Cập nhật số lượng tin nhắn chưa đọc
      setUnreadCount(data.unreadCount);

      // Thêm thông báo mới
      setNotifications((prevNotifications) => [
        {
          group: {
            _id: data.groupId,
            name: data.groupName,
          },
          sender: data.sender,
          messages: [{ content: data.message.content }],
          messagesCount: 1,
          latestMessageTime: data.message.timestamp,
        },
        ...prevNotifications,
      ]);

      // Hiển thị toast notification
      toast.info(
        `Tin nhắn mới từ ${data.sender.name} - Nhóm ${data.groupName}`
      );
    });

    // Cleanup socket khi component unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

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
    const interval = setInterval(fetchUnreadCount, 3000);
    return () => clearInterval(interval);
  }, []);

  // XỬ LÝ XÓA THÔNG BÁO
  /*  const clearGroupNotifications = async (groupId) => {
    try {
      await axios.delete(
        "http://localhost:5000/api/messageNotification/clear-group-notifications",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          data: { groupId },
        }
      );

      // Sau khi xóa, cập nhật lại danh sách và số lượng thông báo
      await fetchUnreadCount();
      await fetchNotifications();
    } catch (error) {
      console.error("Error clearing group notifications:", error);
      toast.error("Không thể xóa thông báo");
    }
  }; */

  const markNotificationsAsRead = async (groupId) => {
    try {
      await axios.put(
        "http://localhost:5000/api/messageNotification/mark-notifications-read",
        { groupId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Sau khi đánh dấu đã đọc, refresh lại danh sách thông báo và số lượng
      await fetchUnreadCount();
      await fetchNotifications();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      toast.error("Có lỗi xảy ra khi đánh dấu thông báo");
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification || !notification.group) {
        console.error("Invalid notification data:", notification);
        toast.error("Thông tin thông báo không hợp lệ");
        return;
      }

      // xửa lý ẩn các thông báo đã xem
      await markNotificationsAsRead(notification.group._id);
      const senderRole = notification.sender?.role;
      // Xóa các thông báo của nhóm này
      /* await clearGroupNotifications(notification.group._id); */

      // Debug: In ra các giá trị để kiểm tra
      console.log("Sender Role:", senderRole);
      console.log("Current User Role:", user.role);
      console.log("Notification:", notification);

      // Gọi API để lấy chi tiết
      // Gọi API để lấy chi tiết
      const response = await axios.get(
        `http://localhost:5000/api/messageNotification/notification-details`,
        {
          params: {
            groupId: notification.group._id,
            senderRole: senderRole,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const details = response.data.details;

      if (senderRole === "Giảng viên" && user.role === "Sinh viên") {
        navigate("/dashboardStudent/messageStudent", {
          state: {
            teacherInfo: {
              id: details.id,
              name: details.name,
              teacherId: details.teacherId,
              role: "teacher",
            },
            groupInfo: {
              _id: notification.group._id.toString(),
              name: notification.group.name,
            },
          },
        });
      } else if (senderRole === "Sinh viên" && user.role === "Giảng viên") {
        // Chuyển sang trang chat giảng viên
        navigate("/dashboardTeacher/messageTeacher", {
          state: {
            groupInfo: {
              id: notification.group._id,
              name: details.name || notification.group.name,
              students: details.students,
            },
          },
        });
      } else if (senderRole === "Sinh viên" && user.role === "Sinh viên") {
        navigate("/dashboardStudent/messageStudent", {
          state: {
            groupInfo: {
              id: notification.group._id,
              name: details.name || notification.group.name,
              students: details.students,
            },
          },
        });
      }

      setShowDropdown(false);
      await fetchUnreadCount();
      await fetchNotifications();
    } catch (error) {
      console.error("Error in handleNotificationClick:", error);
      toast.error("Có lỗi xảy ra khi xử lý thông báo");
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

    const senderRole = notification.sender?.role;
    const roleBadge =
      senderRole === "Giảng viên" ? (
        <Badge bg="primary" className="ms-2">
          GV
        </Badge>
      ) : (
        <Badge bg="info" className="ms-2">
          SV
        </Badge>
      );

    return (
      <div
        key={notification.sender._id}
        className={`p-2 border-bottom`}
        onClick={() => handleNotificationClick(notification)}
        style={{ cursor: "pointer" }}
      >
        <div
          className="d-flex justify-content-between"
          style={{ color: "black" }}
        >
          <strong>
            Nhóm: {notification.group?.name || "Nhóm không xác định"}
          </strong>
          <small className="text-muted">
            {moment(notification.latestMessageTime).fromNow()}
          </small>
        </div>
        <div className="text-muted small mb-1" style={{ color: "black" }}>
          {notification.sender?.name} {roleBadge}
          {notification.messagesCount > 1 && (
            <Badge bg="secondary" className="ms-2">
              {notification.messagesCount} tin nhắn
            </Badge>
          )}
        </div>
        <div className="text-truncate" style={{ color: "black" }}>
          {notification.messages[0]?.content}
        </div>
      </div>
    );
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* Giữ nguyên code ban đầu */}
      <button
        className="btn btn-link p-0 position-relative"
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) {
            fetchNotifications();
          }
        }}
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

      {/* Giữ nguyên phần dropdown */}
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
            notifications.map((notification, index) =>
              renderNotificationContent(notification, index)
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
