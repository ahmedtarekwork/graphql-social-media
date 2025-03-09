// queries
import getSingleUser from "./controllers/queries/getSingleUser";
import getAllUsers from "./controllers/queries/getAllUsers";
import checkUser from "./controllers/queries/checkUser";
import getUserNotificationsCount from "./controllers/queries/getUserNotificationsCount";
import getUserNotifications from "./controllers/queries/getUserNotifications";
import getUserSavedPosts from "./controllers/queries/getUserSavedPosts";
import getUserFriends from "./controllers/queries/getUserFriends";
import getUserFriendsCount from "./controllers/queries/getUserFriendsCount";
import getUserFriendshipRequestsCount from "./controllers/queries/getUserFriendshipRequestsCount";
import doesCurrentUserSentFriendshipRequest from "./controllers/queries/doesCurrentUserSentFriendshipRequest";
import doesCurrentUserRecevedFriendshipRequest from "./controllers/queries/doesCurrentUserRecevedFriendshipRequest";
import isUserMyFriend from "./controllers/queries/isUserMyFriend";
import getUserFriendsRequests from "./controllers/queries/getUserFriendsRequests";

// mutations
import registerUser from "./controllers/mutations/registerUser";
import loginUser from "./controllers/mutations/loginUser";
import changeUserData from "./controllers/mutations/changeUserData";
import removeUserFromFriendsList from "./controllers/mutations/removeUserFromFriendsList";
import sendFriendshipRequest from "./controllers/mutations/sendFriendshipRequest";
import handleFriendShipRequest from "./controllers/mutations/handleFriendShipRequest";
import markNotificationAsRead from "./controllers/mutations/markNotificationAsRead";
import markAllNotificationsAsRead from "./controllers/mutations/markAllNotificationsAsRead";
import removeUserProfileOrCoverPicture from "./controllers/mutations/removeUserProfileOrCoverPicture";
import deleteUser from "./controllers/mutations/deleteUser";

const userResolvers = {
  Query: {
    getSingleUser,
    getAllUsers,
    checkUser,

    // notifications
    getUserNotificationsCount,
    getUserNotifications,

    // posts
    getUserSavedPosts,

    // friends
    getUserFriends,
    getUserFriendsCount,

    // friendship requests
    getUserFriendshipRequestsCount,
    doesCurrentUserSentFriendshipRequest,
    doesCurrentUserRecevedFriendshipRequest,
    isUserMyFriend,
    getUserFriendsRequests,
  },

  Mutation: {
    registerUser,
    loginUser,
    changeUserData,
    removeUserFromFriendsList,
    sendFriendshipRequest,
    handleFriendShipRequest,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeUserProfileOrCoverPicture,
    deleteUser,
  },
};

export default userResolvers;
