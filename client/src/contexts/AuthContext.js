import { createContext, useReducer, useEffect } from "react";
import { authReducer } from "../reducers/authReducer";
import { apiUrl, LOCAL_STORAGE_TOKEN_NAME } from "./constants";
import axios from "axios";
import setAuthToken from "../utils/setAuthToken";

export const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  const [authState, dispatch] = useReducer(authReducer, {
    authLoading: true,
    isAuthenticated: false,
    user: null,
    profile: null, // Thêm profile vào state
  });

  // Load user và profile khi khởi tạo
  useEffect(() => {
    const loadUser = async () => {
      if (localStorage[LOCAL_STORAGE_TOKEN_NAME]) {
        setAuthToken(localStorage[LOCAL_STORAGE_TOKEN_NAME]);
      }

      try {
        const response = await axios.get(`${apiUrl}/auth`);
        if (response.data.success) {
          let profileData = null;
          try {
            // Thử gọi API lấy profile cho cả Sinh viên và Giảng viên
            if (response.data.user.role === "Sinh viên") {
              const profileResponse = await axios.get(
                `${apiUrl}/student/profile-student`
              );
              if (profileResponse.data.success) {
                profileData = profileResponse.data.profile;
              }
            } else if (response.data.user.role === "Giảng viên") {
              const profileResponse = await axios.get(
                `${apiUrl}/teachers/profile-teacher`
              );
              if (profileResponse.data.success) {
                profileData = profileResponse.data.profile; // Lưu profile nếu có
              }
            }
          } catch (error) {
            console.log(
              "Không lấy được profile, nhưng vẫn cho phép đăng nhập."
            );
          }

          // Cập nhật state với user và profile
          dispatch({
            type: "SET_AUTH",
            payload: {
              isAuthenticated: true,
              user: response.data.user,
              profile: profileData, // Profile có thể là null
            },
          });
        }
      } catch (error) {
        localStorage.removeItem(LOCAL_STORAGE_TOKEN_NAME);
        setAuthToken(null);
        dispatch({
          type: "SET_AUTH",
          payload: { isAuthenticated: false, user: null, profile: null },
        });
      }
    };

    loadUser();
  }, []);

  // Login
  const loginUser = async (userForm) => {
    try {
      const response = await axios.post(`${apiUrl}/auth/login`, userForm);
      if (response.data.success) {
        localStorage.setItem(
          LOCAL_STORAGE_TOKEN_NAME,
          response.data.accessToken
        );
        setAuthToken(response.data.accessToken);

        const userResponse = await axios.get(`${apiUrl}/auth`);
        let profileData = null;

        // Lấy profile nhưng không bắt buộc
        try {
          const profileResponse = await axios.get(`${apiUrl}/profile/profile`);
          if (profileResponse.data.success) {
            profileData = profileResponse.data.profile;
          }
        } catch (error) {
          console.log("Không lấy được profile, nhưng vẫn cho phép đăng nhập.");
        }

        if (userResponse.data.success) {
          dispatch({
            type: "SET_AUTH",
            payload: {
              isAuthenticated: true,
              user: userResponse.data.user,
              profile: profileData, // Profile có thể là null
            },
          });
        }

        return response.data;
      }
    } catch (error) {
      if (error.response.data) return error.response.data;
      else return { success: false, message: error.message };
    }
  };

  // Logout
  const logoutUser = () => {
    localStorage.removeItem(LOCAL_STORAGE_TOKEN_NAME);
    setAuthToken(null);
    dispatch({
      type: "SET_AUTH",
      payload: { isAuthenticated: false, user: null, profile: null },
    });
  };
  // updateProfile
  const updateProfile = async () => {
    try {
      const response = await axios.get(`${apiUrl}/student/profile-student`);
      if (response.data.success) {
        dispatch({
          type: "SET_AUTH",
          payload: {
            ...authState,
            profile: response.data.profile,
          },
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Context data
  const authContextData = { loginUser, logoutUser, authState, updateProfile };

  // Return provider
  return (
    <AuthContext.Provider value={authContextData}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
