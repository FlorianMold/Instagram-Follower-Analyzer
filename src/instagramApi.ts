import {Follower} from './follower';
import {IgApiClient} from "instagram-private-api";

/**
 * Retrieve instagram-followers
 */
export const getFollowers = async (username: string, password: string): Promise<Follower[]> => {
    const ig = new IgApiClient();
    ig.state.generateDevice(username);
    const auth = await ig.account.login(username, password);
    const followersFeed = ig.feed.accountFollowers(auth.pk);
    const wholeResponse = await followersFeed.request();
    return wholeResponse.users.map(value => {
        return {
            name: value.username
        };
    });
}