import 'package:flutter/widgets.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:pulse/pulse.dart';
import 'pulse_provider.dart';

/// A hook that subscribes to a Pulse [EventType] and returns the latest payload.
///
/// Must be used inside a [HookWidget].
///
/// ```dart
/// class MyWidget extends HookWidget {
///   @override
///   Widget build(BuildContext context) {
///     final count = usePulse<int>(counterEvent, initialValue: 0);
///     return Text('$count');
///   }
/// }
/// ```
T usePulse<T>(
  EventType<T> event, {
  required T initialValue,
  Engine? engine,
}) {
  return use(_PulseHook<T>(
    event: event,
    initialValue: initialValue,
    engine: engine,
  ));
}

class _PulseHook<T> extends Hook<T> {
  final EventType<T> event;
  final T initialValue;
  final Engine? engine;

  const _PulseHook({
    required this.event,
    required this.initialValue,
    this.engine,
  });

  @override
  _PulseHookState<T> createState() => _PulseHookState<T>();
}

class _PulseHookState<T> extends HookState<T, _PulseHook<T>> {
  late T _value;
  void Function()? _unsubscribe;

  @override
  void initHook() {
    super.initHook();
    _value = hook.initialValue;
    _subscribe();
  }

  @override
  void didUpdateHook(_PulseHook<T> oldHook) {
    if (oldHook.event != hook.event || oldHook.engine != hook.engine) {
      _unsubscribe?.call();
      _subscribe();
    }
  }

  void _subscribe() {
    final eng = hook.engine ?? PulseProvider.of(context);
    _unsubscribe = eng.on<T>(hook.event, (payload) {
      setState(() {
        _value = payload;
      });
    });
  }

  @override
  T build(BuildContext context) => _value;

  @override
  void dispose() {
    _unsubscribe?.call();
    _unsubscribe = null;
    super.dispose();
  }
}
