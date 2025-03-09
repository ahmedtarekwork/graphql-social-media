// queries
import getHomePageStories from "./controllers/queries/getHomePageStories";
import getAuthUserStories from "./controllers/queries/getAuthUserStories";
import getSingleUserStories from "./controllers/queries/getSingleUserStories";

// mutations
import addStory from "./controllers/mutations/addStory";
import updateStory from "./controllers/mutations/updateStory";
import deleteStory from "./controllers/mutations/deleteStory";

const storyResolvers = {
  Query: {
    getHomePageStories,
    getAuthUserStories,
    getSingleUserStories,
  },

  Mutation: {
    addStory,
    updateStory,
    deleteStory,
  },
};

export default storyResolvers;
