export function height2normal(
    context: CanvasRenderingContext2D,
    contextN: CanvasRenderingContext2D
) {
    var width = 512
    var height = 512

    var src = context.getImageData(0, 0, width, height)
    var dst = contextN.createImageData(width, height)

    for (var i = 0, l = width * height * 4; i < l; i += 4) {
        var x1, x2, y1, y2

        if (i % (width * 4) == 0) {
            // left edge
            x1 = src.data[i]
            x2 = src.data[i + 4]
        } else if (i % (width * 4) == (width - 1) * 4) {
            // right edge
            x1 = src.data[i - 4]
            x2 = src.data[i]
        } else {
            x1 = src.data[i - 4]
            x2 = src.data[i + 4]
        }

        if (i < width * 4) {
            // top edge
            y1 = src.data[i]
            y2 = src.data[i + width * 4]
        } else if (i > width * (height - 1) * 4) {
            // bottom edge
            y1 = src.data[i - width * 4]
            y2 = src.data[i]
        } else {
            y1 = src.data[i - width * 4]
            y2 = src.data[i + width * 4]
        }

        dst.data[i] = x1 - x2 + 127
        dst.data[i + 1] = y1 - y2 + 127
        dst.data[i + 2] = 255
        dst.data[i + 3] = 255
    }

    contextN.putImageData(dst, 0, 0)
}