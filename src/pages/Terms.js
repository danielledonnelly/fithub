import React from 'react';

const Terms = () => {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#f0f6fc] mb-6">Terms of Service</h1>
        
        <div className="space-y-6 text-[#c9d1d9]">
          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using FitHub, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">2. Description of Service</h2>
            <p>
              FitHub is a fitness tracking application that integrates with Fitbit to provide users with a GitHub-style visualization of their fitness activities. The service includes:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Fitness activity visualization</li>
              <li>Activity tracking and statistics</li>
              <li>Integration with Fitbit services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">3. User Accounts</h2>
            <p>
              To use FitHub, you must have a valid Fitbit account and authorize FitHub to access your Fitbit data. You are responsible for maintaining the security of your account and any activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">4. Data Usage and Privacy</h2>
            <p>
              Your use of FitHub is also governed by our Privacy Policy. By using FitHub, you agree that we can collect and use your information as described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">5. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the service</li>
              <li>Interfere with or disrupt the service</li>
              <li>Share your account credentials with others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">6. Intellectual Property</h2>
            <p>
              All content and materials available on FitHub are protected by intellectual property rights. You may not copy, modify, distribute, or create derivative works without our express permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">7. Disclaimer of Warranties</h2>
            <p>
              FitHub is provided "as is" without any warranties, expressed or implied. We do not guarantee that the service will be uninterrupted or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">8. Limitation of Liability</h2>
            <p>
              FitHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any material changes to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">10. Contact Information</h2>
            <p>
              For any questions about these Terms of Service, please contact us at [Your Contact Email].
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

export default Terms; 