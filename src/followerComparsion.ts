import { Follower } from './follower';

/**
 * Compares two lists of followers and returns new followers and people that unfollowed.
 *
 * @param newList new list of followers
 * @param oldList old list of followers
 */
export const compareFollowers = (newList: Follower[], oldList: Follower[]): [Follower[], Follower[]] => {
    return [
        newList.filter(value => !oldList.some(value1 => value1.name === value.name)),
        oldList.filter(value => !newList.some(value1 => value1.name === value.name))
    ]
}