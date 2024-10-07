import React from "react";
import "../../css/TopicDetailForm.css"; // Import file CSS để style

function TopicDetailForm({ topic, onClose }) {
  return (
    <>
      <div className="modal-overlay" onClick={onClose}></div>{" "}
      {/* Overlay để khi click ra ngoài sẽ đóng modal */}
      <div className="modal-content">
        <h3>Thông tin chi tiết đề tài:</h3>
        <p>
          <strong>Tên đề tài: </strong>
          {topic.nameTopic || "Không có tiêu đề"}
        </p>
        <p>
          <strong>Mô tả: </strong>
          {topic.descriptionTopic || "Không có mô tả"}
        </p>

        {topic.teacher && (
          <p>
            <strong>Giảng Viên:</strong>{" "}
            {topic.teacher.name || "Chưa có thông tin"}
          </p>
        )}

        <button onClick={onClose}>Đóng</button>
      </div>
    </>
  );
}

export default TopicDetailForm;
