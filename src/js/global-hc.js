jQuery(document).ready(function($){
  // Check for the situation where a logged in user is missing the vCookie cookie and set it.
  if (readCookie('pmn-cookie') && !readCookie('vCookie')) {
    pmnLogger('info', 'User is logged in (has pmn-cookie), but is missing viafoura cookie (vCookie)', '', false);
    fetchUserProfile();
  }

  // Begin pmn-connext.jstear
  var env = window.env;
  pmnLogger('info', 'PMN Environment', env, false);

  var globalNow = Date.now();
  pmnLogger('info', 'DOM Ready', globalNow, false);

  // Global var representing Connext onInit initial now()
  var connextNow = Date();
  var connextEnv = 'prod';
  var isPreprod = window.isPreprod;

  //=========================
  // DOM ELEMENT SELECTORS
  //=========================

  var loginBtn = $('.signinlink');
  var profileBtn = $('.profilelink');


  //=========================
  // AUTH0 Client Settings
  //=========================

  var AUTH0_CLIENT_ID;
  var AUTH0_DOMAIN;
  var AUTH0_CALLBACK_URL = location.href;
  var requestedScopes = 'openid email profile read:messages write:messages';

  // Determine Auth0 Tenant & Client to be used
  if (env === 'dev' || env === 'stage') {
    connextEnv = 'stage';

    if (isPreprod) {
      connextEnv = 'preprod';
    }

    if (env === 'dev') {
      AUTH0_CLIENT_ID = 'qaM1sDGqd4HYHfXoaRtb7wNHL0Y6lqb8';
      AUTH0_DOMAIN = 'login-dev.philly.com';
    }

    if (env === 'stage') {
      // TODO: Update to stage Tenant when confirmed Auth0 Tenant setup is completed
      AUTH0_CLIENT_ID = 'qaM1sDGqd4HYHfXoaRtb7wNHL0Y6lqb8';
      AUTH0_DOMAIN = 'login-dev.philly.com';
    }
  } else {
    AUTH0_CLIENT_ID = 'WNSui5Uiq7JrIVDzJ75LPTCx9nV4T0rk';
    AUTH0_DOMAIN = 'login.philly.com';
  }

  // Set Auth0 Lock Configuration Options
  if (isPreprod) {
    // Auth0 Lock v10.2 Configuration Options
    var authOptions = {
      configurationBaseUrl: 'https://cdn.auth0.com',
      auth: {
        sso: true,
        redirect: false,
        params: {
          scope: "openid email"
        }
      },
      theme: {
        logo: "//media.philly.com/designimages/PMNbrand_Lockup.png",
        primaryColor: "#cc0000"
      },
      autofocus: true,
      autoclose: true,
      allowSignUp: true,
      initialScreen: 'login'
    };
  } else {
    // Auth0 Lock v11.0.1 Configuration Options
    var authOptions = {
      configurationBaseUrl: 'https://cdn.auth0.com',
      auth: {
        sso: true,
        redirect: false,
        redirectUrl: location.origin,
        responseType: "token",
        params: {
          scope: "openid email profile"
        }
      },
      theme: {
        logo: "//media.philly.com/designimages/PMNbrand_Lockup.png",
        primaryColor: "#cc0000"
      },
      autofocus: true,
      autoclose: true,
      allowSignUp: true,
      initialScreen: 'login'
    };
  }

  // Mobile Redirect
  if (window.innerWidth < 750 || window.screen.width < 769) {
    //authOptions.auth.redirect = true;
    // https compatible
    var authOptionsRedirectStart = window.location.protocol !== "https:" ? "http://" : "https://";
    var authOptionsRedirect = "www.philly.com/templates/mobile_redirect.html?rurl=" + encodeURIComponent(AUTH0_CALLBACK_URL);
    // redirect URL
    switch (env) {
      case "dev":
      case "stage":
        authOptions.auth.redirectUrl = authOptionsRedirectStart + env + "." + authOptionsRedirect;
        break;
      default:
        authOptions.auth.redirectUrl = authOptionsRedirectStart + authOptionsRedirect;
    }
  }

  // Initialize Auth0 Lock
  let lock = new Auth0Lock(AUTH0_CLIENT_ID, AUTH0_DOMAIN, authOptions);

  // Make Lock globally accessible
  // window.lock = lock;


  //=====================================
  //  DOM FUNCTIONS
  //=====================================

  // Log In Clicked, Show Auth0 Lock
  $('.signinlink').on('click', function () {
    pmnLogger('info', 'Login Button', 'click', false);

    lock.show(); // Display Auth0 Lock
  });

  // Log user OUT; Return Home
  $('.signoutlink').on('click', function () {
    pmnLogger('info', 'Logout Button', 'click', false);

    displayLoggedOutUX();
    clearUser();

    // If viafoura is present on the page, we NEED to wait until it's
    // active session has been destroyed before redirecting the page.
    if (window.vf && window.vf.session) {
      // Setup up an event handler
      window.vf.$subscribe('logout', 'success', function () {
        lockLogoutAndRedirect()
      });
    } else { // Else, redirect immediately.
      lockLogoutAndRedirect()
    }
  });


  //=====================================
  //  CONNEXT
  //=====================================

  /**
   * Logout of the lock, redirect to the appropriate home page.
   */
  function lockLogoutAndRedirect() {
    if (window.env === "dev" || window.env === "stage") {
      lock.logout({
        returnTo: 'http://' + window.env + '.www.philly.com'
      });
    } else {
      lock.logout({
        returnTo: 'http://www.philly.com'
      });
    }
  }

  /**
   * Calculate time lapsed from initialization of DOM up until the method (arg)
   * @param method
   */
  function calcTimeLapse (method) {
    var time = Date.now();
    var lapse = time - connextNow;
    colorTrace('\t** Time Lapse: Connext: [' + method.toString() + '] = ' + lapse + 'ms', 'blue');
  }

  /**
   * Connext Initialization & Callbacks
   */
  function initConnext () {
    try {
      connextNow = Date.now();
      pmnLogger('info', 'Connext Start Time:', connextNow, false);

      var configCode;

      if (window.env === "dev" || window.env === "stage") {
        if (connextEnv === 'prod') {
          configCode = 'MG2softLaunch';
        } else {
          configCode = 'MG2SOFTLAUNCH';
        }
      } else {
        configCode = 'MG2softLaunch';
      }
      pmnLogger('info', 'Connext configCode', configCode, false);
      pmnLogger('info', 'Connext Environment', connextEnv, false);

      Connext.init({
        debug: false,
        siteCode: "PHL",
        configCode: configCode, // prod = MG2softLaunch, dev = MG2SOFTLAUNCH
        attr: "set1",
        environment: connextEnv,
        authSettings: {
          auth0Lock: lock,
          domain: AUTH0_DOMAIN
        },
        onInit: function () {
          calcTimeLapse('onInit');
        },
        onLoggedIn: function () {
          // General Case
          calcTimeLapse('onLoggedIn');
        },
        onAuthorized: function () {
          // Logged In; Not Subscriber
          calcTimeLapse('onAuthorized'); // Calculate Time Lapse
          updateUser(); // Update User Data
          displayLoggedInUX(); // Update UI
          fetchAds(false); // Fetch Ads
        },
        onNotAuthorized: function () {
          // Logged Out
          calcTimeLapse('onNotAuthorized'); // Calculate Time Lapse
          clearUser(); // Clear User Data
          displayLoggedOutUX(); // Update UI
          fetchAds(false); // Fetch Ads
        },
        onHasAccess: function () {
          // Logged In; Subscriber
          calcTimeLapse('onHasAccess'); // Calculate Time Lapse
          updateUser(); // Update User Data
          displaySubscribedUX(); // Update UI
          fetchAds(true); // Fetch Lite Ads
        },
        onHasNoActiveSubscription: function () {
          calcTimeLapse('onHasNoActiveSubscription'); // Calculate Time Lapse
          updateUser();
          displayLoggedInUX();
          fetchAds(false);
        },
        onHasAccessNotEntitled: function () {
          calcTimeLapse('onHasAccessNotEntitled'); // Calculate Time Lapse
          displayLoggedInUX();
          updateUser();
          fetchAds(false);
        }
      });
    } catch (error) {
      pmnLogger('error', 'Error initConnext', error, true);
    }
  }


  // Call Main
  try {
    getUser()
    .then(function (user) {
      if (user && user.state !== 'Subscribed') {
        pmnLogger('info', 'User Subscription Status Changed', 'initConnext', false);

        initConnext();
        return;
      }

      displaySubscribedUX();

      var now = new Date();
      var timestamp = new Date(user.timestamp);
      var timeDiff = now - timestamp;
      pmnLogger('info', 'Now', now, false);
      pmnLogger('info', 'Timestamp', timestamp, false);
      pmnLogger('info', 'Time Diff', timeDiff, false);

      // Session > 5min (300,000ms)
      // 24 hours = 8.64e+7 = 86,400,000
      if (timeDiff >= 86400000) {
        pmnLogger('info', 'Session > 24 hours - ', 'callSubscriptionAPI()', false);

        callSubscriptionAPI();
      }
    })
    .catch(function (error) {
      pmnLogger('info', 'Main: catch - getUser', error, true);
      // TODO: Should I be calling - clearUser() ? I do below...
      initConnext();
    });
  } catch (error) {
    pmnLogger('error', 'ERROR Main - catch', error, true);
    clearUser();
    initConnext();
  }
  // End pmn-connext.js



  var $tertNav = $(".tertiary-nav .sf__link-list");
  var $realHeight = Array.prototype.reduce.call($tertNav.children(), function(p, c) {return p + (c.offsetHeight || 0);}, 0) + 'px';
  $(".section-front-header").on("click", ".mobile-nav", mobileNav);

  function mobileNav(event) {
    $(event.target).toggleClass("open");
    if (!$tertNav.css("maxHeight") || $tertNav.css("maxHeight") === "0px") {
      $tertNav.css("maxHeight", $realHeight);
    }
    else {
      $tertNav.css("maxHeight", "0px");
    }
  }

  //=====================
  // VIAFOURA
  //=====================

  var viewCmntBtn = document.querySelector('.btn-comments-view');
  var closeCmntBtn = document.querySelector('.btn-comments-close');
  var sharebarBottom = document.querySelector('#share-bar-bottom');

  // TODO: Without jQuery
  var widget = $('.vf-widget');
  var guidelines = $('.chat-guidelines');
  var vfLoginBtn = $('.vf-login-button');
  var vfSignupBtn = $('.vf-signup-button');

  window.vfQ = window.vfQ || [];

  window.vfQ.push(function () {
    // Viafoura is loaded and window.vf is available
    // let vf = window.vf;
    var vfUser = null;

    pmnLogger('info', 'Viafoura', 'ready', false);

    // First destroy the current viafoura context
    // window.vf.context.teardown()
    // .then(function () {
    //   pmnLogger('info', 'Context API', 'teardown', false);
    //
    //   window.vf.context.get('user')
    //   .then(function (user) {
    //     pmnLogger('info', 'Context get -> user', user.name, false);
    //     vfUser = user;
    //   })
    //   .catch(function (err) {
    //     pmnLogger('error', 'Context get -> user', err, true);
    //   });
    // })
    // Update the page meta information
    // .then(updatePageMetaData)
    // Add some new widgets to the page
    // .then(addNewWidgetContainers)
    // Finally restart the viafoura application
    //.then(window.vf.context.setup);


    //=====================
    // DOM EVENTS
    //=====================

    // User interacts w. 'View Comment(s)' button
    viewCmntBtn.addEventListener('click', function () {
      pushEventToDataLayer('comment', 'open');
      viewComments();
    });

    // User interacts w. 'Close Comments' button
    closeCmntBtn.addEventListener('click', function () {
      pushEventToDataLayer('comment', 'close');

      window.vf.context.reset()
      .then(function () {
        closeComments();
      })
      .catch(function (error) {
        pmnLogger('error', 'Viafoura Context Reset', error, true);
      });
    });

    // Community Guidelines for Commenting
    guidelines.on('click', function () {
      pmnLogger('info', 'View Community Guidelines', 'click', false);
      pushEventToDataLayer('comment', 'view-community-guidelines');
    });

    // Log In link within commenting widget
    vfLoginBtn.on('click', function () {
      pmnLogger('info', 'Viafoura Login Button', 'click', false);
      pushEventToDataLayer('vf-login', 'click');

      lock.show();
    });

    // Sign Up link within commenting widget
    vfSignupBtn.on('click', function () {
      pmnLogger('info', 'Viafoura Signup Button', 'click', false);
      pushEventToDataLayer('vf-signup', 'click');

      lock.show();
    });


    //=====================
    // WIDGET EVENTS
    //=====================

    window.vf.$subscribe('widgets', 'mount', function () {
      pmnLogger('info', 'Viafoura: widgets', 'mount', false);
    });

    window.vf.$subscribe('commenting', 'loaded', function () {
      pmnLogger('info', 'Comment Widget', 'loaded', false);

      if ($('.article__content .Mg2-connext').is(':visible')) {
        $('.vf-tray-trigger').hide();
      }

      // Hide comment counter if zero comments
      var commentCount = document.querySelector('.vf-counter');

      if (commentCount && (commentCount.innerText === '0' || commentCount.innerHTML === '0')) {
        pmnLogger('warning', 'Hiding comment counter', commentCount.innerText, false);
        commentCount.classList.add('hide');
      }

      // The viafoura stuff is "ready", so let's make the view button visible.
      $('.btn-comments-view').css('visibility', 'visible');
      $('#vf-button-loader').hide();
    });

    window.vf.$subscribe('sharebar', 'loaded', function () {
      pmnLogger('info', 'Sharebar Widget', 'loaded', false);
    });

    window.vf.$subscribe('users', 'loaded', function () {
      pmnLogger('info', 'Users Widget', 'loaded', false);
    });

    window.vf.$subscribe('share', 'clicked', function (network, button) {
      pmnLogger('info', 'Viafoura: share', 'clicked', false);
      pushEventToDataLayer('social-share', network);
    });

    window.vf.$subscribe('topics', 'loaded', function () {
      pmnLogger('info', 'Viafoura: topics', 'loaded', false);
    });

    window.vf.$subscribe('vf-ads', 'requestCommentAd', function () {
      pmnLogger('info', 'Viafoura Requesting Ad', 'requestCommentAd', false);
    });


    //=====================
    // AUTH EVENTS
    //=====================

    window.vf.$subscribe('authentication', 'required', function () {
      pmnLogger('info', 'Viafoura: authentication', 'required', false);

      setTimeout(function() {
        window.vf.$publish('tray', 'close');
      });
    });

    // Listen for successful of Viafoura authentication
    window.vf.$subscribe('login', 'success', function () {
      pmnLogger('info', 'Viafoura: login', 'success', false);
      pushEventToDataLayer('vf-login', 'success');

      var authText = document.querySelector('.vf-login-signup');
      var commenterName = document.querySelector('.vf-comment-form-name');

      authText.classList.add('hide');
      commenterName.setAttribute('style', 'display: inline');
    });

    // Listen for failure of Viafoura authentication
    window.vf.$subscribe('login', 'failure', function (error) {
      pmnLogger('info', 'Viafoura: login', error, true);
      pushEventToDataLayer('vf-login', 'failure');
    });

    // Listen for successful Viafoura logout
    window.vf.$subscribe('logout', 'success', function () {
      pmnLogger('info', 'Viafoura: logout', 'success', false);
      pushEventToDataLayer('logout', 'success');

      var avatar = document.querySelector('.vf-comment-user');
      var commenterName = document.querySelector('.vf-comment-form-name');
      var commentForm = document.querySelector('.vf-comment-form');
      var bellIcon = document.querySelector('.vf-tray-trigger');

      avatar.classList.add('hide');
      avatar.setAttribute('style', 'display:none');
      commenterName.setAttribute('style', 'display:none');
      commentForm.setAttribute('style', 'display:none');
      bellIcon.setAttribute('style', 'display:none');
    });


    //=====================
    // USER EVENTS
    //=====================

    window.vf.$subscribe('profile', 'show', function () {
      pmnLogger('info', 'Viafoura Profile', 'show', false);
    });

    window.vf.$subscribe('user', 'loaded', function (userContext) {
      pmnLogger('info', 'vfUser loaded', userContext, true);
    });

    window.vf.$subscribe('user', 'changed', function (userContext) {
      pmnLogger('info', 'vfUser changed', userContext, true);
    });


    //=====================
    // COMMENT EVENTS
    //=====================

    window.vf.$subscribe('comments', 'more-loaded', function () {
      pmnLogger('info', 'Comments', 'more-loaded', false);
    });

    window.vf.$subscribe('comments-realtime', 'more-loaded', function () {
      pmnLogger('info', 'Comments RT', 'more-loaded', false);
    });

    window.vf.$subscribe('comment-replies', 'loaded', function () {
      pmnLogger('info', 'Comment Replies', 'loaded', false);
    });

    window.vf.$subscribe('comment-replies-realtime', 'loaded', function () {
      pmnLogger('info', 'Comment Replies RT', 'loaded', false);
    });

    window.vf.$subscribe('comment-thread', 'loaded', function () {
      pmnLogger('info', 'Comment Thread', 'loaded', false);
    });

    window.vf.$subscribe('comment', 'rendered', function () {
      pmnLogger('info', 'Comment', 'rendered', false);
    });

    // Fires on successful comment creation
    window.vf.$subscribe('comment', 'created', function () {
      pmnLogger('info', 'Comment', 'created', false);
      pushEventToDataLayer('comment', 'created');
    });

    // Fires on successful comment reply being posted
    window.vf.$subscribe('comment-reply', 'posted', function () {
      pmnLogger('info', 'Comment', 'reply posted', false);
      pushEventToDataLayer('comment', 'reply');
    });


    //=====================
    // TRAY EVENTS
    //=====================

    window.vf.$subscribe('vf-tray-trigger', 'clicked', function () {
      pmnLogger('info', 'Tray', 'clicked', false);
      if ($('.subscribetoday__wrap').is(':visible')) {
        $('.viafoura .vf-tray').addClass('vf-tray-ns');
      }
    });

    window.vf.$subscribe('tray', 'toggle', function () {
      pmnLogger('info', 'Tray', 'toggle', false);
    });

    window.vf.$subscribe('tray', 'open', function () {
      pmnLogger('info', 'Tray', 'open', false);
    });

    window.vf.$subscribe('tray', 'opened', function () {
      pmnLogger('info', 'Tray', 'opened', false);
    });

    window.vf.$subscribe('tray', 'close', function () {
      pmnLogger('info', 'Tray', 'close', false);
    });

    window.vf.$subscribe('tray', 'closed', function () {
      pmnLogger('info', 'Tray', 'closed', false);
    });
  });
});

