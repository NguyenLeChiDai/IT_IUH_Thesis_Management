import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import "moment/locale/vi";
import NotificationDetailModal from "../Notification/NotificationDetailModal";
import "../../css/NotificationPage.css";
import { apiUrl } from "../../contexts/constants";
const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showNotificationDetail, setShowNotificationDetail] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${apiUrl}/notification`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleReadNotification = async (id) => {
    try {
      await axios.put(
        `${apiUrl}/notification/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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
  };

  return (
    <div className="notification-page container mt-4">
      <h2 className="mb-4">Tất cả Thông báo</h2>
      {notifications.length > 0 ? (
        <div className="notification-list">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`notification-item p-3 mb-2 ${
                !notif.isRead ? "bg-light" : ""
              }`}
              onClick={() => handleNotificationClick(notif)}
              style={{
                cursor: "pointer",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <div className="d-flex justify-content-between">
                <span className="fw-bold">{notif.title}</span>
                <small className="text-muted">
                  {moment(notif.createdAt).fromNow()}
                </small>
              </div>
              <p className="text-muted mb-1">
                {notif.message.length > 80
                  ? `${notif.message.substring(0, 80)}...`
                  : notif.message}
              </p>
              <small className="text-muted">
                Gửi bởi: {notif.createdBy.username}
              </small>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted">Không có thông báo nào.</p>
      )}

      <NotificationDetailModal
        show={showNotificationDetail}
        onHide={() => setShowNotificationDetail(false)}
        notification={selectedNotification}
        onMarkAsRead={handleReadNotification}
      />
    </div>
  );
};

export default NotificationPage;
