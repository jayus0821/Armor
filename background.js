'use strict'
var keyflag = 0; //是否提示有跨域的jsonp请求
var switchon = 1; //是否开启蜜罐
chrome.storage.sync.set({ keyflag: 0, switchon: 1 });
const manifest = chrome.runtime.getManifest();
var honeypotUrlCache = {};
var http = {};
var ruleStr = `
{
    "默安幻阵": [
      {
        "filename": "record.js",
        "content": "document[__Ox3f21b[0xd]](__Ox3f21b"
      }
    ],
    "HFish": [
      {
        "filename": "x.js",
        "content": "sec_key"
      }
    ]
}
`
var rule = JSON.parse(ruleStr);
const {
    version
} = manifest;


// 给数组添加push2方法，用于向数组push不重复的数据
Array.prototype.push2 = function() {
    for (var i = 0; i < arguments.length; i++) {
        var ele = arguments[i];
        if (this.indexOf(ele) == -1) {
            this.push(ele);
        }
    }
};

// 规则匹配,匹配成功将数据放入缓存
function checkForRule(url, content) {
    for (var item in rule) {
        for (var r1 in rule[item]) {
            if (rule[item][r1]["filename"] === '{{honeypotAny}}' && content.indexOf(rule[item][r1]["content"]) != -1) {
                honeypotUrlCache[url] = item;
                return
            } else if (url.indexOf(rule[item][r1]["filename"]) != -1) {
                if (rule[item][r1]["content"] === '{{honeypotAny}}') {
                    honeypotUrlCache[url] = item;
                    return
                } else if (content.indexOf(rule[item][r1]["content"]) != -1) {
                    honeypotUrlCache[url] = item;
                    return
                }
            }
        }
    }
}


// 传入 URL 检查是否为蜜罐
function checkHoneypot(url) {

    console.log("[Honeypot] check url:" + url)
    let status = false

    // 判断是否在历史检测出来中的缓存中存在
    //console.log(honeypotUrlCache)
    if (honeypotUrlCache.hasOwnProperty(url)) {
        status = true
    } else {
        // 不存在就进行请求，然后解析内容用规则去匹配
        $.ajax({
            type: "get",
            async: false,
            url: url,
            success: function(data) {
                checkForRule(url, data)
                console.log("[Honeypot] checkForRule over.")
            }
        });
    }

    // 再次从缓存中检查
    if (honeypotUrlCache.hasOwnProperty(url)) {
        status = true
    }

    return status
}

