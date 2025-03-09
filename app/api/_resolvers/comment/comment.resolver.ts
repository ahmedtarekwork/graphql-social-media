// queries
import getPostComments from "./controllers/queries/getPostComments";
import getSingleComment from "./controllers/queries/getSingleComment";
import getCommentReactions from "./controllers/queries/getCommentReactions";
import getMyReactionToComment from "./controllers/queries/getMyReactionToComment";

// mutations
import addComment from "./controllers/mutations/addComment";
import editComment from "./controllers/mutations/editComment";
import deleteComment from "./controllers/mutations/deleteComment";
import deleteMediaFromComment from "./controllers/mutations/deleteMediaFromComment";
import toggleReactionOnComment from "./controllers/mutations/toggleReactionOnComment";

const commentResolvers = {
  Query: {
    getPostComments,
    getSingleComment,
    getCommentReactions,
    getMyReactionToComment,
  },

  Mutation: {
    addComment,
    editComment,
    deleteComment,
    deleteMediaFromComment,
    toggleReactionOnComment,
  },
};

export default commentResolvers;
