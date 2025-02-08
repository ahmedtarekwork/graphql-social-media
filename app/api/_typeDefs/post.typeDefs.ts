import gql from "graphql-tag";

const postTypeDefs = gql`
  type Query {
    getHomePagePosts(
      paginatedPosts: PaginatedItemsInput!
    ): GetSingleUserPostsResponseType!

    getCurrentUserPosts(
      paginatedPosts: PaginatedItemsInputWithSkipInput!
    ): GetSingleUserPostsResponseType!
    getSingleUserPosts(
      paginatedPosts: PaginatedPostsForSpecificUserInput!
    ): GetSingleUserPostsResponseType!

    getSinglePost(postId: ID!): Post

    getPostSharesUsers(
      sharesInfo: SharesInfoInput!
    ): GetPostSharesUsersResponseType!

    getPostReactions(
      reactionsInfo: GetPostReactionsInput!
    ): GetPostReactionsResponseType!

    getMyReactionToPost(postId: ID!): GetMyReactionToPostResponseType!
  }

  type Mutation {
    addPost(postData: PostDataInput!): Post!
    editPost(newPostData: EditPostDataInput!): SuccessResponseType!
    deletePost(postId: ID!): SuccessResponseType!
    togglePostFromBookmark(postId: ID!): SuccessResponseType!
    toggleReaction(reactionData: ToggleReactionInput!): SuccessResponseType!
    deleteMediaFromPost(
      mediaData: DeleteMediaFromItemInput!
    ): SuccessResponseType!
    toggleSharedPost(postId: ID!): SuccessResponseType!
  }

  input GetPostReactionsInput {
    postId: ID!
    limit: Int!
    page: Int!
    reaction: Reactions!
  }

  type GetMyReactionToPostResponseType {
    reaction: Reactions
  }

  type GetPostReactionsResponseType {
    reactions: [NotFullUser!]!
    isFinalPage: Boolean!
  }

  type GetPostSharesUsersResponseType {
    shares: [NotFullUser!]!
    isFinalPage: Boolean!
  }

  type GetSingleUserPostsResponseType {
    posts: [Post!]!
    isFinalPage: Boolean!
  }

  input SharesInfoInput {
    page: Int!
    limit: Int!
    postId: ID!
  }

  input PaginatedItemsInputWithSkipInput {
    page: Int!
    limit: Int!
    skip: Int
  }

  input EditPostDataInput {
    postId: String!
    caption: String
    media: [ImageInput!]
    privacy: Privacy
    blockComments: Boolean
  }
  input PostDataInput {
    caption: String
    media: [ImageInput!]
    privacy: Privacy
    blockComments: Boolean
    community: Community
    communityId: String
  }

  input PaginatedPostsForSpecificUserInput {
    page: Int!
    limit: Int!
    userId: String!
    skip: Int
  }
`;

export default postTypeDefs;
