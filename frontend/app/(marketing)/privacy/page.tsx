import { LegalDocument, LegalSection, ReviewItems } from "../../components/legal-document";

export default function PrivacyPage() {
  return (
    <LegalDocument
      currentPage="privacy"
      title="Privacy Policy"
      description="This draft explains what the current Situationship application collects and does with it. Production providers, retention rules, legal contact details, and the applicable jurisdiction still need project-owner review."
    >
      <LegalSection title="1. Information the service handles">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="font-semibold text-[#44332e]">Account and age:</strong> email address, date of birth, account identifier, account status, and account creation date. Registration uses the date of birth to enforce the 18+ minimum and calculate the age shown with a discovery profile.</li>
          <li><strong className="font-semibold text-[#44332e]">Password and sign-in:</strong> the password you provide is stored through the backend framework’s password-hashing function, not as the original plaintext value. Sign-in issues access and refresh tokens. The frontend keeps those tokens and an account identifier in browser sessionStorage.</li>
          <li><strong className="font-semibold text-[#44332e]">Profile:</strong> display name, gender, city, biography, optional photo, and selected profile interests. Photos are accepted as JPG or PNG files up to 5 MB.</li>
          <li><strong className="font-semibold text-[#44332e]">Preferences:</strong> connection goal, connection style, exclusivity preference, and meeting frequency.</li>
          <li><strong className="font-semibold text-[#44332e]">Connection activity:</strong> interest or pass decisions, matches, messages, message read/edit/delete state, and notifications about incoming interest or a match.</li>
          <li><strong className="font-semibold text-[#44332e]">Safety activity:</strong> blocks and reports. A report records the reporter, reported profile, category, optional details, and creation time.</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. How information is used and shown">
        <p>Account details support registration, sign-in, age eligibility, and account management. Profile details, preferences, photos, and profile interests are presented to signed-in members in discovery so they can decide whether to express interest or pass. The date of birth is used to calculate displayed age; it is not included in the discovery profile response.</p>
        <p>Interest decisions determine whether a mutual match is created. Matches enable the members to message. Message and notification records support those interactions and show read state and match or interest updates.</p>
        <p>Block information is used to keep the two accounts out of one another’s discovery results and remove an existing match. Report information is recorded when a member reports a profile. The current code does not define a moderation review process, response time, or retention exception for reports.</p>
        <p>Profile information described above is visible to signed-in members in discovery; messages are available to the members in that match, and notifications go to their addressed member. The project also includes an administrator site where staff with the required permissions can access account, profile, preference, block, and report records. The project has not documented which staff roles receive those permissions or a staff access policy.</p>
      </LegalSection>

      <LegalSection title="3. Storage, security, and providers">
        <p>Account, profile, preference, connection, chat, safety, and notification records are held in the application database. Profile photos are held in the configured media storage. The repository’s local development configuration uses PostgreSQL and a local media directory; it does not identify the production hosting, database, photo-storage, or email providers.</p>
        <p>The application uses framework password hashing for passwords. Other safeguards, including encryption of database files, media, or backups, cannot be confirmed from the application code and are not promised by this draft.</p>
        <p>No analytics or advertising integration was found in the current frontend or backend code. The project owner must confirm whether production hosting, monitoring, error reporting, email, analytics, or other service providers receive information.</p>
      </LegalSection>

      <LegalSection title="4. Cookies and browser storage">
        <p>The frontend stores authentication tokens and an account identifier in browser sessionStorage. The frontend code does not set or read cookies or use localStorage for those values. The backend includes Django session and CSRF middleware, so the project owner should verify which cookies, if any, are set in the production configuration and describe them before publication.</p>
      </LegalSection>

      <LegalSection title="5. Retention and account deletion">
        <p>The application does not configure a fixed retention period or automatic inactive-account deletion for account or activity records. Records remain in the database until changed or deleted through the service, subject to the account-deletion behavior described below. A retention schedule for operational logs and backups has not been set.</p>
        <p>You can request deletion in Settings by confirming your current password. The backend deletes your account and linked profile, preferences, interest actions, matches and their messages, blocks, and reports from the database. Notifications addressed to your account are removed. A notification held for another member may remain: its account link is cleared, but its text or profile metadata may remain. The backend attempts to delete your profile photo from configured media storage after the database transaction; successful deletion of every stored copy or backup is not confirmed.</p>
      </LegalSection>

      <LegalSection title="6. Your controls and privacy requests">
        <p>You can edit your profile, preferences, and profile interests; change your password; log out; and request account deletion. The current app does not provide a privacy-settings panel or a self-service data export. It also does not define a separate process for requests to access, correct, restrict, or otherwise exercise privacy rights.</p>
        <p>Rights and request procedures depend on the laws that apply to the operating entity and to you. The project owner must confirm the applicable jurisdiction and provide a working privacy contact before this policy is published. No contact address is invented in this draft.</p>
      </LegalSection>

      <LegalSection title="7. Policy updates and contact">
        <p>The application does not currently implement a notice process for privacy-policy changes. The project owner must decide how changes will be communicated and set the effective date. This document is a draft prepared 7 October 2026, not an effective privacy notice.</p>
        <p>A verified privacy contact and operating entity have not been provided in the project. Add a working route for privacy inquiries before publication.</p>
      </LegalSection>

      <ReviewItems>
        <li>Identify the data controller/operator, its legal name, privacy contact, and any required representative or privacy officer.</li>
        <li>Confirm the applicable jurisdictions and have counsel identify the required disclosures, legal bases, and user-rights process.</li>
        <li>Set retention periods or criteria for active and inactive accounts, reports, operational logs, and backups.</li>
        <li>Document deletion exceptions, media-storage cleanup guarantees, and how backups are handled.</li>
        <li>Identify production hosting, database, media, email, monitoring, analytics, and advertising providers; confirm data locations and any transfers.</li>
        <li>Verify production cookies and other browser storage, and decide how policy updates and their effective dates will be communicated.</li>
      </ReviewItems>
    </LegalDocument>
  );
}
