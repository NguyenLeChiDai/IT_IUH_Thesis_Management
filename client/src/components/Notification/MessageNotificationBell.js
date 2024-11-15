import React, { useState, useEffect, useRef } from "react";
import { Badge } from "react-bootstrap";
import axios from "axios";
import { MessageCircle } from "lucide-react";
import moment from "moment";

const MessageNotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/messageNotification/unread-count",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/messageNotification",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
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

  const markAsRead = async (notificationId) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/messageNotification/mark-read/${notificationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data.success) {
        fetchUnreadCount();
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      fetchNotifications();
    }
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
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-2 border-bottom ${
                  !notification.isRead ? "bg-light" : ""
                }`}
                onClick={() => markAsRead(notification._id)}
                style={{ cursor: "pointer" }}
              >
                <div className="d-flex justify-content-between">
                  <strong>{notification.sender?.name}</strong>
                  <small className="text-muted">
                    {moment(notification.createdAt).fromNow()}
                  </small>
                </div>
                <div>
                  {notification.groupId ? (
                    <small className="text-muted">
                      Nhóm: {notification.groupId.name}
                    </small>
                  ) : null}
                </div>
                <div className="text-truncate">
                  {notification.message?.content}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted">Không có tin nhắn mới</div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageNotificationBell;
