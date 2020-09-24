import { Follower } from './follower';
import { IgApiClient } from 'instagram-private-api';

/**
 * Retrieve instagram-followers
 */
export const getFollowers = async (
  username: string,
  password: string
): Promise<Follower[]> => {
  const ig = new IgApiClient();
  ig.state.generateDevice(username);
  const auth = await ig.account.login(username, password);
  let feed = ig.feed.accountFollowers(auth.pk);
  let allResults: Follower[] = [];
  let currentPage;
  do {
    currentPage = await feed.items();
    currentPage.forEach(user => {
      allResults.push({ name: user.username });
    });
  } while (feed.isMoreAvailable());

  return allResults;
};

/**
 * Retrieve your followed accounts.
 *
 * @param username username of the instagram-account
 * @param password password of the instagram-account
 */
export const getFollowed = async (
  username: string,
  password: string
): Promise<Follower[]> => {
  const ig = new IgApiClient();
  ig.state.generateDevice(username);
  const auth = await ig.account.login(username, password);
  let feed = ig.feed.accountFollowing(auth.pk);
  let allResults: Follower[] = [];
  let currentPage;
  do {
    currentPage = await feed.items();
    currentPage.forEach(user => {
      allResults.push({ name: user.username });
    });
  } while (feed.isMoreAvailable());

  return allResults;
};
