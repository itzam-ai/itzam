export default function Privacy() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 font-bold text-4xl">Privacy Policy</h1>

          <div className="space-y-6 text-neutral-700 dark:text-neutral-300">
            <p>
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Introduction</h2>
              <p>
                Itzam (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is
                committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our service that allows you to
                seamlessly integrate AI into your applications.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Information We Collect</h2>
              <p>
                We collect information that you provide directly to us when you:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Create an account</li>
                <li>Use our dashboard to manage AI workflows</li>
                <li>Configure AI models, prompts, and context</li>
                <li>Make API requests through our service</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">
                How We Use Your Information
              </h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Provide, maintain, and improve our services</li>
                <li>Manage your account and process payments</li>
                <li>Send you technical notices and updates</li>
                <li>Monitor usage patterns and analyze trends</li>
                <li>Prevent fraudulent use of our services</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">
                Data Sharing and Disclosure
              </h2>
              <p>We may share your information with:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>AI model providers to fulfill your requests</li>
                <li>Service providers who assist in our operations</li>
                <li>Legal authorities when required by law</li>
                <li>
                  Business partners in the event of a merger or acquisition
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Your Rights</h2>
              <p>
                Depending on your location, you may have certain rights
                regarding your personal information, including:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Access to your personal data</li>
                <li>Correction of inaccurate data</li>
                <li>Deletion of your data</li>
                <li>Restriction or objection to processing</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-semibold text-2xl">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please
                contact us at privacy@itzam.ai.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
