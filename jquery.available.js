(function (window, document, $) {
  
  var doc       = $(document),
      listeners = [],
      timer;
  
  /**
   * checkReady
   */
  function checkReady (elem) {

    var next;

    // climb the DOM until we find a nextSibling or the document
    while (elem && !(next = elem.nextSibling) &&
      (elem = elem.parentNode) && elem.nodeType !== 9) {}
      
    return !!next;
  }
  
  /**
   * checkAvailable
   */
  function checkAvailable () {
    
    var i, n, listener, elem;
    
    // Reset the timer
    timer = null;
    
    for (i = 0, n = listeners.length; i < n; ++i) {

      listener = listeners[i];

      // check for existence of DOM elements for given selector
      elem = $(listener.selector);

      // decrement the number of attempts
      listener.attempts--;

      // if element is found or attempts have been exhausted or DOM is ready
      if ((elem.length && (!listener.checkReady || (listener.checkReady && ($.isReady || checkReady(elem[0]))))) || !listener.attempts) {

        // listener.attempts && console.info('found ' + listener.selector);
        // !listener.attempts && console.warn('did not find ' + listener.selector);

        // only execute callback if element was found
        if (elem.length) {
          listener.callback(); // scope to dom el?
        }

        // remove the listener from the stack
        listeners.splice(i, 1);
        
        // after splice, decrement the count so we don't skip a listener 
        --i; 
        
        // after splice, decrement the size to account for spliced listener
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
  };

  // Public static default settings
  $.available.interval = 50;
  $.available.attempts = 1000;

})(this, this.document, this.jQuery);
