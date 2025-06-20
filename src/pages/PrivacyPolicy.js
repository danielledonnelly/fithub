import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#f0f6fc] mb-6">Privacy Policy</h1>
        
        <div className="space-y-6 text-[#c9d1d9]">
          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">Introduction</h2>
            <p>
              FitHub ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share your information when you use our application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">Information We Collect</h2>
            <p>We collect information from your Fitbit account through the Fitbit API, including:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Activity and exercise data</li>
              <li>Heart rate data</li>
              <li>Basic profile information</li>
              <li>Sleep data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Display your fitness activity in a GitHub-style contribution graph</li>
              <li>Calculate and show your fitness statistics</li>
              <li>Improve our services and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">Data Storage and Security</h2>
            <p>
              We take the security of your data seriously. We use industry-standard security measures to protect your information. Your Fitbit access tokens are stored securely and are never shared with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">Data Sharing</h2>
            <p>
              We do not sell or share your personal information with third parties. Your data is only used within the FitHub application to provide you with our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Access your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Revoke Fitbit access at any time</li>
              <li>Request a copy of your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at [Your Contact Email].
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time.
            </p>
          </section>

          <p className="text-sm text-[#8b949e] mt-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 