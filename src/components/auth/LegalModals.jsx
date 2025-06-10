import React from 'react';

// Terms of Service Modal Component
export function TermsModal({ show, onHide }) {
  return (
    <div className={`modal fade ${show ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: show ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Terms of Service</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <small className="text-muted">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
              </small>
            </div>

            <section className="mb-4">
              <h6 className="text-primary">1. Acceptance of Terms</h6>
              <p className="small">
                By accessing and using RentMate ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-4">
              <h6 className="text-primary">2. Platform Description</h6>
              <p className="small">
                RentMate is an online marketplace that connects equipment owners with individuals and businesses seeking to rent equipment. 
                We facilitate transactions but do not own the equipment listed on our platform.
              </p>
            </section>

            <section className="mb-4">
              <h6 className="text-primary">3. User Responsibilities</h6>
              <p className="small"><strong>Equipment Owners:</strong></p>
              <ul className="small">
                <li>Must provide accurate descriptions and conditions of equipment</li>
                <li>Ensure equipment is safe and functional</li>
                <li>Maintain appropriate insurance coverage</li>
                <li>Respond promptly to rental requests</li>
              </ul>
              <p className="small"><strong>Renters:</strong></p>
              <ul className="small">
                <li>Use equipment responsibly and as intended</li>
                <li>Return equipment in the same condition as received</li>
                <li>Report damages immediately</li>
                <li>Pay rental fees promptly</li>
              </ul>
            </section>

            <section className="mb-4">
              <h6 className="text-primary">4. Payment and Fees</h6>
              <p className="small">
                RentMate charges a service fee for each successful rental transaction. Payment processing is handled through secure third-party providers. 
                All fees are clearly disclosed before transaction completion.
              </p>
            </section>

            <section className="mb-4">
              <h6 className="text-primary">5. Liability and Insurance</h6>
              <p className="small">
                Users are responsible for their own insurance coverage. RentMate does not provide insurance for equipment or assume liability for damages, 
                injuries, or losses that may occur during rental periods.
              </p>
            </section>

            <section className="mb-4">
              <h6 className="text-primary">6. Dispute Resolution</h6>
              <p className="small">
                While RentMate provides a platform for communication and may assist in dispute resolution, users are primarily responsible for 
                resolving conflicts between themselves. Serious disputes may be subject to mediation or arbitration.
              </p>
            </section>

            <section className="mb-4">
              <h6 className="text-primary">7. Account Termination</h6>
              <p className="small">
                RentMate reserves the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, 
                or pose risks to other users or the platform.
              </p>
            </section>

            <section className="mb-4">
              <h6 className="text-primary">8. Modifications</h6>
              <p className="small">
                These terms may be updated periodically. Users will be notified of significant changes and continued use of the platform 
                constitutes acceptance of updated terms.
              </p>
            </section>

            <section className="mb-4">
              <h6 className="text-primary">9. Contact Information</h6>
              <p className="small">
                For questions about these Terms of Service, please contact us at:
                <br />
                Email: legal@rentmate.com
                <br />
                Phone: (555) 123-4567
              </p>
            </section>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Privacy Policy Modal Component
export function PrivacyModal({ show, onHide }) {
  return (
    <div className={`modal fade ${show ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: show ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Privacy Policy</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <small className="text-muted">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
              </small>
            </div>

            <section className="mb-4">
              <h6 className="text-primary">1. Information We Collect</h6>
              <p className="small"><strong>Personal Information:</strong></p>
              <ul className="small">
                <li>Name, email address, phone number and address</li>
                <li>Payment information (processed securely by third parties)</li>
                <li>Profile photos and verification documents</li>
              </ul>
              
              <p className="small"><strong>Usage Information:</strong></p>
              <ul className="small">
                <li>Device information and IP address</li>
                <li>Browser type and operating system</li>
                <li>Pages visited and time spent on the platform</li>
                <li>Search queries and equipment interactions</li>
              </ul>
            </section>

            <section className="mb-4">
              <h6 className="text-primary">2. How We Use Your Information</h6>
              <p className="small">We use your information to:</p>
              <ul className="small">
                <li>Provide and improve our platform services</li>
                <li>Process transactions and facilitate rentals</li>
                <li>Communicate with you about your account and transactions</li>
                <li>Verify identity and prevent fraud</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-4">
              <h6 className="text-primary">3. Information Sharing</h6>
              <p className="small"><strong>With Other Users:</strong></p>
              <ul className="small">
                <li>Profile information (name, photo, reviews)</li>
                <li>Contact information for confirmed rentals</li>
                <li>Location information for equipment pickup/delivery</li>
              </ul>
              
              <p className="small"><strong>With Third Parties:</strong></p>
              <ul className="small">
                <li>Payment processors for transaction handling</li>
                <li>Identity verification services</li>
                <li>Customer support and analytics providers</li>
                <li>Legal authorities when required by law</li>
              </ul>
            </section>

            <section className="mb-4">
              <h6 className="text-primary">4. Data Security</h6>
              <p className="small">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="small">
                <li>SSL encryption for data transmission</li>
                <li>Secure server infrastructure</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and employee training</li>
              </ul>
            </section>

            <section className="mb-4">
              <h6 className="text-primary">5. Your Privacy Rights</h6>
              <p className="small">You have the right to:</p>
              <ul className="small">
                <li>Access and review your personal information</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of marketing communications</li>
                <li>Request data portability</li>
                <li>Object to certain processing activities</li>
              </ul>
            </section>

            <section className="mb-4">
              <h6 className="text-primary">6. Cookies and Tracking</h6>
              <p className="small">
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, 
                and provide personalized content. You can manage cookie preferences through your browser settings.
              </p>
            </section>

            <section className="mb-4">
              <h6 className="text-primary">7. Data Retention</h6>
              <p className="small">
                We retain your information for as long as necessary to provide services and comply with legal obligations. 
                Account data is typically deleted within 30 days of account closure, except where retention is required by law.
              </p>
            </section>

            <section className="mb-4">
              <h6 className="text-primary">8. Children's Privacy</h6>
              <p className="small">
                RentMate is not intended for users under 18 years of age. We do not knowingly collect personal 
                information from children. If we become aware of such collection, we will delete the information promptly.
              </p>
            </section>

            <section className="mb-4">
              <h6 className="text-primary">9. Changes to This Policy</h6>
              <p className="small">
                We may update this Privacy Policy periodically. We will notify you of significant changes by email 
                or through the platform. Your continued use constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-4">
              <h6 className="text-primary">10. Contact Us</h6>
              <p className="small">
                For privacy-related questions or requests, contact us at:
                <br />
                Email: privacy@rentmate.com
                <br />
                Phone: (555) 123-4567
                <br />
                Address: 123 Privacy Lane, Data City, DC 12345
              </p>
            </section>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}