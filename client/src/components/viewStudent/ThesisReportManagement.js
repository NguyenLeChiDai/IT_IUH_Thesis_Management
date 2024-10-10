import React, { useState, useEffect } from "react";
import { Button, Table, Modal, Form, Toast } from "react-bootstrap";
import { Search } from "lucide-react";
import { InputAdornment, TextField, TablePagination } from "@mui/material";
import axios from "axios";
import "../../css/ThesisReportManagement.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const ThesisReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [file, setFile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        "http://localhost:5000/api/thesisReports/get-report",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        setReports(response.data.reports);
      } else {
        setError("Không thể lấy danh sách báo cáo");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setError("Đã xảy ra lỗi khi lấy danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const MAX_TITLE_LENGTH = 50; // Giới hạn độ dài tiêu đề

  const handleSubmitReport = async (event) => {
    event.preventDefault();
    const title = event.target.title.value;
    if (title.length > MAX_TITLE_LENGTH) {
      Toast.error("Tên báo cáo của bạn quá dài");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", event.target.description.value);
    formData.append("file", file);

    try {
      let response;
      if (editMode) {
        response = await axios.put(
          `http://localhost:5000/api/thesisReports/${selectedReport._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setReports(
          reports.map((report) =>
            report._id === selectedReport._id ? response.data.report : report
          )
        );
      } else {
        response = await axios.post(
          "http://localhost:5000/api/thesisReports/upload-report",
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setReports([...reports, response.data.report]);
      }
      setShowModal(false);
      setEditMode(false);
      setSelectedReport(null);
      setFile(null);
    } catch (error) {
      console.error("Error submitting report:", error);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setEditMode(false);
    setShowModal(true);
  };

  const handleEditReport = (report) => {
    setSelectedReport(report);
    setEditMode(true);
    setShowModal(true);
  };

  const handleDeleteReport = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa báo cáo này?")) {
      try {
        await axios.delete(`http://localhost:5000/api/thesisReports/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setReports(reports.filter((report) => report._id !== id));
      } catch (error) {
        console.error("Error deleting report:", error);
      }
    }
  };

  const handleViewFile = (fileUrl) => {
    window.open(`http://localhost:5000${fileUrl}`, "_blank");
  };

  const handleDownloadFile = async (fileUrl, fileName) => {
    try {
      const response = await axios.get(`http://localhost:5000${fileUrl}`, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const filteredReports = reports.filter((report) =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Hàm để xuống dòng mô tả
  const formatDescription = (description, maxLength = 120) => {
    if (!description) return "";
    const words = description.split(" ");
    let lines = [];
    let currentLine = "";

    words.forEach((word) => {
      if ((currentLine + word).length > maxLength) {
        lines.push(currentLine.trim());
        currentLine = "";
      }
      currentLine += word + " ";
    });
    if (currentLine.trim()) lines.push(currentLine.trim());

    return lines.join("\n");
  };
  return (
    <div className="thesis-report-container">
      <h2 className="mb-4 text-center">Quản lý báo cáo khóa luận</h2>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : (
        <>
          <Form className="mb-4">
            <div className="search-container">
              <TextField
                label="Tìm kiếm theo tên báo cáo"
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

          <Button
            variant="primary"
            onClick={() => {
              setSelectedReport(null);
              setEditMode(false);
              setShowModal(true);
            }}
            className="mb-3"
          >
            <i className="fas fa-plus"></i> Đăng báo cáo
          </Button>

          {reports.length > 0 ? (
            <>
              <Table striped bordered hover className="custom-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên báo cáo</th>
                    <th>Ngày đăng</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((report, index) => (
                      <tr
                        key={report._id}
                        onClick={() => handleViewReport(report)}
                        className="report-row"
                      >
                        <td>{index + 1 + page * rowsPerPage}</td>
                        <td>{report.title}</td>
                        <td>
                          {new Date(report.submissionDate).toLocaleString()}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              report.status === "Đã xem"
                                ? "reviewed"
                                : "pending"
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {/*  <Button
                            variant="info"
                            size="sm"
                            className="mr-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReport(report);
                            }}
                          >
                            <i className="fas fa-eye"></i> Xem
                          </Button> */}
                          {report.status !== "Đã xem" && (
                            <>
                              <Button
                                variant="warning"
                                size="sm"
                                className="mr-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditReport(report);
                                }}
                              >
                                <i className="fas fa-edit"></i> Sửa
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteReport(report._id);
                                }}
                              >
                                <i className="fas fa-trash"></i> Xóa
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredReports.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          ) : (
            <p>Không có báo cáo nào.</p>
          )}
        </>
      )}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        className="thesis-report-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editMode
              ? "Chỉnh sửa báo cáo"
              : selectedReport
              ? "Chi tiết báo cáo"
              : "Đăng báo cáo mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReport && !editMode ? (
            <div className="report-details">
              <h4>{selectedReport.title}</h4>
              <p>
                <strong>Mô tả:</strong>
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                  {formatDescription(selectedReport.description)}
                </pre>
              </p>
              <p>
                <strong>File:</strong>{" "}
                <Button
                  variant="link"
                  onClick={() => handleViewFile(selectedReport.fileUrl)}
                >
                  {selectedReport.fileName}
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() =>
                    handleDownloadFile(
                      selectedReport.fileUrl,
                      selectedReport.fileName
                    )
                  }
                >
                  Tải xuống
                </Button>
              </p>
              <p>
                <strong>Ngày đăng:</strong>{" "}
                {new Date(selectedReport.submissionDate).toLocaleString()}
              </p>
              {selectedReport.status === "Đã xem" && (
                <>
                  <p>
                    <strong>Ngày xem:</strong>{" "}
                    {new Date(selectedReport.viewedDate).toLocaleString()}
                  </p>
                  <p>
                    <strong>Ghi chú:</strong> {selectedReport.teacherNote}
                  </p>
                  {selectedReport.teacherFileName && (
                    <p>
                      <strong>File đã chỉnh sửa:</strong>{" "}
                      <Button
                        variant="link"
                        onClick={() =>
                          handleViewFile(selectedReport.teacherFileUrl)
                        }
                      >
                        {selectedReport.teacherFileName}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() =>
                          handleDownloadFile(
                            selectedReport.teacherFileUrl,
                            selectedReport.teacherFileName
                          )
                        }
                      >
                        Tải xuống
                      </Button>
                    </p>
                  )}
                </>
              )}
            </div>
          ) : (
            <Form onSubmit={handleSubmitReport}>
              <Form.Group>
                <Form.Label>Tên báo cáo</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  required
                  defaultValue={editMode ? selectedReport.title : ""}
                  maxLength={MAX_TITLE_LENGTH}
                />
                <Form.Text className="text-muted">
                  Tối đa {MAX_TITLE_LENGTH} ký tự
                </Form.Text>
              </Form.Group>
              <Form.Group>
                <Form.Label>Mô tả</Form.Label>
                <Form.Control
                  as="textarea"
                  name="description"
                  rows={3}
                  defaultValue={editMode ? selectedReport.description : ""}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>File báo cáo</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  required={!editMode}
                />
                {editMode && (
                  <small className="form-text text-muted">
                    Để trống nếu không muốn thay đổi file
                  </small>
                )}
              </Form.Group>
              <Button variant="primary" type="submit" className="mt-3">
                {editMode ? "Cập nhật báo cáo" : "Đăng báo cáo"}
              </Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ThesisReportManagement;
