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
      reactionsInfo: GetItemReactionsInput!
    ): GetItemReactionsResponseType!

    getMyReactionToPost(itemId: ID!): GetMyReactionToItemResponseType!
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
