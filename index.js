class IndexController extends Controller {
    load() {
        this.data = {
            tabs: [
                {
                    "title": "推薦",
                    "id": "home",
                    "url": "http://wap.ikukudm.com/",
                    "data": {}
                },
                {
                    "title": "日漫",
                    "id": "japan",
                    "url": "http://wap.ikukudm.com/comictype/3_{0}.htm"
                },
                {
                    "title": "港漫",
                    "id": "hongkong",
                    "url": "http://wap.ikukudm.com/comictype/5_{0}.htm"
                },
                {
                    "title": "国漫",
                    "id": "china",
                    "url": "http://wap.ikukudm.com/comictype/30_{0}.htm"
                },
                {
                    "title": "更多",
                    "id": "more",
                    "url": "http://wap.ikukudm.com/comictype/31_{0}.htm"
                }, 
            ]
        };
    }
}

module.exports = IndexController;