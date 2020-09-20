import fetch from 'node-fetch';
import formData from 'form-data';

export class InstagramC {
    public csrfToken: string | undefined;
    public sessionId: string | undefined;
    public userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36';
    public userIdFollowers: any = {};
    public timeoutForCounter = 250;
    public timeoutForCounterValue = 20000;
    public paginationDelay = 20000;
    public receivePromises: any = {};
    public searchTypes = ['location', 'hashtag'];
    public essentialValues: any;
    public baseHeader: any;
    public rollout_hash: any;

    /**
     * Constructor
     */
    constructor(csrfToken?: string, sessionId?: string) {
        this.csrfToken = csrfToken;
        this.sessionId = sessionId;
        this.essentialValues = {
            sessionid: undefined,
            ds_user_id: undefined,
            csrftoken: undefined,
            shbid: undefined,
            rur: undefined,
            mid: undefined,
            shbts: undefined,
            mcd: undefined,
            ig_cb: 1,
            //urlgen      : undefined //this needs to be filled in according to my RE
        };

        this.baseHeader = {
            'accept-langauge': 'en-US;q=0.9,en;q=0.8,es;q=0.7',
            'origin': 'https://www.instagram.com',
            'referer': 'https://www.instagram.com/',
            'upgrade-insecure-requests': '1',
            'user-agent': this.userAgent,
        }
    }


    generateCookie(simple?: any) {
        if (simple) return 'ig_cb=1'

        var cookie = ''
        var keys = Object.keys(this.essentialValues)
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (this.essentialValues[key] !== undefined) {
                cookie += key + '=' + this.essentialValues[key] + (i < keys.length - 1 ? '; ' : '')
            }
        }