/* crypto-js-rollup-aes.js */

/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(u,p){var d={},l=d.lib={},s=function(){},t=l.Base={extend:function(a){s.prototype=this;var c=new s;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
    r=l.WordArray=t.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=p?c:4*a.length},toString:function(a){return(a||v).stringify(this)},concat:function(a){var c=this.words,e=a.words,j=this.sigBytes;a=a.sigBytes;this.clamp();if(j%4)for(var k=0;k<a;k++)c[j+k>>>2]|=(e[k>>>2]>>>24-8*(k%4)&255)<<24-8*((j+k)%4);else if(65535<e.length)for(k=0;k<a;k+=4)c[j+k>>>2]=e[k>>>2];else c.push.apply(c,e);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
          32-8*(c%4);a.length=u.ceil(c/4)},clone:function(){var a=t.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],e=0;e<a;e+=4)c.push(4294967296*u.random()|0);return new r.init(c,a)}}),w=d.enc={},v=w.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var e=[],j=0;j<a;j++){var k=c[j>>>2]>>>24-8*(j%4)&255;e.push((k>>>4).toString(16));e.push((k&15).toString(16))}return e.join("")},parse:function(a){for(var c=a.length,e=[],j=0;j<c;j+=2)e[j>>>3]|=parseInt(a.substr(j,
          2),16)<<24-4*(j%8);return new r.init(e,c/2)}},b=w.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var e=[],j=0;j<a;j++)e.push(String.fromCharCode(c[j>>>2]>>>24-8*(j%4)&255));return e.join("")},parse:function(a){for(var c=a.length,e=[],j=0;j<c;j++)e[j>>>2]|=(a.charCodeAt(j)&255)<<24-8*(j%4);return new r.init(e,c)}},x=w.Utf8={stringify:function(a){try{return decodeURIComponent(escape(b.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return b.parse(unescape(encodeURIComponent(a)))}},
    q=l.BufferedBlockAlgorithm=t.extend({reset:function(){this._data=new r.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=x.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,e=c.words,j=c.sigBytes,k=this.blockSize,b=j/(4*k),b=a?u.ceil(b):u.max((b|0)-this._minBufferSize,0);a=b*k;j=u.min(4*a,j);if(a){for(var q=0;q<a;q+=k)this._doProcessBlock(e,q);q=e.splice(0,a);c.sigBytes-=j}return new r.init(q,j)},clone:function(){var a=t.clone.call(this);
        a._data=this._data.clone();return a},_minBufferSize:0});l.Hasher=q.extend({cfg:t.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){q.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(b,e){return(new a.init(e)).finalize(b)}},_createHmacHelper:function(a){return function(b,e){return(new n.HMAC.init(a,
      e)).finalize(b)}}});var n=d.algo={};return d}(Math);
(function(){var u=CryptoJS,p=u.lib.WordArray;u.enc.Base64={stringify:function(d){var l=d.words,p=d.sigBytes,t=this._map;d.clamp();d=[];for(var r=0;r<p;r+=3)for(var w=(l[r>>>2]>>>24-8*(r%4)&255)<<16|(l[r+1>>>2]>>>24-8*((r+1)%4)&255)<<8|l[r+2>>>2]>>>24-8*((r+2)%4)&255,v=0;4>v&&r+0.75*v<p;v++)d.push(t.charAt(w>>>6*(3-v)&63));if(l=t.charAt(64))for(;d.length%4;)d.push(l);return d.join("")},parse:function(d){var l=d.length,s=this._map,t=s.charAt(64);t&&(t=d.indexOf(t),-1!=t&&(l=t));for(var t=[],r=0,w=0;w<
  l;w++)if(w%4){var v=s.indexOf(d.charAt(w-1))<<2*(w%4),b=s.indexOf(d.charAt(w))>>>6-2*(w%4);t[r>>>2]|=(v|b)<<24-8*(r%4);r++}return p.create(t,r)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}})();
(function(u){function p(b,n,a,c,e,j,k){b=b+(n&a|~n&c)+e+k;return(b<<j|b>>>32-j)+n}function d(b,n,a,c,e,j,k){b=b+(n&c|a&~c)+e+k;return(b<<j|b>>>32-j)+n}function l(b,n,a,c,e,j,k){b=b+(n^a^c)+e+k;return(b<<j|b>>>32-j)+n}function s(b,n,a,c,e,j,k){b=b+(a^(n|~c))+e+k;return(b<<j|b>>>32-j)+n}for(var t=CryptoJS,r=t.lib,w=r.WordArray,v=r.Hasher,r=t.algo,b=[],x=0;64>x;x++)b[x]=4294967296*u.abs(u.sin(x+1))|0;r=r.MD5=v.extend({_doReset:function(){this._hash=new w.init([1732584193,4023233417,2562383102,271733878])},
  _doProcessBlock:function(q,n){for(var a=0;16>a;a++){var c=n+a,e=q[c];q[c]=(e<<8|e>>>24)&16711935|(e<<24|e>>>8)&4278255360}var a=this._hash.words,c=q[n+0],e=q[n+1],j=q[n+2],k=q[n+3],z=q[n+4],r=q[n+5],t=q[n+6],w=q[n+7],v=q[n+8],A=q[n+9],B=q[n+10],C=q[n+11],u=q[n+12],D=q[n+13],E=q[n+14],x=q[n+15],f=a[0],m=a[1],g=a[2],h=a[3],f=p(f,m,g,h,c,7,b[0]),h=p(h,f,m,g,e,12,b[1]),g=p(g,h,f,m,j,17,b[2]),m=p(m,g,h,f,k,22,b[3]),f=p(f,m,g,h,z,7,b[4]),h=p(h,f,m,g,r,12,b[5]),g=p(g,h,f,m,t,17,b[6]),m=p(m,g,h,f,w,22,b[7]),
      f=p(f,m,g,h,v,7,b[8]),h=p(h,f,m,g,A,12,b[9]),g=p(g,h,f,m,B,17,b[10]),m=p(m,g,h,f,C,22,b[11]),f=p(f,m,g,h,u,7,b[12]),h=p(h,f,m,g,D,12,b[13]),g=p(g,h,f,m,E,17,b[14]),m=p(m,g,h,f,x,22,b[15]),f=d(f,m,g,h,e,5,b[16]),h=d(h,f,m,g,t,9,b[17]),g=d(g,h,f,m,C,14,b[18]),m=d(m,g,h,f,c,20,b[19]),f=d(f,m,g,h,r,5,b[20]),h=d(h,f,m,g,B,9,b[21]),g=d(g,h,f,m,x,14,b[22]),m=d(m,g,h,f,z,20,b[23]),f=d(f,m,g,h,A,5,b[24]),h=d(h,f,m,g,E,9,b[25]),g=d(g,h,f,m,k,14,b[26]),m=d(m,g,h,f,v,20,b[27]),f=d(f,m,g,h,D,5,b[28]),h=d(h,f,
          m,g,j,9,b[29]),g=d(g,h,f,m,w,14,b[30]),m=d(m,g,h,f,u,20,b[31]),f=l(f,m,g,h,r,4,b[32]),h=l(h,f,m,g,v,11,b[33]),g=l(g,h,f,m,C,16,b[34]),m=l(m,g,h,f,E,23,b[35]),f=l(f,m,g,h,e,4,b[36]),h=l(h,f,m,g,z,11,b[37]),g=l(g,h,f,m,w,16,b[38]),m=l(m,g,h,f,B,23,b[39]),f=l(f,m,g,h,D,4,b[40]),h=l(h,f,m,g,c,11,b[41]),g=l(g,h,f,m,k,16,b[42]),m=l(m,g,h,f,t,23,b[43]),f=l(f,m,g,h,A,4,b[44]),h=l(h,f,m,g,u,11,b[45]),g=l(g,h,f,m,x,16,b[46]),m=l(m,g,h,f,j,23,b[47]),f=s(f,m,g,h,c,6,b[48]),h=s(h,f,m,g,w,10,b[49]),g=s(g,h,f,m,
          E,15,b[50]),m=s(m,g,h,f,r,21,b[51]),f=s(f,m,g,h,u,6,b[52]),h=s(h,f,m,g,k,10,b[53]),g=s(g,h,f,m,B,15,b[54]),m=s(m,g,h,f,e,21,b[55]),f=s(f,m,g,h,v,6,b[56]),h=s(h,f,m,g,x,10,b[57]),g=s(g,h,f,m,t,15,b[58]),m=s(m,g,h,f,D,21,b[59]),f=s(f,m,g,h,z,6,b[60]),h=s(h,f,m,g,C,10,b[61]),g=s(g,h,f,m,j,15,b[62]),m=s(m,g,h,f,A,21,b[63]);a[0]=a[0]+f|0;a[1]=a[1]+m|0;a[2]=a[2]+g|0;a[3]=a[3]+h|0},_doFinalize:function(){var b=this._data,n=b.words,a=8*this._nDataBytes,c=8*b.sigBytes;n[c>>>5]|=128<<24-c%32;var e=u.floor(a/
      4294967296);n[(c+64>>>9<<4)+15]=(e<<8|e>>>24)&16711935|(e<<24|e>>>8)&4278255360;n[(c+64>>>9<<4)+14]=(a<<8|a>>>24)&16711935|(a<<24|a>>>8)&4278255360;b.sigBytes=4*(n.length+1);this._process();b=this._hash;n=b.words;for(a=0;4>a;a++)c=n[a],n[a]=(c<<8|c>>>24)&16711935|(c<<24|c>>>8)&4278255360;return b},clone:function(){var b=v.clone.call(this);b._hash=this._hash.clone();return b}});t.MD5=v._createHelper(r);t.HmacMD5=v._createHmacHelper(r)})(Math);
(function(){var u=CryptoJS,p=u.lib,d=p.Base,l=p.WordArray,p=u.algo,s=p.EvpKDF=d.extend({cfg:d.extend({keySize:4,hasher:p.MD5,iterations:1}),init:function(d){this.cfg=this.cfg.extend(d)},compute:function(d,r){for(var p=this.cfg,s=p.hasher.create(),b=l.create(),u=b.words,q=p.keySize,p=p.iterations;u.length<q;){n&&s.update(n);var n=s.update(d).finalize(r);s.reset();for(var a=1;a<p;a++)n=s.finalize(n),s.reset();b.concat(n)}b.sigBytes=4*q;return b}});u.EvpKDF=function(d,l,p){return s.create(p).compute(d,
    l)}})();
CryptoJS.lib.Cipher||function(u){var p=CryptoJS,d=p.lib,l=d.Base,s=d.WordArray,t=d.BufferedBlockAlgorithm,r=p.enc.Base64,w=p.algo.EvpKDF,v=d.Cipher=t.extend({cfg:l.extend(),createEncryptor:function(e,a){return this.create(this._ENC_XFORM_MODE,e,a)},createDecryptor:function(e,a){return this.create(this._DEC_XFORM_MODE,e,a)},init:function(e,a,b){this.cfg=this.cfg.extend(b);this._xformMode=e;this._key=a;this.reset()},reset:function(){t.reset.call(this);this._doReset()},process:function(e){this._append(e);return this._process()},
  finalize:function(e){e&&this._append(e);return this._doFinalize()},keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(e){return{encrypt:function(b,k,d){return("string"==typeof k?c:a).encrypt(e,b,k,d)},decrypt:function(b,k,d){return("string"==typeof k?c:a).decrypt(e,b,k,d)}}}});d.StreamCipher=v.extend({_doFinalize:function(){return this._process(!0)},blockSize:1});var b=p.mode={},x=function(e,a,b){var c=this._iv;c?this._iv=u:c=this._prevBlock;for(var d=0;d<b;d++)e[a+d]^=
    c[d]},q=(d.BlockCipherMode=l.extend({createEncryptor:function(e,a){return this.Encryptor.create(e,a)},createDecryptor:function(e,a){return this.Decryptor.create(e,a)},init:function(e,a){this._cipher=e;this._iv=a}})).extend();q.Encryptor=q.extend({processBlock:function(e,a){var b=this._cipher,c=b.blockSize;x.call(this,e,a,c);b.encryptBlock(e,a);this._prevBlock=e.slice(a,a+c)}});q.Decryptor=q.extend({processBlock:function(e,a){var b=this._cipher,c=b.blockSize,d=e.slice(a,a+c);b.decryptBlock(e,a);x.call(this,
      e,a,c);this._prevBlock=d}});b=b.CBC=q;q=(p.pad={}).Pkcs7={pad:function(a,b){for(var c=4*b,c=c-a.sigBytes%c,d=c<<24|c<<16|c<<8|c,l=[],n=0;n<c;n+=4)l.push(d);c=s.create(l,c);a.concat(c)},unpad:function(a){a.sigBytes-=a.words[a.sigBytes-1>>>2]&255}};d.BlockCipher=v.extend({cfg:v.cfg.extend({mode:b,padding:q}),reset:function(){v.reset.call(this);var a=this.cfg,b=a.iv,a=a.mode;if(this._xformMode==this._ENC_XFORM_MODE)var c=a.createEncryptor;else c=a.createDecryptor,this._minBufferSize=1;this._mode=c.call(a,
      this,b&&b.words)},_doProcessBlock:function(a,b){this._mode.processBlock(a,b)},_doFinalize:function(){var a=this.cfg.padding;if(this._xformMode==this._ENC_XFORM_MODE){a.pad(this._data,this.blockSize);var b=this._process(!0)}else b=this._process(!0),a.unpad(b);return b},blockSize:4});var n=d.CipherParams=l.extend({init:function(a){this.mixIn(a)},toString:function(a){return(a||this.formatter).stringify(this)}}),b=(p.format={}).OpenSSL={stringify:function(a){var b=a.ciphertext;a=a.salt;return(a?s.create([1398893684,
    1701076831]).concat(a).concat(b):b).toString(r)},parse:function(a){a=r.parse(a);var b=a.words;if(1398893684==b[0]&&1701076831==b[1]){var c=s.create(b.slice(2,4));b.splice(0,4);a.sigBytes-=16}return n.create({ciphertext:a,salt:c})}},a=d.SerializableCipher=l.extend({cfg:l.extend({format:b}),encrypt:function(a,b,c,d){d=this.cfg.extend(d);var l=a.createEncryptor(c,d);b=l.finalize(b);l=l.cfg;return n.create({ciphertext:b,key:c,iv:l.iv,algorithm:a,mode:l.mode,padding:l.padding,blockSize:a.blockSize,formatter:d.format})},
  decrypt:function(a,b,c,d){d=this.cfg.extend(d);b=this._parse(b,d.format);return a.createDecryptor(c,d).finalize(b.ciphertext)},_parse:function(a,b){return"string"==typeof a?b.parse(a,this):a}}),p=(p.kdf={}).OpenSSL={execute:function(a,b,c,d){d||(d=s.random(8));a=w.create({keySize:b+c}).compute(a,d);c=s.create(a.words.slice(b),4*c);a.sigBytes=4*b;return n.create({key:a,iv:c,salt:d})}},c=d.PasswordBasedCipher=a.extend({cfg:a.cfg.extend({kdf:p}),encrypt:function(b,c,d,l){l=this.cfg.extend(l);d=l.kdf.execute(d,
      b.keySize,b.ivSize);l.iv=d.iv;b=a.encrypt.call(this,b,c,d.key,l);b.mixIn(d);return b},decrypt:function(b,c,d,l){l=this.cfg.extend(l);c=this._parse(c,l.format);d=l.kdf.execute(d,b.keySize,b.ivSize,c.salt);l.iv=d.iv;return a.decrypt.call(this,b,c,d.key,l)}})}();
(function(){for(var u=CryptoJS,p=u.lib.BlockCipher,d=u.algo,l=[],s=[],t=[],r=[],w=[],v=[],b=[],x=[],q=[],n=[],a=[],c=0;256>c;c++)a[c]=128>c?c<<1:c<<1^283;for(var e=0,j=0,c=0;256>c;c++){var k=j^j<<1^j<<2^j<<3^j<<4,k=k>>>8^k&255^99;l[e]=k;s[k]=e;var z=a[e],F=a[z],G=a[F],y=257*a[k]^16843008*k;t[e]=y<<24|y>>>8;r[e]=y<<16|y>>>16;w[e]=y<<8|y>>>24;v[e]=y;y=16843009*G^65537*F^257*z^16843008*e;b[k]=y<<24|y>>>8;x[k]=y<<16|y>>>16;q[k]=y<<8|y>>>24;n[k]=y;e?(e=z^a[a[a[G^z]]],j^=a[a[j]]):e=j=1}var H=[0,1,2,4,8,
  16,32,64,128,27,54],d=d.AES=p.extend({_doReset:function(){for(var a=this._key,c=a.words,d=a.sigBytes/4,a=4*((this._nRounds=d+6)+1),e=this._keySchedule=[],j=0;j<a;j++)if(j<d)e[j]=c[j];else{var k=e[j-1];j%d?6<d&&4==j%d&&(k=l[k>>>24]<<24|l[k>>>16&255]<<16|l[k>>>8&255]<<8|l[k&255]):(k=k<<8|k>>>24,k=l[k>>>24]<<24|l[k>>>16&255]<<16|l[k>>>8&255]<<8|l[k&255],k^=H[j/d|0]<<24);e[j]=e[j-d]^k}c=this._invKeySchedule=[];for(d=0;d<a;d++)j=a-d,k=d%4?e[j]:e[j-4],c[d]=4>d||4>=j?k:b[l[k>>>24]]^x[l[k>>>16&255]]^q[l[k>>>
  8&255]]^n[l[k&255]]},encryptBlock:function(a,b){this._doCryptBlock(a,b,this._keySchedule,t,r,w,v,l)},decryptBlock:function(a,c){var d=a[c+1];a[c+1]=a[c+3];a[c+3]=d;this._doCryptBlock(a,c,this._invKeySchedule,b,x,q,n,s);d=a[c+1];a[c+1]=a[c+3];a[c+3]=d},_doCryptBlock:function(a,b,c,d,e,j,l,f){for(var m=this._nRounds,g=a[b]^c[0],h=a[b+1]^c[1],k=a[b+2]^c[2],n=a[b+3]^c[3],p=4,r=1;r<m;r++)var q=d[g>>>24]^e[h>>>16&255]^j[k>>>8&255]^l[n&255]^c[p++],s=d[h>>>24]^e[k>>>16&255]^j[n>>>8&255]^l[g&255]^c[p++],t=
      d[k>>>24]^e[n>>>16&255]^j[g>>>8&255]^l[h&255]^c[p++],n=d[n>>>24]^e[g>>>16&255]^j[h>>>8&255]^l[k&255]^c[p++],g=q,h=s,k=t;q=(f[g>>>24]<<24|f[h>>>16&255]<<16|f[k>>>8&255]<<8|f[n&255])^c[p++];s=(f[h>>>24]<<24|f[k>>>16&255]<<16|f[n>>>8&255]<<8|f[g&255])^c[p++];t=(f[k>>>24]<<24|f[n>>>16&255]<<16|f[g>>>8&255]<<8|f[h&255])^c[p++];n=(f[n>>>24]<<24|f[g>>>16&255]<<16|f[h>>>8&255]<<8|f[k&255])^c[p++];a[b]=q;a[b+1]=s;a[b+2]=t;a[b+3]=n},keySize:8});u.AES=p._createHelper(d)})();


/* pmn-encryption.js */
/*
  ENCRYPTION / DECRYPTION FUNCTIONS
 */

/**
 * Encrypt data
 *
 * @param data Information to be encrypted
 */
function encryptData (data) {
  if (data === undefined || data === null) {
    throw new Error('Cannot encrypt empty data set');
  }

  // Hold data after determining typeof
  var dataHolder;

  // Object must be encapsulated w.in an Array
  if (typeof data === 'object') {
    dataHolder = JSON.stringify([data]);
  } else {
    dataHolder = data;
  }

  var cipherData = CryptoJS.AES.encrypt(dataHolder, 'PMN_p3pp3r-#215');

  return encodeURIComponent(cipherData);
}

/**
 * Decrypt data
 *
 * @param data Information to be encrypted
 * @returns {*}
 */
function decryptData (data) {
  if (data) {
    data = decodeURIComponent(data);
    pmnLogger('info', 'Decoded URI Component', data, true);

    if (data === undefined || data === null) {
      throw new Error('Cannot decrypt empty data set');
    }

    var decryptedBytes;
    var decryptedData;

    if (typeof data === 'object') {
      decryptedBytes = CryptoJS.AES.decrypt(data, 'PMN_p3pp3r-#215');
      decryptedData = JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));
    } else {
      decryptedBytes = CryptoJS.AES.decrypt(data.toString(), 'PMN_p3pp3r-#215');
      decryptedData = JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));
    }

    return decryptedData;
  }

  return null;
}

