/*global H5P*/
H5P.Tooltip = (function (EventDispatcher) {
  "use strict";

  /**
   * Create an accessible tooltip
   * 
   * @param {HTMLElement} triggeringElement The element that should trigger the tooltip
   * @param {Object} options Options for tooltip
   * @param {String} options.text The text to be displayed in the tooltip
   *  If not set, will attempt to set text = aria-label of triggeringElement
   * @param {String[]} options.classes Extra css classes for the tooltip
   * @param {Boolean} options.ariaHidden Whether the hover should be read by screen readers or not
   * @param {String} options.position Where the tooltip should appear in relation to the 
   *  triggeringElement. Accepted positions are "top" (default), "left", "right" and "bottom"
   * 
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
    options.text = options.text || triggeringElement.ariaLabel || '';
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

    // Set the initial position based on options.position
    switch (options.position) {
      case "left":
        tooltip.classList.add('h5p-tooltip-left');
        break;
      case "right":
        tooltip.classList.add('h5p-tooltip-right');
        break;
      case "bottom":
        tooltip.classList.add('h5p-tooltip-bottom');
        break;
      default:
        options.position = "top";
    }

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
      const availableHeight = document.getElementsByClassName('h5p-container')[0].clientHeight;
      const tooltipWidth = tooltip.offsetWidth;
      const tooltipOffsetTop = tooltip.offsetTop;
      const triggerWidth = triggeringElement.clientWidth;
      const triggerHeight = triggeringElement.clientHeight;
      const offsetLeft = triggeringElement.offsetLeft;
      const offsetTop = triggeringElement.offsetTop;
      const position = options.position;

      let adjusted = false;

      // Going out of screen on left side
      if ((position === "left" && (offsetLeft < tooltipWidth)) ||
        (offsetLeft + triggerWidth < tooltipWidth)) {
        tooltip.classList.add('h5p-tooltip-adjusted-right');
        tooltip.classList.remove('h5p-tooltip-adjusted-left');
        adjusted = true;
      }
      // Going out of screen on right side
      else if ((position === "right" && (offsetLeft + triggerWidth + tooltipWidth > availableWidth)) ||
        (offsetLeft + tooltipWidth > availableWidth)) {
        tooltip.classList.add('h5p-tooltip-adjusted-left');
        tooltip.classList.remove('h5p-tooltip-adjusted-right');
        adjusted = true;
      }

      // going out of top of screen
      if ((position === "top" && (offsetTop < -tooltipOffsetTop)) ||
        (offsetTop < tooltipOffsetTop)) {
        tooltip.classList.add('h5p-tooltip-adjusted-down');
        tooltip.classList.remove('h5p-tooltip-adjusted-up');
        adjusted = true;
      }
      // going out of bottom of screen
      else if ((position === "bottom" && (offsetTop + tooltipOffsetTop + tooltip.clientHeight > availableHeight)) ||
        (offsetTop + triggerHeight + tooltipOffsetTop > availableHeight)) {
        tooltip.classList.add('h5p-tooltip-adjusted-up');
        tooltip.classList.remove('h5p-tooltip-adjusted-down');
        adjusted = true;
      }

      // Reset adjustments
      if (!adjusted) {
        tooltip.classList.remove('h5p-tooltip-adjusted-down');
        tooltip.classList.remove('h5p-tooltip-adjusted-up');
        tooltip.classList.remove('h5p-tooltip-adjusted-left');
        tooltip.classList.remove('h5p-tooltip-adjusted-right');
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
