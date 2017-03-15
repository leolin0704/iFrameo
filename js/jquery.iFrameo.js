(function(window, $) {
    var iFrameo = function() {

        var iframeConfigs = []

        this.register = function(id, src) {

            iframeConfigs.forEach(function(cfg, index) {
                if (cfg.id === id) {
                    $("#" + cfg.id).removeAttr("src")
                    iframeConfigs.splice(index, 1)
                    return false
                }
            }, this);

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

                var $current = $("#" + cfg.id)
                $current.attr("src", cfg.src)
                if (loadCallback) {
                    $current.load(function() {
                        cfg.status = 'Y'
                        var me = this
                        var iframeItem = _buildIFrameItem(cfg.id)
                        iframeItem.iWindow.receive = function(name, params) {
                            receive(name, params)
                        }

                        iframeItem.iWindow.yelling = function(name, params) {
                            yelling.call(me, name, params, window.frames[cfg.id])
                        }

                        loadCallback.call(me, iframeItem)

                        callbackCount++

                        //所有iFrame加载完成之后, 进行全局回调
                        if (callbackCount === frameCount && allLoadedCallback) {
                            allLoadedCallback.call($("#" + ids.join(",#")))
                        }
                    })
                }
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

        var listeners = []
        this.listen = function(name, processor) {
            listeners.push(_buildListener(name, processor))
        }

        function yelling(name, params, iframeItem) {
            var listener = _getListener(name)

            if (!listener) {
                console.log("叫喊没有被听到: " + name)
                return
            }

            listener.processor.call(this, params, iframeItem)
        }

        function _buildListener(name, processor) {
            return {
                name: name,
                processor: processor
            }
        }


        function _getListener(name) {
            var result

            $.each(listeners, function(index, listener) {
                if (listener.name === name) {
                    result = listener
                    return false
                }
            })

            return result
        }


        var receivers = []
        this.broadcast = function(name, params, targetIFrame) {
            var receivers = _getReceivers(name, targetIFrame)

            if (!receivers) {
                console.log("广播没有被任何接收器收听: " + name)
                return
            }

            receivers.forEach(function(processor) {
                processor(params)
            }, this);
        }

        function _getReceivers(name, targetIFrame) {
            var result = []

            if (targetIFrame) {
                var iframeItem
                if (typeof(targetIFrame) === "string") {
                    iframeItem = _buildIFrameItem(targetIFrame)
                } else if (targetIFrame.iWindow) {
                    iframeItem = targetIFrame
                } else if (_getWindow(targetIFrame)) {
                    iframeItem = {
                        original: targetIFrame,
                        iWindow: _getWindow(targetIFrame),
                        iDocument: _getDocument(targetIFrame)
                    }
                }

                if (iframeItem && iframeItem.iWindow.receivers && iframeItem.iWindow.receivers[name]) {
                    result.push(iframeItem.iWindow.receivers[name])
                }
            } else {
                $.each(iframeConfigs, function(index, cfg) {
                    var iframeItem = _buildIFrameItem(cfg.id)

                    if (iframeItem.iWindow.receivers && iframeItem.iWindow.receivers[name]) {
                        result.push(iframeItem.iWindow.receivers[name])
                    }
                })
            }

            return result
        }

    }

    window.iFrameo = iFrameo

})(window, jQuery)