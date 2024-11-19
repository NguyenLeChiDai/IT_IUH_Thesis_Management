import React, { useState, useEffect } from "react";
import { Container, Card, Button, Row, Col } from "react-bootstrap";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Download, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminReportDetail = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const { reportId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchReportDetail();
  }, [reportId]);

  const fetchReportDetail = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/adminReport/admin/report/${reportId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        setReport(response.data.report);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching report detail:", error);
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/adminReport/admin/download-report/${reportId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", report.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  if (!report) {
    return <div>Không tìm thấy báo cáo</div>;
  }

  return (
    <Container className="mt-4">
      <Button
        variant="outline-secondary"
        className="mb-3"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} className="me-2" /> Quay lại
      </Button>
      <Card>
        <Card.Header>Chi tiết báo cáo</Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h5>Thông tin nhóm và sinh viên</h5>
              <p>
                <strong>Nhóm:</strong>{" "}
                {report.group?.groupName || "Chưa có nhóm"}
              </p>
              <p>
                <strong>Sinh viên:</strong>{" "}
                {report.students
                  .map((student) => `${student.name} (${student.studentId})`)
                  .join(", ")}
              </p>
            </Col>
            <Col md={6}>
              <h5>Thông tin đề tài</h5>
              <p>
                <strong>Tên đề tài:</strong> {report.topic?.nameTopic}
              </p>
              <p>
                <strong>Giảng viên hướng dẫn:</strong> {report.teacher?.name}
              </p>
            </Col>
          </Row>

          <Row className="mt-3">
            <Col md={6}>
              <h5>Thông tin báo cáo</h5>
              <p>
                <strong>Thư mục:</strong> {report.folder?.name}
              </p>
              <p>
                <strong>Tên file:</strong> {report.fileName}
              </p>
              <p>
                <strong>Ngày gửi:</strong>{" "}
                {new Date(report.submissionDate).toLocaleString()}
              </p>
              <p>
                <strong>Ngày phê duyệt:</strong>{" "}
                {new Date(report.teacherApprovalDate).toLocaleString()}
              </p>
            </Col>
            <Col md={6}>
              {report.adminNote && (
                <>
                  <h5>Ghi chú của admin</h5>
                  <p>{report.adminNote}</p>
                </>
              )}
            </Col>
          </Row>

          <div className="mt-3 text-center">
            <Button variant="primary" onClick={handleDownload}>
              <Download size={16} className="me-2" /> Tải báo cáo
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminReportDetail;
