import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../css/ListStudentGroups.css"; // Import file CSS riêng để tạo kiểu

export const ListStudentGroups = () => {
  const [groups, setGroups] = useState([]);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/studentgroups/list-groups"
      );

      if (response.data.success) {
        setGroups(response.data.groups);
      } else {
        alert("Không có nhóm nào.");
        setGroups([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải nhóm:", error);
      alert("Lỗi khi tải nhóm.");
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/studentGroups/join-group/${groupId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.confirmationRequired) {
        setConfirmation({
          groupId: groupId,
          message: response.data.message,
        });
      } else if (response.data.success) {
        alert("Đã tham gia nhóm thành công");
        fetchGroups(); // Cập nhật danh sách nhóm sau khi tham gia
      }
    } catch (error) {
      console.error("Error joining group:", error);
    }
  };

  const confirmJoinGroup = async (groupId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/studentGroups/join-group/${groupId}`,
        { confirmation: true }, // Gửi thêm thông tin xác nhận
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        alert("Đã tham gia nhóm thành công");
        setConfirmation(null); // Xóa thông báo xác nhận
        fetchGroups(); // Cập nhật danh sách nhóm
      }
    } catch (error) {
      console.error("Error confirming group join:", error);
    }
  };

  return (
    <div>
      <h2>Danh sách nhóm sinh viên</h2>
      {confirmation && (
        <div className="confirmation-popup">
          <p>{confirmation.message}</p>
          <button onClick={() => confirmJoinGroup(confirmation.groupId)}>
            Xác nhận
          </button>
          <button onClick={() => setConfirmation(null)}>Hủy</button>
        </div>
      )}
      <div className="groups-grid">
        {groups.map((group) => (
          <div key={group._id} className="group-card">
            <p>
              <strong>Tên nhóm:</strong> {group.groupName}
            </p>
            <p>
              <strong>Trạng thái nhóm:</strong> {group.groupStatus}
            </p>
            <button onClick={() => handleJoinGroup(group._id)}>
              Tham gia nhóm
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