/**
 * Returns user data via reading cookie & decrypting it
 *
 * @returns {*}
 */
function getDecryptedUser () {
  var cookie = readCookie('pmn-cookie');

  if (cookie === undefined || cookie === null || cookie === '') {
    return null;
  }

  var user = decryptData(cookie);

  if (user && user[0]) {
    return user[0];
  }

  return null;
}

/* pmn-utils.js */
/*
  PMN Utility Functions
 */

//=====================================
//  CONSOLE & LOGGER FUNCTIONS
//=====================================

/**
 * Pretty logging in developer console
 *
 * @param  {string} msg   Text to be displayed in console.log()
 * @param  {string} color Hex representation of a color or a CSS color by name (i.e. 'purple')
 */
function colorTrace (msg, color) {
  console.log("%c" + msg, "color:" + color + ";font-weight:bold;");
}

/**
 * Console Logger to handle types of log
 *
 * @param {string} type [info, warning, error]
 * @param {string} title
 * @param data
 * @param {boolean} verbose If false, print 1-line log
 */
function pmnLogger (type, title, data, verbose) {
  try {
    var env = window.env;
    var titleColor;
    var envVerbose = (env === 'dev' || env === 'stage') ? true : false;

    // Determine title color
    switch (type) {
      case 'info':
        titleColor = 'blue';
        break;
      case 'warning':
        titleColor = 'orange';
        break;
      case 'error':
        titleColor = '#cc0000';
        break;
      default:
        titleColor = 'blue';
    }

    if (envVerbose && verbose) {
      colorTrace('\n**** [TITLE]: ' + title + ' ****', titleColor);

      if (typeof data === 'object') {
        console.dir(data);
      } else {
        colorTrace('\t** [DATA]: ' + data, 'purple');
      }

      colorTrace('**** [FIN]: ' + title + ' ****\n', 'green');

    } else if (envVerbose && !verbose) {
      // Minimal Log
      colorTrace('\n**** [' + title + ']: ' + data, titleColor);
    }
  } catch (err) {
    colorTrace('\n!! [ERROR]: pmnLogger', 'red');
    console.log(err);
  }
}


