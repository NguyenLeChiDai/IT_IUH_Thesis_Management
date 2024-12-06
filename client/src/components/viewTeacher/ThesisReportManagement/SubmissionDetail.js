import React, { useState, useEffect } from "react";
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
import axios from "axios";
import moment from "moment";
import { apiUrl } from "../../../contexts/constants";
const SubmissionDetail = () => {
  const [loading, setLoading] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackFile, setFeedbackFile] = useState(null);
  const [submission, setSubmission] = useState(null);
  const { submissionId } = useParams();
  const navigate = useNavigate();

  // Fetch submission details
  useEffect(() => {
    const fetchSubmissionDetail = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${apiUrl}/reportManagements/submission/${submissionId}`
        );
        if (response.data.success) {
          setSubmission(response.data.submission);
        }
      } catch (error) {
        console.error("Error fetching submission:", error);
        // Add error handling/notification here
      } finally {
        setLoading(false);
      }
    };

    if (submissionId) {
      fetchSubmissionDetail();
    }
  }, [submissionId]);

  // Handle file download
  const handleDownload = async (fileType) => {
    try {
      setLoading(true);
      const endpoint =
        fileType === "submission"
          ? `${apiUrl}/reportManagements/download-report/${submissionId}`
          : `${apiUrl}/reportManagements/feedback-file/${submissionId}`; // Endpoint tải file phản hồi

      const response = await axios.get(endpoint, {
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        fileType === "submission"
          ? submission?.file?.name
          : submission?.feedback?.file?.name || "download"
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading file:", error);
      // Add error notification here
    } finally {
      setLoading(false);
    }
  };

  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    if (!feedbackNote.trim() && !feedbackFile) return;

    try {
      setLoading(true);
      const formData = new FormData();
      if (feedbackNote.trim()) {
        formData.append("note", feedbackNote);
      }
      if (feedbackFile) {
        formData.append("file", feedbackFile);
      }

      const response = await axios.post(
        `${apiUrl}/reportManagements/submission/${submissionId}/feedback`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        // Update submission state with new feedback
        setSubmission((prev) => ({
          ...prev,
          feedback: response.data.feedback,
        }));

        // Clear form
        setFeedbackNote("");
        setFeedbackFile(null);

        // Add success notification here
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      // Add error notification here
    } finally {
      setLoading(false);
    }
  };

  if (!submission && !loading) {
    return <div>Không tìm thấy thông tin bài nộp</div>;
  }

  return (
    <div className="container-fluid mt-4">
      <Button variant="link" className="mb-3 p-0" onClick={() => navigate(-1)}>
        <ArrowLeft className="me-2" />
        Danh sách báo cáo
      </Button>
      <h2 className="mb-4">Chi tiết bài nộp</h2>

      {/* General Information */}
      <Card className="mb-4">
        <Card.Body>
          <h6 className="card-subtitle mb-3 text-muted">Thông tin chung</h6>
          <Table borderless size="sm">
            <tbody>
              <tr>
                <td style={{ width: "120px" }}>
                  <strong>Nhóm:</strong>
                </td>
                <td>{submission?.groupName}</td>
              </tr>
              <tr>
                <td>
                  <strong>Thành viên:</strong>
                </td>
                <td>{submission?.members?.join(", ")}</td>
              </tr>
              <tr>
                <td>
                  <strong>Đề tài:</strong>
                </td>
                <td>{submission?.topic}</td>
              </tr>
              <tr>
                <td>
                  <strong>Thời gian nộp:</strong>
                </td>
                <td>
                  {moment(submission?.submissionDate).format(
                    "DD/MM/YYYY HH:mm"
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Trạng thái:</strong>
                </td>
                <td>
                  <Badge
                    bg={
                      submission?.status?.includes("Trễ") ? "danger" : "success"
                    }
                  >
                    {submission?.status}
                  </Badge>
                </td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Attached File */}
      <Card className="mb-4">
        <Card.Body>
          <h6 className="card-subtitle mb-3 text-muted">File đính kèm</h6>
          <div className="d-flex align-items-center justify-content-between p-3 border rounded">
            <div className="d-flex align-items-center">
              <FileText size={24} className="text-primary me-2" />
              <div>
                <div>{submission?.file?.name}</div>
              </div>
            </div>
            <div>
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => handleDownload("submission")}
                disabled={loading}
              >
                <Download size={16} className="me-1" />
                Tải về
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Feedback History */}
      {submission?.feedback?.note && (
        <Card className="mb-4">
          <Card.Body>
            <h6 className="card-subtitle mb-3 text-muted">Nhận xét</h6>
            <p>{submission.feedback.note}</p>
            {submission.feedback.file && (
              <div className="d-flex align-items-center justify-content-between p-3 border rounded mt-3">
                <div className="d-flex align-items-center">
                  <FileText size={24} className="text-primary me-2" />
                  <div>{submission.feedback.file.name}</div>
                </div>
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={() => handleDownload("feedback")}
                  disabled={loading}
                >
                  <Download size={16} className="me-1" />
                  Tải về
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Feedback Form */}
      <Card>
        <Card.Body>
          <h6 className="card-subtitle mb-3 text-muted">Thêm nhận xét</h6>
          <Form>
            <Form.Group className="mb-3">
              <Form.Control
                as="textarea"
                rows={3}
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
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
                  onChange={(e) => setFeedbackFile(e.target.files[0])}
                />
              </Form.Group>
              <Button
                variant="primary"
                onClick={handleSubmitFeedback}
                disabled={(!feedbackNote.trim() && !feedbackFile) || loading}
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
