/*global H5P*/
H5P.ConfirmationDialog = (function (EventDispatcher) {
  "use strict";

  /**
   * Create a confirmation dialog
   *
   * @param [options] Options for confirmation dialog
   * @param [options.headerText] Header text
   * @param [options.dialogText] Dialog text
   * @param [options.cancelText] Cancel dialog button text
   * @param [options.confirmText] Confirm dialog button text
   * @constructor
   */
  function ConfirmationDialog(options) {
    EventDispatcher.call(this);
    var self = this;

    // Default options
    options = options || {};
    options.headerText = options.headerText ||
      'Confirm action';
    options.dialogText = options.dialogText ||
      'Please confirm that you wish to proceed. This action will not be reversible.';
    options.cancelText = options.cancelText || 'Cancel';
    options.confirmText = options.confirmText || 'Confirm';

    // Create background
    var popupBackground = document.createElement('div');
    popupBackground.classList
      .add('h5p-confirmation-dialog-background', 'hidden', 'hiding');

    // Create outer popup
    var popup = document.createElement('div');
    popup.classList.add('h5p-confirmation-dialog-popup', 'hidden');
    popupBackground.appendChild(popup);

    // Popup header
    var header = document.createElement('div');
    header.classList.add('h5p-confirmation-dialog-header');
    popup.appendChild(header);

    // Header text
    var headerText = document.createElement('div');
    headerText.classList.add('h5p-confirmation-dialog-header-text');
    headerText.innerHTML = options.headerText;
    header.appendChild(headerText);

    // Popup body
    var body = document.createElement('div');
    body.classList.add('h5p-confirmation-dialog-body');
    popup.appendChild(body);

    // Popup text
    var text = document.createElement('div');
    text.classList.add('h5p-confirmation-dialog-text');
    text.innerHTML = options.dialogText;
    body.appendChild(text);

    // Popup buttons
    var buttons = document.createElement('div');
    buttons.classList.add('h5p-confirmation-dialog-buttons');
    body.appendChild(buttons);

    // Cancel button
    var cancelButton = document.createElement('button');
    cancelButton.classList.add('h5p-core-cancel-button');
    cancelButton.tabindex = 0;
    cancelButton.textContent = options.cancelText;
    cancelButton.onclick = function () {
      self.hide();
      self.trigger('canceled');
    };
    buttons.appendChild(cancelButton);

    // Confirm button
    var confirmButton = document.createElement('button');
    confirmButton.classList.add('h5p-core-button',
      'h5p-confirmation-dialog-confirm-button');
    confirmButton.tabindex = 0;
    confirmButton.textContent = options.confirmText;
    confirmButton.onclick = function () {
      self.hide();
      self.trigger('confirmed');
    };
    buttons.appendChild(confirmButton);

    // Exit button
    var exitButton = document.createElement('button');
    exitButton.classList.add('h5p-confirmation-dialog-exit');
    exitButton.tabindex = 0;
    exitButton.onclick = function () {
      self.hide();
      self.trigger('canceled');
    };
    popup.appendChild(exitButton);

    // Wrapper element
    var wrapperElement;

    /**
     * Append confirmation dialog
     * @param {HTMLElement} wrapper
     * @returns {H5P.ConfirmationDialog}
     */
    this.appendTo = function (wrapper) {
      wrapper.appendChild(popupBackground);
      wrapperElement = wrapper;

      return this;
    };

    /**
     * Fit popup to container. Makes sure it doesn't overflow.
     */
    var fitToContainer = function () {
      var popupOffset = parseInt(popup.style.top, 10) + popup.offsetHeight;

      // Overflows wrapper
      if (popupOffset > wrapperElement.offsetHeight) {
        var overflowedContainerOffset = wrapperElement.offsetHeight - popup.offsetHeight;
        popup.style.top = overflowedContainerOffset + 'px';
      }
    };

    /**
     * Show confirmation dialog
     * @params {number} offsetTop Offset top
     * @returns {H5P.ConfirmationDialog}
     */
    this.show = function (offsetTop) {
      popup.style.top = offsetTop + 'px';
      popupBackground.classList.remove('hidden');
      fitToContainer();
      popupBackground.classList.remove('hiding');
      popup.classList.remove('hidden');
      cancelButton.focus();

      return this;
    };

    /**
     * Hide confirmation dialog
     * @returns {H5P.ConfirmationDialog}
     */
    this.hide = function () {
      popupBackground.classList.add('hiding');
      popup.classList.add('hidden');
      setTimeout(function () {
        popupBackground.classList.add('hidden');
      }, 100);

      return this;
    };
  }

  ConfirmationDialog.prototype = Object.create(EventDispatcher.prototype);
  ConfirmationDialog.prototype.constructor = ConfirmationDialog;

  return ConfirmationDialog;

}(H5P.EventDispatcher));
