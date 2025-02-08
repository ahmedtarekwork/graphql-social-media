import gql from "graphql-tag";

const storyTypeDefs = gql`
  type Query {
    getHomePageStories(paginatedStories: PaginatedItemsInput!): [Story!]!
    getAuthUserStories: [Story!]!
    getSingleUserStories(userId: ID!): [Story!]!
  }

  type Mutation {
    addStory(addStoryData: AddStoryInput!): Story!
    updateStory(updateStoryData: EditStoryInput!): Story
    deleteStory(storyId: ID!): SuccessResponseType!
  }

  type Story {
    caption: String
    media: ImageType
    owner: User!
    reactions: RecationsType!
    _id: ID!
    createdAt: String!
    expiredData: Int!
  }

  input AddStoryInput {
    caption: String
    media: ImageInput
  }
  input EditStoryInput {
    storyId: ID!
    caption: String
    media: ImageInput
  }
`;

export default storyTypeDefs;
