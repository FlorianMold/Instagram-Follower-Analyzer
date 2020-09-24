import * as FollowerHelper from '../src/followerComparsion';
import { Follower } from '../src/follower';

describe('Follower Comparison Test', () => {
  it('works', () => {
    const newList: Follower[] = [
      { name: 'Daniel' },
      { name: 'Marlene' },
      { name: 'Jürgen' },
    ];

    const oldList: Follower[] = [
      { name: 'Florian' },
      { name: 'Daniel' },
      { name: 'Marlene' },
    ];

    const [followers, unfollowers] = FollowerHelper.compareFollowers(
      newList,
      oldList
    );

    expect(followers).toEqual([{ name: 'Jürgen' }]);
    expect(unfollowers).toEqual([{ name: 'Florian' }]);
  });
});