//=====================================
//  COOKIE FUNCTIONS
//=====================================

/**
 * Set cookie key=value; IFF no value, cookie is reset
 *
 * @param {string} key
 * @param {string} value
 */
function setCookie (key, value) {
  if (key === undefined || key === null) {
    throw new Error('Set Cookie requires a key for cookie to be set.');
  }

  // No value provide resets cookie
  if (value === undefined || value === null) {
    value = ';';
  } else {
    value = value.toString() + ';';
  }

  // 1 month = 2,628,000 sec
  var exp = 'max-age=2628000;';

  document.cookie = key.toString() + '=' + value + 'path=/;' + exp;
}


//=====================================
//  USER STATE FUNCTIONS
//=====================================

/**
 * Resets user cookie
 */
function clearUser () {
  setCookie('pmn-cookie', ';');
  setCookie('vCookie', ';');

  if (window.vf && window.vf.session) {
    window.vf.session.logout();
  }
}

/**
 * Return user data by one source otherwise error
 *  Prioritize Data Sources:
 *    1) Cookie
 *    2) localStorage
 *    3) Subscription API
 *
 * @returns {*}
 */
function getUser () {
  return new Promise(function (resolve, reject) {
    try {
      var user = getDecryptedUser();

      // No user cookie was previously set, try localStorage
      if (user === null) {
        user = {
          auth0Id: null,
          uid: null,
          displayName: null,
          email: null,
          timestamp: null,
          state: null,
          mg2Id: null,
          registrationDate: null,
          subscriptionStartDate: null,
          subscriptionExpirationDate: null,
          registrationSource: null,
          paperCode: null,
          householdLevel: null
        };

        if (Connext && Connext.Storage) {
          var userData = Connext.Storage.GetUserData();
          var userProfile = Connext.Storage.GetUserProfile();
          var state = Connext.Storage.GetUserState();

          if (userData === undefined || userData === null) {
            throw new Error('Connext could not find user data');
          }

          var digital = userData.DigitalAccess;

          // From this point on we can confidently access DigitalAccess
          if (digital && digital.Errors !== null) {
            console.log('Connext DigitalAccess Errors', digital.Errors.message);
            throw new Error(digital.Errors.message);
          }

          var digitalSubscription = digital.Subscription;

          // Should be caught with check on Errors - This is fallback check
          if (digitalSubscription === undefined || digitalSubscription === null) {
            throw new Error('User does not have Digital Access Subscription data');
          }

          if (userProfile === undefined || userProfile === null) {
            throw new Error('Connext could not find user profile');
          }

          // If (!state), compare now to subscription exp date for safety net
          if (state === undefined || state === null) {
            pmnLogger('warning', 'Connext could not find', 'state', false);
          }

          if ( userData.Subscriptions ) {
            // Handle Connext V.1.14 backward compatible
            var subscriptions = ( userData.Subscriptions.OwnedSubscriptions && userData.Subscriptions.OwnedSubscriptions[0] ) || userData.Subscriptions[0];

            user.auth0Id = userProfile.sub;
            user.uid = userProfile.sub;
            user.displayName = (userProfile && userProfile.user_metadata && userProfile.user_metadata.displayName) || null; // Not available in Connext V.1.14
            user.email = userProfile.email;
            user.metadata = userProfile.user_metadata; // Not available in Connext V.1.14
            user.state = state;
            user.timestamp = new Date();
            user.mg2Id = subscriptions.AccountNumber || subscriptions.AccountId;
            user.registrationSource = null;
            user.registrationDate = userProfile.created_at || ''; // Not available in Connext V.1.14
            user.subscriptionStartDate = digitalSubscription.StartDate || '';
            user.subscriptionExpirationDate = digitalSubscription.DateStop || '';
            user.paperCode = subscriptions.PaperCode || '';
            user.householdLevel = subscriptions.HouseholdSubscriptionLevel || subscriptions.SubscriptionLevelHousehold;
          }
        } else {
          pmnLogger('info', 'User not found in Cookie or Local Storage:', 'API call...', false);

          // Call Subscription API
          user = callSubscriptionAPI();

          if (user === null) {
            throw new Error('Connext could not find user');
          }
        }
      }

      resolve(user);

    } catch (error) {
      reject(error.message);
    }
  });
}

