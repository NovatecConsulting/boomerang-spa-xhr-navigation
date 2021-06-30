(function () {
  BOOMR = window.BOOMR || {};
  BOOMR.plugins = BOOMR.plugins || {};

  if (BOOMR.plugins.spa_xhr_navigation) {
    return;
  }

  var impl = {
    /** Fields */

    /** Whether the plugin has been initialized */
    initialized: false,
    /** an anchor element to resolve paths */
    a: null,
    /** the current path/virtual site */
    currentVirtualSiteUrl: null,

    /** DEFAULT SETTINGS */

    /**
     * @deprecated - use onXhr instead.
     * Callback for generating a virtual site based on XHR.
     * The result of this function will be used as path the new site url.
     */
    navigationPath: null,
    /**
     * Callback for generating a virtual site based on XHR.
     * The result of this function will be used as path the new site url.
     * This function will only be used in case `useXhrNavigation` is true.
     */
    onXhr: function () {
      return null;
    },
    /** Disable sending beacons for the initial page load. */
    disableHardNav: false,
    /**
     * Whether virtual sites should be used. In case this is true, the virtual sites are persisted
     * and all beacons are modified, so they'll use the virtual site in the `u` and `pgu` field.
     */
    useVirtualSites: false,
    /** Whether XHR navigation should trigger virtual sites. */
    useXhrNavigation: true,

    /**
     * Function which is executed when any XHR request is executed.
     *
     * @param {*} xhr_info - Information about the XHR which has been sent
     */
    onXhrSend: function (xhr_info) {
      var resultPath;
      if (this.navigationPath) {
        resultPath = this.navigationPath(xhr_info);
      } else {
        resultPath = this.onXhr(xhr_info);
      }

      if (resultPath) {
        this.a.href = resultPath;
        const virtualSiteUrl = this.a.href;
        BOOMR.plugins.SPA.route_change();

        if (this.useVirtualSites) {
          this.currentVirtualSiteUrl = virtualSiteUrl;
        } else {
          BOOMR.addVar("pgu", virtualSiteUrl);
        }
      }
    },
  };

  /**
   * Instrument the XMLHttpRequest so that requests will trigger a virtual site navigation.
   */
  const instrumentXhr = function () {
    const original_XHR = XMLHttpRequest;

    const instr_XMLHttpRequest = function () {
      var xhr_info = {
        header: {},
      };

      req = new original_XHR();

      orig_open = req.open;
      orig_setRequestHeader = req.setRequestHeader;
      orig_send = req.send;

      req.setRequestHeader = function (header, value) {
        xhr_info.header[header] = value;

        orig_setRequestHeader.apply(this, arguments);
      };

      req.open = function (method, url, async, user) {
        xhr_info.method = method;
        xhr_info.url = url;
        xhr_info.async = !!async;
        xhr_info.user = user;

        orig_open.apply(this, arguments);
      };

      req.send = function (body) {
        xhr_info.body = body;
        impl.onXhrSend(xhr_info);

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

  /**
   * Instruments Boomerang's sendBeaconData function so that the current site is injected
   * into the beacon's `u` and `pgu` fields.
   */
  const instrumentBoomerang = function () {
    const original_sendBeaconData = BOOMR.sendBeaconData;

    const instr_sendBeaconData = function (data) {
      console.log("send data", data);
      const url = BOOMR.window.document.URL;

      // in case virtual sites are enabled and a vsite exists
      if (impl.useVirtualSites && impl.currentVirtualSiteUrl) {
        // pgu should contain the site url for async requests
        if (data.pgu) {
          if (data.pgu === url) {
            data.pgu = impl.currentVirtualSiteUrl;
          }
        } else {
          if (data.u === url) {
            data.u = impl.currentVirtualSiteUrl;
          }
        }
      }

      original_sendBeaconData.apply(this, [data]);
    };

    BOOMR.sendBeaconData = instr_sendBeaconData;
  };

  // Initialize insturmentation
  const initInstrumentation = function () {
    if (impl.useXhrNavigation) {
      instrumentXhr();
    }

    if (impl.useVirtualSites) {
      instrumentBoomerang();
    }
  };

  /**
   * The plugin itself.
   */
  BOOMR.plugins.spa_xhr_navigation = {
    /**
     * Initializes the plugin.
     *
     * @param {object} config Configuration
     * @returns {@link BOOMR.plugins.spa_xhr_navigation} The spa_xhr_navigation plugin for chaining
     */
    init: function (config) {
      if (impl.initialized) {
        return this;
      }

      BOOMR.utils.pluginConfig(impl, config, "spa_xhr_navigation", [
        "onXhr",
        "navigationPath",
        "disableHardNav",
        "useXhrNavigation",
        "useVirtualSites",
      ]);

      if (impl.navigationPath) {
        console.warn(
          "The 'navigationPath' function is configured for the SPA_XHR_NAVIGATION plugin, but this is is deprecated. Please replace it with 'onXhr'."
        );
      }

      impl.a = document.createElement("a"); // used to resolve paths to URLs
      initInstrumentation();

      BOOMR.plugins.SPA.register("XHR_NAVIGATION");
      BOOMR.plugins.SPA.hook(BOOMR.hasBrowserOnloadFired(), {});

      if (!BOOMR.hasBrowserOnloadFired() && !impl.disableHardNav) {
        BOOMR.plugins.SPA.route_change();
      }

      return this;
    },

    /**
     * Sets the currently used virtual site. The given path is resolved to the current host.
     *
     * @param {*} vSitePath - the path of the virtual site
     */
    setVirtualSite: function (vSitePath) {
      impl.a.href = vSitePath;
      impl.currentVirtualSiteUrl = impl.a.href;
    },

    /**
     * This plugin is always complete (ready to send a beacon).
     */
    is_complete: function () {
      return true;
    },
  };
})();
