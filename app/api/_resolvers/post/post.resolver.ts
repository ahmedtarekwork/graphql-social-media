// queries
import getHomePagePosts from "./controllers/queries/getHomePagePosts";
import getCurrentUserPosts from "./controllers/queries/getCurrentUserPosts";
import getSingleUserPosts from "./controllers/queries/getSingleUserPosts";
import getSinglePost from "./controllers/queries/getSinglePost";
import getPostSharesUsers from "./controllers/queries/getPostSharesUsers";
import getPostReactions from "./controllers/queries/getPostReactions";
import getMyReactionToPost from "./controllers/queries/getMyReactionToPost";

// mutations
import addPost from "./controllers/mutations/addPost";
import editPost from "./controllers/mutations/editPost";
import deletePost from "./controllers/mutations/deletePost";
import deleteMediaFromPost from "./controllers/mutations/deleteMediaFromPost";
import togglePostFromBookmark from "./controllers/mutations/togglePostFromBookmark";
import toggleReaction from "./controllers/mutations/toggleReaction";
import toggleSharedPost from "./controllers/mutations/toggleSharedPost";

const postResolvers = {
  Query: {
    getHomePagePosts,
    getCurrentUserPosts,
    getSingleUserPosts,
    getSinglePost,
    getPostSharesUsers,
    getPostReactions,
    getMyReactionToPost,
  },

  Mutation: {
    addPost,
    editPost,
    deletePost,
    deleteMediaFromPost,
    togglePostFromBookmark,
    toggleReaction,
    toggleSharedPost,
  },
};

export default postResolvers;
