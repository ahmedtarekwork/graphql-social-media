import gql from "graphql-tag";

const pageTypeDefs = gql`
  type Query {
    getPageInfo(pageId: String!): Page!
    getAllPages(wantedPageData: PaginatedItemsInput!): [Page!]!
  }

  type Mutation {
    addPage(pageData: AddPageInput!): Page!
    editPage(editPageData: EditPageInput!): Page!
    deletePage(pageId: ID!): SuccessResponseType!

    togglePageAdmin(toggleAdminData: PageAdminInput): SuccessResponseType!

    togglePageFollow(pageId: ID!): [String!]!
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