/**
 * Initialize user obj & commenter user obj.
 * Encrypt both objects and set cookies: pmn-cookie and vCookie, respectively
 */
function updateUser () {
  var user = {
    auth0Id: null,
    displayName: null,
    email: null,
    householdLevel: null,
    metadata: null,
    mg2Id: null,
    paperCode: null,
    registrationDate: null,
    registrationSource: null,
    state: null,
    subscriptionExpirationDate: null,
    subscriptionStartDate: null,
    timestamp: null,
    uid: null
  };

  var userState = Connext.Storage.GetUserState();

  if (userState !== undefined || userState !== null) {
    user.state = userState;
  }

  var userData = Connext.Storage.GetUserData();
  var auth0Profile = Connext.Storage.GetUserProfile();

  if (auth0Profile !== undefined || auth0Profile !== null) {
    user.registrationDate = (auth0Profile && auth0Profile.created_at) || null; // No longer avail. in Connext V.1.14
    user.auth0Id = (userData && userData.MasterId) || null;
    user.uid = (userData && userData.MasterId) || null;

    // FIXME: When the lock jumps to v11, user_metadata will be removed from our access. We will need another way to get this displayName field.
    user.displayName = (auth0Profile && auth0Profile.user_metadata && auth0Profile.user_metadata.displayName) || null;
    user.email = (auth0Profile && auth0Profile.email) || null;
    user.metadata = (auth0Profile && auth0Profile.user_metadata) || null; // No longer avail. in Connext V.1.14
  }

  // Only Subscribers have subscription data
  if (userState === 'Subscribed') {
    // Check for errors
    if (userData.DigitalAccess.Errors === null) {
      var subscriptions = userData.Subscriptions;

      if (subscriptions !== undefined || subscriptions !== null) {
        // handle Connext V.1.14 backward compatible.
        subscriptions = ( subscriptions.OwnedSubscriptions && subscriptions.OwnedSubscriptions[0] ) || ( subscriptions[0] ) ;

        user.subscriptionStartDate = new Date(userData.DigitalAccess.Subscription.StartDate);
        user.subscriptionExpirationDate = new Date(userData.DigitalAccess.Subscription.DateStop);
        user.mg2Id = subscriptions.AccountId || subscriptions.AccountNumber;
        user.paperCode = subscriptions.PaperCode;
        user.householdLevel = subscriptions.SubscriptionLevelHousehold || subscriptions.HouseholdSubscriptionLevel;
      }
    }
  }

  user.timestamp = new Date();

  var cipherUser = encryptData(user);
  setCookie('pmn-cookie', cipherUser);

  var vfUser = {
    displayName: user.displayName,
    email: user.email,
    uid: user.uid
  };

  var cipherVfUser = encryptData(vfUser);
  setCookie('vCookie', cipherVfUser);

  if (window.vf && window.vf.session) {
    window.vf.session.login.cookie(readCookie('vCookie'));
  }
}

