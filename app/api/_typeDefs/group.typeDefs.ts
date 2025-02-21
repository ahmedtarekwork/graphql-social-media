import gql from "graphql-tag";

const groupTypeDefs = gql`
  type Query {
    getSingleGroup(groupId: ID!): Group

    getExploreGroups(pagination: PaginatedItemsInput!): GetGroupsResponse!
    getJoinedGroups(pagination: PaginatedItemsInput!): GetGroupsResponse!
    getAdminGroups(pagination: PaginatedItemsInput!): GetGroupsResponse!
    getOwnedGroups(pagination: PaginatedItemsInput!): GetGroupsResponse!

    getGroupJoinRequests(
      requestsPaginationInfo: GetGroupRequestsInput!
    ): GetJoinRequestsResponse!

    getGroupPosts(
      paginatedPosts: PaginationWithSkipAndGroupId!
    ): GetGroupPostsResponse!

    getGroupAdminsList(
      paginationData: PaginationWithSkipAndGroupId!
    ): GetGroupAdminsReponse!

    isUserMemberInGroup(groupId: ID!): IsUserMemberInGroupResponse!
    isUserAdminInGroup(groupId: ID!): IsUserAdminInGroupResponse!
  }

  type Mutation {
    addGroup(groupData: AddGroupInput!): Group!
    editGroup(editGroupData: EditGroupInput!): SuccessResponseType!
    deleteGroup(groupId: ID!): SuccessResponseType!

    toggleGroupAdmin(
      toggleGroupAdminData: ToggleGroupAdminInput!
    ): SuccessResponseType!

    joinGroup(groupId: ID!): JoinGroupResponseType!
    exitGroup(groupId: ID!): SuccessResponseType!

    expulsingFromTheGroup(
      expulsingFromGroupData: ExpulsingFromTheGroupInput!
    ): SuccessResponseType!

    handleGroupRequest(
      handleGroupRequestData: HandleGroupRequestInput!
    ): SuccessResponseType!
  }

  type Group {
    _id: ID!
    name: String!
    owner: User!
    membersCount: Int!
    privacy: GroupPrivacy!
    profilePicture: ImageType
    coverPicture: ImageType
    admins: [User!]!
  }

  type IsUserAdminInGroupResponse {
    isUserAdminInGroup: Boolean!
  }
  type IsUserMemberInGroupResponse {
    isUserMemberInGroup: Boolean!
  }

  type GetGroupPostsResponse {
    posts: [Post!]!
    isFinalPage: Int!
  }

  type GetGroupAdminsReponse {
    admins: [NotFullUser!]!
    isFinalPage: Int!
  }

  input PaginationWithSkipAndGroupId {
    limit: Int!
    page: Int!
    skip: Int!
    groupId: String!
  }

  type GetJoinRequestsResponse {
    requests: [GroupRequest!]!
    isFinalPage: Boolean!
  }

  type GetGroupsResponse {
    groups: [Group!]!
    isFinalPage: Boolean!
  }

  type JoinGroupResponseType {
    message: String!
  }

  enum GroupPrivacy {
    public
    members_only
  }

  input ExpulsingFromTheGroupInput {
    groupId: ID!
    memberId: ID!
  }

  input AddGroupInput {
    name: String!
    profilePicture: ImageInput
    coverPicture: ImageInput
    privacy: GroupPrivacy
  }
  input EditGroupInput {
    groupId: ID!
    name: String
    profilePicture: ImageInput
    coverPicture: ImageInput
    privacy: GroupPrivacy
  }

  input ToggleGroupAdminInput {
    adminId: ID!
    groupId: ID!
  }

  # group request
  type GroupRequest {
    _id: ID! # ID of request itself
    user: User!
  }

  input HandleGroupRequestInput {
    requestId: ID!
    acception: Boolean!
  }

  input GetGroupRequestsInput {
    groupId: ID!
    page: Int!
    limit: Int!
  }
`;

export default groupTypeDefs;
