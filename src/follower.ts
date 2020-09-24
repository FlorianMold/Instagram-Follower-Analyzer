export type Follower = {
  name: string;
};

export const getFollowerName = (follower: Follower) => follower.name;
