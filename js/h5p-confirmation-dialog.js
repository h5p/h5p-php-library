/*global H5P*/
H5P.ConfirmationDialog = (function (EventDispatcher) {
  "use strict";

  /**
   * Create a confirmation dialog
   *
   * @param [options] Options for confirmation dialog
   * @param [options.instance] Instance that uses confirmation dialog
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

    /**
     * Handle confirming event
     * @param {Event} e
     */
    function dialogConfirmed(e) {
      self.hide();
      self.trigger('confirmed');
      e.preventDefault();
    }

    /**
     * Handle dialog canceled
     * @param {Event} e
     */
    function dialogCanceled(e) {
      self.hide();
      self.trigger('canceled');
      e.preventDefault();
    }

    // Offset of exit button
    var exitButtonOffset = 2 * 16;
    var shadowOffset = 8;

    // Determine if we are too large for our container and must resize
    var resizeIFrame = false;

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
    cancelButton.textContent = options.cancelText;
    cancelButton.onclick = dialogCanceled;
    cancelButton.onkeydown = function (e) {
      if (e.which === 32) { // Space
        dialogCanceled(e);
      }
    };
    buttons.appendChild(cancelButton);

    // Confirm button
    var confirmButton = document.createElement('button');
    confirmButton.classList.add('h5p-core-button',
      'h5p-confirmation-dialog-confirm-button');
    confirmButton.textContent = options.confirmText;
    confirmButton.onclick = dialogConfirmed;
    confirmButton.onkeydown = function (e) {
      if (e.which === 32) { // Space
        dialogConfirmed(e);
      }
    };
    buttons.appendChild(confirmButton);

    // Exit button
    var exitButton = document.createElement('button');
    exitButton.classList.add('h5p-confirmation-dialog-exit');
    exitButton.onclick = dialogCanceled;
    exitButton.onkeydown = function (e) {
      if (e.which === 32) { // Space
        dialogCanceled(e);
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
     * @params {number} [offsetTop] Offset of popup
     */
    var fitToContainer = function (offsetTop) {
      var popupOffsetTop = parseInt(popup.style.top, 10);
      if (offsetTop) {
        popupOffsetTop = offsetTop;
      }

      // Overflows height
      if (popupOffsetTop + popup.offsetHeight > wrapperElement.offsetHeight) {
        popupOffsetTop = wrapperElement.offsetHeight - popup.offsetHeight - shadowOffset;
      }

      if (popupOffsetTop - exitButtonOffset <= 0) {
        popupOffsetTop = exitButtonOffset + shadowOffset;

        // We are too big and must resize
        resizeIFrame = true;
      }
      popup.style.top = popupOffsetTop + 'px';
    };

    /**
     * Show confirmation dialog
     * @params {number} offsetTop Offset top
     * @returns {H5P.ConfirmationDialog}
     */
    this.show = function (offsetTop) {
      popupBackground.classList.remove('hidden');
      fitToContainer(offsetTop);
      setTimeout(function () {
        popup.classList.remove('hidden');
        popupBackground.classList.remove('hiding');

        setTimeout(function () {
          // Focus confirm button
          confirmButton.focus();

          // Resize iFrame if necessary
          if (resizeIFrame && options.instance) {
            var minHeight = parseInt(popup.offsetHeight, 10) +
              exitButtonOffset + (2 * shadowOffset);
            wrapperElement.style.minHeight = minHeight + 'px';
            options.instance.trigger('resize');
            resizeIFrame = false;
          }
        }, 100);
      }, 0);

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
