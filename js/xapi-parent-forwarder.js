// Forward xAPI events to parent window, making it possible to use the
// following code from parent window to get events:
// window.addEventListener('message', function (event) { <...> });
H5P.externalDispatcher.on('xAPI', function (event) {
  if (event.data && event.data.statement && event.data.statement.actor && event.data.statement.actor.mbox) {
    if (H5PIntegration.user && H5PIntegration.user.mail_sha1sum) {
      event.data.statement.actor = {
        mbox_sha1sum: H5PIntegration.user.mail_sha1sum,
        objectType: "Agent"
      };
    }
    else {
      delete event.data.statement.actor;
    }
  }

  H5P.communicator.send('xAPI', event.data);
});