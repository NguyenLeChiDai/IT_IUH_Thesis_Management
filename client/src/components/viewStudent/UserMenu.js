import React, { useContext, useEffect, useState, useRef } from "react";
import { Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../contexts/AuthContext";
import NotificationsIcon from "@mui/icons-material/Notifications";
import moment from "moment";
import "moment/locale/vi";
import "../../css/UserMenu.css";
import avatar from "../../assets/avatar.png";
import NotificationDetailModal from "../Notification/NotificationDetailModal";
import MessageNotificationBell from "../Notification/MessageNotificationBell";
import io from "socket.io-client";

const UserMenu = () => {
  const navigate = useNavigate();
  const { authState, logoutUser } = useContext(AuthContext);
  const { user, profile } = authState;
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationDetail, setShowNotificationDetail] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const notificationRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      withCredentials: true,
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    setSocket(newSocket);

    // Đăng ký lắng nghe sự kiện nhận thông báo
    newSocket.on("receiveNotification", (newNotification) => {
      if (shouldShowNotification(newNotification)) {
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        showBrowserNotification(newNotification);
      }
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user]);
  // Kiểm tra xem có nên hiển thị thông báo cho user hiện tại không
  const shouldShowNotification = (notification) => {
    if (notification.type === "all") return true;
    if (notification.type === "student" && user?.role === "Sinh viên")
      return true;
    if (notification.type === "teacher" && user?.role === "Giảng viên")
      return true;
    return false;
  };

  // Hiển thị thông báo trên trình duyệt
  const showBrowserNotification = (notification) => {
    if (Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/path/to/notification-icon.png", // Thêm icon nếu có
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(notification.title, {
            body: notification.message,
            icon: "/path/to/notification-icon.png",
          });
        }
      });
    }
  };

  useEffect(() => {
    setCurrentProfile(profile);
    fetchNotifications();
  }, [profile]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/notification",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        setNotifications(response.data.notifications);
        const unread = response.data.notifications.filter(
          (n) => !n.isRead
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const handleChangePassword = () => {
    navigate("/change-password");
  };

  const handleReadNotification = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/notification/${id}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setShowNotificationDetail(true);
    setShowNotifications(false);
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      await Promise.all(
        unreadNotifications.map((notification) =>
          axios.put(
            `http://localhost:5000/api/notification/${notification._id}/read`,
            {},
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          )
        )
      );
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const getNotificationPreview = (message) => {
    return message.length > 100 ? `${message.substring(0, 100)}...` : message;
  };

  return (
    <div className="user-dropdown d-flex align-items-center gap-3">
      {/* Render MessageNotificationBell only if the user is not an admin */}
      {user?.role !== "admin" && <MessageNotificationBell />}
      <div
        className="position-relative"
        style={{ marginTop: "10px" }}
        ref={notificationRef}
      >
        <button
          className="btn btn-link p-0 position-relative"
          onClick={toggleNotifications}
          style={{ border: "none", background: "none" }}
        >
          <NotificationsIcon className="text-secondary" size={28} />
          {unreadCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {unreadCount}
              <span className="visually-hidden"></span>
            </span>
          )}
        </button>

        {showNotifications && (
          <div
            className="position-absolute notification-menu bg-white shadow rounded"
            style={{
              width: "300px",
              right: 0,
              top: "100%",
              zIndex: 1000,
              border: "1px solid rgba(0,0,0,.15)",
            }}
          >
            <div className="d-flex justify-content-between align-items-center px-3 py-2">
              <h6 className="mb-0">Thông báo</h6>
              <button
                className="btn btn-link btn-sm text-decoration-none"
                onClick={markAllAsRead}
              >
                Đánh dấu tất cả đã đọc
              </button>
            </div>
            <hr className="my-1" />
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`notification-item p-2 cursor-pointer hover:bg-gray-50 ${
                    !notif.isRead ? "bg-light" : ""
                  }`}
                  style={{ cursor: "pointer" }}
                >
                  <div className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold" style={{ color: "black" }}>
                        {notif.title}
                      </span>
                      {!notif.isRead && (
                        <div
                          className="notification-dot bg-danger"
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                          }}
                        ></div>
                      )}
                    </div>
                    <span className="notification-message">
                      {getNotificationPreview(notif.message)}
                    </span>
                    <div className="d-flex justify-content-between mt-1">
                      <small className="text-muted">
                        Gửi bởi: {notif.createdBy.username}
                      </small>
                      <small className="text-muted">
                        {moment(notif.createdAt).fromNow()}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-3 text-muted">
                  Không có thông báo mới
                </div>
              )}
            </div>
            <div className="p-2 text-center border-top">
              <button
                className="btn btn-link btn-sm text-decoration-none"
                onClick={() => {
                  if (user?.role === "Sinh viên") {
                    navigate("/dashboardStudent/notification-page-student");
                  } else if (user?.role === "Giảng viên") {
                    navigate("/dashboardTeacher/notification-page-teacher");
                  } else if (user?.role === "admin") {
                    navigate("/dashboardAdmin/notifications");
                  }
                }}
              >
                Xem tất cả thông báo
              </button>
            </div>
          </div>
        )}
      </div>

      <img
        src={avatar}
        alt="Avatar"
        className="user-avatar me-2"
        style={{
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          objectFit: "cover",
          marginTop: "10px",
        }}
      />

      <Dropdown>
        <Dropdown.Toggle
          variant="light"
          id="dropdown-basic"
          className="d-flex flex-column align-items-start"
          style={{ marginTop: "10px" }}
        >
          <span>Chào, {currentProfile?.name || user?.username || "User"}</span>
          <small className="text-muted">{user?.role}</small>
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item onClick={handleChangePassword}>
            Cập nhật mật khẩu
          </Dropdown.Item>
          <Dropdown.Item onClick={handleLogout}>Đăng xuất</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      <NotificationDetailModal
        show={showNotificationDetail}
        onHide={() => setShowNotificationDetail(false)}
        notification={selectedNotification}
        onMarkAsRead={handleReadNotification}
      />
    </div>
  );
};

export default UserMenu;
