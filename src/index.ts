import * as FollowerHelper from "./followerComparsion";
import * as FileSystem from "./fileSystem";
import * as InstagramApi from "./instagramApi";
import * as Utils from "./utils";
import {Command} from 'commander';
import dotenv from 'dotenv';

const program = new Command();
program
    .version('0.0.1')
    .option('-f, --followed', 'Show people that followed you today.')
    .option('-u, --unfollowed', 'Show people that unfollowed you today.')
    .option('-F, --show-followers <date>', 'Show follower-list on the given date.')
    .option('-fL, --follower-list', 'Show complete list of people that followed you.')
    .option('-uL, --unfollower-list', 'Show complete list of people that unfollowed you.')
    .option('-aF, --accounts-not-follow', 'Accounts that you follow, but don\'t follow back:')
    .option('-aU, --accounts-you-not-follow', 'Accounts that you do not follow, but follow you:')
    .option('-c, --follow-counts', 'Prints the amount of followers and followed people.')
    .parse(process.argv);

FileSystem.checkDirectories();

const oldDate = Utils.getDate();
oldDate[2] = oldDate[2] - 1;

dotenv.config()
const username = process.env.IG_USER ?? "";
const password = process.env.IG_PASSWORD ?? "";

InstagramApi.getFollowers(username, password).then(async followers => {

    FileSystem.saveFollowers(Utils.getDateString(), followers);
    const oldFollowers = FileSystem.loadFollowers(Utils.getDateString(oldDate));

    const [followed, unfollowed] = FollowerHelper.compareFollowers(followers, oldFollowers);

    FileSystem.appendFollowers(followed);
    FileSystem.appendUnfollowers(unfollowed);

    if (program.followed)
        console.log("Followed:", followed);

    if (program.unfollowed)
        console.log("Unfollowed:", unfollowed);

    if (program.showFollowers)
        console.log(`Followers (${program.showFollowers}):`, FileSystem.loadFollowers(program.showFollowers));

    if (program.followerList)
        console.log("Complete Followed List:", FileSystem.loadFollowed());

    if (program.unfollowerList)
        console.log("Complete Unfollowed List:", FileSystem.loadUnfollowed());

    if (program.followCounts) {
        const followed = await InstagramApi.getFollowed(username, password);
        console.log("Followers:", followers.length);
        console.log("Followed:", followed.length);
    }

    if (program.accountsYouNotFollow) {
        const followed = await InstagramApi.getFollowed(username, password);
        console.log(
            "Accounts that you do not follow, but follow you:",
            FollowerHelper.compareFollowers(followed, followers)[1]
        );
    }

    if (program.accountsNotFollow) {
        const followed = await InstagramApi.getFollowed(username, password);
        console.log(
            "Accounts that you follow, but don't follow back:",
            FollowerHelper.compareFollowers(followed, followers)[0]
        );
    }
});


