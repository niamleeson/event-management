/// Sentinel value returned from handlers to indicate the event should be skipped
/// (no output emitted).
class _Skip {
  const _Skip();

  @override
  String toString() => 'Skip';
}

/// Return this from a handler to suppress output emission.
const Skip = _Skip();

/// Check whether a value is the [Skip] sentinel.
bool isSkip(Object? value) => value is _Skip;
