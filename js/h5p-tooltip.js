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

    // Function used by the escape listener
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
    triggeringElement.addEventListener('mouseenter', function () {
      showTooltip(true);
    });
    triggeringElement.addEventListener('mouseleave', function () {
      hideTooltip(true);
    });
    triggeringElement.addEventListener('focusin', function () {
      showTooltip(false);
    });
    triggeringElement.addEventListener('focusout', function () {
      hideTooltip(false);
    });

    /**
     * Makes the tooltip visible and activates it's functionality
     * 
     * @param {Boolean} triggeredByHover True if triggered by mouse, false if triggered by focus
     */
    const showTooltip = function (triggeredByHover) {
      if (triggeredByHover) {
        self.hover = true;
      }
      else {
        self.focus = true;
      }
      
      tooltip.classList.add('h5p-tooltip-visible');

      // Add listener to iframe body, as esc keypress would not be detected otherwise
      document.body.addEventListener('keydown', escapeFunction, true);

      // Ensure that all of the tooltip is visible
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
    }

    /**
     * Hides the tooltip and removes listeners
     *
     * @param {Boolean} triggeredByHover True if triggered by mouse, false if triggered by focus
     */
     const hideTooltip = function (triggeredByHover) {
      if (triggeredByHover) {
        self.hover = false;
      }
      else {
        self.focus = false;
      }

      // Only hide tooltip if neither hovered nor focused
      if (!self.hover && !self.focus) {   
        tooltip.classList.remove('h5p-tooltip-visible');

        // Remove iframe body listener
        document.body.removeEventListener('keydown', escapeFunction, true);
      }
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
