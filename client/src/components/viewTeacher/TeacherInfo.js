import React, { useState, useEffect, useContext } from "react";
import { Row, Col, Button, Form } from "react-bootstrap";
import axios from "axios";
import setAuthToken from "../../utils/setAuthToken"; // Đảm bảo bạn đã import setAuthToken đúng cách
import { AuthContext } from "../../contexts/AuthContext"; // Import AuthContext
import "../../css/TeacherInfo.css";
const TeacherInfo = () => {
  const { updateProfile } = useContext(AuthContext); // Lấy updateProfile từ context
  const [userData, setUserData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    teacherId: "",
    name: "",
    phone: "",
    email: "",
    gender: "",
    major: "",
  });

  useEffect(() => {
    // Lấy token từ localStorage
    const token = localStorage.getItem("token");

    if (token) {
      // Đặt token vào headers của axios
      setAuthToken(token);
    } else {
      console.log("Token not found, redirect to login");
      // Redirect to login page or show error
    }

    // Gọi API để lấy thông tin hồ sơ của người dùng
    axios
      .get("http://localhost:5000/api/teachers/profile-teacher")
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
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();

    axios
      .post("http://localhost:5000/api/teachers/update", profile)
      .then((response) => {
        const data = response.data;
        if (data.success) {
          setUserData(data.profile);
          setIsEditing(false);
          updateProfile(data.profile); // Cập nhật profile vào context
        } else {
          alert(data.message);
        }
      })
      .catch((error) => console.log("Error updating profile: ", error));
  };

  return (
    <Row className="user-info-group-container">
      {isEditing ? (
        <Form onSubmit={handleUpdateProfile}>
          <Col md={12} className="user-info">
            <h3>Thông Tin Cá Nhân</h3>
            <Form.Group>
              <Form.Label>Mã giảng viên:</Form.Label>
              <Form.Control
                type="text"
                name="teacherId"
                value={profile.teacherId}
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
              <Form.Label>Chuyên ngành:</Form.Label>
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
          <Col md={6} className="group-info">
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
          <Col md={6} className="user-info">
            <h3>Thông Tin Cá Nhân</h3>
            <p>Mã giảng viên: {userData.teacherId}</p>
            <p>Họ và tên: {userData.name}</p>
            <p>Số điện thoại: 0{userData.phone}</p>
            <p>Email: {userData.email}</p>
            <p>Chuyên Ngành: {userData.major}</p>
            <p>Giới tính: {userData.gender}</p>
          </Col>
          <Button onClick={() => setIsEditing(true)}>Cập nhật</Button>
        </>
      )}
    </Row>
  );
};

export default TeacherInfo;
