(function () {
  BOOMR = window.BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  if (BOOMR.plugins.spa_xhr_navigation) {
    return;
  }

  var impl = {
    initialized: false,
    navigationPath: function () {
      return null;
    },
    disableHardNav: false,
    a: null, //an anchor element to resolve paths
    onXhrSend: function (xhr_info) {
      var resultPath = this.navigationPath(xhr_info);
      if (resultPath) {
        this.a.href = resultPath;
        var resolvedPath = this.a.href;
        BOOMR.plugins.SPA.route_change();
        BOOMR.addVar("pgu", resolvedPath);
      }
    },
  };

  // Instrumentation based on the AutoXHR Plugin
  var initInstrumentation = function () {
    var original_XHR = XMLHttpRequest;
    var instr_XMLHttpRequest = function () {
      var xhr_info = {};
      var xhr_header_calls = [];
      var open_args;

      req = new original_XHR();

      orig_open = req.open;
      orig_setRequestHeader = req.setRequestHeader;
      orig_send = req.send;

      req.setRequestHeader = function () {
        xhr_header_calls.push(arguments);
      };

      req.open = function (method, url, async) {
        xhr_info.method = method;
        xhr_info.url = url;
        xhr_info.async = !!async;
        open_args = arguments;
        //we delay the open-call to make sure it happens after the navigation
      };

      req.send = function (data) {
        xhr_info.body = data;
        impl.onXhrSend(xhr_info);
        orig_open.apply(this, open_args);
        for (var i = 0; i < xhr_header_calls.length; i++) {
          orig_setRequestHeader.apply(this, xhr_header_calls[i]);
        }
        orig_send.apply(this, arguments);
      };

      return req;
    };

    instr_XMLHttpRequest.UNSENT = 0;
    instr_XMLHttpRequest.OPENED = 1;
    instr_XMLHttpRequest.HEADERS_RECEIVED = 2;
    instr_XMLHttpRequest.LOADING = 3;
    instr_XMLHttpRequest.DONE = 4;
    instr_XMLHttpRequest.prototype = XMLHttpRequest.prototype;
    window.XMLHttpRequest = instr_XMLHttpRequest;
  };

  BOOMR.plugins.spa_xhr_navigation = {
    /**
     * Initializes the plugin.
     *
     * @param {object} config Configuration
     * @param {function} [config.spa_xhr_navigation.navigationPath]
     *
     * @returns {@link BOOMR.plugins.spa_xhr_navigation} The spa_xhr_navigation plugin for chaining
     * @memberof BOOMR.plugins.spa_xhr_navigation
     */
    init: function (config) {
      if (impl.initialized) {
        return this;
      }

      BOOMR.utils.pluginConfig(impl, config, "spa_xhr_navigation", [
        "navigationPath",
        "disableHardNav",
      ]);

      impl.a = document.createElement("a"); //used to resolve paths to URLs
      initInstrumentation();

      BOOMR.plugins.SPA.register("XHR_NAVIGATION");
      BOOMR.plugins.SPA.hook(BOOMR.hasBrowserOnloadFired(), {});

      if (!BOOMR.hasBrowserOnloadFired() && !impl.disableHardNav) {
        BOOMR.plugins.SPA.route_change();
      }

      return this;
    },

    is_complete: function () {
      return true;
    },
  };
})();
