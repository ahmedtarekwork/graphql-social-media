import gql from "graphql-tag";

const userTypeDefs = gql`
  type Query {
    getSingleUser(userId: ID!): User #not full user properties
    getAllUsers(wantedUsers: PaginatedItemsInput!): GetAllUsersResponseType!
    checkUser: User #not full user
    # notifications
    getUserNotifications(
      notificationsPagination: PaginatedItemsInput!
    ): GetUserNotificationsResponseType!
    getUserNotificationsCount: CountResponseType!

    # posts
    getUserSavedPosts(
      postsPaginations: PaginatedItemsInput!
    ): GetUserSavedPostsResponseType!

    # friendship
    isUserMyFriend(userId: ID!): CheckForFriendshipResponseType
    doesCurrentUserSentFriendshipRequest(
      receverId: ID!
    ): CheckForFriendshipResponseType!
    doesCurrentUserRecevedFriendshipRequest(
      senderId: ID!
    ): CheckForFriendshipResponseType!

    getUserFriendshipRequestsCount: CountResponseType!
    getUserFriendsRequests(
      requestsPagination: PaginatedItemsInput!
    ): GetUserFriendshipRequestsResponseType!

    getUserFriends(
      friendsPagination: GetUserFriendsInput!
    ): GetUserFriendsResponseType!
    getUserFriendsCount(userId: ID!): CountResponseType!

    # pages
    getUserFollowedPages(
      pagesPagination: PaginatedItemsInput!
    ): [NotFullPageOrGroup!]!
    getUserOwnedPage(
      pagesPagination: PaginatedItemsInput!
    ): [NotFullPageOrGroup!]!
    getuserAdminPages(
      pagesPagination: PaginatedItemsInput!
    ): [NotFullPageOrGroup!]!

    # groups
    getUserJoinedGroups(
      groupsPagination: PaginatedItemsInput!
    ): [NotFullPageOrGroup!]!
    getUserOwnedGroups(
      groupsPagination: PaginatedItemsInput!
    ): [NotFullPageOrGroup!]!
    getUserAdminGroups(
      groupsPagination: PaginatedItemsInput!
    ): [NotFullPageOrGroup!]!
  }

  type Mutation {
    registerUser(userData: RegisterUserInput!): User!
    loginUser(loginCredintials: LoginUserInput!): User!
    changeUserData(newUserData: ChangeUserDataInput!): User!
    deleteUser: SuccessResponseType!
    removeUserFromFriendsList(userId: ID!): RemoveUserFromFriendsListResponse!

    removeUserProfileOrCoverPicture(
      pictureType: PicturesTypes!
    ): SuccessResponseType!

    sendFriendshipRequest(userId: ID!): SuccessResponseType!
    handleFriendShipRequest(
      handleFriendshipRequestData: HandleFriendShipRequestInput!
    ): HandleFriendShipRequestResponseType!

    markNotificationAsRead(id: ID!): MarkSingleNotificationAsReadResponseType!
    markAllNotificationsAsRead: SuccessResponseType!
  }

  enum PicturesTypes {
    profile
    cover
  }

  input GetUserFriendsInput {
    page: Int!
    limit: Int!
    userId: ID!
  }

  type SavedPostType {
    _id: ID!
    caption: String
    media: ImageType
  }

  type GetUserSavedPostsResponseType {
    savedPosts: [SavedPostType!]!
    isFinalPage: Boolean!
  }

  type GetAllUsersResponseType {
    users: [User!]!
    isFinalPage: Boolean!
  }

  type CheckForFriendshipResponseType {
    status: Boolean!
  }

  type GetUserFriendsResponseType {
    friends: [NotFullUser!]!
    isFinalPage: Boolean!
  }

  type GetUserFriendshipRequestsResponseType {
    friendsRequests: [NotFullUser!]!
    isFinalPage: Boolean!
  }

  type GetUserNotificationsResponseType {
    notifications: [Notification!]!
    isFinalPage: Boolean!
  }

  type MarkSingleNotificationAsReadResponseType {
    message: String!
    id: String!
  }

  type CountResponseType {
    count: Int!
  }

  type HandleFriendShipRequestResponseType {
    message: String!
    id: ID!
  }

  type RemoveUserFromFriendsListResponse {
    message: String!
    userId: ID!
  }

  input HandleFriendShipRequestInput {
    userId: ID!
    acception: Boolean!
  }

  input ChangeUserDataInput {
    email: String
    username: String
    password: String
    address: String
    profilePicture: ImageInput
    coverPicture: ImageInput
  }

  input RegisterUserInput {
    email: String!
    username: String!
    password: String!
    address: String!
    profilePicture: ImageInput
    coverPicture: ImageInput
  }
  input LoginUserInput {
    username: String!
    password: String!
  }
`;

export default userTypeDefs;
