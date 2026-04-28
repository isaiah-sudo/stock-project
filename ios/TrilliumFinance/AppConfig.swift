import Foundation

enum BrowserTab: String, CaseIterable, Identifiable {
  case home
  case dashboard
  case chat
  case leaderboard

  var id: String { rawValue }

  var title: String {
    switch self {
    case .home:
      return "Home"
    case .dashboard:
      return "Dashboard"
    case .chat:
      return "Chat"
    case .leaderboard:
      return "Rankings"
    }
  }

  var systemImage: String {
    switch self {
    case .home:
      return "house.fill"
    case .dashboard:
      return "chart.line.uptrend.xyaxis"
    case .chat:
      return "message.fill"
    case .leaderboard:
      return "trophy.fill"
    }
  }

  var path: String {
    switch self {
    case .home:
      return ""
    case .dashboard:
      return "dashboard"
    case .chat:
      return "chat"
    case .leaderboard:
      return "leaderboard"
    }
  }
}

enum AppConfig {
  static let defaultWebBaseURL = URL(string: "https://trilliumfinance.net")!
  static let webBaseURLEnvironmentKey = "TRILLIUM_WEB_BASE_URL"
  static let webBaseURLStorageKey = "webBaseURL"

  static var webBaseURL: URL {
    if let stored = UserDefaults.standard.string(forKey: webBaseURLStorageKey),
      let url = URL(string: stored)
    {
      return url
    }

    if let override = ProcessInfo.processInfo.environment[webBaseURLEnvironmentKey],
      let url = URL(string: override)
    {
      return url
    }

    return defaultWebBaseURL
  }

  static func url(for tab: BrowserTab) -> URL {
    guard !tab.path.isEmpty else {
      return webBaseURL
    }

    return webBaseURL.appendingPathComponent(tab.path)
  }
}
