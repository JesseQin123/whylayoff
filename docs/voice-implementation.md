# Review-before-send voice input

The browser flow detects `getUserMedia`, `MediaRecorder`, and supported recording MIME types at runtime. It shows a separate explanation before requesting permission, stops all microphone tracks after finish, cancel, interruption, or navigation, and limits each segment to 90 seconds.

The state machine is `idle → permission → requesting → recording → processing → review → sent`, with explicit denied, failed, canceled, and interrupted recovery. A transcript remains editable and only fills the regular text answer after the participant chooses **Use this text**. The participant must still choose **Continue** before it becomes an interview message or fact.

`POST /api/transcriptions` accepts a private, owner-scoped upload with a client idempotency key. The server checks session ownership, declared MIME, a matching container signature, and the 8 MB limit. Jobs can be read or deleted only by the same anonymous owner. Local audio bytes expire within 24 hours and are deleted immediately after use, retry, cancel, or navigation when the request reaches the server.

No audio transcription model has been confirmed on the private gateway. If `AUDIO_BASE_URL`, `AUDIO_API_KEY`, and `AUDIO_TRANSCRIPTION_MODEL` are absent, the job returns `TRANSCRIPTION_NOT_CONFIGURED`. Browsers with SpeechRecognition can still offer their live draft as progressive enhancement; other browsers retain the text box and phone-keyboard dictation path.

## Release device gate

Issue #4 remains open until the exact release build is tested on a real iPhone Safari and Android Chrome. The test records browser/OS versions and verifies permission allow/deny, finish, cancel, background interruption, 90-second stop, review/edit/retry, text fallback, and that the microphone indicator turns off after every exit path.
