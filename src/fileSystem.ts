import { Follower } from './follower';
import fs from 'fs';

const directory = __dirname + '/followers';
const followedList = 'followed';
const unfollowedList = 'unfollowed';

console.log(directory);

/**
 * Check if the needed directories exists and creates them if needed.
 */
export const checkDirectories = (): void => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
};

const descendingSort = (a: string, b: string) => (a === b ? 0 : a > b ? -1 : 1);

/**
 * Loads all follower lists from the file-system
 */
export const loadFollowerLists = (): string[] => {
  return fs
    .readdirSync(directory)
    .filter(
      value =>
        ![followedList, unfollowedList]
          .map(value1 => (value1 += '.json'))
          .includes(value)
    )
    .sort(descendingSort);
};

/**
 * Finds the follower-list that comes before the current.
 */
export const findLastFollowerListName = (): string => {
  const followerLists = loadFollowerLists();
  if (followerLists.length <= 1) {
    return '';
  }
  followerLists.sort(descendingSort);
  return followerLists[1].split('.')[0];
};

/**
 * Save follower-list with the given name.
 */
export const saveFollowers = (
  filename: string,
  followers: Follower[]
): void => {
  fs.writeFileSync(
    directory + '/' + filename + '.json',
    JSON.stringify(followers)
  );
};

/**
 * Load list of followers.
 */
export const loadFollowed = () => loadFollowers(followedList);

/**
 * Load list of unfollowers.
 */
export const loadUnfollowed = () => loadFollowers(unfollowedList);

/**
 * Load followers from the file-system.
 *
 * @param filename filename to load
 */
export const loadFollowers = (filename: string): Follower[] => {
  return loadFile(directory + '/' + filename + '.json');
};

/**
 * Append followers to follower list.
 *
 * @param followed list of new followers
 */
export const appendFollowers = (followed: Follower[]): void => {
  appendList(followed, directory + '/' + followedList + '.json');
};

/**
 * Append followers to follower list.
 *
 * @param unfollowed list of unfollowers
 */
export const appendUnfollowers = (unfollowed: Follower[]): void => {
  appendList(unfollowed, directory + '/' + unfollowedList + '.json');
};

/**
 * Append list of followers/unfollowers to the file.
 *
 * @param list list to append
 * @param fileName name of the file to append
 */
const appendList = (list: Follower[], fileName: string): void => {
  const oldList = loadFile(fileName);
  const newList = oldList.concat(
    list.filter(value => !oldList.some(value1 => value1.name === value.name))
  );
  fs.writeFileSync(fileName, JSON.stringify(newList));
};

/**
 * Loads the list with the given filename.
 *
 * @param fileName name of the file to load.
 */
const loadFile = (fileName: string): Follower[] => {
  if (!fs.existsSync(fileName)) return [];

  const fileContent = fs.readFileSync(fileName, 'utf-8');
  return JSON.parse(fileContent);
};
