import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Landing from "./components/layout/Landing";
import TrangChu from "./screen/TrangChu";
import Auth from "./views/Auth";
import AuthContextProvider from "./contexts/AuthContext";
import DashboardAdmin from "./views/DashboardAdmin";
import DashboardUser from "./views/DashboardUser";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import AccountManagement from "./components/viewsAdmin/AccountManagement"; // Import AccountManagement
import DashboardTeacher from "./views/DashboardTeacher";

function App() {
  return (
    <AuthContextProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth authRoute="login" />} />
          <Route path="/register" element={<Auth authRoute="register" />} />
          <Route path="/trangchu" element={<TrangChu />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboardAdmin" element={<DashboardAdmin />}>
              <Route
                path="account-management"
                element={<AccountManagement />}
              />{" "}
              {/* Route mới cho AccountManagement */}
            </Route>
            <Route path="/dashboardUser" element={<DashboardUser />} />
            <Route path="/dashboardTeacher" element={<DashboardTeacher />} />
          </Route>
        </Routes>
      </Router>
    </AuthContextProvider>
  );
}

export default App;
