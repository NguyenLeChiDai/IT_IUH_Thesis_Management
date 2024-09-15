// export const authReducer = (state, action) => {
//   const {
//     type,
//     payload: { isAuthenticated, user },
//   } = action;

//   switch (type) {
//     case "SET_AUTH":
//       return {
//         ...state,
//         authLoading: false,
//         isAuthenticated,
//         user,
//       };

//     default:
//       return state;
//   }
// };
export const authReducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case "SET_AUTH":
      return {
        ...state,
        isAuthenticated: payload.isAuthenticated,
        user: payload.user,
        authLoading: false,
        profile: payload.profile, // Cập nhật profile trong state
      };
    default:
      return state;
  }
};