/**
 * Update User Cookie
 *
 * @param {Object} data represents MG2 API response
 */
function updateUserByData (data) {
  try {
    // Original user before subscription api call
    var user = getDecryptedUser();

    pmnLogger('info', 'updateUserByData - data', data, true);

    if (data === undefined || data === null) {
      pmnLogger('error', 'Update User By Data', 'data is empty', false);
      return;
    }

    var digital = data.DigitalAccess;

    if (digital && digital.Errors === null) {
      user.auth0Id = data.MasterId;
      user.uid = data.MasterId;
      user.displayName = data.displayName;
      user.metadata = data.metadata;
      user.timestamp = new Date(); // Reset timestamp
      user.mg2Id = data.Subscriptions[0].AccountId;
      user.registrationSource = data.registrationSource;
      user.paperCode = data.Subscriptions[0].PaperCode;
      user.householdLevel = data.Subscriptions[0].SubscriptionLevelHousehold;

      if (digital.AccessLevel.IsPremium) {
        user.state = 'Subscribed';
      } else {
        user.state = 'Logged In';
      }

      user.registrationDate = new Date(user.registrationDate);
      //user.subscriptionStartDate = new Date(digital.Subscription.StartDate);
      //user.subscriptionExpirationDate = new Date(digital.Subscription.DateStop);

      pmnLogger('info', 'Update User by Data', 'COMPLETE', false);

      var cipherData = encryptData(user);
      setCookie('pmn-cookie', cipherData);
    }
  } catch (error) {
    pmnLogger('error', 'updateUserByData', error, true);
    return error.message;
  }
}

