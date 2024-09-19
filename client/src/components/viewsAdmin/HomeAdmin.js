import React from "react";
import { Container, Table, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/HomeAdmin.css";

export const HomeAdmin = () => {
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Main Content */}
      <Container className="mt-5" style={{ paddingBottom: "70px" }}>
        <h2>Danh sách Khóa luận</h2>
        <Table striped bordered hover className="mt-3">
          <thead>
            <tr>
              <th>#</th>
              <th>Tên khóa luận</th>
              <th>Tác giả</th>
              <th>Giảng viên hướng dẫn</th>
              <th>Ngày nộp</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Phát triển ứng dụng web với ReactJS</td>
              <td>Nguyễn Văn A</td>
              <td>TS. Trần Văn B</td>
              <td>01/09/2024</td>
              <td>
                <Button variant="primary" size="sm">
                  Chỉnh sửa
                </Button>{" "}
                <Button variant="danger" size="sm">
                  Xóa
                </Button>
              </td>
            </tr>
            {/* Thêm nhiều dòng dữ liệu tại đây */}
          </tbody>
        </Table>
      </Container>
    </div>
  );
};
