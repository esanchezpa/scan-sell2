import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// A widget that listens for barcode scanner input (HID keyboard emulation)
class BarcodeListener extends StatefulWidget {
  final Widget child;
  final ValueChanged<String> onBarcodeScanned;
  final Duration bufferDuration;

  const BarcodeListener({
    super.key,
    required this.child,
    required this.onBarcodeScanned,
    this.bufferDuration = const Duration(milliseconds: 100),
  });

  @override
  State<BarcodeListener> createState() => _BarcodeListenerState();
}

class _BarcodeListenerState extends State<BarcodeListener> {
  final FocusNode _focusNode = FocusNode();
  String _barcodeBuffer = '';
  DateTime? _lastKeyPress;

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  void _handleKeyEvent(KeyEvent event) {
    if (event is KeyDownEvent) {
      final now = DateTime.now();
      
      // If time since last key is greater than buffer, it's likely manual typing
      // So we clear the buffer. Barcode scanners type very fast.
      if (_lastKeyPress != null && now.difference(_lastKeyPress!) > widget.bufferDuration) {
        _barcodeBuffer = '';
      }
      
      _lastKeyPress = now;

      if (event.logicalKey == LogicalKeyboardKey.enter) {
        if (_barcodeBuffer.isNotEmpty) {
          widget.onBarcodeScanned(_barcodeBuffer);
          _barcodeBuffer = '';
        }
      } else {
        final char = event.character;
        if (char != null) {
          _barcodeBuffer += char;
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return KeyboardListener(
      focusNode: _focusNode,
      onKeyEvent: _handleKeyEvent,
      autofocus: true,
      child: widget.child,
    );
  }
}