/**
 * Updates several user state cookies on the page with key/value pairs.
 *
 * @param {Object} data key/value pairs
 */
function updateUserByKeys(data) {
  try {
    if (!data) {
      throw new Error('updateUserByKeys: Requires data argument. None passed in');
    }

    if (typeof data !== 'object') {
      throw new Error('updateUserByKeys: data argument is not an object');
    }

    var legacyUser = getDecryptedUser()

    if (!legacyUser) {
      throw new Error('updateUserByKeys: Could not load legacy user (i.e. readCookie("pmn-cookie"))')
    }

    // Set each key/value in the user state object.
    for (let key in data) {
      legacyUser[key] = data[key]
    }

    // Update current PMN cookie b.c. it is only update periodically
    setCookie('pmn-cookie', encryptData(legacyUser));

    var vfUser = {
      uid: legacyUser.uid,
      email: legacyUser.email,
      displayName: legacyUser.displayName
    };

    var cipherVfUser = encryptData(vfUser)

    // Encrypt and set the viafoura User Object
    setCookie('vCookie', cipherVfUser);

    // Publish Viafoura Event
    if (window.vf && window.vf.session) {
      setTimeout(function() {
        window.vf.session.login.cookie(cipherVfUser);
        console.log('\n**** Updated vf.session ****');
      }, 2000)
    }

    return true

  } catch (err) {
    console.trace(err);
    pmnLogger('error', 'updateUserByKeys ', err.message, true);

    return false;
  }
}

//=====================
// VIAFOURA FUNCTIONS
//=====================

/**
 * Pushes provided data to key event to PMNdataLayer
 *
 * @param event
 * @param data
 */
function pushEventToDataLayer (event, data) {
  if (PMNdataLayer) {
    pmnLogger('info', 'Pushing to Data Layer', data, false);

    event = event.toString().trim();

    if (event === '') {
      throw new Error('[PMNdataLayer]: event name required');
    }

    if (data === undefined || data === null) {
      data = 'No Data was provided';
    }

    // Set data layer vfEvents Array key if empty
    if (!PMNdataLayer[0].analytics.vfEvents) {
      PMNdataLayer[0].analytics.vfEvents = [];
    }

    switch (event) {
      case 'vfUser':
        PMNdataLayer[0].analytics.vfUser = data;
        break;
      case 'social-share':
        PMNdataLayer.push({
          "event": event,
          "socialPlatform": data
        });
        break;
      case 'comment':
        PMNdataLayer.push({
          "event": event,
          "commentAction": data
        });
        break;
      default:
        PMNdataLayer.push({
          event: event,
          action: data
        });
    }
  }
}

/**
 * Returns Commenter User Object by reading vCookie
 *
 * @returns {*}
 */
function getViafouraUser () {
  var commenter = null;
  var vCookie = readCookie('vCookie');

  if (vCookie !== undefined || vCookie !== null || vCookie !== '') {
    commenter = decryptData(vCookie);

    if (commenter) {
      commenter = commenter[0];
    }
  }

  return commenter;
}

/**
 * Activate user session
 */
function loadVfUserSession () {
  var cookie = readCookie('vCookie');

  if (cookie !== '' || cookie !== null || cookie !== undefined) {
    window.vf.session.login.cookie(cookie)
    .then(function () {
      pmnLogger('info', 'Viafoura Session Login', 'success', false);
      return true;
    })
    .catch(function (err) {
      pmnLogger('error', 'Viafoura Session Login', err, true);
      return false;
    });
  }
}

/**
 * Display Comment widget
 */
function viewComments () {
  pmnLogger('info', 'View Comments', 'click', false);

  var commentWidget = document.getElementById('commenting-widget');
  var btnViewComments = document.querySelector('.btn-comments-view');
  var btnCloseComments = document.querySelector('.btn-comments-close');
  var authText = document.querySelector('.vf-login-signup');

  window.vf.context.get('user')
  .then(function (user) {
    console.log('\n>>>> Prepared to comment as: [name]', user.name);

    btnViewComments.setAttribute('style', 'display:none'); // Hide: View Comments
    btnCloseComments.setAttribute('style', 'display:flex'); // Show: Close Comments
    commentWidget.classList.remove('hide');

    if (user.name === 'Guest') {
      console.log('\n>>>> Viafoura Recognizes you as Guest <<<<');

      var avatar = document.querySelector('.vf-comment-user');
      var commenterName = document.querySelector('.vf-comment-form-name');
      var commentForm = document.querySelector('.vf-comment-form');
      var bellIcon = document.querySelector('.vf-tray-trigger');

      avatar.setAttribute('style', 'display:none');
      commenterName.setAttribute('style', 'display:none');
      commentForm.setAttribute('style', 'display:none');
      bellIcon.setAttribute('style', 'display:none');
    } else {
      authText.classList.add('hide'); // Hide Log in, Sign up text
    }
  })
  .catch(function (err) {
    pmnLogger('error', 'ERROR - vf context user', err, true);
  });
}

/**
 * Hide Comment widget
 */
function closeComments () {
  pmnLogger('info', 'Close Comments', 'click', false);

  var commentWidget = document.getElementById('commenting-widget');
  var btnViewComments = document.querySelector('.btn-comments-view');
  var btnCloseComments = document.querySelector('.btn-comments-close');
  var authText = document.querySelector('.vf-login-signup');

  commentWidget.classList.add('hide');
  btnCloseComments.setAttribute('style', 'display: none');
  btnViewComments.setAttribute('style', 'display: flex');

  // Hide b.c viewComments() will check if to redisplay
  authText.classList.remove('hide');
}


//=====================================
//  DOM MANIPULATION FUNCTIONS
//=====================================

/**
 * Removes text in a button, queries by #id
 *
 * @param {string} id Element to be cleared
 */
function clearElementTextById (id) {
  $('#' + id.toString()).text('');
}

/**
 * Appends text to an element
 * @param {string} id Element to query
 * @param {string} text
 */
function addElementTextById (id, text) {
  if (id === undefined || id === null || id === '') {
    throw new Error('Can not query for element without field: id');
  }

  if (text === undefined || text === null) {
    throw new Error('Adding text to an element requires valid text. If clearing text, call: clearElementById();');
  }

  var elementId = '#' + id;
  //var element = document.querySelector(elementId);
  var element = $(elementId);

  // No element found - throw Error
  if (element === undefined || element === null) {
    throw new Error('Could not find element by id: ' + elementId);
  }

  // Add text to element
  element.text(text.toString());
}


//=====================================
//  LOADER FUNCTIONS
//=====================================

/**
 * Hides loader on login || profile button
 *
 * @param selector
 */
function hideLoaderById (selector) {
  var loader = document.querySelector('#' + selector);
  var classes = loader.classList;

  classes.add('hide');

  if (classes.contains('hide')) {
    hideMobileIcon();
  } else {
    showMobileIcon();
  }
}

