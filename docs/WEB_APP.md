# TONATI LAB home-screen web app

The existing website remains the product. A root-scoped manifest, 192/512 PNG icons derived from the existing mark, an Apple 180px touch icon and standalone mode support phone home-screen installation. `/app.html` explains Safari and Chrome installation. No developer-store account, paid service, customer billing or notification permission is activated.

On an installed phone, Games / Lab / Record navigation appears with bottom safe-area padding. Normal desktop and phone browser sessions keep the website navigation. Other pages retain the Menu. Device-local watchlists and notebooks are not cloud synced; installed browser storage may differ from the browser where they were saved.

## Cache and freshness policy

`sw.js` caches only `/offline.html`. Same-origin GET navigations use the network. A network failure displays the connection fallback, which contains no schedule, pick or probability. APIs, JSON reports, prediction archives, JavaScript and CSS are not intercepted or stored by this worker. Existing server-side schedule/odds caches and timestamps continue to apply. An already-open page displays an offline notice and labels visible content as a previous snapshot. Restoring a connection asks users to refresh rather than making extra odds calls automatically.

Worker updates bypass the browser's worker-script cache. Activation deletes only older `tonati-offline-*` caches. It does not clear local storage or other caches. A fallback version change should bump the cache name. The service worker is root scoped, served with `Cache-Control: no-store`, and never trusts a cached game document as current analysis.

## Verification

Node tests execute the actual worker in a controlled context to verify install/activation, online navigation, network failures and API/data pass-through. Client tests cover standalone navigation, canceled/accepted prompts, installed confirmation and connection labels. The build copies every manifest icon and offline asset. Live visual checks use actual pages at phone width; installed-layout review is explicitly a simulation. Safari home-screen installation must still be checked on a real iPhone; remote Chrome cannot establish iOS behavior.

## Updating or removing

Normal page content comes from the live website. No prediction history is cached for offline replay. Remove the home-screen app through the device's normal app controls. Removing it can remove that app's device-local notebook/watchlist; export the notebook before removal if needed. Unregistering this worker should be performed only through a reviewed migration if offline support is retired.
