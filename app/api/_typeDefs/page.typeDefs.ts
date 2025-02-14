import gql from "graphql-tag";

const pageTypeDefs = gql`
  type Query {
    getPageInfo(pageId: ID!): Page
    getPagePost(pagePostsInfo: PagePostsInfoInput!): GetPagePostsResponse!
    getAllPages(wantedPageData: PaginatedItemsInput!): [Page!]!
  }

  type Mutation {
    addPage(pageData: AddPageInput!): Page!
    editPage(editPageData: EditPageInput!): SuccessResponseType!
    deletePage(pageId: ID!): SuccessResponseType!

    togglePageAdmin(toggleAdminData: PageAdminInput): SuccessResponseType!

    togglePageFollow(pageId: ID!): [String!]!
  }

  input PagePostsInfoInput {
    pageId: ID!
    limit: Int!
    page: Int!
  }

  type GetPagePostsResponse {
    isFinalPage: Boolean!
    posts: [Post!]!
  }

  type ToggleAdminResponse {
    message: String!
    newAdminsList: [ID!]
  }

  input EditPageInput {
    pageId: ID!
    name: String
    profilePicture: ImageInput
    coverPicture: ImageInput
  }
  input AddPageInput {
    name: String!
    profilePicture: ImageInput
    coverPicture: ImageInput
  }
  input PageAdminInput {
    pageId: ID!
    newAdminId: ID!
  }
`;

export default pageTypeDefs;
