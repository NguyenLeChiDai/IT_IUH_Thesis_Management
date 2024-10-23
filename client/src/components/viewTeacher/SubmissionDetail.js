import React, { useState } from "react";
import { Card, Badge, Table, ListGroup, Form, Button } from "react-bootstrap";
import {
  FileText,
  Eye,
  Download,
  Upload,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

const SubmissionDetail = () => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const { submissionId } = useParams();
  const navigate = useNavigate();

  // Mock data (thay thế bằng API call thực tế)
  const mockSubmission = {
    id: 1,
    groupName: "Nhóm 1",
    members: ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C"],
    title: "Báo cáo giữa kỳ - Đề tài ABC",
    description: "Mô tả chi tiết về báo cáo giữa kỳ của nhóm",
    file: "baocao_nhom1.pdf",
    fileSize: "2.5 MB",
    submissionTime: "2024-03-20 14:30",
    status: "Đúng hạn",
    feedback: [
      {
        id: 1,
        content: "Cần bổ sung phần phân tích dữ liệu",
        timestamp: "2024-03-21 09:15",
        teacher: "GV. Nguyễn Văn X",
      },
    ],
    version: 1,
    tags: ["Giữa kỳ", "Đang đánh giá"],
  };

  const handleDownload = (file) => {
    setLoading(true);
    setTimeout(() => {
      console.log(`Downloading file: ${file}`);
      setLoading(false);
    }, 1000);
  };

  const handleViewFile = (file) => {
    console.log(`Viewing file: ${file}`);
  };

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) return;
    setLoading(true);
    // API call logic here
    setTimeout(() => {
      setFeedback("");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="container-fluid mt-4">
      <Button variant="link" className="mb-3 p-0" onClick={() => navigate(-1)}>
        <ArrowLeft className="me-2" />
        Danh sách báo cáo
      </Button>
      <h2 className="mb-4">Chi tiết bài nộp</h2>

      {/* Thông tin chung */}
      <Card className="mb-4">
        <Card.Body>
          <h6 className="card-subtitle mb-3 text-muted">Thông tin chung</h6>
          <Table borderless size="sm">
            <tbody>
              <tr>
                <td style={{ width: "120px" }}>
                  <strong>Tiêu đề:</strong>
                </td>
                <td>{mockSubmission.title}</td>
              </tr>
              <tr>
                <td>
                  <strong>Thành viên:</strong>
                </td>
                <td>{mockSubmission.members.join(", ")}</td>
              </tr>
              <tr>
                <td>
                  <strong>Thời gian nộp:</strong>
                </td>
                <td>{mockSubmission.submissionTime}</td>
              </tr>
              <tr>
                <td>
                  <strong>Trạng thái:</strong>
                </td>
                <td>
                  <Badge
                    bg={
                      mockSubmission.status === "Đúng hạn"
                        ? "success"
                        : "danger"
                    }
                  >
                    {mockSubmission.status}
                  </Badge>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Tags:</strong>
                </td>
                <td>
                  {mockSubmission.tags.map((tag, index) => (
                    <Badge key={index} bg="secondary" className="me-1">
                      {tag}
                    </Badge>
                  ))}
                </td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* File đính kèm */}
      <Card className="mb-4">
        <Card.Body>
          <h6 className="card-subtitle mb-3 text-muted">File đính kèm</h6>
          <div className="d-flex align-items-center justify-content-between p-3 border rounded">
            <div className="d-flex align-items-center">
              <FileText size={24} className="text-primary me-2" />
              <div>
                <div>{mockSubmission.file}</div>
                <small className="text-muted">{mockSubmission.fileSize}</small>
              </div>
            </div>
            <div>
              <Button
                variant="outline-primary"
                size="sm"
                className="me-2"
                onClick={() => handleViewFile(mockSubmission.file)}
              >
                <Eye size={16} className="me-1" />
                Xem
              </Button>
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => handleDownload(mockSubmission.file)}
                disabled={loading}
              >
                <Download size={16} className="me-1" />
                Tải về
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Lịch sử nhận xét */}
      <Card className="mb-4">
        <Card.Body>
          <h6 className="card-subtitle mb-3 text-muted">Lịch sử nhận xét</h6>
          <ListGroup variant="flush">
            {mockSubmission.feedback.map((fb) => (
              <ListGroup.Item key={fb.id} className="px-0">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <strong>{fb.teacher}</strong>
                  <small className="text-muted">{fb.timestamp}</small>
                </div>
                <p className="mb-0">{fb.content}</p>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>

      {/* Form nhận xét */}
      <Card>
        <Card.Body>
          <h6 className="card-subtitle mb-3 text-muted">Thêm nhận xét</h6>
          <Form>
            <Form.Group className="mb-3">
              <Form.Control
                as="textarea"
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Nhập nhận xét của bạn..."
              />
            </Form.Group>
            <div className="d-flex justify-content-between align-items-center">
              <Form.Group controlId="feedbackFile">
                <Form.Label className="btn btn-outline-primary mb-0">
                  <Upload size={16} className="me-1" />
                  Đính kèm file phản hồi
                </Form.Label>
                <Form.Control
                  type="file"
                  hidden
                  onChange={(e) => console.log(e.target.files[0])}
                />
              </Form.Group>
              <Button
                variant="primary"
                onClick={handleSubmitFeedback}
                disabled={!feedback.trim() || loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <MessageSquare className="me-1" />
                    Gửi nhận xét
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default SubmissionDetail;
