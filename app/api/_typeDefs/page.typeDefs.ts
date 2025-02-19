import gql from "graphql-tag";

const pageTypeDefs = gql`
  type Query {
    getPageInfo(pageId: ID!): Page
    getPagePosts(
      paginatedPosts: PaginatedItemsInputWithIdAndSkip!
    ): GetPagePostsResponse!

    getExplorePages(pagination: PaginatedItemsInput!): GetPagesResponse!
    getFollowedPages(pagination: PaginatedItemsInput!): GetPagesResponse!
    getOwnedPages(pagination: PaginatedItemsInput!): GetPagesResponse!
    getAdminPages(pagination: PaginatedItemsInput!): GetPagesResponse!

    getPageAdminsList(
      paginationData: PaginatedItemsInputWithIdAndSkip!
    ): GetPageAdminsListResponse!

    isUserFollowingPage(pageId: ID!): IsUserFollowingPageResponse!
    isUserAdminInPage(pageId: ID!): IsUserAdminInPageResponse!
  }

  type Mutation {
    addPage(pageData: AddPageInput!): Page!
    editPage(editPageData: EditPageInput!): SuccessResponseType!
    deletePage(pageId: ID!): SuccessResponseType!

    togglePageAdmin(toggleAdminData: PageAdminInput!): SuccessResponseType!

    togglePageFollow(pageId: ID!): SuccessResponseType!

    removePageProfileOrCoverPicture(
      removePictureInfo: RemovePictureInfoInput!
    ): SuccessResponseType!
  }

  type GetPagesResponse {
    pages: [NotFullPage]!
    isFinalPage: Boolean!
  }

  type GetPageAdminsListResponse {
    isFinalPage: Boolean!
    admins: [NotFullUser!]!
  }

  type IsUserAdminInPageResponse {
    isUserAdminInPage: Boolean!
  }

  type IsUserFollowingPageResponse {
    isUserFollowingPage: Boolean!
  }

  input RemovePictureInfoInput {
    pageId: ID!
    pictureType: PicturesTypes!
  }

  input PaginatedItemsInputWithIdAndSkip {
    pageId: ID!
    limit: Int!
    page: Int!
    skip: Int!
  }

  input PaginatedItemsInputWithPageId {
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
    toggle: TogglePageAdminEnum!
  }

  enum TogglePageAdminEnum {
    add
    remove
  }
`;

export default pageTypeDefs;
