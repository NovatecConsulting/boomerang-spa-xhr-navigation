# boomerang-spa-xhr-navigation
This Boomerang plugin enables SPA-Navigation detection based on XHR-Requests.
It can therefore be used as an alternative to the History-Plugin when your SPA does not rewrite the URL.

The plugin must be executed after the SPA and the AutoXHR plugin!

You can then configure is as follows:
```
BOOMR.init({
    instrument_xhr: true,
    autorun: false,
    spa_xhr_navigation: {
        navigationPath: function(data) {
            //data.url is the URL of the XHR-Request
            //data.method it the used HTTP method
            //data.body it the request content
            if(data.url.includes("my_nav")) {
                return data.url; //navigation with this page url
            }
            return null; //no navigation
        },
		//Optional: Disable to send beacons for the initial page load (Hard Navigation) normally?
		disableHardNav: false
    }
});
```

You must pass a custom function to the `navigationPath` option.
This function will be executed for every XHR-Request your page sends.
If the function returns a string, the returned string will be used as page name.

If you return any falsy value (empty string, null, false), the XHR will not initiate a navigation.

