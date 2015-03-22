/**
* Wikiplus
* Author:+Eridanus Sora/@妹空酱
* Github:https://github.com/Last-Order/Wikiplus
*/
/**
* 依赖组件 jQuery.ajaxq
*/
// AjaxQ jQuery Plugin
// Copyright (c) 2012 Foliotek Inc.
// MIT License
// https://github.com/Foliotek/ajaxq

(function($) {

    var queues = {};

    // Register an $.ajaxq function, which follows the $.ajax interface, but allows a queue name which will force only one request per queue to fire.
    $.ajaxq = function(qname, opts) {

        if (typeof opts === "undefined") {
            throw ("AjaxQ: queue name is not provided");
        }

        // Will return a Deferred promise object extended with success/error/callback, so that this function matches the interface of $.ajax
        var deferred = $.Deferred(),
            promise = deferred.promise();

        promise.success = promise.done;
        promise.error = promise.fail;
        promise.complete = promise.always;

        // Create a deep copy of the arguments, and enqueue this request.
        var clonedOptions = $.extend(true, {}, opts);
        enqueue(function() {

            // Send off the ajax request now that the item has been removed from the queue
            var jqXHR = $.ajax.apply(window, [clonedOptions]).always(dequeue);

            // Notify the returned deferred object with the correct context when the jqXHR is done or fails
            // Note that 'always' will automatically be fired once one of these are called: http://api.jquery.com/category/deferred-object/.
            jqXHR.done(function() {
                deferred.resolve.apply(this, arguments);
            });
            jqXHR.fail(function() {
                deferred.reject.apply(this, arguments);
            });
        });

        return promise;

        // If there is no queue, create an empty one and instantly process this item.
        // Otherwise, just add this item onto it for later processing.
        function enqueue(cb) {
            if (!queues[qname]) {
                queues[qname] = [];
                cb();
            }
            else {
                queues[qname].push(cb);
            }
        }

        // Remove the next callback from the queue and fire it off.
        // If the queue was empty (this was the last item), delete it from memory so the next one can be instantly processed.
        function dequeue() {
            if (!queues[qname]) {
                return;
            }
            var nextCallback = queues[qname].shift();
            if (nextCallback) {
                nextCallback();
            }
            else {
                delete queues[qname];
            }
        }
    };

    // Register a $.postq and $.getq method to provide shortcuts for $.get and $.post
    // Copied from jQuery source to make sure the functions share the same defaults as $.get and $.post.
    $.each( [ "getq", "postq" ], function( i, method ) {
        $[ method ] = function( qname, url, data, callback, type ) {

            if ( $.isFunction( data ) ) {
                type = type || callback;
                callback = data;
                data = undefined;
            }

            return $.ajaxq(qname, {
                type: method === "postq" ? "post" : "get",
                url: url,
                data: data,
                success: callback,
                dataType: type
            });
        };
    });

    var isQueueRunning = function(qname) {
        return queues.hasOwnProperty(qname);
    };

    var isAnyQueueRunning = function() {
        for (var i in queues) {
            if (isQueueRunning(i)) return true;
        }
        return false;
    };

    $.ajaxq.isRunning = function(qname) {
        if (qname) return isQueueRunning(qname);
        else return isAnyQueueRunning();
    };
    
    $.ajaxq.clear = function(qname) {
        if (!qname) {
            for (var i in queues) {
                if (queues.hasOwnProperty(i)) {
                    delete queues[i];
                }
            }
        }
        else {
            if (queues[qname]) {
                delete queues[qname];
            }
        }
    };
    
})(jQuery);


