import gql from "graphql-tag";

const userTypeDefs = gql`
  type Query {
    getSingleUser(userId: ID!): User
    getAllUsers(wantedUsers: PaginatedItemsInput!): GetAllUsersResponseType!
    checkUser: User

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

  input GetUserFriendsInput {
    page: Int!
    limit: Int!
    userId: ID!
  }

  type IsUserFollowThisPageResponse {
    isFollow: Boolean!
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
