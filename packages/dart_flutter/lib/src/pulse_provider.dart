import 'package:flutter/widgets.dart';
import 'package:pulse/pulse.dart';

/// An [InheritedWidget] that provides a Pulse [Engine] to the widget tree.
///
/// Wrap your app (or a subtree) with [PulseProvider] to make the engine
/// accessible via [PulseProvider.of(context)].
///
/// ```dart
/// PulseProvider(
///   engine: myEngine,
///   child: MyApp(),
/// )
/// ```
class PulseProvider extends InheritedWidget {
  /// The Pulse engine instance.
  final Engine engine;

  const PulseProvider({
    super.key,
    required this.engine,
    required super.child,
  });

  /// Retrieve the nearest [Engine] from the widget tree.
  ///
  /// Throws if no [PulseProvider] is found above the given [context].
  static Engine of(BuildContext context) {
    final provider =
        context.dependOnInheritedWidgetOfExactType<PulseProvider>();
    if (provider == null) {
      throw FlutterError(
        'PulseProvider.of() called with a context that does not contain a PulseProvider.\n'
        'Ensure a PulseProvider is an ancestor of the widget calling PulseProvider.of().',
      );
    }
    return provider.engine;
  }

  /// Retrieve the nearest [Engine] from the widget tree, or null if not found.
  static Engine? maybeOf(BuildContext context) {
    return context
        .dependOnInheritedWidgetOfExactType<PulseProvider>()
        ?.engine;
  }

  @override
  bool updateShouldNotify(PulseProvider oldWidget) {
    return engine != oldWidget.engine;
  }
}
