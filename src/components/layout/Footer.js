export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-4 px-6">
      <div className="flex items-center justify-between">
        {/* Left Side - Copyright */}
        <div className="text-sm text-gray-600">
          © {new Date().getFullYear()} Famtech Enterprise Solutions. All rights reserved.
        </div>

        {/* Right Side - Links and Status */}
        <div className="flex items-center gap-6">
          <a
            href="#privacy"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="#terms"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Terms of Service
          </a>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">System Status:</span>
            <span className="text-sm font-medium text-green-600">Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
