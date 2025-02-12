import gql from "graphql-tag";

const publicTypeDefs = gql`
  type User {
    _id: ID!
    email: String!
    username: String!
    address: String!

    profilePicture: ImageType
    coverPicture: ImageType

    followedPages: [NotFullPageOrGroup!]!
    ownedPages: [NotFullPageOrGroup!]
    adminPages: [NotFullPageOrGroup!]

    joinedGroups: [NotFullPageOrGroup!]!
    adminGroups: [NotFullPageOrGroup!]!
    ownedGroups: [NotFullPageOrGroup!]!
  }

  type Notification {
    _id: ID!
    createdAt: String!
    content: String!
    url: String!
    icon: IconEnum!
    hasRead: Boolean!
  }

  enum IconEnum {
    friend
    page
    group
    post
    comment
    sad
    angry
    love
    like
    not_specified
  }

  type Post {
    _id: ID!
    reactions: RecationsType!
    caption: String!
    media: [ImageType!]!
    owner: NotFullUser!
    commentsCount: Int!
    blockComments: Boolean!
    privacy: Privacy!
    createdAt: String!
    community: Community!
    communityId: ID
    shareData: SharePostData!
    shareDate: String!
    isInBookMark: Boolean!
    isShared: Boolean!
    sharePerson: NotFullUser
  }

  type SharePostData {
    count: Int!
    users: [NotFullUser!]!
  }

  type NotFullUser {
    _id: ID!
    username: String!
    profilePicture: ImageType
  }

  type Page {
    _id: ID!
    name: String!
    owner: User!
    admins: [User!]!
    followersCount: Int!
    profilePicture: ImageType
    coverPicture: ImageType
  }

  type NotFullPageOrGroup {
    _id: ID!
    name: String!
    profilePicture: ImageType
  }

  enum Community {
    personal
    page
    group
  }

  enum Privacy {
    only_me
    friends_only
    public
  }

  type SuccessResponseType {
    message: String!
  }

  type RecationsType {
    like: RecationType!
    love: RecationType!
    sad: RecationType!
    angry: RecationType!
  }
  type RecationType {
    count: Int!
  }

  enum Reactions {
    like
    love
    sad
    angry
  }

  input ToggleReactionInput {
    itemId: String! # item => post or comment
    reaction: Reactions!
  }

  input DeleteMediaFromItemInput {
    itemId: String!
    publicIds: [String!]!
  }

  type ImageType {
    public_id: ID
    secure_url: String
  }

  input ImageInput {
    public_id: ID!
    secure_url: String!
  }

  input PaginatedItemsInput {
    page: Int!
    limit: Int!
  }

  input GetItemReactionsInput {
    itemId: ID!
    limit: Int!
    page: Int!
    reaction: Reactions!
  }

  type GetItemReactionsResponseType {
    reactions: [NotFullUser!]!
    isFinalPage: Boolean!
  }

  type GetMyReactionToItemResponseType {
    reaction: Reactions
  }
`;

export default publicTypeDefs;
