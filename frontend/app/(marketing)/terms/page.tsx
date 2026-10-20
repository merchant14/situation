import { LegalDocument, LegalSection, ReviewItems } from "../../components/legal-document";

export default function TermsPage() {
  return (
    <LegalDocument
      currentPage="terms"
      title="Terms & Conditions"
      description="A plain-language draft of the terms for using Situationship. It is based on the features currently present in the application and needs project-owner and legal review before it becomes effective."
    >
      <LegalSection title="1. Eligibility and your account">
        <p>Situationship is for adults aged 18 and older. When you register, you must give an accurate date of birth. The service checks the date you enter against the 18-year minimum; it does not perform identity or document verification.</p>
        <p>Give us a working email address and keep your sign-in credentials private. You are responsible for activity carried out through your account. The project has not supplied a support channel; one must be added before publication so members know how to report suspected account access.</p>
      </LegalSection>

      <LegalSection title="2. Profiles and appropriate use">
        <p>Keep your display name, age-related information, city, biography, photo, interests, and connection preferences accurate and appropriate. Your date of birth is used to determine eligibility and calculate the age shown with a profile; the date itself is not a field in the discovery profile response.</p>
        <p>Do not harass, threaten, abuse, impersonate, exploit, or deceive other members. Do not use the service to break the law, violate another person’s rights, or upload content you do not have permission to use. Do not use Situationship to target someone who has blocked you or to interfere with another member’s use of the service.</p>
      </LegalSection>

      <LegalSection title="3. Preferences, interest, and matching">
        <p>You can set preferences for connection goal, connection style, exclusivity, and meeting frequency, and choose interests for your profile. The current app presents these details with profiles to help members decide whether they want to connect.</p>
        <p>You can express interest in another profile or pass. A match is created only when both people have expressed interest. A match is not a promise of compatibility, a relationship, or any particular outcome.</p>
      </LegalSection>

      <LegalSection title="4. Messages and member safety">
        <p>Messaging is available between matched members. Communicate respectfully and do not send unlawful, threatening, abusive, or harassing content. You can edit or delete your own messages in the chat; deleting a message replaces its text with a deletion marker in the current service.</p>
        <p>You can block or report a profile using the controls in the service. Blocking prevents the pair from appearing to one another in discovery and removes an existing match. Reports are recorded by the service; its review process and response times have not been defined in the current product.</p>
        <p>Profiles and preferences are supplied by members. Situationship does not verify identity, certify profile accuracy, guarantee compatibility, or guarantee anyone’s conduct or personal safety. Use your own judgment before sharing information or meeting someone, and seek immediate local help if you are in danger.</p>
      </LegalSection>

      <LegalSection title="5. Platform and member content">
        <p>The ownership of the Situationship name, brand, software, and design has not been documented in the project materials. The operating entity and rights holders must be identified before publication.</p>
        <p>The current product accepts and displays member profile text and photos, but it does not define a member-content license or the exact permissions needed to host and display that material. The project owner must settle those terms before these Terms become effective. This draft does not grant a new license.</p>
      </LegalSection>

      <LegalSection title="6. Access, suspension, and termination">
        <p>The application has an active/inactive account status, but its current code does not define when an account may be suspended, who makes that decision, how long a suspension lasts, what notice is given, or whether a member can appeal. Those rules are an unresolved product policy and must be decided before this section is finalized.</p>
      </LegalSection>

      <LegalSection title="7. Account deletion">
        <p>You can request account deletion from Settings after confirming your current password. The current backend deletes the account and associated profile, preferences, interest actions, matches and their messages, blocks, and reports from the database.</p>
        <p>A notification already stored for another member can remain after deletion: the link to the account is cleared, but its text or profile metadata may still identify the action. The service attempts to remove the profile photo from its configured media storage after the database deletion. Backup handling and any deletion exceptions are not defined, so complete removal from every copy cannot be promised.</p>
      </LegalSection>

      <LegalSection title="8. Disclaimers and liability">
        <p>Situationship is a service for discovering profiles and communicating after a mutual match. It does not guarantee uninterrupted availability, a particular match, compatibility, identity, or another member’s behavior. Use the service and make decisions about contact or meetings at your own judgment.</p>
        <p>Any “as available” disclaimer or limitation of liability must be reviewed and adapted by qualified counsel for the confirmed operating entity and applicable law. Nothing in these draft terms is intended to exclude a right or liability that cannot lawfully be excluded.</p>
      </LegalSection>

      <LegalSection title="9. Changes and contact">
        <p>The current application does not implement a notice process for changes to these Terms. The project owner must decide how material changes will be communicated, when they take effect, and whether members must accept them again. Do not treat this draft as an announced change process.</p>
        <p>No legal or support contact has been confirmed in the project. The operating entity and a working contact for legal inquiries must be added before publication; no company, address, jurisdiction, or email is assumed here.</p>
      </LegalSection>

      <ReviewItems>
        <li>Identify the operating entity, verified legal/privacy contact, and a support route.</li>
        <li>Choose the governing jurisdiction and have counsel review the disclaimers and liability language.</li>
        <li>Define suspension and termination grounds, decision process, notice, duration, and appeals.</li>
        <li>Define the user-content permissions needed to host and display profile content and photos, and confirm platform IP ownership.</li>
        <li>Set the Terms’ effective date and a process for notifying members about changes.</li>
      </ReviewItems>
    </LegalDocument>
  );
}
