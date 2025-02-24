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
    isUserSentJoinRequest(groupId: ID!): IsUserSentJoinRequestResponseType!

    joinRequestsCount(groupId: ID!): JoinRequestsCountResponse!
  }

  type Mutation {
    addGroup(groupData: AddGroupInput!): Group!
    editGroup(editGroupData: EditGroupInput!): SuccessResponseType!
    deleteGroup(groupId: ID!): SuccessResponseType!

    removePageProfileOrCoverPicture(
      removePictureInfo: RemoveGroupPictureInfoInput!
    ): SuccessResponseType!

    toggleGroupAdmin(
      toggleAdminData: ToggleGroupAdminInput!
    ): SuccessResponseType!

    joinGroup(groupId: ID!): SuccessResponseType!
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
  }

  type NotFullGroup {
    _id: ID!
    name: String!
    profilePicture: ImageType
    membersCount: Int!
    owner: String
  }

  type JoinRequestsCountResponse {
    count: Int!
  }

  type IsUserSentJoinRequestResponseType {
    isUserSentJoinRequest: Boolean!
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
    requests: [JoinGroupRequestResponseType!]!
    isFinalPage: Boolean!
  }

  type JoinGroupRequestResponseType {
    _id: ID!
    user: NotFullUser!
  }

  type GetGroupsResponse {
    groups: [NotFullGroup!]!
    isFinalPage: Boolean!
  }

  enum GroupPrivacy {
    public
    members_only
  }

  input RemoveGroupPictureInfoInput {
    groupId: ID!
    pictureType: PicturesTypes!
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
    newAdminId: ID!
    groupId: ID!
    toggle: ToggleEnum!
  }

  enum ToggleEnum {
    add
    remove
  }

  input HandleGroupRequestInput {
    requestId: ID!
    groupId: ID!
    senderId: ID!
    acception: Boolean!
  }

  input GetGroupRequestsInput {
    groupId: ID!
    page: Int!
    limit: Int!
  }
`;

export default groupTypeDefs;
