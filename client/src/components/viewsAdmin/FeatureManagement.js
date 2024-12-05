import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { Info, ToggleLeft, ToggleRight } from "lucide-react";
import { apiUrl } from "../../contexts/constants";
const FeatureManagement = () => {
  const [features, setFeatures] = useState([
    {
      feature: "leave_group",
      name: "Rời Nhóm",
      description: "Cho phép sinh viên rời khỏi nhóm học tập",
      isEnabled: true,
      disabledReason: "",
    },
    {
      feature: "leave_topic",
      name: "Rời Đề Tài",
      description: "Cho phép sinh viên rời khỏi đề tài nghiên cứu",
      isEnabled: true,
      disabledReason: "",
    },
  ]);

  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => {
    fetchFeatureStatus();
  }, []);

  const fetchFeatureStatus = async () => {
    try {
      const response = await axios.get(`${apiUrl}/adminFeature/feature-status`);
      if (response.data.success) {
        const serverConfigs = response.data.configs;
        setFeatures((prevFeatures) =>
          prevFeatures.map((feature) => {
            const serverConfig = serverConfigs.find(
              (config) => config.feature === feature.feature
            );
            return serverConfig
              ? {
                  ...feature,
                  isEnabled: serverConfig.isEnabled,
                  disabledReason: serverConfig.disabledReason,
                }
              : feature;
          })
        );
      }
    } catch (error) {
      setNotificationMessage("Lỗi kết nối: Không thể tải trạng thái tính năng");
      console.error("Lỗi lấy trạng thái:", error);
    }
  };

  const handleFeatureToggle = async (feature, isEnabled) => {
    try {
      const updatedFeature = features.find((f) => f.feature === feature);
      const response = await axios.put(
        `${apiUrl}/adminFeature/feature-status`,
        {
          feature,
          isEnabled,
          disabledReason: updatedFeature.disabledReason,
        }
      );
      if (response.data.success) {
        setFeatures((prevFeatures) =>
          prevFeatures.map((f) =>
            f.feature === feature
              ? {
                  ...f,
                  isEnabled,
                  disabledReason: isEnabled ? "" : f.disabledReason,
                }
              : f
          )
        );
        setNotificationMessage(
          isEnabled
            ? `Đã bật tính năng ${updatedFeature.name}`
            : `Đã tắt tính năng ${updatedFeature.name}`
        );
      }
    } catch (error) {
      setNotificationMessage("Lỗi: Không thể cập nhật trạng thái");
      console.error("Lỗi cập nhật:", error);
    }
  };

  const handleReasonChange = (feature, reason) => {
    setFeatures((prevFeatures) =>
      prevFeatures.map((f) =>
        f.feature === feature ? { ...f, disabledReason: reason } : f
      )
    );
  };

  return (
    <div className="feature-management-container">
      <Card className="feature-management-card shadow-lg">
        <Card.Header className="bg-primary text-white d-flex align-items-center">
          <Info className="me-2" />
          <h2 className="mb-0">Quản Lý Tính Năng</h2>
        </Card.Header>

        {notificationMessage && (
          <Alert
            variant={notificationMessage.includes("Lỗi") ? "danger" : "success"}
            onClose={() => setNotificationMessage("")}
            dismissible
          >
            {notificationMessage}
          </Alert>
        )}

        <Card.Body>
          {features.map((feature) => (
            <div
              key={feature.feature}
              className="feature-item mb-3 p-3 border rounded"
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">{feature.name}</h5>
                  <small className="text-muted">{feature.description}</small>
                </div>
                <div>
                  {feature.isEnabled ? (
                    <ToggleRight
                      color="green"
                      size={32}
                      onClick={() =>
                        handleFeatureToggle(feature.feature, false)
                      }
                      style={{ cursor: "pointer" }}
                    />
                  ) : (
                    <ToggleLeft
                      color="red"
                      size={32}
                      onClick={() => handleFeatureToggle(feature.feature, true)}
                      style={{ cursor: "pointer" }}
                    />
                  )}
                </div>
              </div>

              {!feature.isEnabled && (
                <Form.Control
                  type="text"
                  placeholder="Nhập lý do khóa tính năng"
                  value={feature.disabledReason}
                  onChange={(e) =>
                    handleReasonChange(feature.feature, e.target.value)
                  }
                  className="mt-2 form-control-sm"
                />
              )}
            </div>
          ))}
        </Card.Body>
      </Card>
    </div>
  );
};

export default FeatureManagement;
