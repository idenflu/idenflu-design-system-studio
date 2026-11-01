import AppKit

let root = CommandLine.arguments[1]
let sourceName = CommandLine.arguments.count > 2 ? CommandLine.arguments[2] : "reference.png"
let implementationName = CommandLine.arguments.count > 3 ? CommandLine.arguments[3] : "desktop.jpg"
let prefix = CommandLine.arguments.count > 4 ? CommandLine.arguments[4] : "comparison"
let reference = NSImage(contentsOfFile: root + "/" + sourceName)!
let implementation = NSImage(contentsOfFile: root + "/" + implementationName)!

func compare(_ output: String, _ crop: NSRect) {
    let width = Int(crop.width)
    let height = Int(crop.height)
    let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: width * 2, pixelsHigh: height, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    bitmap.size = NSSize(width: width * 2, height: height)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
    NSColor.white.setFill()
    NSRect(x: 0, y: 0, width: width * 2, height: height).fill()
    reference.draw(in: NSRect(x: 0, y: 0, width: width, height: height), from: crop, operation: .sourceOver, fraction: 1)
    implementation.draw(in: NSRect(x: width, y: 0, width: width, height: height), from: crop, operation: .sourceOver, fraction: 1)
    NSGraphicsContext.restoreGraphicsState()
    try! bitmap.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: root + "/" + output))
}

compare(prefix + "-full.png", NSRect(x: 0, y: 0, width: 1484, height: 1060))
compare(prefix + "-states.png", NSRect(x: 420, y: 80, width: 420, height: 580))
