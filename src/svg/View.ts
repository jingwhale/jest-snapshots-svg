import { ViewStyle } from "react-native"
import * as yoga from "yoga-layout"

import { styleFromComponent } from "../component-to-node"
import { RenderedComponent } from "../index"
import wsp from "../whitespace"
import {
  dashStyles,
  filledPathForSide,
  getBorderColor,
  getBorderRadius,
  getBorderWidth,
  pathForRect,
  scaleSides,
  sidesEqual,
  strokedPathForSide,
} from "./borders"
import { $ } from "./util"

export default ({ top, left, width, height }: yoga.Layout, style: any) => {
  const attributes: any = {
    type: "View",
  }

  const borderWidths = getBorderWidth(style)
  const borderColors = getBorderColor(style)
  let borderRadii = getBorderRadius(style)

  const borderScale = Math.max(
    (borderRadii[0] + borderRadii[2]) / width,
    (borderRadii[1] + borderRadii[3]) / width,
    (borderRadii[0] + borderRadii[3]) / height,
    (borderRadii[1] + borderRadii[2]) / height,
    1
  )

  if (borderScale > 1) {
    borderRadii = scaleSides(borderRadii, 1 / borderScale)
  }

  const borderStyle: string = style.borderStyle || "solid"
  const fill = style.backgroundColor || "none"

  if (
    sidesEqual(borderWidths) &&
    sidesEqual(borderColors) &&
    sidesEqual(borderRadii) &&
    borderStyle === "solid"
  ) {
    const borderWidth = borderWidths[0]
    const borderRadius = borderRadii[0]
    // Offset size by half border radius, as RN draws border inside, whereas SVG draws on both sides
    return $("rect", {
      ...attributes,
      "x": left - borderWidth * 0.5,
      "y": top - borderWidth * 0.5,
      "width": width - borderWidth,
      "height": height - borderWidth,
      fill,
      "stroke": borderColors[0],
      "stroke-width": borderWidth,
      "rx": borderRadii[0] - borderWidth * 0.5,
      "ry": borderRadii[0] - borderWidth * 0.5,
    })
  } else if (sidesEqual(borderWidths) && sidesEqual(borderColors) && borderStyle === "solid") {
    const borderWidth = borderWidths[0]
    return $("path", {
      ...attributes,
      fill,
      "stroke": borderColors[0],
      "stroke-width": borderWidth,
      "d": pathForRect(left, top, width, height, borderRadii, scaleSides(borderWidths, 0.5))
    })
  } else if (sidesEqual(borderColors) && borderStyle === "solid") {
    const backgroundShape = $("path", {
      ...attributes,
      fill,
      d: pathForRect(left, top, width, height, borderRadii, scaleSides(borderWidths, 0.5))
    })
    const borderShape = $("path", {
      fill: borderColors[0],
      d: pathForRect(left, top, width, height, borderRadii, [0, 0, 0, 0]) +
        pathForRect(left, top, width, height, borderRadii, borderWidths, true)
    })
    return backgroundShape + borderShape
  } else if (sidesEqual(borderWidths) && sidesEqual(borderColors)) {
    const borderWidth = borderWidths[0]
    const backgroundShape = $("path", {
      ...attributes,
      fill,
      d: pathForRect(left, top, width, height, borderRadii, [0, 0, 0, 0])
    })
    const borderShape = $("path", {
      ...dashStyles[borderStyle](borderWidth),
      "fill": "none",
      "stroke": borderColors[0],
      "stroke-width": borderWidth,
      "d": pathForRect(left, top, width, height, borderRadii, scaleSides(borderWidths, 0.5))
    })
    return backgroundShape + borderShape
  } else if (borderStyle === "solid") {
    const backgroundShape = $("path", {
      ...attributes,
      fill,
      d: pathForRect(left, top, width, height, borderRadii, scaleSides(borderWidths, 0.5)),
    })
    const borders = borderColors.map((borderColor, side) => (
      $("path", {
        fill: borderColor || "none",
        d: filledPathForSide(left, top, width, height, borderRadii, borderWidths, side),
      })
    ))
    return backgroundShape + borders.join("")
  } else {
    const backgroundShape = $("path", {
      ...attributes,
      fill,
      d: pathForRect(left, top, width, height, borderRadii, [0, 0, 0, 0]),
    })
    const borders = borderColors.map((borderColor, side) => (
      $("path", {
        ...dashStyles[borderStyle](borderWidths[side]),
        "stroke": borderColor,
        "stroke-width": borderWidths[side],
        "d": strokedPathForSide(left, top, width, height, borderRadii, borderWidths, side),
      })
    ))
    return backgroundShape + borders.join("")
  }
}
