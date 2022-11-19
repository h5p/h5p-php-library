/*global H5P*/
H5P.Tooltip = (function () {
  'use strict';

  // Position (allowed and default)
  const Position = {
    allowed: ['top', 'bottom', 'left', 'right'],
    default: 'top'
  };

  /**
   * Create an accessible tooltip
   *
   * @param {HTMLElement} triggeringElement The element that should trigger the tooltip
   * @param {Object} options Options for tooltip
   * @param {String} options.text The text to be displayed in the tooltip
   *  If not set, will attempt to set text = aria-label of triggeringElement
   * @param {String[]} options.classes Extra css classes for the tooltip
   * @param {Boolean} options.ariaHidden Whether the hover should be read by screen readers or not (default: true)
   * @param {String} options.position Where the tooltip should appear in relation to the
   *  triggeringElement. Accepted positions are "top" (default), "left", "right" and "bottom"
   *
   * @constructor
   */
  function Tooltip(triggeringElement, options) {
    // Make sure tooltips have unique id
    H5P.Tooltip.uniqueId += 1;
    const tooltipId = 'h5p-tooltip-' + H5P.Tooltip.uniqueId;

    // Default options
    options = options || {};
    options.classes = options.classes || [];
    options.ariaHidden = options.ariaHidden || true;
    options.position = (options.position && Position.allowed.includes(options.position)) 
      ? options.position
      : Position.default;

    // Initiate state
    let hover = false;
    let focus = false;

    // Function used by the escape listener
    const hideOnEscape = function (event) {
      if (event.key === 'Escape') {
        tooltip.classList.remove('h5p-tooltip-visible');
      }
    };

    // Create element
    const tooltip = document.createElement('div');

    tooltip.classList.add('h5p-tooltip');
    tooltip.id = tooltipId;
    tooltip.role = 'tooltip';
    tooltip.innerHTML = options.text || triggeringElement.getAttribute('aria-label') || '';
    tooltip.setAttribute('aria-hidden', options.ariaHidden);
    tooltip.classList.add(...options.classes);

    triggeringElement.appendChild(tooltip);
    //document.body.appendChild(tooltip)

    /**
     * Set the position of the tooltip
     * @param {string} position Any of the types in Position.allowed
     */
    const setPosition = function (position) {
      tooltip.setAttribute('data-position', position);
    };
    setPosition(options.position);

    /**
     * Set the alignment of the tooltip
     * @param {string} alignment 'left' or 'right'
     */
    const setAlignment = function (alignment) {
      tooltip.setAttribute('data-alignment', alignment);
    };

    // Aria-describedby will override aria-hidden
    if (!options.ariaHidden) {
      triggeringElement.setAttribute('aria-describedby', tooltipId);
    }

    // Use a mutation observer to listen for aria-label being
    // changed for the triggering element. If so, update the tooltip.
    // Mutation observer will be used even if the original elements
    // doesn't have any aria-label.
    new MutationObserver(function (mutations) {
      const ariaLabel = mutations[0].target.getAttribute('aria-label');

      console.log('ariaLabel', ariaLabel, tooltip, tooltip.parentNode, triggeringElement);

      if (tooltip.parentNode === null) {
        triggeringElement.appendChild(tooltip);
      }

      if (ariaLabel) {
        tooltip.innerHTML = options.text || ariaLabel;
      }
    }).observe(triggeringElement, {
      attributes: true,
      attributeFilter: ['aria-label', 'class'],
    });

    // A reference to the H5P container (if any). If null, it means
    // this tooltip is not whithin an H5P.
    let h5pContainer;

    /**
     * Makes the tooltip visible and activates it's functionality
     *
     * @param {UIEvent} event The triggering event
     */
    const showTooltip = function (event) {
      if (event.type === 'mouseenter') {
        hover = true;
      }
      else {
        focus = true;
      }

      tooltip.style.left = '';
      tooltip.classList.add('h5p-tooltip-visible');
      H5P.Tooltip.registerTooltip(tooltipId, () => {
        hover = focus = false;
        tooltip.classList.remove('h5p-tooltip-visible');
      });

      // Add listener to iframe body, as esc keypress would not be detected otherwise
      document.body.addEventListener('keydown', hideOnEscape, true);

      // The section below makes sure the tooltip is completely visible
      let tooltipRect = tooltip.getBoundingClientRect();

      // H5P.Tooltip can be used both from within an H5P and elsewhere.
      // The below code is for figuring out the containing element.
      // h5pContainer has to be looked up the first time we show the tooltip,
      // since it might not be added to the DOM when H5P.Tooltip is invoked.
      if (h5pContainer === undefined) {
        // After the below, h5pContainer is either null or a reference to the
        // DOM element
        h5pContainer = triggeringElement.closest('.h5p-container');
      }
      const rootRect = h5pContainer ? h5pContainer.getBoundingClientRect() : document.documentElement.getBoundingClientRect();

      tooltip.style.maxWidth = `min(300px, ${rootRect.width*0.9}px)`;
      

      const isVisible = tooltipRect.left >= 0 &&
        tooltipRect.top >= 0 &&
        tooltipRect.right <= rootRect.width &&
        tooltipRect.bottom <= rootRect.height;

      if (!isVisible) {
        // The tooltip placement needs to be adjusted. This logic will place the
        // tooltipeither above or below the triggering element. It will also move
        // it left or right if it is displayed outside the root element.

        // First reset to default position
        setPosition('top');

        const triggeringRect = triggeringElement.getBoundingClientRect();

        // Place it either above or below the triggering element
        const heightAbove = triggeringRect.top;
        const heightBelow = rootRect.height - triggeringRect.bottom;
        if (heightBelow > heightAbove) {
          setPosition('bottom');
        }

        // Do we have to adjust it left or right?
        tooltipRect = tooltip.getBoundingClientRect();
        if (tooltipRect.left < 0) {
          //setAlignment('left');
          console.log('Move to the right', `${-tooltipRect.left}px`);
          tooltip.style.left = `calc(50% + ${-tooltipRect.left}px)`;
        }
        else if (tooltipRect.right > rootRect.width) {
          console.log(tooltipRect.right);

          //setAlignment('right');
          console.log('Move to the left', `-${tooltipRect.right - rootRect.width}px`);
          tooltip.style.left = `calc(50% - ${tooltipRect.right - rootRect.width}px)`;
        }
      }
    }

    /**
     * Hides the tooltip and removes listeners
     *
     * @param {UIEvent} event The triggering event
     */
    const hideTooltip = function (event) {
      let hide = false;

      if (event.type === 'click') {
        hide = true;
      }
      else {
        if (event.type === 'mouseleave') {
          hover = false;
        }
        else {
          focus = false;
        }

        hide = (!hover && !focus);
      }

      // Only hide tooltip if neither hovered nor focused
      if (hide) {
        tooltip.classList.remove('h5p-tooltip-visible');

        // Remove iframe body listener
        document.body.removeEventListener('keydown', hideOnEscape, true);
      }
    }

    // Add event listeners to triggeringElement
    triggeringElement.addEventListener('mouseenter', showTooltip);
    triggeringElement.addEventListener('mouseleave', hideTooltip);
    triggeringElement.addEventListener('focusin', showTooltip);
    triggeringElement.addEventListener('focusout', hideTooltip);
    triggeringElement.addEventListener('click', hideTooltip);

    tooltip.addEventListener('click', function (event) {
      // Prevent clicks on the tooltip from triggering click
      // listeners on the triggering element
      event.stopPropagation();
      event.preventDefault();

      // Hide the tooltip when it is clicked
      hideTooltip(event);
    });

    /**
     * Change the text displayed by the tooltip
     *
     * @param {String} text The new text to be displayed
     *  Set to null to use aria-label of triggeringElement instead
     */
    this.setText = function (text) {
      options.text = text;
      tooltip.innerHTML = options.text || triggeringElement.getAttribute('aria-label') || '';
    };

    this.hide = function () {
      console.log('hiding', tooltip);
      hover = focus = false;
      tooltip.classList.remove('h5p-tooltip-visible');
    };

    /**
     * Retrieve tooltip
     *
     * @return {HTMLElement}
     */
    this.getElement = function () {
      return tooltip;
    };
  }
  
  return Tooltip;

})();

H5P.Tooltip.uniqueId = -1;
H5P.Tooltip.registerTooltip = (tooltipId, cb) => {
  if (H5P.Tooltip.current && tooltipId !== H5P.Tooltip.current.tooltipId) {
    H5P.Tooltip.current.cb();
  }
  H5P.Tooltip.current = {
    cb: cb,
    tooltipId
  };
}