/**
* 依赖组件:MoeNotification
* https://github.com/Last-Order/MoeNotification
*/
function MoeNotification(undefined){
    var self = this;
    this.display = function(text,type,callback){
        console.log('New Notification:' + text);
        var _callback = callback || function(){};
        var _text = text  || '喵~';
        var _type = type || 'success';
        $("#MoeNotification").append(
            $("<div>").addClass('MoeNotification-notice')
                      .addClass('MoeNotification-notice-' + _type)
                      .append('<span>' + _text + '</span>')
                      .fadeIn(300)
        );
        self.bind();
        self.clear();
        _callback($("#MoeNotification").find('.MoeNotification-notice').last());
    }
    this.create = {
        success : function(text,callback){
            var _callback = callback || function(){};
            self.display(text,'success',_callback);
        },
        warning : function(text,callback){
            var _callback = callback || function(){};
            self.display(text,'warning',_callback);
        },
        error : function(text,callback){
            var _callback = callback || function(){};
            self.display(text,'error',_callback);
        }
    };
    this.clear = function(){
        if ($(".MoeNotification-notice").length>=10){
            //self.slideLeft($(".MoeNotification-notice").first());
            $("#MoeNotification").children().first().fadeOut(150,function(){
                $(this).remove();
            });
            setTimeout(self.clear,300);
        }
        else{
            return false;
        }
    }
    this.bind = function(){
        $(".MoeNotification-notice").mouseover(function(){
            self.slideLeft($(this));
        });
    }
    window.slideLeft = this.slideLeft = function(object,speed){
        object.css('position','relative');
        object.animate({
            left: "-200%",
            },
            speed || 150, function() {
                $(this).fadeOut('fast',function(){
                    $(this).remove();
                });
        });
    }
    this.init = function(){
        $("body").append('<div id="MoeNotification"></div>');
    }
    if (!$("#MoeNotification").length>0){
        this.init();
    }
}

