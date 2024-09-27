import React, { useState, useEffect, useContext } from "react";
import { Row, Col, Button, Form } from "react-bootstrap";
import axios from "axios";
import setAuthToken from "../../utils/setAuthToken"; // Đảm bảo bạn đã import setAuthToken đúng cách
import { AuthContext } from "../../contexts/AuthContext"; // Import AuthContext
import "../../css/StudentInfo.css";
import { Box, Typography } from "@mui/material";
const StudentInfo = () => {
  const { updateProfile } = useContext(AuthContext); // Lấy updateProfile từ context
  const [userData, setUserData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    studentId: "",
    name: "",
    phone: "",
    email: "",
    class: "",
    major: "",
    gender: "",
    groupName: "",
    groupStatus: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
    } else {
      console.log("Token not found, redirect to login");
    }

    fetchProfileData();
  }, []);

  const fetchProfileData = () => {
    axios
      .get("http://localhost:5000/api/student/profile-student")
      .then((response) => {
        const data = response.data;
        if (data.success) {
          setUserData(data.profile);
          setProfile(data.profile);
        } else {
          console.log("Error fetching profile: ", data.message);
        }
      })
      .catch((error) => {
        console.log("Error fetching profile: ", error);
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();

    axios
      .post("http://localhost:5000/api/student/update", profile)
      .then((response) => {
        const data = response.data;
        if (data.success) {
          setUserData(data.profile);
          setIsEditing(false);
          updateProfile(data.profile);
          fetchProfileData(); // Fetch updated data after successful update
        } else {
          alert(data.message);
        }
      })
      .catch((error) => console.log("Error updating profile: ", error));
  };

  return (
    <>
      <Box>
        <Typography variant="h4">Thông tin sinh viên:</Typography>
        {/* <StudentInfo /> */}
      </Box>

      <Row className="user-info-container">
        {isEditing ? (
          <Form onSubmit={handleUpdateProfile}>
            <Col md={6} className="user-info">
              <h3>Thông Tin Cá Nhân</h3>
              <Form.Group>
                <Form.Label>Mã sinh viên:</Form.Label>
                <Form.Control
                  type="text"
                  name="studentId"
                  value={profile.studentId}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Họ và tên:</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Số điện thoại:</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={profile.phone}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Email:</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Lớp danh nghĩa:</Form.Label>
                <Form.Control
                  type="text"
                  name="class"
                  value={profile.class}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Ngành học:</Form.Label>
                <Form.Control
                  type="text"
                  name="major"
                  value={profile.major}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Giới tính:</Form.Label>
                <Form.Control
                  type="text"
                  name="gender"
                  value={profile.gender}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
            <Col md={6} className="user-info">
              <h3>Thông Tin Nhóm Đề Tài</h3>
              <Form.Group>
                <Form.Label>Tên nhóm:</Form.Label>
                <Form.Control
                  type="text"
                  name="groupName"
                  value={profile.groupName}
                  readOnly // Làm trường này chỉ đọc
                  //onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Trạng thái Đề tài:</Form.Label>
                <Form.Control
                  type="text"
                  name="groupStatus"
                  value={profile.groupStatus}
                  readOnly // Làm trường này chỉ đọc
                  //onChange={handleInputChange}
                />
              </Form.Group>
              <Button variant="primary" type="submit">
                Lưu Thay Đổi
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Hủy
              </Button>
            </Col>
          </Form>
        ) : (
          <>
            <Col md={6} /* className="user-info" */>
              <div className="card personal-info-card">
                <div className="card-body">
                  <h3>Thông Tin Cá Nhân</h3>
                  <p>Mã sinh viên: {userData.studentId}</p>
                  <p>Họ và tên: {userData.name}</p>
                  <p>Số điện thoại: {userData.phone}</p>
                  <p>Email: {userData.email}</p>
                  <p>Lớp danh nghĩa: {userData.class}</p>
                  <p>Ngành học: {userData.major}</p>
                  <p>Giới tính: {userData.gender}</p>
                </div>
              </div>
            </Col>
            <Col md={6} /* className="user-info" */>
              <div className="card group-info-card">
                <div className="card-body">
                  <h3>Thông Tin Nhóm Đề Tài</h3>
                  <p>Tên nhóm: {userData.groupName || "Chưa có nhóm"}</p>
                  <p>Trạng thái nhóm: {userData.groupStatus || "N/A"}</p>
                </div>
              </div>
            </Col>
            <Button
              style={{ marginTop: "10px" }}
              onClick={() => setIsEditing(true)}
            >
              Cập nhật
            </Button>
          </>
        )}
      </Row>
    </>
  );
};

export default StudentInfo;
