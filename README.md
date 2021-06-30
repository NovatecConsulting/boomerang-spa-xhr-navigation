# boomerang-spa-xhr-navigation

This Boomerang plugin enables SPA-Navigation detection based on XHR-Requests and introduces the concept of virtual sites.
It can therefore be used as an alternative to the History-Plugin when your SPA does not rewrite the URL.

The plugin must be executed **after the SPA and the AutoXHR** plugin!

You can then configure is as follows:
```
BOOMR.init({

    spa_xhr_navigation: {
        onXhr: function (xhrInfo) {
            if(xhrInfo.url.includes("example")) {
                return "/virtual_site"; // execute a virtual navigation to "/example"
            }
            return null; // no navigation
        },
        disableHardNav: false, // optional: disable sending beacons for the initial page load (Hard Navigation)
        useXhrNavigation: true, // optional: whether XHR navigation should trigger virtual sites.
        useVirtualSites: true, // optional:  whether virtual sites should be used - see description for more details
    }

});
```

The `onXhr` function (former `navigationPath`) will be executed for every XHR-Request your page sends in case `useXhrNavigation` is set to `true`. If the function returns a non-empty string, the returned string will be used as path for the beacon's current page URL. Otherwise, the XHR request is ignored by the plugin.

Example: assuming the current URL is `http://example.org/index.html` and the `onXhr` is returning `virtual_site` for a XHR request. This would result in the beacon containing `http://example.org/virtual_site` as its page URL.

By default, the virtual page URL is only used for the XHR request triggering it. If it is desired that the virtual page URL is persisted and also used for further beacons, `useVirtualSites` must be set to `true`. In this case, all subsequent beacons will contain the virtual page URL in their `u` and `pgu` beacon field.

#### Manually Setting the Virtual Page URL

The plugin provides a function `setVirtualSite` for manually setting the currently used virtual page URL.
This can be used to set the virtual page URL which is used by the beacons in case `useVirtualSites` is set to `true`.

```
BOOMR.plugins.spa_xhr_navigation.setVirtualSite("virtual_site");
```

Example: assuming the current URL is `http://example.org/index.html` and `setVirtualSite` is invoked using `virtual_site`. This would result in all beacons containing `http://example.org/virtual_site` as the page URL.

### Configuration

Available options are:

| Option | Description | Default value |
|---|---|---|
| `navigationPath` | *Deprecated*. Use `onXhr` instead. | `null` |
| `onXhr` | Callback for generating a virtual site based on XHR. The result of this function will be used as path the new site url. This function will only be used in case `useXhrNavigation` is true. | `() => null` |
| `disableHardNav` | Disable sending beacons for the initial page load. | `false` |
| `useVirtualSites` | Whether virtual sites should be used. In case this is true, the virtual sites are persisted and all beacons are modified, so they'll use the virtual site in the `u` and `pgu` field. | `false` |
| `useXhrNavigation` | Whether XHR navigation should trigger virtual sites. | `true` |

