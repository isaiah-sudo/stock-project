import XCTest
@testable import TrilliumFinance

final class AppConfigTests: XCTestCase {
  func testHomeTabUsesBaseURLWithoutPath() {
    let url = AppConfig.url(for: .home)

    XCTAssertEqual(url.absoluteString, AppConfig.webBaseURL.absoluteString)
  }

  func testDashboardTabAppendsDashboardPath() {
    let url = AppConfig.url(for: .dashboard)

    XCTAssertTrue(url.absoluteString.hasSuffix("/dashboard"))
  }

  func testLeaderboardTabAppendsLeaderboardPath() {
    let url = AppConfig.url(for: .leaderboard)

    XCTAssertTrue(url.absoluteString.hasSuffix("/leaderboard"))
  }
}
