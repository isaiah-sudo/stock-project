import SwiftUI
import UIKit
import WebKit

struct AppShellView: View {
  @State private var selectedTab: BrowserTab = .dashboard

  var body: some View {
    TabView(selection: $selectedTab) {
      ForEach(BrowserTab.allCases) { tab in
        NavigationStack {
          BrowserScreenView(
            title: tab.title,
            tab: tab,
            url: resolvedURL(for: tab)
          )
        }
        .tabItem {
          Label(tab.title, systemImage: tab.systemImage)
        }
        .tag(tab)
      }
    }
    .tint(.cyan)
  }

  private func resolvedURL(for tab: BrowserTab) -> URL {
    guard !tab.path.isEmpty else {
      return AppConfig.webBaseURL
    }

    return AppConfig.webBaseURL.appendingPathComponent(tab.path)
  }
}

struct BrowserScreenView: View {
  let title: String
  let tab: BrowserTab
  let url: URL

  @State private var reloadToken = UUID()
  @State private var isLoading = true
  @State private var pageTitle = ""
  @State private var errorMessage: String?
  @Environment(\.openURL) private var openURL

  var body: some View {
    ZStack(alignment: .top) {
      WebView(
        url: url,
        reloadToken: reloadToken,
        isLoading: $isLoading,
        pageTitle: $pageTitle,
        errorMessage: $errorMessage
      )

      if isLoading {
        ProgressView()
          .padding(.horizontal, 14)
          .padding(.vertical, 10)
          .background(.regularMaterial, in: Capsule())
          .padding(.top, 12)
      }

      if let errorMessage {
        Text(errorMessage)
          .font(.footnote.weight(.semibold))
          .foregroundStyle(.white)
          .padding(.horizontal, 14)
          .padding(.vertical, 10)
          .background(Color.red.opacity(0.9), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
          .padding([.horizontal, .top], 16)
      }
    }
    .navigationTitle(pageTitle.isEmpty ? title : pageTitle)
    .navigationBarTitleDisplayMode(.inline)
    .toolbar {
      ToolbarItemGroup(placement: .topBarTrailing) {
        Button {
          reloadToken = UUID()
        } label: {
          Image(systemName: "arrow.clockwise")
        }
        .accessibilityLabel("Reload page")

        Button {
          openURL(url)
        } label: {
          Image(systemName: "safari")
        }
        .accessibilityLabel("Open in Safari")
      }
    }
    .safeAreaInset(edge: .bottom) {
      HStack {
        Text(tab.title)
          .font(.caption.weight(.semibold))
          .foregroundStyle(.secondary)

        Spacer()

        Text(url.host ?? url.absoluteString)
          .font(.caption2)
          .foregroundStyle(.secondary)
          .lineLimit(1)
          .truncationMode(.middle)
      }
      .padding(.horizontal, 16)
      .padding(.vertical, 10)
      .background(.thinMaterial)
    }
  }
}

struct WebView: UIViewRepresentable {
  let url: URL
  let reloadToken: UUID
  @Binding var isLoading: Bool
  @Binding var pageTitle: String
  @Binding var errorMessage: String?

  func makeCoordinator() -> Coordinator {
    Coordinator(
      isLoading: $isLoading,
      pageTitle: $pageTitle,
      errorMessage: $errorMessage
    )
  }

  func makeUIView(context: Context) -> WKWebView {
    let webView = WKWebView(frame: .zero)
    webView.navigationDelegate = context.coordinator
    webView.allowsBackForwardNavigationGestures = true
    context.coordinator.load(url: url, in: webView, reloadToken: reloadToken)
    return webView
  }

  func updateUIView(_ webView: WKWebView, context: Context) {
    context.coordinator.load(url: url, in: webView, reloadToken: reloadToken)
  }

  final class Coordinator: NSObject, WKNavigationDelegate {
    private var isLoading: Binding<Bool>
    private var pageTitle: Binding<String>
    private var errorMessage: Binding<String?>
    private var lastLoadedURL: URL?
    private var lastReloadToken: UUID?

    init(
      isLoading: Binding<Bool>,
      pageTitle: Binding<String>,
      errorMessage: Binding<String?>
    ) {
      self.isLoading = isLoading
      self.pageTitle = pageTitle
      self.errorMessage = errorMessage
    }

    func load(url: URL, in webView: WKWebView, reloadToken: UUID) {
      let shouldLoad = lastLoadedURL != url || lastReloadToken != reloadToken
      guard shouldLoad else { return }

      lastLoadedURL = url
      lastReloadToken = reloadToken
      errorMessage.wrappedValue = nil
      isLoading.wrappedValue = true
      webView.load(URLRequest(url: url, cachePolicy: .reloadIgnoringLocalAndRemoteCacheData))
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
      isLoading.wrappedValue = true
      errorMessage.wrappedValue = nil
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
      isLoading.wrappedValue = false
      pageTitle.wrappedValue = webView.title ?? pageTitle.wrappedValue
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
      isLoading.wrappedValue = false
      errorMessage.wrappedValue = error.localizedDescription
    }

    func webView(
      _ webView: WKWebView,
      didFailProvisionalNavigation navigation: WKNavigation!,
      withError error: Error
    ) {
      isLoading.wrappedValue = false
      errorMessage.wrappedValue = error.localizedDescription
    }

    func webView(
      _ webView: WKWebView,
      decidePolicyFor navigationAction: WKNavigationAction,
      decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
      guard let targetURL = navigationAction.request.url else {
        decisionHandler(.allow)
        return
      }

      switch targetURL.scheme?.lowercased() {
      case "http", "https", nil:
        decisionHandler(.allow)
      default:
        UIApplication.shared.open(targetURL)
        decisionHandler(.cancel)
      }
    }
  }
}
