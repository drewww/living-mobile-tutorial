if (!$.cookie('user')) {
    //alert('undefined cookie');
    $.cookie('user', Math.random(), {
        expires: 10000
    });
}

var toq = (function () {
    return {
        keys: {},
        callbacks: {},
        http: {
            'abort': function () {}
        },
        parse: function (x) {
            var obj = undefined;
            if (x) {
                try {
                    obj = JSON.parse(x);
                } catch (err) {
                    obj = x;
                }
            }
            return obj;
        },
        subscribe: function (query, callback) {
            var k = query.split('=')[0];
            var v = query.split('=')[1];
            if (!v) v='';
            //do better checking?
            toq.keys[k] = v;
            toq.callbacks[k] = callback;
        },
        unsubscribe: function(room){
            delete toq.keys[room];
            delete toq.callbacks[room];
        },
        write: function (key, obj, fn) {
            var d = {};
            if (typeof obj == 'string') {
                d[key] = obj;
            } else {
                d[key] = JSON.stringify(obj);
            }
            if (typeof(fn)!="function"){
                fn = function(){};
            }
            
            $.ajax({
                url: '/db/',
                type:'POST',
                timeout: 10000,
                data: d,
                success: fn,
                dataType: 'json',
                error: function (req, status, e) {
                   //
                }
            });
            
        },
        connect: function () {
            toq.http.abort();
            clearTimeout(toq.timeout);
            if (toq.keys.length==0) return alert('add a room with toq.load(room,callback) before you call toq.update()');
            toq.http = $.ajax({
                url: '/db/',
                timeout: 50000,
                data: toq.keys,
                cache:false,
                success: function (docs) {
                    for (var i in docs) {
                        var doc = docs[i];
                        var obj = toq.parse(doc.data);
                        //do something about setting div ids?
                        if (doc.key in toq.callbacks) {
                            try {
                                toq.callbacks[doc.key](doc, obj);
                            } catch (error){
                                alert(error.message);
                            }
            }
                        if (doc.key in toq.keys) toq.keys[doc.key] = doc.rev + 1 +':';
                    }
                    toq.timeout = setTimeout(toq.update, 300);
                },
                dataType: 'json',
                error: function (req, status, e) {
                    toq.timeout = setTimeout(toq.update, 300);
                }
            });
        }
    };
})();

// connects to toqbot and gets the ID hash that represents this user. This 
// isn't actually used in any requests, but we keep it around in case clients
// need to access it. These hashes are how users are identified on the server
// and come from the random numbers that user's choose to identify themselves.
$.ajax({
    url: '/db/',
    timeout: 5000,
    success: function (info) {
        toq.user = info.user;
    },
    dataType: 'json',
    error: function (req, status, e) {
        toq.user = 'request failed';
    }
});