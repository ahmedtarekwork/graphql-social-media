import gql from "graphql-tag";

const commentTypeDefs = gql`
  type Query {
    getPostComments(
      commentData: GetPostCommentsData!
    ): GetPostCommentsResponseType!
    getSingleComment(commentId: ID!): CommentType

    getCommentReactions(
      reactionsInfo: GetItemReactionsInput!
    ): GetItemReactionsResponseType!

    getMyReactionToComment(itemId: ID!): GetMyReactionToItemResponseType!
  }

  type Mutation {
    addComment(addCommentData: AddCommentInput!): CommentType!
    editComment(editCommentData: EditCommentInput!): SuccessResponseType!
    deleteComment(commentId: ID!): SuccessResponseType!
    deleteMediaFromComment(
      mediaData: DeleteMediaFromItemInput!
    ): SuccessResponseType!
    toggleReactionOnComment(
      reactionData: ToggleReactionInput!
    ): SuccessResponseType!
  }

  type GetPostCommentsResponseType {
    comments: [CommentType!]!
    isFinalPage: Boolean!
  }

  type CommentType {
    _id: String!
    owner: NotFullUser!
    comment: String
    media: [ImageType!]
    reactions: RecationsType!
    createdAt: String!
    post: String!
    community: Community!
    communityId: ID
  }

  input GetPostCommentsData {
    postId: String!
    page: Int!
    limit: Int!
    skip: Int
  }

  input AddCommentInput {
    postId: String!
    comment: String
    media: [ImageInput!]
  }

  input EditCommentInput {
    commentId: String!
    comment: String
    media: [ImageInput!]
  }
`;

export default commentTypeDefs;
