
function parseData(text, url) {
    const doc = HTMLParser.parse(text);
    let links = doc.querySelectorAll("#list > li > a");
    let results = [];
    let subtitle = doc.querySelector('.sub_r > .txtItme').text;
    let summary = doc.querySelector('.txtDesc').text;
    for (let i = 0, t = links.length; i < t; i++) {
        let el = links[i];
        results.push({
            link: new URL(el.getAttribute('href'), url).toString(),
            title: el.text,
        });
    }

    return {
        subtitle: subtitle,
        summary: summary,
        list: results,
    };
}

module.exports = async function(url) {
    let res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Mobile Safari/537.36',
        }
    });
    let buffer = await res.arrayBuffer();
    let decoder = new TextDecoder('gbk');
    let text = decoder.decode(buffer);

    return parseData(text, url);
}