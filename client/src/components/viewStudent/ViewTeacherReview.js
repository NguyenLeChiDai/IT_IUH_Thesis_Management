import React, { useState, useEffect } from "react";
import axios from "axios";
import { apiUrl } from "../../contexts/constants";
const ReviewerInformation = () => {
  const [reviewers, setReviewers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviewAssignment = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `${apiUrl}/reviewAssignment/get-group-teacher-reviewers`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setReviewers(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "An unexpected error occurred");
        setLoading(false);
      }
    };

    fetchReviewAssignment();
  }, []);

  if (loading) return <div>Đang tải thông tin...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div
      className="reviewer-information"
      style={{ width: "100%", background: "#f9f9f9", padding: "15px" }}
    >
      <h2>Thông Tin Giảng Viên Phản Biện</h2>
      <div className="status-info">
        <p>
          Ngày Phân Công: {new Date(reviewers.assignedDate).toLocaleString()}
        </p>
      </div>
      <div className="reviewers-list">
        {reviewers.reviewers.map((reviewer, index) => (
          <div key={index} className="reviewer-card">
            <h3>Giảng Viên Phản Biện {index + 1}</h3>
            <p>
              <strong>Tên:</strong> {reviewer.name}
            </p>
            <p>
              <strong>Email:</strong> {reviewer.email}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewerInformation;
