(function(window, $) {
    var iFrameo = function() {

        var iframeConfigs = []

        this.register = function(id, src) {
            iframeConfigs.push({
                id: id,
                src: src,
                status: 'N' //N - no 未初始化, P - pending 加载中, Y - yes加载完成
            })
        }

        this.load = function(ids, loadCallback, allLoadedCallback) {
            if (!$.isArray(ids)) {
                ids = [ids]
            }

            var frameCount = ids.length
            var callbackCount = 0
            $.each(ids, function(idx, id) {
                var cfg = _getConfig(id)

                if (!cfg) {
                    console.log("找不到对应的iFrame: " + id)
                    return
                }

                if (loadCallback) {
                    $("#" + cfg.id).load(function() {
                        cfg.status = 'Y'
                        var me = this
                        var iframeItem = _buildIFrameItem(cfg.id)
                        iframeItem.iWindow.broadcast = function(name, params) {
                            broadcast.call(me, name, params, iframeItem)
                        }
                        loadCallback.call(me, iframeItem)

                        callbackCount++

                        //所有iFrame加载完成之后, 进行全局回调
                        if (callbackCount === frameCount && allLoadedCallback) {
                            allLoadedCallback.call($("#" + ids.join(",#")))
                        }
                    })
                }

                $("#" + cfg.id).attr("src", cfg.src)
            })
        }

        this.catch = function(ids, catchCallback) {
            if (!$.isArray(ids)) {
                ids = [ids]
            }

            var iframes = {}

            var result = true;
            $.each(ids, function(idx, id) {
                var cfg = _getConfig(id)

                if (!cfg) {
                    console.log("找不到对应的iFrame: " + id)
                    result = false
                    return false
                }

                if (cfg.status !== 'Y') {
                    console.log("对应的iFrame尚未加载: " + id)
                    result = false
                    return false
                }


                var $ifr = $("#" + cfg.id)

                iframes[id] = _buildIFrameItem(id)
            })

            if (result && catchCallback) {
                catchCallback.call($("#" + ids.join(",#")), iframes)
            }
        }

        function _buildIFrameItem(id) {
            var $ifr = $("#" + id)

            return {
                original: $ifr[0],
                iWindow: _getWindow($ifr[0]),
                iDocument: _getDocument($ifr[0])
            }
        }

        function _getDocument(iframe) {
            return iframe.contentDocument
        }

        function _getWindow(iframe) {
            return iframe.contentWindow
        }

        function _getConfig(iFrameName) {
            var result

            $.each(iframeConfigs, function(index, iframe) {
                if (iframe.id === iFrameName) {
                    result = iframe
                    return false
                }
            })

            return result
        }

        var reveivers = []
        this.receive = function(name, processor) {
            reveivers.push(_buildReceiver(name, processor))
        }


        function broadcast(name, params, iframeItem) {
            var receiver = _getReceiver(name)

            if (!receiver) {
                console.log("广播没有被任何接收器收听: " + name)
                return
            }

            receiver.processor.call(this, params, iframeItem)
        }

        function _buildReceiver(name, processor) {
            return {
                name: name,
                processor: processor
            }
        }


        function _getReceiver(name) {
            var result

            $.each(reveivers, function(index, receiver) {
                if (receiver.name === name) {
                    result = receiver
                    return false
                }
            })

            return result
        }

    }

    window.iFrameo = iFrameo

})(window, jQuery)