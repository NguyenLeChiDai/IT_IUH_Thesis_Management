import React, { useState, useEffect } from "react";
import { Table, Card, Modal, Spin, message } from "antd";
import axios from "axios";

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherDetails, setTeacherDetails] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:5000/api/teachersManagement/teachers"
      );
      setTeachers(response.data);
    } catch (error) {
      message.error("Không thể tải danh sách giảng viên");
    }
    setLoading(false);
  };

  const fetchTeacherDetails = async (teacherId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/teachersManagement/teachers/${teacherId}/details`
      );
      setTeacherDetails(response.data);
      setModalVisible(true);
    } catch (error) {
      message.error("Không thể tải thông tin chi tiết giảng viên");
    }
  };

  const columns = [
    {
      title: "Mã giảng viên",
      dataIndex: "teacherId",
      key: "teacherId",
    },
    {
      title: "Họ và tên",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Chuyên ngành",
      dataIndex: "major",
      key: "major",
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <button
          className="text-blue-600 hover:text-blue-800"
          onClick={() => fetchTeacherDetails(record.teacherId)}
        >
          Xem chi tiết
        </button>
      ),
    },
  ];

  const topicColumns = [
    {
      title: "Mã đề tài",
      dataIndex: "topicId",
      key: "topicId",
    },
    {
      title: "Tên đề tài",
      dataIndex: "nameTopic",
      key: "nameTopic",
    },
    {
      title: "Mô tả",
      dataIndex: "descriptionTopic",
      key: "descriptionTopic",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Số nhóm đăng ký",
      key: "groupCount",
      render: (_, record) => record.Groups?.length || 0,
    },
  ];

  const groupColumns = [
    {
      title: "Mã nhóm",
      dataIndex: "groupId",
      key: "groupId",
    },
    {
      title: "Tên nhóm",
      dataIndex: "groupName",
      key: "groupName",
    },
    {
      title: "Đề tài đăng ký",
      dataIndex: "topicName",
      key: "topicName",
    },
    {
      title: "Thành viên",
      key: "members",
      render: (_, record) => (
        <ul>
          {record.profileStudents?.map((member) => (
            <li key={member.student._id}>
              {member.student.name} ({member.student.studentId}) - {member.role}
            </li>
          ))}
        </ul>
      ),
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "registrationDate",
      key: "registrationDate",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
  ];

  return (
    <div className="p-6">
      <Card title="Quản lý giảng viên" className="shadow-md">
        <Table
          columns={columns}
          dataSource={teachers}
          loading={loading}
          rowKey="teacherId"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng số ${total} giảng viên`,
          }}
        />
      </Card>

      <Modal
        title={`Chi tiết giảng viên: ${teacherDetails?.teacher?.name || ""}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={1000}
        footer={null}
      >
        {teacherDetails && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Danh sách đề tài</h3>
              <Table
                columns={topicColumns}
                dataSource={teacherDetails.topics}
                pagination={false}
                rowKey="_id"
                size="small"
              />
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">
                Danh sách nhóm đã đăng ký đề tài
              </h3>
              <Table
                columns={groupColumns}
                dataSource={teacherDetails.registeredGroups}
                pagination={false}
                rowKey="_id"
                size="small"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default TeacherManagement;
