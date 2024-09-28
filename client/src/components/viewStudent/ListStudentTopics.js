import React, { useState } from "react";
import { Table, Form, Button } from "react-bootstrap";
import { Search } from "lucide-react";
import { InputAdornment, TextField } from "@mui/material";
import "../../css/ListStudentTopics.css"; // Import file CSS

export const ListStudentTopics = () => {
  const [topics, setTopics] = useState([
    {
      id: 1,
      name: "Phát triển ứng dụng web với React cho sinh viên có thể đăng ký mọi lúc mọi nơi trên thế giới trên vũ trụ androi , ios",
      lecturer: "Đặng Thị Thu Hà",
      registeredGroups: 2,
    },
    {
      id: 2,
      name: "Xây dựng hệ thống IoT",
      lecturer: "Trần Thị B",
      registeredGroups: 1,
    },
    {
      id: 3,
      name: "Nghiên cứu về Machine Learning",
      lecturer: "Lê Văn C",
      registeredGroups: 0,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredTopics = topics.filter(
    (topic) =>
      topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.lecturer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="student-topics-list">
      <h2 className="mb-4 text-center">Danh sách đề tài khóa luận</h2>

      <Form className="mb-4">
        <div className="search-container">
          <TextField
            label="Tìm kiếm theo đề tài hoặc tên giảng viên"
            variant="outlined"
            fullWidth
            margin="normal"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            className="search-input"
          />
        </div>
      </Form>

      <Table striped bordered hover className="custom-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên đề tài</th>
            <th>Giảng viên HD</th>
            <th>SL nhóm đã đăng ký</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredTopics.map((topic, index) => (
            <tr key={topic.id}>
              <td>{index + 1}</td>
              <td>{topic.name}</td>
              <td>{topic.lecturer}</td>
              <td>{topic.registeredGroups}</td>
              <td>
                <Button variant="primary" size="sm" className="custom-button">
                  Đăng ký
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};
