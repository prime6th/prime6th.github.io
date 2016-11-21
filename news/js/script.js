function run(p) {
    $('#section').css('visibility', 'hidden');
    fillArticleToSection();
    if (p == 1) {
        return debugRun();
    }
}

function debugRun() {
    aside = document.getElementById('aside');
    if (aside == null) {
        alert("aside is nil");
        return;
    }
    aside.style.display = 'block';
    aside.innerText = "";
    section = $('#section');
    articleTpl = $('#article');
    aside.innerText += "section inner height: " + section.height() + "\n";
    aside.innerText += "article outer height: " + articleTpl.outerHeight(true) + "\n";
}

function duplicateArticle(num) {
    tpl = $('#article-tpl');
    for (i = 0; i < num; ++i) {
        id = i + 1;
        cl = tpl.clone();
        cl.attr('id', 'article-li' + id);
        cl.find('#article').attr('id', 'article' + id)
        cl.appendTo('#article-set');
    }
    tpl.css({ 'display': 'none' });
}

function fillArticleToSection() {
    section = $('#section');
    articleTpl = $('#article');
    cfg = {};
    num = Math.floor(section.height() / articleTpl.outerHeight(true));
    padding = (section.height() - articleTpl.outerHeight(true) * num) / 2;
    section.css({ "padding-top": "0px", "padding-bottom": padding + "px" });
    duplicateArticle(num);
    cfg['num'] = num;
    var articleData = [];
    githubapi(cfg, articleData);
}

function githubapi(cfg, articleData) {
    $.ajax({
        url: "https://api.github.com/gists/7d351533107585892929a56027e2a2d9/comments",
        dataType: "jsonp",
        success: function(returnData) {
            aside = document.getElementById('aside');
            aside.innerText += "your request remaining: " + returnData.meta['X-RateLimit-Remaining'] + "\n";
            var metaLink = returnData.meta['Link'];
            cfg["article-count"] = 0;
            if (metaLink != null) {
                for (var i = 0; i < metaLink.length; ++i) {
                    var obj = metaLink[i];
                    if (obj[1]['rel'] == 'last') {
                        $.ajax({
                            url: obj[0],
                            dataType: "jsonp",
                            success: function(retLast) {
                                lastData = returnData.data;
                                var ai = 0;
                                for (di = lastData.length - 1; di >= 0; --di) {
                                    articleData.push(lastData[di]);
                                    ++cfg['article-count'];
                                    if (articleData.length >= cfg['num']) return getArticleEnd(cfg, articleData);
                                }

                                var lastMetaLink = retLast.meta['Link'];
                                for (var j = 0; j < lastMetaLink.length; ++j) {
                                    var lastLink = lastMetaLink[j];
                                    if (lastLink[1]['rel'] == 'prev') {
                                        $.ajax({
                                            url: lastLink[0],
                                            dataType: 'jsonp',
                                            success: function(retPre) {
                                                var prevData = retPre.data;
                                                for (pi = prevData.length - 1; pi >= 0; --pi) {
                                                    articleData.push(prevData[pi]);
                                                    ++cfg['article-count'];
                                                    if (articleData.length >= cfg['num']) break;
                                                }
                                                return getArticleEnd(cfg, articleData);
                                            }
                                        });
                                    }
                                }
                            }
                        })
                    }
                }
                return;
            }
            retData = returnData.data;
            for (rdi = retData.length - 1; rdi >= 0; --rdi) {
                articleData.push(retData[rdi]);
                ++cfg['article-count'];
            }
            return getArticleEnd(cfg, articleData);
        }
    });
}

function getArticleEnd(cfg, articleData) {
    aside = document.getElementById('aside');
    aside.innerText += "article size: " + articleData.length + "\n";
    fillSection(cfg, articleData);
    $('#section').css('visibility', 'visible');
}

function fillSection(cfg, articleData) {
    num = cfg['num'];
    articleCount = cfg['article-count'];
    for (i = 0; i < num; ++i) {
        index = i + 1;
        article = $('#article' + index);
        if (i < articleCount) {
            data = articleData[i];
            fillArticlePage(article, data);
            continue;
        }
        $('#article-li' + index).hide();
    }
}

function parseTimeToNow(timeStr) {
    parseDate = new Date(timeStr);
    diff = Date.now() - parseDate.getTime();
    if (diff < 60000) return 'seconds ago';
    if (diff < 3600000) {
        unit = Math.floor(diff / 60000);
        if (unit < 2) {
            return 'a minute ago';
        }
        return '' + unit + ' minutes ago';
    }
    unit = Math.floor(diff / 3600000);
    if (unit < 2) {
        return 'an hour ago';
    }
    return '' + unit + ' hours ago';
}

function fillArticlePage(article, articleData) {
    dataBody = articleData['body'].split("\r\n");
    if (dataBody.length < 2) {
        article.find("#title").text(dataBody[0]);
    } else if (dataBody.length < 3) {
        title = article.find("#title");
        title.text(dataBody[0]);
        url = dataBody[1];
        title.attr('href', url);
        article.find('#site').text(extractDomain(url));
    }
    article.find("#post-time").text(parseTimeToNow(data['updated_at']));
}

function extractDomain(url) {
    var domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }

    //find & remove port number
    domain = domain.split(':')[0];

    return domain;
}