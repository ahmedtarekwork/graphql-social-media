import gql from "graphql-tag";

const groupTypeDefs = gql`
  type Query {
    getGroups(wantedGroups: PaginatedItemsInput!): [Group!]!
    getSingleGroup(groupId: ID!): Group
    getGroupJoinRequests(
      requestsPaginationInfo: GetGroupRequestsInput!
    ): [GroupRequest!]!
  }

  type Mutation {
    addGroup(addGroupData: AddGroupInput!): Group!
    editGroup(editGroupData: EditGroupInput!): Group!
    deleteGroup(groupId: ID!): SuccessResponseType!

    toggleGroupAdmin(
      toggleGroupAdminData: ToggleGroupAdminInput!
    ): SuccessResponseType!

    joinGroup(groupId: ID!): JoinGroupResponseType!
    exitGroup(groupId: ID!): SuccessResponseType!

    expulsingFromTheGroup(
      expulsingFromGroupData: ExpulsingFromTheGroupInput
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

  type JoinGroupResponseType {
    message: String!
    joinedGroups: [ID!]
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
  }
  input EditGroupInput {
    groupId: ID!
    name: String
    profilePicture: ImageInput
    coverPicture: ImageInput
  }

  input ToggleGroupAdminInput {
    adminId: ID!
    groupId: ID!
  }

  # group request
  type GroupRequest {
    _id: ID! # ID of request itself
    user: User!
    group: Group!
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
