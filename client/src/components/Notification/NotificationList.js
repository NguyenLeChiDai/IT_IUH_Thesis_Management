// NotificationList.js
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../contexts/AuthContext";
import moment from "moment";
import "moment/locale/vi";

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const { authState } = useContext(AuthContext);

  useEffect(() => {
    fetchNotifications();
  }, []);

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
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (id) => {
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
      fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <div className="notification-list">
      {notifications.map((notification) => (
        <div
          key={notification._id}
          className={`notification-item p-3 border-bottom ${
            !notification.isRead ? "bg-light" : ""
          }`}
          onClick={() => markAsRead(notification._id)}
        >
          <div className="d-flex justify-content-between">
            <h6 className="mb-1">{notification.title}</h6>
            <small className="text-muted">
              {moment(notification.createdAt).fromNow()}
            </small>
          </div>
          <p className="mb-1">{notification.message}</p>
          <small className="text-muted">
            Gửi bởi: {notification.createdBy.username}
          </small>
        </div>
      ))}
      {notifications.length === 0 && (
        <div className="text-center py-3">Không có thông báo nào</div>
      )}
    </div>
  );
};

export default NotificationList;
