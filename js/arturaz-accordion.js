if (Object.isUndefined(Arturaz))
  Arturaz = {};
if (Object.isUndefined(Arturaz.Effect))
  Arturaz.Effect = {};
Arturaz.Effect.BlindLeft = function(element) {
  element = $(element);
  element.makeClipping();
  return new Effect.Scale(element, 0,
    Object.extend({ scaleContent: false,
      scaleY: false,
      scaleMode: 'box',
      scaleContent: false,
      restoreAfterFinish: true,
      afterSetup: function(effect) {
        effect.element.makeClipping().setStyle({
          height: effect.dims[0] + 'px'
        }).show();
      },
      afterFinishInternal: function(effect) {
        effect.element.hide().undoClipping();
      }
    }, arguments[1] || { })
  );
};
 
Arturaz.Effect.BlindRight = function(element) {
  element = $(element);
  var elementDimensions = element.getDimensions();
  return new Effect.Scale(element, 100, Object.extend({
    scaleContent: false,
    scaleY: false,
    scaleFrom: 0,
    scaleMode: {originalHeight: elementDimensions.height, originalWidth: elementDimensions.width},
    restoreAfterFinish: true,
    afterSetup: function(effect) {
      effect.element.makeClipping().setStyle({
        width: '0px',
        height: effect.dims[0] + 'px'
      }).show();
    },
    afterFinishInternal: function(effect) {
      effect.element.undoClipping();
    }
  }, arguments[1] || { }));
};

Arturaz.Accordion = Class.create();
Arturaz.Accordion.lastId = 0;
Arturaz.Accordion.prototype = {
  // Create accordion for given base element.
  // 
  // Written for Prototype 1.6.0.2 and scriptaculous effects v1.8.1
  // 
  // Author: Artūras Šlajus, <x11@arturaz.net>
  // 
  // Find all "toggles" and "contents" by css selector and set active one.
  // use toggleSelector and contentSelector to override default selectors
  // (which are class names).
  // 
  // Default css classes:
  //   vertical type:
  //     accordion_toggle, accordion_toggle_active, accordion_content, 
  //     accordion_content_active
  //   horizontal type:
  //     horizontal_accordion_toggle, horizontal_accordion_toggle_active,
  //     horizontal_accordion_content, horizontal_accordion_content_active
  //     
  // Active classes are set by accordion, they're not used internally at all.
  // Use either activeToggle (you should pass id or element) or activeIndex
  // (defaults to 0).
  // 
  // Supports 'vertical' (default) and 'horizontal' types (type option).
  //
  // Pass your own functions as hideContentAnimator/showContentAnimator to use
  // custom animations.
  //
  // Pass false to animate option to don't use animation.
  //
  // Write some docs for this and slap me for lazyness but you'll have to either
  // ask me (<x11@arturaz.net>) or analyze the source for understanding how this
  // works.
  //
  // Patches are welcome. Github pull request prefered.
  initialize: function(base, options) {
    this.base = $(base)
    this.uniqueId = Arturaz.Accordion.lastId++;
    this.activeToggle = null;
    this.activeContent = null;
    this.options = Object.extend({
      type: 'vertical',      
      onEvent: 'click',
      activeToggle: null,
      activeIndex: 0,
      animate: true,
      duration: 0.4,
      hideContentAnimator: this.hideContentAnimator.bind(this),
      showContentAnimator: this.showContentAnimator.bind(this)
    }, options || {});
    if (this.options.type == 'vertical')
      this.options = Object.extend({
        toggleClass: 'accordion_toggle',
        activeToggleClass: 'accordion_toggle_active',
        contentClass: 'accordion_content',
        activeContentClass: 'accordion_content_active'
      }, this.options);
    else
      this.options = Object.extend({
        toggleClass: 'horizontal_accordion_toggle',
        activeToggleClass: 'horizontal_accordion_toggle_active',
        contentClass: 'horizontal_accordion_content',
        activeContentClass: 'horizontal_accordion_content_active'
      }, this.options);
    this.options = Object.extend({
      toggleSelector: "." + this.options.toggleClass,
      contentSelector: "." + this.options.contentClass
    }, this.options);
    
    this.getToggles();
    this.getContents();
    
    this.registerEventHandlers();
    this.hideAll();
    if (this.options.activeToggle)
      this.selectContentByToggle(this.options.activeToggle, false);
    else
      this.selectContentByIndex(this.options.activeIndex, false);
  },
  
  getToggles: function() {    
    this.toggles = this.base.select(this.options.toggleSelector);
    this.reindex(this.toggles);
  },
  
  getContents: function() {    
    this.contents = this.base.select(this.options.contentSelector);
    this.reindex(this.contents);
  },
  
  reindex: function(what) {
    var i = 0;
    what.each(function(content) {
      content.accordionIndex = i;
      i++;
    });
  },
  
  registerEventHandlers: function() {
    this.toggles.invoke('observe', this.options.onEvent, 
      this.toggleActivated.bindAsEventListener(this));
  },
  
  toggleActivated: function(event) {
    this.selectContentByToggle(event.element());
  },
  
  findContentByToggle: function(toggle) {
    return this.contents[toggle.accordionIndex];
  },
  
  selectContentByToggle: function(toggle, animate) {
    this.selectContent(toggle, this.findContentByToggle(toggle), animate);
  },
  
  selectContentByIndex: function(index, animate) {
    this.selectContent(this.toggles[index], this.contents[index], animate);
  },
  
  // Select current active content block.
  //
  // Receives toggle that was pressed and new content that should be shown.
  //
  // Third param allows us to override this.options.animate.
  selectContent: function(newActiveToggle, newActiveContent, animate) {
    // Don't do anything if we pressed on active toggle.
    if (this.activeToggle == newActiveToggle)
      return;
    
    // Should we animate?
    animate = (typeof(animate) == "undefined") ? this.options.animate : animate
    
    // Unflag active toggle
    if (this.activeToggle) { // is null on first run
      this.activeToggle.removeClassName(this.options.activeToggleClass);
      this.activeToggle = null;
    }
    
    // Hide active content.
    if (this.activeContent) { // is null on first run
      this.activeContent.removeClassName(this.options.activeContentClass);
      if (animate)
        this.options.hideContentAnimator(this.activeContent);
      else
        this.activeContent.hide();
      this.activeContent = null;
    }
    
    // Flag new toggle
    newActiveToggle.addClassName(this.options.activeToggleClass);
    this.activeToggle = newActiveToggle;
    
    // Make new content as active content
    newActiveContent.addClassName(this.options.activeContentClass);
    if (animate)
      this.options.showContentAnimator(newActiveContent);
    else
      newActiveContent.show();
    this.activeContent = newActiveContent;
  },
  
  hideAll: function() {
    this.contents.invoke('hide');
  },
  
  // Default method for hiding content.
  hideContentAnimator: function(content) {
    queue = {position: 'end', scope: 'accordion_hide_' + this.uniqueId }
    
    if (this.options.type == 'vertical')
      Effect.BlindUp(content, {duration: this.options.duration, queue: queue});
    else
      Arturaz.Effect.BlindLeft(content, 
        {duration: this.options.duration, queue: queue});
  },
  
  // Default method for showing content.
  showContentAnimator: function(content) {
    queue = {position: 'end', scope: 'accordion_show_' + this.uniqueId }
    
    if (this.options.type == 'vertical')
      Effect.BlindDown(content, {duration: this.options.duration, queue: queue});
    else
      Arturaz.Effect.BlindRight(content, 
        {duration: this.options.duration, queue: queue});
  }
};