//Wikiplus 主程序
$(function(){
    //包裹于函数避免污染全局

    //功能性函数定义开始

    //抛出格式化异常
    //Params : (int) number, (string) message
    function throwError(number,message){
        var e = new Error();
        e.number = number;
        e.message = message || '未知错误';
        console.log('%c错误[' + e.number + ':' + e.message + ']抛出','color:red');
        throw e;
    }

    //检测值是否在数组中 
    //Params : (string) value, (array) array
    //Returns : (boolean) True/False
    window.inArray = inArray = function(value,array){
        if ($.inArray(value,array) === -1){
            return false;
        }
        else{
            return true;
        }
    }
    //功能性函数定义结束

    //Wikipage类构造函数
    Wikipage = function(page){
        var self = this;
        console.log('正在构建页面类');
        //可用性检测与权限检测
        if (!wgEnableAPI||!wgEnableWriteAPI){
            throwError(1002,'本Wiki未开启可用的API');
            return;
        }
        if (!inArray('autoconfirmed',wgUserGroups)){
            throwError(1001,'非自动确认用户');
            return;
        }
        //从MediaWiki定义的全局变量中获得信息
        this.pageName  = page || wgPageName;
        this.pageName  = this.pageName.replace(/ /ig,'_');
        this.revision  = wgRevisionId;
        this.articleId = wgArticleId;
        this.API       = 'http://' + location.host + wgScriptPath + '/api.php';
        console.log('正在获得页面基础信息');
        //从API获得编辑令牌和起始时间戳
        $.ajaxq("Main",{
            type:"GET",
            dataType:"json",
            url:self.API,
            data:{
                'action' : 'query',
                'prop'   : 'revisions|info',
                'titles' : self.pageName,
                'rvprop' : 'timestamp',
                'intoken': 'edit',
                'format' : 'json'
            },
            beforeSend : function(){
                console.time('获得页面基础信息耗时');
            },
            success:function(data){
                if (data && data.query && data.query.pages){
                    var info = data.query.pages;
                    for (key in info){
                        if (key != '-1'){
                            if (info[key].revisions && info[key].revisions.length>0){
                                self.timeStamp = info[key].revisions[0].timestamp;
                            }
                            else{
                                throwError(1004,'无法获得页面时间戳');
                                return false;
                            }
                            if (info[key].edittoken){
                                if (info[key].edittoken != '+\\'){
                                    self.editToken = info[key].edittoken;
                                }
                                else{
                                    throwError(1005,'无法获得页面编辑令牌 请确认登录状态');
                                    return false;
                                }
                            }
                        }
                        else{
                            throwError(1003,'无法获得页面基础信息，请检查页面是否存在');
                        }
                    }
                }
                console.timeEnd('获得页面基础信息耗时');
            }
        });
    }
    
    //通用编辑
    Wikipage.prototype.edit = function(content,config,callback){
        var self = this;
        data = config || {};
        callback = callback || new Function();
        //准备提交数据
        data.action        = 'edit';
        data.format        = 'json';
        data.text          = content;
        data.title         = this.pageName;
        data.token         = this.editToken;
        data.basetimestamp = this.timeStamp;
        console.log(self);
        $.ajaxq("Main",{
            type:"POST",
            url:self.API,
            data:$.extend(data,config), //将自定义设置覆盖到默认设置
            success:function(data){
                if (data && data.edit){
                    //分辨返回数据
                    if (data.edit.result && data.edit.result == 'Success'){
                        //编辑成功
                        callback();
                    }
                    else{
                    }
                }
                else if (data && data.error){
                    switch(data.error.code){
                        case 'notitle' : throwError(1006,'无法编辑空标题页面');break;
                        case 'notext'  : throwError(1007,'未设置页面目标内容');break;
                        case 'notoken' : throwError(1008,'空的编辑令牌');break;
                        case 'invalidsection' : throwError(1009,'段落编号非法');break;
                        case 'protectedtitle' : throwError(1010,'无法被创建的标题');break;
                        case 'cantcreate' : throwError(1011,'没有新建页面权限');break;
                        case 'cantcreate-anon' : throwError(1012,'匿名用户无法新建页面');break;
                        case 'articleexists' : throwError(1013,'无法创建已经存在的页面');break;
                        case 'noimageredirect-anon' : throwError(1014,'匿名用户无法创建文件重定向');break;
                        case 'noimageredirect' : throwError(1015,'没有创建文件重定向的权限');break;
                        case 'spamdetected' : throwError(1016,'目标文本被SPAM过滤器拦截');break;
                        case 'filtered' : throwError(1017,'过滤器拦截了本次编辑');break;
                        case 'contenttoobig' : throwError(1018,'文本超过了最大字节限制');break;
                        case 'noedit-anon' : throwError(1019,'匿名用户无法编辑页面');break;
                        case 'noedit' : throwError(1020,'没有编辑页面的权限');break;
                        case 'pagedeleted' : throwError(1021,'在编辑的时间里，页面被删除');break;
                        case 'emptypage' : throwError(1022,'新页面不能为空内容');break;
                        case 'emptynewsection' : throwError(1023,'新段落不能为空内容');break;
                        case 'editconflict' : throwError(1024,'触发了编辑冲突');break;
                        case 'revwrongpage' : throwError(1025,'目标修订版本与目标页面不匹配');break;
                        case 'undofailure' : throwError(1026,'因为存在冲突的中间版本，无法撤销');break;
                        case 'missingtitle' : throwError(1027,'');break;
                        case 'mustbeposted' : throwError(1028,'必须使用POST方式提交编辑');break;
                        case 'readapidenied' : throwError(1029,'没有使用读取API的权限');break;
                        case 'writeapidenied' : throwError(1030,'您没有权限通过API编辑此页面');break;
                        case 'noapiwrite' : throwError(1031,'本Wiki未开启可用的写入API');break;
                        case 'badtoken' : throwError(1032,'非法的编辑令牌');break;
                        case 'missingparam' : throwError(1033,'页面名、页面ID必须有一项不为空值');break;
                        case 'invalidparammix' : throwError(1034,'页面名、页面ID不能同时使用');break;
                        case 'invalidtitle' : throwError(1035,'非法的标题');break;
                        case 'nosuchpageid' : throwError(1036,'不存在的页面ID');break;
                        case 'pagecannotexist' : throwError(1037,'该名称空间不允许创建一般页面');break;
                        case 'nosuchrevid' : throwError(1038,'不存在的修订编号');break;
                        case 'badmd5' : throwError(1039,'非法的MD5值');break;
                        case 'hookaborted' : throwError(1040,'编辑被扩展Hook拦截');break;
                        case 'parseerror' : throwError(1041,'无法解析所给的WikiText');break;
                        case 'summaryrequired' : throwError(1042,'编辑摘要不能为空');break;
                        case 'blocked' : throwError(1043,'您已经被封禁');break;
                        case 'ratelimited' : throwError(1044,'达到操作速率上限，请稍后再试');break;
                        case 'unknownerror' : throwError(1045,'未知错误');break;
                        case 'nosuchsection' : throwError(1046,'不存在的段落');break;
                        case 'sectionsnotsupported' : throwError(1047,'本页面不支持段落编辑');break;
                        case 'editnotsupported' : throwError(1048,'该页面无法通过API编辑');break;
                        case 'appendnotsupported' : throwError(1049,'该页面无法前后插入文本');break;
                        case 'redirect-appendonly' : throwError(1050,'在遵循重定向的情况下，只能进行前后插入或创建新段落');break;
                        case 'badformat' : throwError(1051,'错误的文本格式');break;
                        case 'customcssprotected' : throwError(1052,'无法编辑用户CSS页');break;
                        case 'customjsprotected' : throwError(1053,'无法编辑用户JS页');break;
                    }
                }
            }
        })
    }
    //Wikipage - editSection
    //编辑段落
    //Params : (string) content , (number) section , (function) callback
    Wikipage.prototype.editSection = function(content,section,callback){
        var self = this;
        var section = section || 0;
        var callback = callback || new Function();
        this.edit(content,{
            'section' : section
        },callback);
    }
    //Wikipage - getWikiText
    //获取页面的wiki文本
    //Params : (function) callback
    Wikipage.prototype.getWikiText = function(callback,config){
        var callback = callback || new Function();
        var url =  'http://' + location.host + wgScriptPath + '/index.php';
        var data = {
            'title' : this.pageName,
            'action' : 'raw'
        };
        $.ajaxq("Main",{
            url : url,
            type : "GET",
            dataType : "text",
            data : $.extend(data,config),
            beforeSend : function(){
                console.time('获得页面文本耗时');
            },
            success : function(data){
                if (data){
                    console.timeEnd('获得页面文本耗时');
                    callback(data);
                }
                else{
                    throwError(1054,'无法获得页面文本');
                }
            },
            error : function(e){
                throwError(1055,'无法获得页面文本(网络原因)');
            }
        })
    }
    //Wikipage - toString
    //显示类信息
    Wikipage.prototype.info = Wikipage.prototype.toString = function(){
        return '[Wikiplus - Wikipage]\r\n[页面名:' + this.pageName + ']';
    }



    //主界面显示及初始化
    var Wikiplus = function(){
        //再次包裹在函数内以优雅地安排变量作用域
        //这不是一个严格意义上的Class 但是有其一定特性
        var self = this;
        this.showNotice        = new MoeNotification();
        this.isBeta            = true;
        this.version           = '1.6';
        this.lastestUpdateDesc = '重构';
        this.validNameSpaces   = [0,1,2,3,4,8,10,11,12,14,274,614,8964];
        this.preloadData       = {};
        this.defaultSettings          = {
            '设置名' : '设置值',
            '设置参考' : 'http://zh.moegirl.org/User:%E5%A6%B9%E7%A9%BA%E9%85%B1/Wikiplus/%E8%AE%BE%E7%BD%AE%E8%AF%B4%E6%98%8E'
        };

        this.init = function(){
            console.log('Wikiplus' + self.version + '正在加载');
            a = new Wikipage();
            self.initBasicFunctions();
            self.initAdvancedFunctions();
        }
        this.initBasicFunctions = function(){
            //加载基础功能
        }
        this.initAdvancedFunctions = function(){
            //加载高级功能
        }
        this.init();
    }()
})