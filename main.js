const PER_PAGE = 40;

class MainController extends Controller {

    load(data) {
        this.id = data.id;
        this.url = data.url;
        this.page = 0;

        var cached = this.readCache();
        let list;
        if (cached) {
            list = cached.items;
        } else {
            list = [];
        }

        this.data = {
            list: list,
            loading: false,
            hasMore: this.id !== 'update'
        };

        this.userAgent = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Mobile Safari/537.36';

        if (cached) {
            let now = new Date().getTime();
            if (now - cached.time > 30 * 60 * 1000) {
                this.reload();
            }
        } else {
            this.reload();
        }

    }

    async onPressed(index) {
        await this.navigateTo('book', {
            data: this.data.list[index]
        });
    }

    onRefresh() {
        this.reload();
    }

    async onLoadMore() {
        this.setState(() => {
            this.data.loading = true;
        });
        try {

            let page = this.page + 1;
            let url = this.makeURL(page);
            let res = await fetch(url, {
                headers: {
                    'User-Agent': this.userAgent,
                },
            });
            let buffer = await res.arrayBuffer();
            let decoder = new TextDecoder('gbk');
            let text = decoder.decode(buffer);
            this.page = page;
            let items = this.parseData(text, url);
    
            this.setState(()=>{
                for (let item of items) {
                    this.data.list.push(item);
                }
                this.data.loading = false;
                this.data.hasMore = items.length >= PER_PAGE;
            });
        } catch (e) {
            showToast(`${e}\n${e.stack}`);
            this.setState(()=>{
                this.data.loading = false;
            });
        }
        
    }

    makeURL(page) {
        return this.url.replace('{0}', page + 1).replace('{1}', PER_PAGE);
    }

    async reload() {
        this.setState(() => {
            this.data.loading = true;
        });
        try {
            let url = this.makeURL(0);
            let res = await fetch(url, {
                headers: {
                    'User-Agent': this.userAgent,
                }
            });
            let buffer = await res.arrayBuffer();
            let decoder = new TextDecoder('gbk');
            let text = decoder.decode(buffer);
            let items = this.parseData(text, url);
            this.page = 0;
            localStorage['cache_' + this.id] = JSON.stringify({
                time: new Date().getTime(),
                items: items,
            });
            this.setState(()=>{
                this.data.list = items;
                this.data.loading = false;
                this.data.hasMore = this.id !== 'update' && items.length >= PER_PAGE;
            });
        } catch (e) {
            showToast(`${e}\n${e.stack}`);
            this.setState(()=>{
                this.data.loading = false;
            });
        }
    }

    readCache() {
        let cache = localStorage['cache_' + this.id];
        if (cache) {
            let json = JSON.parse(cache);
            return json;
        }
    }

    parseData(text, url) {
        if (this.id === 'home') {
            return this.parseHomeData(text, url);
        } else if (this.id === 'update') {
            return this.parseUpdateData(text, url);
        } else {
            return this.parsePageData(text, url);
        } 
    }

    parseHomeData(html, url) {
        const doc = HTMLParser.parse(html);

        let results = [];
        let boxes = doc.querySelectorAll('.imgBox');
        for (let box of boxes) {
            let subhead = box.querySelector('.Sub_H2');
            if (subhead) {
                let icon = subhead.querySelector('.icon img');
                let label = subhead.querySelector('.Title');
                results.push({
                    header: true,
                    title: label.text,
                    icon: icon ? new URL(icon.getAttribute('src'), url).toString() : null
                });
            }
            let books = box.querySelectorAll('ul > li');
            for (let book_elem of books) {
                results.push({
                    title: book_elem.querySelector('a.txtA').text,
                    subtitle: book_elem.querySelector('.info').text,
                    link: new URL(book_elem.querySelector('a.ImgA').getAttribute('href'), url).toString(),
                    picture: new URL(book_elem.querySelector('a.ImgA > img').getAttribute('src'), url).toString(),
                });
            }
        }

        return results;
    }

    parseUpdateData(text, url) {
        const doc = HTMLParser.parse(text);

        let results = [];
        let boxes = doc.querySelectorAll('.UpdateList .itemBox');
        for (let box of boxes) {
            let linkimg = box.querySelector('.itemImg a');
            let item = {};
            item.title = linkimg.getAttribute('title');
            item.link = new URL(linkimg.getAttribute('href'), url).toString();
            item.picture = new URL(linkimg.querySelector('img').getAttribute('src'), url).toString();
            let items = box.querySelectorAll('.itemTxt > .txtItme');
            let summary = [];
            for (const elem of items) {
                summary.push(elem.text);
            }
            item.subtitle = summary.join('|');
            results.push(item);
        }
        return results;
    }

    parsePageData(text, url) {
        const doc = HTMLParser.parse(text);
        let results = [];
        let boxes = doc.querySelectorAll('#classify_container > li');
            
            for (let box of boxes) {
                let linkimg = box.querySelector('.ImgA');
                let item = {};
                item.link = new URL(linkimg.getAttribute('href'), url).toString();
                item.picture = new URL(linkimg.querySelector('img').getAttribute('src'), url).toString();
                
                item.title = box.querySelector('.txtA').text;
                item.subtitle = box.querySelector('.info').text;
                results.push(item);
            }
        return results;
    }

}

module.exports = MainController;