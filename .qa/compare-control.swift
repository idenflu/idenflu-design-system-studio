import AppKit
let root = CommandLine.arguments[1]
let source = NSImage(contentsOfFile: root + "/components-desktop.png")!
let current = NSImage(contentsOfFile: root + "/docs-buttons.png")!
let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 720, pixelsHigh: 88, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
bitmap.size = NSSize(width: 720, height: 88)
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
NSColor.white.setFill()
NSRect(x: 0, y: 0, width: 720, height: 88).fill()
source.draw(in: NSRect(x: 12, y: 13, width: 202, height: 62), from: NSRect(x: 56, y: 728, width: 202, height: 62), operation: .sourceOver, fraction: 1)
current.draw(in: NSRect(x: 372, y: 13, width: 280, height: 62), from: NSRect(x: 304, y: 726, width: 280, height: 62), operation: .sourceOver, fraction: 1)
NSGraphicsContext.restoreGraphicsState()
try bitmap.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: root + "/docs-control-comparison.png"))
