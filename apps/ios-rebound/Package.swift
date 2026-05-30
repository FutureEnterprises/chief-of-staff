// swift-tools-version:5.9
//
// Package manifest for Rebound. The point of this SPM manifest is to
// make the domain layer (`ReboundDomain`) buildable + testable on
// any machine with Swift installed, no Xcode required. The iOS app
// target itself ships as an Xcode project (see README).

import PackageDescription

let package = Package(
    name: "ReboundDomain",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "ReboundDomain", targets: ["ReboundDomain"]),
    ],
    targets: [
        .target(
            name: "ReboundDomain",
            path: "Sources/ReboundDomain"
        ),
        .testTarget(
            name: "ReboundDomainTests",
            dependencies: ["ReboundDomain"],
            path: "Tests/ReboundTests"
        ),
    ]
)