var count = 0
    //每次请求前触发，可以拿到 requestBody 数据，同时可以对本次请求作出干预修改
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        chrome.storage.sync.get('keyflag', (res) => {
            keyflag = res.keyflag;
        });
        chrome.storage.sync.get('switchon', (res) => {
            switchon = res.switchon;
        });
        console.log(switchon, keyflag);
        if (switchon == 0) {
            return;
        }
        // console.log(details);
        if (details.type == 'script') { //
            if (checkHoneypot(details.url)) {
                new Notification("当前为" + honeypotUrlCache[details.url] + "蜜罐,快跑,当前蜜罐脚本已屏蔽!");
                return { cancel: true };
            }
        }

        //url:当前的url；initiator：浏览器状态栏里的domain
        let {
            url,
            initiator
        } = details;
        // console.log(url, initiator); //http://mbd.baidu.com/newspage/api/getusername?cb=jQuery15204197566477288597_1623140159838&_=1623140160171 http://103.43.19.111

        //如果发起者为空，直接赋值url
        if (initiator == "undefined" || initiator == "null" || typeof(initiator) == "undefined") {
            initiator = url;
        }
        const protocal = url.split("://")[0];

        //根据url返回域名和对应的path
        function GetHostAndPath(url) {
            var arrUrl = url.split("//"); //  http://mbd.baidu.com/newspage/api/getusername?cb=jQuery15204197566477288597_1623140159838&_=1623140160171
            var start = arrUrl[1].indexOf("/");
            var host = arrUrl[1].substring(0, start);
            var path = arrUrl[1].substring(start); //stop省略，截取从start开始到结尾的所有字符

            var result = new Array(host, path);
            return result
        }
        //根据url获取主域名
        function get_domain(url) { //http://103.43.19.111
            var domain = url.split("://")[1];
            if (domain.includes('/')) {
                domain = domain.split('/')[0];
            }
            // var re_domain = /([a-zA-Z0-9-]+)(.com\b|.net\b|.edu\b|.miz\b|.biz\b|.cn\b|.cc\b|.org\b){1,}/g;
            // domain = url.match(re_domain);
            return domain;

        }
        //判断host是否在黑名单内
        function inBlackList(host) {
            //黑名单host来自长亭D-sensor的溯源api，共47个
            const BlackList = ["account.itpub.net", "accounts.ctrip.com", "ajax.58pic.com", "api.csdn.net", "api.ip.sb", "api.passport.pptv.com", "bbs.zhibo8.cc", "bit.ly", "blog.csdn.net", "blog.itpub.net", "c.v.qq.com", "chinaunix.net", "cmstool.youku.com", "comment.api.163.com", "databack.dangdang.com", "dimg01.c-ctrip.com", "down2.uc.cn", "github.com", "hd.huya.com", "home.51cto.com", "home.ctfile.com", "home.zhibo8.cc", "hudong.vip.youku.com", "i.jrj.com.cn", "iask.sina.com.cn", "itunes.apple.com", "m.ctrip.com", "m.game.weibo.cn", "mapp.jrj.com.cn", "my.zol.com.cn", "passport.ctrip.com", "passport.game.renren.com", "passport.iqiyi.com", "playbill.api.mgtv.com", "renren.com", "skylink.io", "u.faloo.com", "ucenter.51cto.com", "v.huya.com", "v2.sohu.com", "vote2.pptv.com", "wap.sogou.com", "webapi.ctfile.com", "weibo.com", "www.58pic.com", "www.iqiyi.com", "www.iteye.com", "www.zbj.com", "www.cndns.com", "mozilla.github.io", "www.sitestar.cn", "api.fastadmin.net", "m.site.baidu.com", "restapi.amap.com", "login.sina.com.cn", "now.qq.com", "message.dangdang.com", "musicapi.taihe.com", "api-live.iqiyi.com", "api.m.jd.com", "tie.163.com", "pcw-api.iqiyi.com", "so.v.ifeng.com", "passport.baidu.com", "wz.cnblogs.com", "passport.cnblogs.com", "hzs14.cnzz.com", "mths.be", "validity.thatscaptaintoyou.com", "stc.iqiyipic.com", "s14.cnzz.com", "sb.scorecardresearch.com", "js.cndns.com", "datax.baidu.com", "assets.growingio.com", "www.gnu.org", "wappassalltest.baidu.com", "baike.baidu.com", "ka.sina.com.cn", "p.qiao.baidu.com", "map.baidu.com", "www.dangdang.com", "g.alicdn.com", "s.faloo.com", "msg.qy.net", "morn.cndns.com", "i.qr.weibo.cn", "github.comgithub.com", "uis.i.sohu.com", "www.tianya.cn", "passport.mop.com", "commapi.dangdang.com", "comment.money.163.com", "chaxun.1616.net", "tieba.baidu.com", "remind.hupu.com", "service.bilibili.com", "node.video.qq.com", "api.weibo.com", "www.jiyoujia.com", "mbd.baidu.com", "wapsite.baidu.com", "zhifu.baidu.com", "m.iask.sina.com.cn", "mooc1-1.chaoxing.co", "myjr.suning.com", "mooc1-1.chaoxing.com", "my.zol.com.cn", "passport.tianya.cn", "account.cnblogs.com", "passport2.chaoxing.com", "zhifu.duxiaoman.com"];
            for (const BlackSite of BlackList) {
                if (host == BlackSite) {
                    return true
                }
            }
            return false
        }

        var mainDomain = get_domain(initiator); //发起者的主域名
        var targetHost = GetHostAndPath(url)[0]; //跨域或本域访问的目标主机
        var targetPath = GetHostAndPath(url)[1]; //跨域或本域访问的目标路径
        console.log(mainDomain, targetHost, targetPath);

        const WhiteList = ['www.baidu.com', 'www.qq.com', 'www.csdn.net', 'www.weibo.com', 'www.cnblogs.com', 'www.aliyun.com', 'www.ctrip.com', 'www.weibo.cn', 'www.iqiyi.com', 'www.163.com', 'www.126.com', 'www.51cto.com', 'www.taobao.com', 'www.sogou.com', 'www.iteye.com', 'www.58.com', 'www.google.com', 'www.fofa.so', 'www.jd.com', 'www.tmall.com', 'www.github.io', 'www.github.com', 'www.sina.com.cn', 'www.mi.com', 'www.zhihu.com', 'quake.360.cn', 'www.bilibili.com', 'www.csdn.com'] //白名单
        for (var WhiteSite of WhiteList) {
            if (mainDomain == WhiteSite) {
                console.log('命中白名单' + mainDomain); // 访问这些网站时退出
                return;
            }
        }

        let redirectUrl;
        let cancel;

        if (mainDomain == targetHost) { //如果相等表示正常域内访问
            return;
        } else { //如果不相等，可能是跨域访问，需要继续判断
            let flag = 0;
            const blockQueryStringList = ['callback', 'jsonp', 'javascript', 'cb=', 'xxoo']; //如果url中存在这些字段，说名可能时jsonp请求，归类为可疑请求，进行拦截
            // `默安蜜罐特征：xxoo=chrome-extension`
            if (protocal == 'http' || protocal == 'https') {
                if (inBlackList(targetHost)) {
                    // 黑名单拦截
                    count += 1;
                    flag = 1;
                    new Notification('拦截黑名单' + count + '次：' + targetHost + '\n建议立即关闭页面 => ' + mainDomain);
                    console.log('拦截黑名单' + count + '次：' + targetHost + '\n建议立即关闭页面 => ' + mainDomain);
                } else {
                    for (const q of blockQueryStringList) {
                        if (q && targetPath.includes(q)) {
                            redirectUrl = 'data:text/javascript;charset=UTF-8;base64,' + btoa(`;`); //拦截
                            new Notification('拦截可疑溯源请求：' + targetHost + targetPath + '\n建议立即关闭页面 => ' + mainDomain);
                            console.log('拦截可疑溯源请求：' + targetHost + targetPath + '\n建议立即关闭页面 => ' + mainDomain);
                            flag = 1;
                        }
                    }
                }
                if (keyflag == 1) {
                    if (flag == 0) { //黑名单不一定全，如果callback关键字匹配也失效的话，就可能拦截失败，通过提示存在所有jsonp跨域请求，让用户自己来判断
                        const jsonp_WhiteList = [".css", ".js", ".png", ".jpg", ".gif", "api.map.baidu.com", "miao.baidu.com", "img", "imges"] //path中含有这些字符串的被划分为正常的jsonp请求//会比较多
                        let flag2 = 1;
                        for (const q of jsonp_WhiteList) {
                            let request_url = targetHost + targetPath;
                            if (request_url.includes(q)) {
                                flag2 = 0;
                            }
                        }
                        if (flag2 == 1) {
                            new Notification('存在跨域jsonp:\n' + targetHost + targetPath);
                            console.log('存在跨域jsonp:\n' + targetHost + targetPath);
                        }

                    }
                }


            }
        }

        if (cancel) return {
            cancel
        };
        else if (redirectUrl) return {
            redirectUrl
        }
        else return {};
    }, {
        urls: ["<all_urls>"]
    }, ["blocking"]
);