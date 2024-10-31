import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Landing from "./components/layout/Landing";
import TrangChu from "./screen/TrangChu";
import Auth from "./views/Auth";
import AuthContextProvider from "./contexts/AuthContext";
import DashboardAdmin from "./views/DashboardAdmin";
import DashboardStudent from "./views/DashboardStudent";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import ManageStudentAccounts from "./components/viewsAdmin/ManageStudentAccounts"; // Import AccountManagement
import DashboardTeacher from "./views/DashboardTeacher";
import ManageTeacherAccounts from "./components/viewsAdmin/ManageTeacherAccounts";
import PostTheTopic from "./components/viewTeacher/PostTheTopic";
import { HomeAdmin } from "./components/viewsAdmin/HomeAdmin";
import ManageStudentGroups from "./components/viewsAdmin/ManageStudentGroups";
import { ListStudentGroups } from "./components/viewStudent/ListStudentGroups";
import StudentInfo from "./components/viewStudent/StudentInfo";
import { ToastContainer } from "react-toastify";
import { ListStudentTopics } from "./components/viewStudent/ListStudentTopics";
import ChangePassword from "./components/password/ChangePassword";
import TopicStudent from "./components/viewStudent/TopicStudent";
import ThesisReport from "./components/viewStudent/ThesisReport";
import ManageTopic from "./components/viewsAdmin/ManageTopic";
import ThesisReportManagement from "./components/viewTeacher/ThesisReportManagement";
import FolderContent from "./components/viewTeacher/ThesisReportManagement/FolderContent";
import SubmissionDetail from "./components/viewTeacher/ThesisReportManagement/SubmissionDetail";

function App() {
  return (
    <AuthContextProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth authRoute="login" />} />
          <Route
            path="/forgot-password"
            element={<Auth authRoute={"forgot-password"} />}
          />
          <Route path="/register" element={<Auth authRoute="register" />} />
          <Route path="/trangchu" element={<TrangChu />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboardAdmin" element={<DashboardAdmin />}>
              <Route index element={<HomeAdmin />} />
              <Route
                path="manage-student-accounts"
                element={<ManageStudentAccounts />}
              />{" "}
              {/* Đường dẫn cho "Quản lý tài khoản sinh viên" */}
              <Route
                path="manage-teacher-accounts"
                element={<ManageTeacherAccounts />}
              />{" "}
              {/* Đường dẫn cho "Quản lý tài khoản giảng viên" */}
              <Route
                path="student-groups"
                element={<ManageStudentGroups />}
              />{" "}
              {/* Đường dẫn cho "Nhóm sinh viên" */}
              <Route path="manage-topics" element={<ManageTopic />} />{" "}
            </Route>

            <Route path="/dashboardStudent" element={<DashboardStudent />}>
              <Route index element={<StudentInfo />} />{" "}
              <Route
                path="list-student-groups"
                element={<ListStudentGroups />}
              />{" "}
              <Route
                path="list-student-topics"
                element={<ListStudentTopics />}
              />{" "}
              <Route path="TopicStudent" element={<TopicStudent />} />{" "}
              <Route path="submit-report" element={<ThesisReport />} />{" "}
            </Route>

            <Route path="/dashboardTeacher" element={<DashboardTeacher />}>
              <Route
                path="manage-report-student"
                element={<ThesisReportManagement />}
              />{" "}
              <Route path="folder/:folderId" element={<FolderContent />} />
              <Route
                path="submission/:submissionId"
                element={<SubmissionDetail />}
              />
              <Route path="upload-topic" element={<PostTheTopic />} />
            </Route>
            <Route path="/change-password" element={<ChangePassword />} />
          </Route>
        </Routes>
        <ToastContainer />
      </Router>
    </AuthContextProvider>
  );
}

export default App;
