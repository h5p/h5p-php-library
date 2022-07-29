/*global H5P*/
H5P.Tooltip = (function (EventDispatcher) {
  "use strict";

  /**
   * Create an accessible tooltip
   * 
   * @param {HTMLElement} triggeringElement The element that should trigger the tooltip
   * @param {Object} options Options for tooltip
   * @param {String} options.text The text to be displayed in the tooltip
   * @param {String[]} options.classes Extra css classes for the tooltip
   * @param {Boolean} options.ariaHidden Whether the hover should be read by screen readers or not
   * @constructor
   */
  function Tooltip(triggeringElement, options) {
    EventDispatcher.call(this);
    
    /** @alias H5P.Tooltip */
    let self = this;

    // Make sure tooltips have unique id
    H5P.Tooltip.uniqueId += 1;
    const tooltipId = "h5p-tooltip-" + H5P.Tooltip.uniqueId;

    // Default options
    options = options || {};
    options.text = options.text || '';
    options.classes = options.classes || [];
    options.ariaHidden = options.ariaHidden || false;

    // Initiate state
    this.hover = false;
    this.focus = false;

    // Declare constants for event listeners
    const iframeBody = document.getElementsByTagName('body')[0];

    const escapeFunction = function (e) {
      if (e.key === 'Escape') {
        tooltip.classList.remove('h5p-tooltip-visible');
      }
    }

    // Create element
    const tooltip = document.createElement('div');

    tooltip.classList.add('h5p-tooltip');
    tooltip.id = tooltipId;
    tooltip.role = 'tooltip';
    tooltip.innerHTML = options.text;
    tooltip.ariaHidden = options.ariaHidden;
    options.classes.forEach(extraClass => {
      tooltip.classList.add(extraClass);
    });

    triggeringElement.appendChild(tooltip);

    // Aria-describedby will override aria-hidden
    if (!options.ariaHidden) {
      triggeringElement.setAttribute('aria-describedby', tooltipId);
    }
    
    //Add event listeners to triggeringElement
    triggeringElement.onmouseenter = function () {
      tooltip.classList.add('h5p-tooltip-visible');
      self.ensureTooltipVisible();
      self.hover = true;
      self.listenForEscape();
    }
    triggeringElement.onmouseleave = function () {
      // Only hide tooltip if not focused
      if(self.focus === false) {
        tooltip.classList.remove('h5p-tooltip-visible');
        self.stopListeningForEscape();
      }
      self.hover = false;
    }
    triggeringElement.addEventListener('focusin', function () {
      tooltip.classList.add('h5p-tooltip-visible');
      self.ensureTooltipVisible();
      self.focus = true;
      self.listenForEscape();
    });
    triggeringElement.addEventListener('focusout', function () {
      // Only hide tooltip if not hovered
      if(self.hover === false) {
        tooltip.classList.remove('h5p-tooltip-visible');
        self.stopListeningForEscape();
      }
      self.focus = false;
    });

    /**
     * Ensures that all of the tooltip is visible
     */
    this.ensureTooltipVisible = function () {
      const availableWidth = document.body.clientWidth;
      const tooltipWidth = tooltip.offsetWidth;
      const triggeringElementWidth = triggeringElement.clientWidth;
      const triggeringElementOffsetLeft = triggeringElement.offsetLeft;

      // Going out of screen on left side
      if (triggeringElementOffsetLeft + triggeringElementWidth < tooltipWidth) {
        tooltip.classList.add('h5p-tooltip-left');
        tooltip.classList.remove('h5p-tooltip-right');
      }
      // Going out of screen on right side
      else if ((triggeringElementOffsetLeft + tooltipWidth) > availableWidth) {
        tooltip.classList.add('h5p-tooltip-right');
        tooltip.classList.remove('h5p-tooltip-left');
      }
      else {
        tooltip.classList.remove('h5p-tooltip-right');
        tooltip.classList.remove('h5p-tooltip-left');
      }
    };

    /**
     * Add listener to iframe body, as esc keypress would not be detected otherwise 
     */
    this.listenForEscape = function () {
      iframeBody.addEventListener('keydown', escapeFunction, true);
    }

    /**
     * Remove iframe body listener
     */
     this.stopListeningForEscape = function () {
      iframeBody.removeEventListener('keydown', escapeFunction, true);
    }
    
    /**
     * Retrieve tooltip
     *
     * @return {HTMLElement}
     */
    this.getElement = function () {
      return tooltip;
    };
  }

  Tooltip.prototype = Object.create(EventDispatcher.prototype);
  Tooltip.prototype.constructor = Tooltip;

  return Tooltip;

}(H5P.EventDispatcher));

H5P.Tooltip.uniqueId = -1;