/**
 * Hide transparent mobile user icon
 */
function hideMobileIcon () {
  $('.loader').parent().removeClass('bg--none');
}

/**
 * Display transparent mobile user icon
 */
function showMobileIcon () {
  $('.loader').parent().addClass('bg--none');
}


//=====================================
//  SUBSCRIBE BAR & DROPDOWN FUNCTIONS
//=====================================

/**
 * Removes hide class from subscribe bar
 */
function showSubscribeBar () {
  var subscribeBar = $('.subscribetoday__wrap'); // Entire Subscribe bar
  subscribeBar.removeClass('hide');
}

/**
 * Hides subscribe bar
 */
function hideSubscribeBar () {
  var subscribeBar = $('.subscribetoday__wrap'); // Entire Subscribe bar
  subscribeBar.addClass('hide');
}

/**
 * Removes hide class from subscribe button
 */
function showSubscribeButton () {
  var subscribeButton = $('.subscriber--btn'); // Entire Subscribe button
  subscribeButton.removeClass('hide');
}

/**
 * Hides subscribe button
 */
function hideSubscribeButton () {
  var subscribeButton = $('.subscribe--btn'); // Entire Subscribe button
  subscribeButton.addClass('hide');
}


/**
 * Show dropdown menu for Subscribers
 */
function showSubscribedDropdown () {
  var content = $('.content');
  content.addClass('is-subscriber');
}

/**
 * Hide dropdown menu for Subscribers. Show dropdown for Logged Out users
 */
function hideSubscribedDropdown () {
  var content = $('.content');
  content.removeClass('is-subscriber');
}

/**
 * Display / hide elements providing: Logged Out UX
 */
function displayLoggedOutUX () {
  showSubscribeBar();
  showSubscribeButton();

  $('.profilelink').addClass('hide'); // Hide profile button
  $('.signinlink').removeClass('hide'); // Show Log In button element
  $('.content').removeClass('menu-is-active');
  $('.content').removeClass('account-is-active');
  hideLoaderById('loginLoader');
  addElementTextById('loginText', 'Log In'); // Add text to button element
}

/**
 * Display / hide elements providing: Logged In UX
 */
function displayLoggedInUX () {
  var subscribeBar = $('.subscribetoday__wrap');

  if (subscribeBar.hasClass('hide')) {
    subscribeBar.removeClass('hide');
  }

  var subscribeButton = $('.subscriber--btn');

  if (subscribeButton.hasClass('hide')) {
    subscribeButton.removeClass('hide');
  }

  $('.signinlink').addClass('hide');
  $('.profilelink').removeClass('hide');

  hideLoaderById('profileLoader');
  var auth0_user;
  auth0_user = getDecryptedUser();

  if (auth0_user) {
    if (auth0_user.email != null) {
      var auth0_email = auth0_user.email.substring(0,8)+'...';
      addElementTextById('profileText', auth0_email);
    }
  } else {
    addElementTextById('profileText', 'My Account');
  }
}

/**
 * Display / hide elements providing the Subscribed user experience
 */
function displaySubscribedUX () {
  hideSubscribeBar();

  $('.signinlink').addClass('hide');
  $('.subscriber--btn').addClass('hide');
  $('.profilelink').removeClass('hide');

  hideLoaderById('profileLoader');
  var auth0_user;
  auth0_user = getDecryptedUser();

  if (auth0_user) {
    if (auth0_user.email != null) {
      var auth0_email = auth0_user.email.substring(0,8)+'...';
      addElementTextById('profileText', auth0_email);
    }
  } else {
    addElementTextById('profileText', 'My Account');
  }

  showSubscribedDropdown();
}


//=====================================
//  API FUNCTIONS
//=====================================

/**
 * Call an API endpoint
 *
 * @param method GET, POST, UPDATE, DELETE
 * @param endpoint Route hitting
 * @param secure Determines use of Authorization Bearer Header
 * @param data If required in a POST
 * @param callback
 */
function callAPI (method, endpoint, secure, data, callback) {
  if (method === undefined) {
    throw new Error('Must provide method for calling an API');
  }

  if (endpoint === undefined) {
    throw new Error('Must provide an endpoint to call an API');
  }

  if (secure === undefined) {
    secure = false;
  }

  var uri = endpoint;
  var xhr = new XMLHttpRequest();
  xhr.open(method, uri);

  // Set Authorization Header
  if (secure) {
    xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
    xhr.setRequestHeader('Site-Code', 'PHL');

    if (env === 'dev' || env === 'stage') {
      xhr.setRequestHeader('Environment', 'stage');
    }
  }

  xhr.onload = function () {
    if (xhr.status === 200) {
      callback(null, xhr.response);
    } else {
      pmnLogger('error', 'Call API', xhr.response, true);
      callback(xhr.response);
    }
  };

  // Send Request
  xhr.send();
}

/**
 * Gets user, call subscription api via callAPI()
 *
 * @returns {*}
 */
function callSubscriptionAPI () {
  var user = getDecryptedUser();

  if (user === null) {
    return null;
  }

  var uri = null;

  // Set request URI for MG2 to match current env
  if (env ==='dev' || env === 'stage') {
    uri = 'https://stage-connext-api.azurewebsites.net/api/user/id/';
  } else {
    uri = 'https://api.mg2connext.com/api/user/id/';
  }

  // Append user auth0 id to request
  uri += user.auth0Id;

  callAPI('GET', uri, true, null, function (error, response) {
    if (error) {
      pmnLogger('error', 'Error callAPI', error, true);
      return error.message;
    }

    var data = JSON.parse(response);
    pmnLogger('info', 'Subscription API Response', data, true);

    if (data && data.DigitalAccess && data.DigitalAccess.Errors === null) {
      updateUserByData(data);
    }
  });
}

function fetchUserProfile () {
  let apiUri = null;

  // Set API endpoint
  switch (window.env) {
    case 'dev':
      apiUri = 'dev.otto.philly.com:7198';
      break;
    case 'stage':
      apiUri = 'stage.otto.philly.com:7198';
      break;
    default:
      apiUri = 'apsping2.philly.com:7198';
  }

  let uri = '';
  let user = getDecryptedUser();

  if (user && user.auth0Id) {
    uri = 'http://' + apiUri + '/api/users/' + user.auth0Id;
    console.log('\nFetching User Profile via API URI: ', uri);

    let xhr = new XMLHttpRequest();

    xhr.open('GET', uri);

    xhr.onload = function () {
      if (xhr.status === 200) {
        console.log('\n**** Fetching User Profile ****', JSON.parse(xhr.response));

        // Update User Cookies
        updateUserByKeys(JSON.parse(xhr.response));
      } else {
        console.log('\n[FETCH STATUS CODE]: fetchUserProfile', xhr.response);
      }
    };

    xhr.onerror = function () {
      console.log('\n!!!! [ERROR]: fetchUserProfile');
    };

    xhr.send();
  }
}

// BEGIN Sticky Nav
window.stickyNavLastYOffset = 0;
window.headerTopPosition = 0;

function UpdateNavPosition() {
  var offset = window.pageYOffset < 0? 0: window.pageYOffset;
  var headerOffset = $('#header').offset().top;
  var minHeight = $('#header .header--primary').height() + $('#header .progress').height();
  var scrolledDelta = offset - stickyNavLastYOffset;

  if (window.innerWidth < 750) {
    minHeight = $('#header').height();
  }
  // Scroll down
  if (scrolledDelta > 0) {
    var newPosition = headerTopPosition + scrolledDelta;
    headerTopPosition = (newPosition < minHeight)? newPosition : minHeight;
    $('#header').css('top', -headerTopPosition + 'px');
  } else {
    // Scroll up
    var newPosition = headerTopPosition + scrolledDelta;
    headerTopPosition = (newPosition > 0)? newPosition : 0;
    $('#header').css('top', -headerTopPosition + 'px');
  }

  stickyNavLastYOffset = offset;
}

$(document).ready(function() {
  window.addEventListener('scroll', function() {
    UpdateNavPosition();
  });

  window.addEventListener('resize', function() {
    UpdateNavPosition();
  });
});
// END Sticky Nav
