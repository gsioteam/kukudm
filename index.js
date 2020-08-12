
class Collection extends glib.Collection {

    constructor(data) {
        super();
        this.url = data.url;
    }

    fetch(url) {
        return new Promise((resolve, reject)=>{
            let req = glib.Request.new('GET', url);
            this.callback = glib.Callback.fromFunction(function() {
                if (req.getError()) {
                    reject(glib.Error.new(302, "Request error " + req.getError()));
                } else {
                    let body = req.getResponseBody();
                    if (body) {
                        resolve(glib.GumboNode.parse(body, 'gbk'));
                    } else {
                        reject(glib.Error.new(301, "Response null body"));
                    }
                }
            });
            req.setOnComplete(this.callback);
            req.start();
        });
    }

}

class HomeCollection extends Collection {

    reload(_, cb) {
        let purl = new PageURL(this.url);
        console.log("start request");
        this.fetch(this.url).then((doc)=>{
            console.log("complete request");
            let results = [];
            let boxes = doc.querySelectorAll('.imgBox');
            for (let box of boxes) {
                let subhead = box.querySelector('.Sub_H2');
                if (subhead) {
                    let head = glib.DataItem.new();
                    head.type = glib.DataItem.Type.Header;
                    let icon = subhead.querySelector('.icon img');
                    if (icon) {
                        head.picture = purl.href(icon.getAttribute('src'));
                    }
                    let label = subhead.querySelector('.Title');
                    if (label) {
                        head.title = label.text;
                    }
                    results.push(head);
                }
                let books = box.querySelectorAll('ul > li');
                for (let book_elem of books) {
                    let item = glib.DataItem.new();
                    item.title = book_elem.querySelector('a.txtA').text;
                    item.subtitle = book_elem.querySelector('.info').text;
                    item.link = purl.href(book_elem.querySelector('a.ImgA').getAttribute('href'));
                    item.picture = purl.href(book_elem.querySelector('a.ImgA > img').getAttribute('src'));
                    results.push(item);
                }
            }
            this.setData(results);
            cb.apply(null);
        }).catch(function(err) {
            if (err instanceof Error) 
                err = glib.Error.new(305, err.message);
            cb.apply(err);
        });
        return true;
    }
};

class UpdateCollection extends Collection {

    reload(_, cb) {
        let purl = new PageURL(this.url);
        this.fetch(this.url).then((doc) => {
            let results = [];
            let boxes = doc.querySelectorAll('.UpdateList .itemBox');
            for (let box of boxes) {
                let linkimg = box.querySelector('.itemImg a');
                let item = glib.DataItem.new();
                item.title = linkimg.getAttribute('title');
                item.link = purl.href(linkimg.getAttribute('href'));
                item.picture = purl.href(linkimg.querySelector('img').getAttribute('src'));
                let items = box.querySelectorAll('.itemTxt > .txtItme');
                let summary = [];
                for (const elem of items) {
                    summary.push(elem.text);
                }
                item.subtitle = summary.join('|');
                results.push(item);
            }
            this.setData(results);
            cb.apply(null);
        }).catch(function(err) {
            if (err instanceof Error) 
                err = glib.Error.new(305, err.message);
            cb.apply(err);
        });
        return true;
    }
}

class OtherCollection extends Collection {
    constructor(data) {
        super(data);
        this.page = 0;
    }

    loadPage(url, func) {
        let purl = new PageURL(url);
        console.log("load " + url);
        this.fetch(url).then((doc) => {
            let results = [];
            let boxes = doc.querySelectorAll('#classify_container > li');
            console.log("loaded  " + boxes.length);
            for (let box of boxes) {
                let linkimg = box.querySelector('.ImgA');
                let item = glib.DataItem.new();
                item.link = purl.href(linkimg.getAttribute('href'));
                item.picture = purl.href(linkimg.querySelector('img').getAttribute('src'));
                
                item.title = box.querySelector('.txtA').text;
                item.subtitle = box.querySelector('.info').text;
                results.push(item);
            }
            func(null, results);
        }).catch(function(err) {
            if (err instanceof Error) 
                err = glib.Error.new(305, err.message);
            func(err);
        });
    }

    reload(_, cb) {
        let url = this.url.replace("{0}", 1);
        this.loadPage(url, (err, data) => {
            if (!err) {
                this.setData(data);
                this.page = 0;
            }
            cb.apply(err);
        });
        return true;
    } 

    loadMore(cb) {
        let page = this.page + 1;
        let url = this.url.replace("{0}", page + 1);
        console.log("load more " + url);
        this.loadPage(url, (err, data) => {
            if (!err) {
                this.appendData(data);
                this.page = page;
            }
            cb.apply(err);
        });
        return true;
    }
}

module.exports = function(info) {
    let col;
    let data = info.toObject();
    switch (data.id) {
        case 'home': {
            col = HomeCollection.new(data);
            break;
        }
        case 'update': {
            col = UpdateCollection.new(data);
            break;
        }
        default: {
            col = OtherCollection.new(data);
            break;
        }
    }
    return col;
};