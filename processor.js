const bookFetch = require('./book_fetch');

/**
 * @property {String}key need override the key for caching
 * @method load need override,
 * @method checkNew need override
 */
class MangaProcesser extends Processor {

    // The key for caching data
    get key() {
        return this.data.link;
    }

    /**
     * 
     * Start load pictures
     * 
     * @param {*} state The saved state.
     */
    async load(state) {
        let env = new ScriptContext();
        env.eval('document = {write: function(html) {return html;}};');
        let cache = {};
        state = state ?? {};
        let url = state.url ?? this.data.link;
        if (url.indexOf('exit/exit') > 0) {
            url = null;
        }
        let count = state.count ?? 0;

        async function request(url, isText)  {
            let res = await fetch(url);
            if (isText) {
                return await res.text();
            } else {
                let buffer = await res.arrayBuffer();
                let decoder = new TextDecoder('gbk');
                let text = decoder.decode(buffer);
                return HTMLParser.parse(text);
            }
        }

        while (url) {
            this.save(false, {
                url,
                count,
            });
            console.log("Request " + url);
            let doc = await request(url);
            let tags = doc.querySelectorAll('script[src]');
            for (let tag of tags) {
                let src = tag.getAttribute('src');
                if (src.match(/^\/js/)) {
                    let href = new URL(src, url).toString();
                    if (!cache[href]) {
                        cache[href] = true;
                        try {
                            let script = await request(href, true);
                            env.eval(script);
                        } catch (e) {}
                    }
                }
            }
            try {
                console.log(`Doc ${doc}`);
                let script = doc.querySelector('script:not([src])');
                let html = env.eval(script.text);
                let doc2 = HTMLParser.parse(html);
                let link = doc2.querySelector('a');
                let item = {
                    url: link.querySelector('img').getAttribute('src'),
                };
                url = new URL(link.getAttribute('href'), url).toString();
                if (url.indexOf('exit/exit') > 0) {
                    url = null;
                }
                this.setDataAt(item, count);
                count++;
            } catch (e) {
                console.log(`error ${e}\n${e.toString()}`);
                throw e;
            }
        }

        this.save(true, {
            count,
        });
    }

    async fetch(url) {
        let res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Mobile Safari/537.36',
            }
        });
        let buffer = await res.arrayBuffer();
        let decoder = new TextDecoder('gbk');
        let text = decoder.decode(buffer);
        return HTMLParser.parse(text);
    }

    // Called in `dispose`
    unload() {

    }

    // Check for new chapter
    async checkNew() {
        let url = this.data.link + '?waring=1';
        let data = await bookFetch(url);
        var item = data.list[data.list.length - 1];
        /**
         * @property {String}title The last chapter title.
         * @property {String}key The unique identifier of last chpater.
         */
        return {
            title: item.title,
            key: item.link,
        };
    }
}

module.exports = MangaProcesser;