import 'package:flutter/widgets.dart';
import 'package:pulse/pulse.dart';
import 'pulse_provider.dart';

/// A widget that subscribes to a Pulse [EventType] and rebuilds
/// whenever a new event of that type is emitted.
///
/// ```dart
/// PulseBuilder<int>(
///   event: counterEvent,
///   initialValue: 0,
///   builder: (context, value) => Text('$value'),
/// )
/// ```
class PulseBuilder<T> extends StatefulWidget {
  /// The event type to subscribe to.
  final EventType<T> event;

  /// The initial value before any event is received.
  final T initialValue;

  /// Builder that receives the latest event payload.
  final Widget Function(BuildContext context, T value) builder;

  /// Optional: provide an engine directly instead of using [PulseProvider].
  final Engine? engine;

  const PulseBuilder({
    super.key,
    required this.event,
    required this.initialValue,
    required this.builder,
    this.engine,
  });

  @override
  State<PulseBuilder<T>> createState() => _PulseBuilderState<T>();
}

class _PulseBuilderState<T> extends State<PulseBuilder<T>> {
  late T _value;
  void Function()? _unsubscribe;

  @override
  void initState() {
    super.initState();
    _value = widget.initialValue;
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _subscribe();
  }

  @override
  void didUpdateWidget(PulseBuilder<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.event != widget.event || oldWidget.engine != widget.engine) {
      _unsubscribe?.call();
      _subscribe();
    }
  }

  void _subscribe() {
    _unsubscribe?.call();
    final engine = widget.engine ?? PulseProvider.of(context);
    _unsubscribe = engine.on<T>(widget.event, (payload) {
      if (mounted) {
        setState(() {
          _value = payload;
        });
      }
    });
  }

  @override
  void dispose() {
    _unsubscribe?.call();
    _unsubscribe = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return widget.builder(context, _value);
  }
}
