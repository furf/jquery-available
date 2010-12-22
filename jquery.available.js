/*!
 * jQuery.available
 * @author Dave Furfero
 * @version 0.2.20101222
 *
 * A jQuery plugin for detection of the readiness of DOM elements as the page
 * is loading.
 *
 */
(function (window, document, $) {

  var origReady = $.fn.ready,
      listeners = [],
      timer;

  /**
   * @name checkReady
   * @private
   *
   * @description Climbs the DOM, starting at the specified element, looking
   *   for a nextSibling which would, in theory, indicate that the element and
   *   all of its contents have been loaded.
   *
   * @warning If any elements (including text nodes) have been dynamically
   *   inserted into the DOM _after_ the specified element, this method will
   *   return a false positive. So please don't do that.
   *
   * @param {HTMLElement} elem HTML element to check for "readiness"
   * @return {Boolean} whether or not the element, or any of its ancestors,
   *   has a nextSibling
   */
  function checkReady (elem) {

    var next;

    // Climb until we find a nextSibling or reach the document root
    while (elem && !(next = elem.nextSibling) &&
      (elem = elem.parentNode) && elem.nodeType !== 9) {}

    return !!next;
  }

  /**
   * @name checkAvailable
   * @private
   *
   * @description Polls the DOM for the presence of at least one element
   *   matching each of the specified selectors. When an element is found, the
   *   corresponding callback is executed and the listener is removed from the 
   *   stack. If a matching element is not found after the default number of 
   *   attempts, the listener is removed from the stack.
   */
  function checkAvailable () {

    var i, n, listener, elem;

    // Reset the polling timer
    timer = null;

    for (i = 0, n = listeners.length; i < n; ++i) {

      listener = listeners[i];

      // Check for presence of at least one element in the DOM matching the
      // selector specified by the listener.
      elem = $(listener.selector)[0];

      // Decrement the number of attempts for this listener 
      listener.attempts--;

      // If a selector is matched, or the number of attempts for the selector
      // has been exhausted, or the DOM is ready, remove the listener from the
      // stack and fire the callback if the selector was matched.
      //       
      // @todo If listener.checkReady is true for a call made after $.isReady,
      // checkReady will essentially == false as the checkReady function will
      // never be called. Consider using an internal isReady to ignore the
      // original and allow post-ready calls to continue to check until found
      // or exhausted. This is an EDGE CASE. The functionality of $.available
      // is intended to be used while the document is loading. But there may
      // be other post-ready uses, so I'm noting this for later consideration.
      if ((elem && (!listener.checkReady || (listener.checkReady &&
          ($.isReady || checkReady(elem))))) || !listener.attempts) {

        // Execute the callback if an element was found
        elem && listener.callback.call(elem, $);

        // Remove the listener from the stack
        listeners.splice(i, 1);

        // After splice, decrement the count so we don't skip a listener and 
        // decrement the size of the loop to account for the removed listener
        --i;
        --n;
      }
    }

    // If there are other listeners, check again at specified interval
    if (listeners.length) {
      timer = window.setTimeout(checkAvailable, $.available.interval);
    }
  }

  /**
   * $.available
   *
   * @example
   * // Lazy-loading content into an empty element as soon as it's available
   * $.available('#myContentDiv', function () {
   *   $('#myContentDiv').load('myContent.html');
   * });
   *
   * @example
   * // Enabling progressively-enhanced behavior on an element as soon as 
   * // it is ready (complete with contents)
   * $.available('#myTabs', true, function () {
   *   $('#myTabs).tabs();
   * });
   * 
   * @param {String|jQuery|HTMLElement} elem element to look for in the DOM
   *   while the page loads
   * @param {Boolean} checkReady (optional) whether or not to check that the
   *   contents of the element have completely loaded
   * @param {Function} callback function to be executed when the element is
   *   available/ready
   */
  $.available = function (elem, checkReady, callback) {

    if ($.isFunction(checkReady)) {
      callback   = checkReady;
      checkReady = false;
    }

    // Add a listener object
    listeners.push({
      selector:   elem.selector || elem,
      callback:   callback,
      checkReady: checkReady,
      attempts:   $.available.attempts
    });

    // See if selector is already present and/or start polling
    !timer && checkAvailable();

    return elem;
  };


  /**
   * @type {Number}
   * @public
   * @static
   * @description Amount of time (in milliseconds) between attempts
   */
  $.available.interval = 50;


  /**
   * @type {Number}
   * @public
   * @static
   * @description Number of times to try to locate an element in the DOM
   */
  $.available.attempts = 5000;


  /**
   * @name jQuery.fn.available
   * @public
   *
   * @description A "convenience" method to provide access to $.available
   *   via the more familiar jQuery syntax. 
   *
   * @warning This method contains the unnecessary overhead of making an
   *   initial collection when it can be reasonably assumed that this method
   *   is being called before this collection would contain any members. It is 
   *   preferred that you use $.available(selector, callback) for efficiency.
   *
   * @param {Function} callback function to be executed when the element is
   *   available (but not necessarily complete)
   */
  $.fn.available = function (callback) {
    return $.available(this, false, callback);
  };


  /**
   * @name jQuery.fn.ready
   * @public
   *
   * @description A donkey punch to override default jQuery.fn.ready
   *   functionality with a more complete notion of "ready". If the first 
   *   member of the collection is document, we assume traditional usage and
   *   execute the callback on DOMReady. Otherwise, we use $.available and 
   *   execute the callback when the element is available and complete.
   *
   * @warning This method contains the unnecessary overhead of making an
   *   initial collection when it can be reasonably assumed that this method
   *   is being called before this collection would contain any members. It is 
   *   preferred that you use $.available(selector, true, callback) for
   *   efficiency.
   *
   * @param {Function} callback function to be executed when the element is
   *   ready
   */
  $.fn.ready = function (callback) {
    return (this[0] === document) ? origReady(callback) :
      $.available(this, true, callback);
  };


})(this, this.document, this.jQuery);
