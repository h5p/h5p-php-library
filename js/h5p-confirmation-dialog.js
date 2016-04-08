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
    options.headerText = options.headerText || H5P.t('confirmDialogHeader');
    options.dialogText = options.dialogText || H5P.t('confirmDialogBody');
    options.cancelText = options.cancelText || H5P.t('cancelLabel');
    options.confirmText = options.confirmText || H5P.t('confirmLabel');

    // Offset of exit button
    var exitButtonOffset = 2 * 16;
    var shadowOffset = 8;

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
    var cancelButton = document.createElement('a');
    cancelButton.classList.add('h5p-core-cancel-button');
    cancelButton.href = '#';
    cancelButton.textContent = options.cancelText;
    cancelButton.onclick = function (e) {
      self.hide();
      self.trigger('canceled');
      e.preventDefault();
    };
    cancelButton.onkeydown = function (e) {
      if (e.which === 32) { // Space
        // Prevent jumping
        e.preventDefault();
      }
      else if (e.which === 13) { // Enter
        self.hide();
        self.trigger('canceled');
        e.preventDefault();
      }
    };
    buttons.appendChild(cancelButton);

    // Confirm button
    var confirmButton = document.createElement('a');
    confirmButton.classList.add('h5p-core-button',
      'h5p-confirmation-dialog-confirm-button');
    confirmButton.href = '#';
    confirmButton.textContent = options.confirmText;
    confirmButton.onclick = function (e) {
      self.hide();
      self.trigger('confirmed');
      e.preventDefault();
    };
    confirmButton.onkeydown = function (e) {
      if (e.which === 32) { // Space
        // Prevent jumping
        e.preventDefault();
      }
      else if (e.which === 13) { // Enter
        self.hide();
        self.trigger('confirmed');
        e.preventDefault();
      }
    };
    buttons.appendChild(confirmButton);

    // Exit button
    var exitButton = document.createElement('a');
    exitButton.href = '#';
    exitButton.classList.add('h5p-confirmation-dialog-exit');
    exitButton.onclick = function (e) {
      self.hide();
      self.trigger('canceled');
      e.preventDefault();
    };
    exitButton.onkeydown = function (e) {
      if (e.which === 32) { // Space
        // Prevent jumping
        e.preventDefault();
      }
      else if (e.which === 13) { // Enter
        self.hide();
        self.trigger('canceled');
        e.preventDefault();
      }
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
      var popupOffsetTop = parseInt(popup.style.top, 10);

      // Overflows height
      if (popupOffsetTop + popup.offsetHeight > wrapperElement.offsetHeight) {
        popupOffsetTop = wrapperElement.offsetHeight - popup.offsetHeight;
      }

      if (popupOffsetTop - exitButtonOffset <= 0) {
        popupOffsetTop = exitButtonOffset;
      }
      popup.style.top = popupOffsetTop + 'px';
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

      // Programmatically focus popup
      popup.setAttribute('tabindex', '-1');
      popup.focus();

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
