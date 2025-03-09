// queries
import getExploreGroups from "./controllers/queries/getExploreGroups";
import getJoinedGroups from "./controllers/queries/getJoinedGroups";
import getAdminGroups from "./controllers/queries/getAdminGroups";
import getOwnedGroups from "./controllers/queries/getOwnedGroups";
import getSingleGroup from "./controllers/queries/getSingleGroup";
import getGroupJoinRequests from "./controllers/queries/getGroupJoinRequests";
import getGroupPosts from "./controllers/queries/getGroupPosts";
import getGroupAdminsList from "./controllers/queries/getGroupAdminsList";
import isUserMemberInGroup from "./controllers/queries/isUserMemberInGroup";
import isUserAdminInGroup from "./controllers/queries/isUserAdminInGroup";
import isUserSentJoinRequest from "./controllers/queries/isUserSentJoinRequest";
import joinRequestsCount from "./controllers/queries/joinRequestsCount";

// mutations
import addGroup from "./controllers/mutations/addGroup";
import editGroup from "./controllers/mutations/editGroup";
import removePageProfileOrCoverPicture from "./controllers/mutations/removePageProfileOrCoverPicture";
import deleteGroup from "./controllers/mutations/deleteGroup";
import toggleGroupAdmin from "./controllers/mutations/toggleGroupAdmin";
import joinGroup from "./controllers/mutations/joinGroup";
import exitGroup from "./controllers/mutations/exitGroup";
import expulsingFromTheGroup from "./controllers/mutations/expulsingFromTheGroup";
import handleGroupRequest from "./controllers/mutations/handleGroupRequest";

const groupResolvers = {
  Query: {
    getExploreGroups,
    getJoinedGroups,
    getAdminGroups,
    getOwnedGroups,
    getSingleGroup,
    getGroupJoinRequests,
    getGroupPosts,
    getGroupAdminsList,
    isUserMemberInGroup,
    isUserAdminInGroup,
    isUserSentJoinRequest,
    joinRequestsCount,
  },

  Mutation: {
    addGroup,
    editGroup,
    removePageProfileOrCoverPicture,
    deleteGroup,
    toggleGroupAdmin,
    joinGroup,
    exitGroup,
    expulsingFromTheGroup,
    handleGroupRequest,
  },
};

export default groupResolvers;
