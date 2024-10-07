import React, { useState, useEffect } from "react";
import axios from "axios";
import "react-confirm-alert/src/react-confirm-alert.css"; // Import style
import "../../css/PostTheTopic.css"; // Import file CSS để style
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { CircularProgress } from "@mui/material";
import ReactPaginate from "react-paginate";
import "font-awesome/css/font-awesome.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";
//import { TablePagination } from '@mui/material';
const PostTheTopic = () => {
  const [activeTab, setActiveTab] = useState("add");
  const [topicTitle, setTopicTitle] = useState("");
  const [topicDescription, setTopicDescription] = useState("");
  const [topics, setTopics] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTopic, setEditingTopic] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  // Trạng thái cho form cập nhật
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateDescription, setUpdateDescription] = useState("");
  //upload file excel
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [duplicates, setDuplicates] = useState([]);
  //status
  const [isLoading, setIsLoading] = useState(false); // trạng thái tải khi upload file

  // Sử dụng filteredTopicList thay vì filteredTopics
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredTopics = topics.filter((t) =>
    t.nameTopic.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pageCount = Math.ceil(filteredTopics.length / itemsPerPage);

  const handlePageClick = (event) => {
    setCurrentPage(event.selected + 1); // Tăng chỉ số trang thêm 1
  };

  const offset = (currentPage - 1) * itemsPerPage;
  const currentPageTopics = filteredTopics.slice(offset, offset + itemsPerPage);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/topics/teacher-topics",
        {
          params: { nameTopic: searchTerm },
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.topics) {
        setTopics(response.data.topics);
      } else {
        console.log("Không có đề tài nào.");
      }
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách đề tài:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const handleConfirm = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token không tồn tại trong localStorage");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/topics/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nameTopic: topicTitle,
          descriptionTopic: topicDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Lỗi từ server: ${errorData.message}`);
      }

      await response.json();
      fetchTopics(); // Cập nhật danh sách đề tài sau khi thêm mới
      setTopicTitle("");
      setTopicDescription("");
      toast.success("Đề tài đã được dăng tải thành công!", {
        position: "top-right", // Thay đổi vị trí nếu cần
        autoClose: 2500,
      });
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu:", error.message);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("Submitting form..."); // Kiểm tra xem sự kiện có chạy không
    setIsUpdating(false); // Đóng modal cập nhật

    Swal.fire({
      title: "Xác Nhận Đăng Đề Tài",
      text: "Bạn có chắc chắn muốn đăng đề tài này không?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Có",
      cancelButtonText: "Không",
    }).then(async (result) => {
      console.log("Swal result:", result); // Kiểm tra kết quả của SweetAlert2
      if (result.isConfirmed) {
        await handleConfirm();
      }
    });
  };

  //Hàm delete
  const handleDelete = async (topicId) => {
    try {
      // Hiển thị hộp thoại xác nhận SweetAlert2
      const result = await Swal.fire({
        title: "Xác Nhận Xóa Đề Tài",
        text: "Bạn có chắc chắn muốn xóa đề tài này không?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Có, xóa nó!",
        cancelButtonText: "Không",
      });

      // Nếu người dùng không xác nhận, thoát khỏi hàm
      if (!result.isConfirmed) return;

      // Gọi API xóa đề tài
      await axios.delete(`http://localhost:5000/api/topics/delete/${topicId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      // Cập nhật danh sách đề tài sau khi xóa
      fetchTopics();

      // Hiển thị thông báo thành công
      toast.success("Đề tài đã được xóa thành công!", {
        position: "top-right",
        autoClose: 2500,
      });
    } catch (error) {
      console.error("Lỗi khi xóa đề tài", error);

      // Hiển thị thông báo lỗi
      toast.error("Có lỗi xảy ra khi xóa đề tài", {
        position: "top-right",
        autoClose: 2500,
      });
    }
  };

  const handleTopicClick = async (topic) => {
    setSelectedTopic(topic);
    setIsDetailsVisible(true); // Hiển thị modal thông tin chi tiết
    setIsUpdating(false); // Đảm bảo modal cập nhật không hiển th
  };

  const handleUpdate = (topic) => {
    setEditingTopic(topic); // Lưu thông tin đề tài cần cập nhật
    setUpdateTitle(topic.nameTopic);
    setUpdateDescription(topic.descriptionTopic);
    setIsUpdating(true);
    setIsDetailsVisible(false);
  };

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token không tồn tại trong localStorage");
      return;
    }
    // Hiển thị hộp thoại xác nhận SweetAlert2
    const confirmUpdate = await Swal.fire({
      title: "Xác Nhận Cập Nhật Đề Tài",
      text: "Bạn có chắc chắn muốn cập nhật đề tài này không?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Có!",
      cancelButtonText: "Không",
    });
    if (!confirmUpdate.isConfirmed) return; // Nếu không được xác nhận, dừng lại

    try {
      const response = await fetch(
        `http://localhost:5000/api/topics/update/${editingTopic._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nameTopic: updateTitle, // Sử dụng giá trị cập nhật
            descriptionTopic: updateDescription, // Sử dụng giá trị cập nhật
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Lỗi từ server: ${errorData.message}`);
      }

      await response.json();
      fetchTopics(); // Cập nhật danh sách đề tài
      setEditingTopic(null);
      setUpdateTitle(""); // Reset lại trường
      setUpdateDescription(""); // Reset lại trường
      setIsUpdating(false); // Đóng modal cập nhật

      // Thông báo lưu thành công
      toast.success("Thông tin đã được cập nhật!", {
        position: "top-right", // Thay đổi vị trí nếu cần
        autoClose: 2500,
      });
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu:", error.message);
    }
  };

  //Upload file excel
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    console.log("File được chọn:", file); // Logging để kiểm tra
  };

  const handleUpload = async () => {
    // Bắt đầu quá trình tải lên
    setIsLoading(true); // Bắt đầu trạng thái loading

    if (!selectedFile) {
      setUploadStatus("Vui lòng chọn một file trước khi tải lên.");
      setIsLoading(false); // Kết thúc trạng thái loading
      return;
    }
    // Hiển thị hộp thoại xác nhận SweetAlert2
    const confirmUpload = await Swal.fire({
      title: "Xác Nhận Đăng Tải Đề Tài",
      text: "Bạn có chắc chắn muốn đăng tải đề tài này không?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Có!",
      cancelButtonText: "Không",
    });
    toast.success("Đề tài đã được dăng tải thành công!", {
      position: "top-right", // Thay đổi vị trí nếu cần
      autoClose: 2500,
    });

    // Nếu người dùng không đồng ý, dừng lại
    if (!confirmUpload.isConfirmed) {
      setIsLoading(false); // Kết thúc trạng thái loading
      return;
    }

    const formData = new FormData();
    formData.append("excelFile", selectedFile);

    try {
      console.log("Đang gửi file:", selectedFile); // Logging trước khi gửi
      const response = await axios.post(
        "http://localhost:5000/api/topics/upload-excel",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      console.log("Phản hồi từ server:", response.data); // Logging phản hồi

      if (response.data.success) {
        setUploadStatus(response.data.message);
        setDuplicates(response.data.duplicates || []);
        // Gọi lại fetchTopics để cập nhật danh sách
        fetchTopics();
      } else {
        setUploadStatus(
          `Có lỗi xảy ra khi tải lên file: ${response.data.message}`
        );
      }
    } catch (error) {
      console.error("Lỗi khi tải lên file:", error);
      if (error.response) {
        // Phản hồi được nhận từ server
        setUploadStatus(`Lỗi từ server: ${error.response.data.message}`);
      } else if (error.request) {
        // Yêu cầu được gửi nhưng không nhận được phản hồi
        setUploadStatus(
          "Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối mạng."
        );
      } else {
        // Có lỗi khi thiết lập request
        setUploadStatus(`Lỗi: ${error.message}`);
      }
    } finally {
      // Kết thúc trạng thái loading trong tất cả trường hợp
      setIsLoading(false);

      // Ẩn thông báo sau 3 giây
      setTimeout(() => {
        setUploadStatus("");
      }, 3000);
    }
  };

  return (
    <div className="post-the-topic">
      <div className="tabs">
        <button
          className={activeTab === "add" ? "active" : ""}
          onClick={() => setActiveTab("add")}
        >
          <i className="fa fa-paper-plane" style={{ marginRight: "8px" }}></i>
          Đăng Tải Đề Tài
        </button>
        <button
          className={activeTab === "manage" ? "active" : ""}
          onClick={() => setActiveTab("manage")}
        >
          <i className="fa fa-tasks" style={{ marginRight: "8px" }}></i>
          Quản Lý Đề Tài
        </button>
      </div>

      {activeTab === "add" && (
        <div className="add-topic">
          <h2
            style={{
              border: "2px solid #3B82F6", // Đường viền xanh dương đậm
              background: "linear-gradient(90deg, #3B82F6, #60A5FA)", // Hiệu ứng gradient
              color: "white", // Màu chữ trắng
              padding: "12px 20px", // Tăng khoảng cách bên trong
              borderRadius: "10px", // Bo tròn góc lớn hơn
              textAlign: "center", // Căn giữa
              boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)", // Đổ bóng sâu hơn
              display: "flex", // Căn chỉnh icon và chữ theo hàng ngang
              alignItems: "center", // Căn giữa theo chiều dọc
              justifyContent: "center", // Căn giữa theo chiều ngang
              fontFamily: "'Roboto', sans-serif", // Phông chữ hiện đại
              fontWeight: "bold", // In đậm
              fontSize: "1.5rem", // Tăng kích thước chữ
              transition: "transform 0.3s ease", // Hiệu ứng khi hover
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <i
              className="fa fa-cloud-upload-alt"
              style={{ marginRight: "10px" }}
            ></i>{" "}
            {/* Biểu tượng mới */}
            Đăng Tải Đề Tài
          </h2>
          <form onSubmit={handleSubmit}>
            <textarea
              type="text"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="Nhập tên đề tài"
              rows="2"
            />
            <textarea
              value={topicDescription}
              onChange={(e) => setTopicDescription(e.target.value)}
              placeholder="Nhập mô tả đề tài"
              rows="6"
            />
            <label
              htmlFor="excel-upload"
              style={{ display: "flex", alignItems: "center" }}
            >
              <div className="file-input" style={{ flexGrow: 1 }}>
                <label
                  htmlFor="excelFile"
                  style={{
                    marginRight: "20px", // Khoảng cách giữa label và input
                    fontSize: "16px", // Kích thước chữ
                    fontWeight: "bold", // Đậm
                    color: "#333", // Màu chữ
                  }}
                >
                  Tải lên file Excel:
                </label>
                <input
                  type="file"
                  id="excelFile"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  style={{
                    padding: "10px", // Tăng khoảng đệm bên trong
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "16px", // Tăng kích thước chữ
                    height: "45px", // Tăng chiều cao
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isLoading}
                style={{
                  marginLeft: "20px",
                  height: "45px", // Đảm bảo chiều cao bằng với input
                  padding: "0 10px", // Tăng padding bên trái và bên phải
                  fontSize: "16px", // Đảm bảo kích thước chữ tương tự như input
                  cursor: "pointer", // Hiển thị con trỏ khi hover
                  backgroundColor: "#3B82F6", // Màu nền
                  color: "white", // Màu chữ
                  border: "none", // Không có viền
                  borderRadius: "4px", // Góc bo tròn
                  display: "flex", // Để canh giữa nội dung
                  alignItems: "center", // Canh giữa theo chiều dọc
                  justifyContent: "center", // Canh giữa theo chiều ngang
                  marginTop: "33px",
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Tải lên Excel"
                )}
              </button>
            </label>
            <button type="submit" disabled={isLoading}>
              {" "}
              {/* Thay đổi thành type submit */}
              Xác Nhận Đăng Tải
            </button>
            {uploadStatus && (
              <p
                style={{
                  marginTop: "10px",
                  padding: "10px",
                  backgroundColor: "#e0f7fa", // Màu nền nhẹ
                  color: "#00796b", // Màu chữ
                  borderRadius: "4px",
                  border: "1px solid #00796b",
                  transition: "opacity 0.5s",
                  opacity: uploadStatus ? 1 : 0,
                }}
              >
                {uploadStatus}
              </p>
            )}
            {/* {duplicates.length > 0 && (
                            <div>
                                <h3>Các đề tài trùng lặp:</h3>
                                <ul>
                                    {duplicates.map((duplicate, index) => (
                                        <li key={index}>
                                            {duplicate.nameTopic} - {duplicate.reason}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )} */}
          </form>
        </div>
      )}

      {activeTab === "manage" && (
        <div className="manage-topic">
          <div className="manage-header">
            <h2
              style={{
                border: "2px solid #3B82F6", // Đường viền xanh dương đậm
                background: "linear-gradient(90deg, #3B82F6, #60A5FA)", // Hiệu ứng gradient
                color: "white", // Màu chữ trắng
                padding: "12px 20px", // Tăng khoảng cách bên trong
                borderRadius: "10px", // Bo tròn góc lớn hơn
                textAlign: "center", // Căn giữa
                boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)", // Đổ bóng sâu hơn
                display: "flex", // Căn chỉnh icon và chữ theo hàng ngang
                alignItems: "center", // Căn giữa theo chiều dọc
                justifyContent: "center", // Căn giữa theo chiều ngang
                fontFamily: "'Roboto', sans-serif", // Phông chữ hiện đại
                fontWeight: "bold", // In đậm
                fontSize: "1.5rem", // Tăng kích thước chữ
                transition: "transform 0.3s ease", // Hiệu ứng khi hover
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <i
                className="fa fa-cloud-upload-alt"
                style={{ marginRight: "10px" }}
              ></i>{" "}
              {/* Biểu tượng mới */}
              Quản Lý Đề Tài
            </h2>
          </div>

          {/* Search input */}
          <div
            className="search-section"
            style={{ position: "relative", width: "100%" }}
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập từ khóa tìm kiếm"
              style={{ width: "100%", paddingLeft: "40px" }} // Thêm padding để chừa khoảng trống cho icon
            />
            <i
              className="fa fa-search"
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#aaa",
              }}
            ></i>
          </div>

          {/* Hiển thị danh sách các topics của trang hiện tại */}
          <ul>
            {currentPageTopics.map((t, index) => (
              <li key={index} onClick={() => handleTopicClick(t)}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <strong
                      style={{
                        wordBreak: "break-word",
                        maxWidth: "800px",
                        overflow: "hidden",
                        fontSize: "18px", // Kích thước font lớn hơn
                        fontWeight: "bold", // Tăng trọng lượng font
                        color: "#333", // Màu chữ tối hơn
                        textTransform: "capitalize", // Chữ cái đầu tiên của mỗi từ viết hoa
                        letterSpacing: "0.5px", // Khoảng cách giữa các chữ cái
                        margin: "8px 0", // Tạo khoảng cách cho phần tên
                        padding: "10px", // Thêm khoảng đệm cho tên
                        border: "1px solid #007bff", // Khung viền màu xanh
                        borderRadius: "5px", // Bo tròn góc
                        backgroundColor: "#f8f9fa", // Màu nền nhẹ
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", // Thêm bóng cho khung
                        display: "inline-block", // Đặt chế độ hiển thị thành inline-block
                      }}
                    >
                      {t.nameTopic}
                    </strong>
                    {t.teacher && (
                      <p style={{ margin: "5px 0", marginLeft: "0" }}>
                        <strong>Giảng Viên:</strong>{" "}
                        {t.teacher.name || "Chưa có thông tin"}
                      </p>
                    )}
                    <p
                      style={{
                        wordBreak: "break-word",
                        maxWidth: "800px",
                        overflow: "hidden",
                        margin: "5px 0", // Thêm khoảng cách trên và dưới
                      }}
                    >
                      <strong>Trạng Thái:</strong>{" "}
                      <span
                        style={{
                          color: t.status === "Đã phê duyệt" ? "green" : "red", // Màu sắc dựa trên trạng thái
                        }}
                      >
                        {t.status}
                      </span>
                    </p>
                  </div>

                  <div>
                    <button
                      className="update"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdate(t);
                      }}
                      style={{ fontWeight: "bold", marginRight: "10px" }}
                    >
                      <i
                        className="fa fa-refresh"
                        style={{ marginRight: "5px" }}
                      ></i>
                      Cập nhật
                    </button>
                    <button
                      className="delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(t._id);
                      }}
                      style={{ fontWeight: "bold", marginRight: "10px" }}
                    >
                      <i
                        className="fa fa-trash"
                        style={{ marginRight: "5px" }}
                      ></i>
                      Xóa
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div
            className="pagination-controls"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "20px",
            }}
          >
            <ReactPaginate
              previousLabel={"Trước"}
              nextLabel={"Sau"}
              pageCount={pageCount}
              onPageChange={handlePageClick}
              containerClassName={"pagination"}
              previousLinkClassName={"pagination__link"}
              nextLinkClassName={"pagination__link"}
              disabledClassName={"pagination__link--disabled"}
              activeClassName={"pagination__link--active"}
              // Ẩn các số trang, chỉ hiển thị Previous, Next
              renderOnZeroPageCount={null}
              pageLinkClassName={"pagination__link--hidden"} // Thêm class để ẩn các số trang
              marginPagesDisplayed={0} // Ẩn các trang lân cận
              pageRangeDisplayed={0} // Ẩn số trang
            />
            {/* <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredTopics.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            /> */}

            {/* Hiển thị trang hiện tại */}
            <span style={{ margin: "0 15px" }}>Page: {currentPage}</span>
          </div>

          {/* Modal Thông Tin Chi Tiết */}
          {isDetailsVisible && selectedTopic && (
            <div
              className="modal-topic-parent"
              style={{
                display: "block",
                position: "fixed",
                top: 0,
                left: 0,
                width: "1500px",
                height: "100%",
                backgroundColor: "rgba(0,0,0,0.5)",
                zIndex: 1000,
              }}
            >
              <div
                className="modal-topic"
                style={{
                  margin: "7% auto",
                  padding: "20px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  width: "80%",
                  maxWidth: "1000px",
                  minWidth: "300px", // Thiết lập chiều rộng tối thiểu
                  maxHeight: "80vh",
                  overflowY: "auto",
                  // marginRight: "70px",
                }}
              >
                <h3 style={{ wordBreak: "break-word", fontWeight: "bold" }}>
                  Thông Tin Chi Tiết Đề Tài
                </h3>
                <p style={{ wordBreak: "break-word", fontWeight: "bold" }}>
                  <strong>Tên Đề Tài:</strong> {selectedTopic.nameTopic}
                </p>
                <p>
                  <strong>Mô Tả:</strong> {selectedTopic.descriptionTopic}
                </p>
                {selectedTopic.teacher && (
                  <p>
                    <strong>Giảng Viên:</strong>{" "}
                    {selectedTopic.teacher.name || "Chưa có thông tin"}
                  </p>
                )}
                <p>
                  <strong>Trạng Thái:</strong> {selectedTopic.status}
                </p>
                <button
                  style={{
                    fontFamily: "'Roboto', sans-serif",
                    fontWeight: "bold",
                  }}
                  onClick={() => {
                    setSelectedTopic(false);
                    setIsDetailsVisible(false);
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isUpdating && (
        <div className="modal">
          <div
            className="modal-content"
            style={{
              margin: "5% auto",
              padding: "20px",
              backgroundColor: "white",
              borderRadius: "8px",
              width: "80%",
              maxWidth: "1000px",
              minWidth: "300px", // Thiết lập chiều rộng tối thiểu
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <span className="close" onClick={() => setIsUpdating(false)}>
              &times;
            </span>
            <h2 style={{ fontWeight: "bold" }}>Cập Nhật Đề Tài</h2>
            <form onSubmit={handleUpdateSubmit}>
              <div className="form-group">
                <label
                  htmlFor="updateTitle"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <FontAwesomeIcon
                    icon={faPencilAlt}
                    style={{ marginRight: "5px" }}
                  />
                  Tên Đề Tài
                </label>
                <textarea
                  id="updateTitle"
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                  placeholder="Nhập tên đề tài"
                />
              </div>

              <div className="form-group">
                <label
                  htmlFor="updateDescription"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <i className="fa fa-edit" style={{ marginRight: "5px" }}></i>
                  Mô Tả Đề Tài
                </label>
                <textarea
                  id="updateDescription"
                  value={updateDescription}
                  onChange={(e) => setUpdateDescription(e.target.value)}
                  placeholder="Nhập mô tả đề tài"
                  rows="12"
                />
              </div>

              <button type="submit" className="submit-btn">
                Cập nhật
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostTheTopic;
