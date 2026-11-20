/*
 * RIFQ Muslim native bridge shim.
 *
 * Injected into the web client after every page load. It replaces the browser
 * Notification API with real Android notifications and exposes the native prayer
 * alarm scheduler, without changing any application code.
 */
(function () {
  if (!window.RifqNative || window.__rifqNativeShim) return;
  window.__rifqNativeShim = true;

  var Native = window.RifqNative;

  function permissionState() {
    try {
      return Native.hasNotificationPermission() ? 'granted' : 'default';
    } catch (e) {
      return 'default';
    }
  }

  function RifqNotification(title, options) {
    options = options || {};
    var self = this;
    this.title = String(title || 'RIFQ Muslim');
    this.body = String(options.body || '');
    this.tag = String(options.tag || '');
    this.onclick = null;
    this.onclose = null;
    this.close = function () {};
    try {
      Native.notify(this.title, this.body, this.tag);
    } catch (e) {
      /* delivery failed; the app keeps working */
    }
    setTimeout(function () {
      if (typeof self.onclose === 'function') self.onclose();
    }, 0);
  }

  Object.defineProperty(RifqNotification, 'permission', {
    configurable: true,
    get: permissionState
  });

  RifqNotification.requestPermission = function (callback) {
    try {
      Native.requestNotificationPermission();
    } catch (e) {
      /* permission dialog unavailable */
    }
    return new Promise(function (resolve) {
      var attempts = 0;
      var timer = setInterval(function () {
        attempts += 1;
        var state = permissionState();
        if (state === 'granted' || attempts > 30) {
          clearInterval(timer);
          if (typeof callback === 'function') callback(state);
          resolve(state);
        }
      }, 500);
    });
  };

  window.Notification = RifqNotification;

  window.RifqNativeBridge = {
    available: true,
    schedulePrayer: function (id, atMillis, title, body) {
      try {
        Native.schedulePrayer(
          String(id),
          Math.round(Number(atMillis)),
          String(title),
          String(body)
        );
        return true;
      } catch (e) {
        return false;
      }
    },
    cancelPrayer: function (id) {
      try {
        Native.cancelPrayer(String(id));
      } catch (e) {
        /* nothing to cancel */
      }
    }
  };
})();
