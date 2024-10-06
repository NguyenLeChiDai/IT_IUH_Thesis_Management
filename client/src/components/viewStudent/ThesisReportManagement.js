import React, { useState } from "react";
import { Button, Table, Modal, Form } from "react-bootstrap";
import { Search } from "lucide-react";
import { InputAdornment, TextField, TablePagination } from "@mui/material";
import "../../css/ThesisReportManagement.css";

const initialReports = [
  {
    id: 1,
    title: "Báo Cáo Usecase",
    description: "Báo cáo uscase cho lần 1",
    file: "AI_trong_y_te.pdf",
    date: "2024-03-15 09:30:00",
    reviewed: true,
    reviewDate: "2024-03-17 14:20:00",
    reviewComment: "Cần bổ sung thêm ví dụ cụ thể",
    reviewedFile: "AI_trong_y_te_reviewed.pdf",
  },
  {
    id: 2,
    title: "Báo cáo Usace lần 2",
    description: "Xây dựng một ứng dụng quản lý công việc sử dụng ReactJS",
    file: "React_Web_App.pdf",
    date: "2024-03-16 11:45:00",
    reviewed: false,
    reviewDate: null,
    reviewComment: "",
    reviewedFile: "",
  },
  // Thêm các báo cáo mẫu khác ở đây
];

const ThesisReportManagement = () => {
  const [reports, setReports] = useState(initialReports);
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleSubmitReport = (event) => {
    event.preventDefault();
    const newReport = {
      id: Date.now(),
      title: event.target.title.value,
      description: event.target.description.value,
      file: event.target.file.files[0].name,
      date: new Date().toLocaleString(),
      reviewed: false,
      reviewDate: null,
      reviewComment: "",
      reviewedFile: "",
    };
    setReports([...reports, newReport]);
    setShowModal(false);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const handleEditReport = (report) => {
    if (!report.reviewed) {
      setSelectedReport(report);
      setShowModal(true);
    }
  };

  const handleDeleteReport = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa báo cáo này?")) {
      setReports(reports.filter((report) => report.id !== id));
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

  return (
    <div className="thesis-report-container">
      <h2 className="mb-4 text-center">Quản lý báo cáo khóa luận</h2>

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
        onClick={() => setShowModal(true)}
        className="mb-3"
      >
        <i className="fas fa-plus"></i> Đăng báo cáo
      </Button>

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
                key={report.id}
                onClick={() => handleViewReport(report)}
                className="report-row"
              >
                <td>{index + 1 + page * rowsPerPage}</td>
                <td>{report.title}</td>
                <td>{report.date}</td>
                <td>
                  <span
                    className={`status-badge ${
                      report.reviewed ? "reviewed" : "pending"
                    }`}
                  >
                    {report.reviewed ? "Đã xem" : "Chưa xem"}
                  </span>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  {!report.reviewed && (
                    <>
                      <Button
                        variant="warning"
                        size="sm"
                        className="ml-2"
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
                        className="ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReport(report.id);
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

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedReport ? "Chi tiết báo cáo" : "Đăng báo cáo mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReport ? (
            <div className="report-details">
              <h4>{selectedReport.title}</h4>
              <p>
                <strong>Mô tả:</strong> {selectedReport.description}
              </p>
              <p>
                <strong>File:</strong> {selectedReport.file}
              </p>
              <p>
                <strong>Ngày đăng:</strong> {selectedReport.date}
              </p>
              {selectedReport.reviewed && (
                <>
                  <p>
                    <strong>Ngày xem:</strong> {selectedReport.reviewDate}
                  </p>
                  <p>
                    <strong>Ghi chú:</strong> {selectedReport.reviewComment}
                  </p>
                  {selectedReport.reviewedFile && (
                    <p>
                      <strong>File đã chỉnh sửa:</strong>{" "}
                      {selectedReport.reviewedFile}
                    </p>
                  )}
                </>
              )}
            </div>
          ) : (
            <Form onSubmit={handleSubmitReport}>
              <Form.Group>
                <Form.Label>Tên báo cáo</Form.Label>
                <Form.Control type="text" name="title" required />
              </Form.Group>
              <Form.Group>
                <Form.Label>Mô tả</Form.Label>
                <Form.Control as="textarea" name="description" rows={3} />
              </Form.Group>
              <Form.Group>
                <Form.Label>File báo cáo</Form.Label>
                <Form.Control type="file" name="file" required />
              </Form.Group>
              <Button variant="primary" type="submit" className="mt-3">
                Đăng báo cáo
              </Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ThesisReportManagement;