        return cookie;
    }

    combineWithBaseHeader(data: any) {
        return Object.assign(this.baseHeader, data)
    }

    updateEssentialValues(src: any, isHTML?: boolean) {
        //assumes that essential values will be extracted from a cookie unless specified by the isHTML bool

        if (!isHTML) {
            var keys = Object.keys(this.essentialValues)

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (!this.essentialValues[key])
                    for (let cookie in src)
                        if (src[cookie].includes(key) && !src[cookie].includes(key + '=""')) {
                            var cookieValue = src[cookie].split(';')[0].replace(key + '=', '')
                            this.essentialValues[key] = cookieValue
                            break;
                        }
            }
        } else {
            var subStr = src;

            var startStr = '<script type="text/javascript">window._sharedData = ';
            var start = subStr.indexOf(startStr) + startStr.length;
            subStr = subStr.substr(start, subStr.length);

            subStr = subStr.substr(0, subStr.indexOf('</script>') - 1);

            var json = JSON.parse(subStr);

            this.essentialValues.csrftoken = json.config.csrf_token;
            this.rollout_hash = json.rollout_hash;
        }
    }

    /**
     * User data by username
     * @param {String} username
     * @return {Object} Promise
     */
    getUserDataByUsername(username: string) {
        var fetch_data = {
            'method': 'get',
            'headers':
                this.combineWithBaseHeader(
                    {
                        'accept': 'text/html,application/xhtml+xml,application/xml;q0.9,image/webp,image/apng,*.*;q=0.8',
                        'accept-encoding': 'gzip, deflate, br',
                        'cookie': this.generateCookie()
                    }
                )
        }

        return fetch('https://www.instagram.com/' + username, fetch_data).then(res => res.text().then(function (data) {
            const regex = /window\._sharedData = (.*);<\/script>/;
            const match = regex.exec(data);

            if (!match || (match && typeof match[1] === 'undefined')) {
                return '';
            }

            return JSON.parse(match[1]).entry_data.ProfilePage[0];
        }))
    }

    /**
     Is private check
     * @param {String} username
     */
    isPrivate(username: string) {
        return this.getUserDataByUsername(username).then((data) =>
            data.user.is_private
        )
    }

    /**
     * User followers list
     * Bench - 1k followers/1 min
     * @param {Int} userId
     * @param {String} endCursor cursor used to fetch next page
     * @param {Int} count count of results to return (API may return less)
     * @param {Int} followersCounter counter of followers
     * @param {Boolean} selfSelf if call by self
     * @return {Object} array followers list
     */
    getUserFollowers(userId: number, endCursor?: string, count?: number, followersCounter?: number, selfSelf?: number): Promise<any> {
        const self = this

        if (!selfSelf)
            self.userIdFollowers[userId] = []


        count = count || 20;

        const query = {
            id: userId,
            include_reel: true,
            fetch_mutual: true,
            first: count,
            after: ""
        };
        if (endCursor) {
            query.after = endCursor;
        }

        const variables = encodeURIComponent(JSON.stringify(query));

        self.receivePromises[userId] = 1
        return fetch('https://www.instagram.com/graphql/query/?query_hash=56066f031e6239f35a904ac20c9f37d9&variables=' + variables,
            {
                'method': 'get',
                'headers':
                    this.combineWithBaseHeader(
                        {
                            'accept': 'text/html,application/xhtml+xml,application/xml;q0.9,image/webp,image/apng,*.*;q=0.8',
                            'accept-encoding': 'gzip, deflate, br',
                            'cookie': this.generateCookie()
                        }
                    )
            }).then(res => {
            return res.text().then((response) => {
                //prepare convert to json
                let json: any = response;

                try {
                    json = JSON.parse(response)
                } catch (e) {
                    console.log('Session error')
                    console.log(response)
                    return [];
                }

                if (json['status'] == 'ok') {
                    self.userIdFollowers[userId] = self.userIdFollowers[userId].concat(json.data.user.edge_followed_by.edges)

                    if (json.data.user.edge_followed_by.page_info.has_next_page) {
                        let end_cursor = json.data.user.edge_followed_by.page_info.end_cursor
                        return new Promise((resolve) => {
                            console.log('fetching next page in ' + this.paginationDelay / 1000 + ' seconds');
                            setTimeout(() => {
                                resolve(self.getUserFollowers(userId, end_cursor, count, 1, 1));
                            }, this.paginationDelay);
                        });
                    } else {
                        self.receivePromises[userId] = undefined
                        return self.userIdFollowers[userId]
                    }

                } else {
                    return new Promise((resolve) => {
                        console.log(json);
                        console.log('request failed, retrying in ' + this.paginationDelay / 1000 + ' seconds');
                        setTimeout(() => {
                            resolve(self.getUserFollowers(userId, endCursor, count, followersCounter, selfSelf));
                        }, this.paginationDelay);
                    });
                }

            }).catch((e) => {
                console.log('Instagram returned:' + e)
            })
        })
    }

    /**
     * Get csrf token
     * @return {Object} Promise
     */
    getCsrfToken() {
        return fetch('https://www.instagram.com',
            {
                'method': 'get',
                'headers':
                    this.combineWithBaseHeader(
                        {
                            'accept': 'text/html,application/xhtml+xml,application/xml;q0.9,image/webp,image/apng,*.*;q=0.8',
                            'accept-encoding': 'gzip, deflate, br',
                            'cookie': this.generateCookie(true)
                        }
                    )
            }).then(t => {
            // @ts-ignore
            this.updateEssentialValues(t.headers._headers['set-cookie'])
            return t.text()
        }).then(html => {
            this.updateEssentialValues(html, true)
            return this.essentialValues.csrftoken
        }).catch(() =>
            console.log('Failed to get instagram csrf token')
        )
    }

    /**
     * Session id by usrname and password
     * @param {String} username
     * @param {String} password
     * @return {Object} Promise
     */
    auth(username: string, password: string) {
        var formdata = 'username=' + username + '&password=' + password + '&queryParams=%7B%7D'

        var options = {
            method: 'POST',
            body: formdata,
            headers:
                this.combineWithBaseHeader(
                    {
                        'accept': '*/*',
                        'accept-encoding': 'gzip, deflate, br',
                        'content-length': formdata.length,
                        'content-type': 'application/x-www-form-urlencoded',
                        'cookie': 'ig_cb=' + this.essentialValues.ig_cb,
                        'x-csrftoken': this.csrfToken,
                        'x-instagram-ajax': this.rollout_hash,
                        'x-requested-with': 'XMLHttpRequest',
                    }
                )
        }

        return fetch('https://www.instagram.com/accounts/login/ajax/', options).then(
            t => {
                // @ts-ignore
                this.updateEssentialValues(t.headers._headers['set-cookie'])
                return this.essentialValues.sessionid;
            }).catch(() =>
            console.log('Instagram authentication failed (challenge required erro)')
        )
    }


    /**
     * @return {Object} default headers
     */
    getHeaders() {
        return {
            'referer': 'https://www.instagram.com/p/BT1ynUvhvaR/?taken-by=yatsenkolesh',
            'origin': 'https://www.instagram.com',
            'user-agent': this.userAgent,
            'x-instagram-ajax': '1',
            'x-requested-with': 'XMLHttpRequest',
            'x-csrftoken': this.csrfToken,
            cookie: ' sessionid=' + this.sessionId + '; csrftoken=' + this.csrfToken + ';'
        }
    }

    /**
     * Return user data by id
     * @param {Int} id
     * @return {Object} promise
     */
    getUserDataById(id: number) {
        let query = 'ig_user(' + id + '){id,username,external_url,full_name,profile_pic_url,biography,followed_by{count},follows{count},media{count},is_private,is_verified}'

        let form = new formData();
        form.append('q', query)

        return fetch('https://www.instagram.com/query/',
            {
                'method': 'post',
                'body': form,
                // @ts-ignore
                'headers': this.getHeaders()
            }).then(res =>
            res.json().then(t => t)
        )
    }
}
