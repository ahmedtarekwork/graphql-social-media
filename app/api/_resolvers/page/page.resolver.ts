// queries
import getPageInfo from "./controllers/queries/getPageInfo";
import getExplorePages from "./controllers/queries/getExplorePages";
import getFollowedPages from "./controllers/queries/getFollowedPages";
import getAdminPages from "./controllers/queries/getAdminPages";
import getOwnedPages from "./controllers/queries/getOwnedPages";
import getPagePosts from "./controllers/queries/getPagePosts";
import getPageAdminsList from "./controllers/queries/getPageAdminsList";
import isUserFollowingPage from "./controllers/queries/isUserFollowingPage";
import isUserAdminInPage from "./controllers/queries/isUserAdminInPage";

// mutations
import togglePageFollow from "./controllers/mutations/togglePageFollow";
import togglePageAdmin from "./controllers/mutations/togglePageAdmin";
import addPage from "./controllers/mutations/addPage";
import editPage from "./controllers/mutations/editPage";
import deletePage from "./controllers/mutations/deletePage";
import removePageProfileOrCoverPicture from "./controllers/mutations/removePageProfileOrCoverPicture";

const pageResolvers = {
  Query: {
    getPageInfo,
    getExplorePages,
    getFollowedPages,
    getAdminPages,
    getOwnedPages,
    getPagePosts,
    getPageAdminsList,
    isUserFollowingPage,
    isUserAdminInPage,
  },

  Mutation: {
    togglePageFollow,
    togglePageAdmin,
    addPage,
    editPage,
    deletePage,
    removePageProfileOrCoverPicture,
  },
};

export default pageResolvers;
