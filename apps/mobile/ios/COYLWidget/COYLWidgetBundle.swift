//
//  COYLWidgetBundle.swift
//  COYLWidget
//
//  Entry point for the Widget Extension target. The @main attribute
//  is what Xcode looks for when it builds the widget product —
//  exactly one bundle per extension.
//
//  Today the bundle exposes a single Live Activity widget. Future
//  home-screen widgets (e.g. a "next danger window" complication)
//  would be added as additional Widget conformances inside `body`.
//

import SwiftUI
import WidgetKit

@available(iOS 17.0, *)
@main
struct COYLWidgets: WidgetBundle {
    var body: some Widget {
        COYLInterruptLiveActivity()
    }
}
